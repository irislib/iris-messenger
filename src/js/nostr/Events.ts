import { debounce } from 'lodash';
import Loki from 'lokijs';

import FuzzySearch from '../FuzzySearch';
import { Event, Filter, getEventHash, matchFilter } from '../lib/nostr-tools';
import localState from '../LocalState';

import IndexedDB from './IndexedDB';
import Key from './Key';
import LocalForage from './LocalForage';
import PubSub, { Unsubscribe } from './PubSub';
import Relays from './Relays';
import Session from './Session';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';

const startTime = Date.now() / 1000;

const MAX_LATEST_MSGS = 500;
const MAX_ZAPS_BY_NOTE = 1000;

const db = new Loki('iris');
const events = db.addCollection('events', {
  indices: ['created_at', 'pubkey', 'kind'],
  unique: ['id'],
});

// add collections for Tags and Users?

let mutedNotes;
localState.get('mutedNotes').on((v) => {
  mutedNotes = v;
});

const DEFAULT_GLOBAL_FILTER = {
  maxFollowDistance: 4,
  minFollowersAtMaxDistance: 5,
};
let globalFilter = DEFAULT_GLOBAL_FILTER;
localState.get('globalFilter').on((r) => {
  globalFilter = r;
});

let dev: any = {};
localState.get('dev').on((d) => {
  dev = d;
});

// TODO separate files for different types of events
const Events = {
  DEFAULT_GLOBAL_FILTER,
  getEventHash,
  db: events,
  seen: new Set<string>(),
  deletedEvents: new Set<string>(),
  directMessagesByUser: new Map<string, SortedLimitedEventSet>(),
  latestNotificationByTargetAndKind: new Map<string, string>(),
  notifications: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  zapsByNote: new Map<string, SortedLimitedEventSet>(),
  keyValueEvents: new Map<string, Event>(),
  threadRepliesByMessageId: new Map<string, Set<string>>(),
  directRepliesByMessageId: new Map<string, Set<string>>(),
  likesByMessageId: new Map<string, Set<string>>(),
  repostsByMessageId: new Map<string, Set<string>>(),
  handledMsgsPerSecond: 0,
  decryptedMessages: new Map<string, string>(),
  futureEventIds: new SortedLimitedEventSet(100, false),
  futureEventTimeout: 0,
  notificationsSeenTime: 0,
  handleNote(event: Event) {
    const has = this.db.by('id', event.id);
    if (!has) {
      this.insert(event);
    }

    const isRepost = this.isRepost(event);
    const replyingTo = !isRepost && this.getNoteReplyingTo(event);
    const myPub = Key.getPubKey();

    /*
    if (changed && LocalForage.loaded) {
      LocalForage.saveEvents();
    }
     */

    if (replyingTo && !isRepost) {
      if (!this.directRepliesByMessageId.has(replyingTo)) {
        this.directRepliesByMessageId.set(replyingTo, new Set<string>());
      }
      this.directRepliesByMessageId.get(replyingTo)?.add(event.id);

      const repliedMsgs = event.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1])
        .slice(0, 2);
      for (const id of repliedMsgs) {
        if (
          event.created_at > startTime ||
          event.pubkey === myPub ||
          SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)
        ) {
          //Events.getEventById(id); // generates lots of subscriptions
        }
        if (!this.threadRepliesByMessageId.has(id)) {
          this.threadRepliesByMessageId.set(id, new Set<string>());
        }
        this.threadRepliesByMessageId.get(id)?.add(event.id);
      }
    }
  },
  getRepostedEventId(event: Event) {
    let id = event.tags?.find((tag) => tag[0] === 'e' && tag[3] === 'mention')?.[1];
    if (id) {
      return id;
    }
    // last e tag is the reposted post
    id = event.tags
      .slice() // so we don't reverse event.tags in place
      .reverse()
      .find((tag: any) => tag[0] === 'e')?.[1];
    return id;
  },
  getNoteReplyingTo: function (event: Event) {
    if (event.kind !== 1) {
      return undefined;
    }
    return this.getEventReplyingTo(event);
  },
  getEventReplyingTo: function (event: Event) {
    const replyTags = event.tags?.filter((tag) => tag[0] === 'e' && tag[3] !== 'mention');
    if (replyTags.length === 1) {
      return replyTags[0][1];
    }
    const replyTag = event.tags?.find((tag) => tag[0] === 'e' && tag[3] === 'reply');
    if (replyTag) {
      return replyTag[1];
    }
    if (replyTags.length > 1) {
      return replyTags[1][1];
    }
    return undefined;
  },
  handleRepost(event: Event) {
    const id = this.getRepostedEventId(event);
    if (!id) return;
    if (!this.repostsByMessageId.has(id)) {
      this.repostsByMessageId.set(id, new Set());
    }
    // only handle one repost per post per user. TODO update with newer event if needed.
    if (!this.repostsByMessageId.get(id)?.has(event.pubkey)) {
      this.repostsByMessageId.get(id)?.add(event.pubkey);
      this.handleNote(event);
    }
  },
  handleReaction(event: Event) {
    const id = event.tags?.reverse().find((tag: any) => tag[0] === 'e')?.[1]; // last e tag is the liked post
    if (!id) return;
    if (!this.likesByMessageId.has(id)) {
      this.likesByMessageId.set(id, new Set());
    }
    this.likesByMessageId.get(id).add(event.pubkey);
    this.insert(event);
  },
  handleFollow(event: Event) {
    const existing = Events.db.findOne({ kind: 3, pubkey: event.pubkey });
    if (existing && existing.created_at >= event.created_at) {
      return;
    }
    if (existing) {
      this.db.findAndRemove({ kind: 3, pubkey: event.pubkey });
    }
    this.insert(event);
    const myPub = Key.getPubKey();

    if (event.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)) {
      LocalForage.loaded && LocalForage.saveProfilesAndFollows();
    }

    if (event.tags) {
      for (const tag of event.tags) {
        if (Array.isArray(tag) && tag[0] === 'p') {
          const pub = tag[1];
          // ensure pub is hex
          if (pub.length === 64 && /^[0-9a-f]+$/.test(pub)) {
            SocialNetwork.addFollower(tag[1], event.pubkey);
          } else {
            // console.error('non-hex follow tag', tag, 'by', event.pubkey);
          }
        }
      }
    }
    if (SocialNetwork.followedByUser.has(event.pubkey)) {
      for (const previouslyFollowed of SocialNetwork.followedByUser.get(event.pubkey)) {
        if (!event.tags || !event.tags?.find((t) => t[0] === 'p' && t[1] === previouslyFollowed)) {
          SocialNetwork.removeFollower(previouslyFollowed, event.pubkey);
        }
      }
    }
    if (event.pubkey === myPub && event.tags?.length) {
      if (SocialNetwork.followedByUser.get(myPub)?.size > 10) {
        localState.get('showFollowSuggestions').put(false);
      }
    }
    if (event.pubkey === myPub && event.content?.length) {
      try {
        const relays = JSON.parse(event.content);
        const urls = Object.keys(relays);
        if (urls.length) {
          // remove all existing relays that are not in urls. TODO: just disable
          console.log('setting relays from your contacs list', urls);
          for (const url of Relays.relays.keys()) {
            if (!urls.includes(url)) {
              Relays.remove(url);
            }
          }
          for (const url of urls) {
            Relays.add(url);
          }
        }
      } catch (e) {
        console.log('failed to parse your relays list', event);
      }
    }
  },
  async handleBlockList(event: Event) {
    if (this.myBlockEvent?.created_at > event.created_at) {
      return;
    }
    this.myBlockEvent = event;
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub) {
      let content;
      try {
        content = await Key.decrypt(event.content);
        const blockList = JSON.parse(content);
        SocialNetwork.blockedUsers = new Set(blockList);
      } catch (e) {
        console.log('failed to parse your block list', content, event);
      }
    }
  },
  handleFlagList(event: Event) {
    if (this.myFlagEvent?.created_at > event.created_at) {
      return;
    }
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub) {
      try {
        const flaggedUsers = JSON.parse(event.content);
        SocialNetwork.flaggedUsers = new Set(flaggedUsers);
      } catch (e) {
        console.log('failed to parse your flagged users list', event);
      }
    }
  },
  insert(event: Event) {
    try {
      delete event['$loki'];
      this.db.insert(event);
    } catch (e) {
      // console.log('failed to insert event', e, typeof e);
      // suppress error on duplicate insert. lokijs should throw a different error kind?
    }
  },
  handleMetadata(event: Event) {
    if (!event.content?.length) {
      return;
    }
    try {
      const existing = SocialNetwork.profiles.get(event.pubkey);
      if (existing?.created_at >= event.created_at) {
        return false;
      }
      if (existing) {
        this.db.findAndRemove({ pubkey: event.pubkey, kind: 0 });
      }
      this.insert(event);
      const profile = JSON.parse(event.content);
      // if we have previously deleted our account, log out. appease app store.
      if (event.pubkey === Key.getPubKey() && profile.deleted) {
        Session.logOut();
        return;
      }
      profile.created_at = event.created_at;
      delete profile['nip05valid']; // not robust
      SocialNetwork.profiles.set(event.pubkey, profile);
      const key = Key.toNostrBech32Address(event.pubkey, 'npub');
      FuzzySearch.add({
        key,
        name: profile.name,
        display_name: profile.display_name,
        followers: SocialNetwork.followersByUser.get(event.pubkey) ?? new Set(),
      });
      //}
    } catch (e) {
      console.log('error parsing nostr profile', e, event);
    }
  },
  handleDelete(event: Event) {
    const id = event.tags?.find((tag) => tag[0] === 'e')?.[1];
    const myPub = Key.getPubKey();
    if (id) {
      const deletedEvent = this.db.by('id', id);
      // only we or the author can delete
      if (deletedEvent && [event.pubkey, myPub].includes(deletedEvent.pubkey)) {
        this.db.findAndRemove({ id });
      }
    }
  },
  handleZap(event) {
    this.insert(event);
    const zappedNote = event.tags?.find((tag) => tag[0] === 'e')?.[1];
    if (!zappedNote) {
      return; // TODO you can also zap profiles
    }
    if (!this.zapsByNote.has(zappedNote)) {
      this.zapsByNote.set(zappedNote, new SortedLimitedEventSet(MAX_ZAPS_BY_NOTE));
    }
    this.zapsByNote.get(zappedNote)?.add(event);
  },
  handleDirectMessage(event: Event) {
    const myPub = Key.getPubKey();
    let user = event.pubkey;
    if (event.pubkey === myPub) {
      user = event.tags?.find((tag) => tag[0] === 'p')?.[1] || user;
    } else {
      const forMe = event.tags?.some((tag) => tag[0] === 'p' && tag[1] === myPub);
      if (!forMe) {
        return;
      }
    }
    this.insert(event);
    if (!this.directMessagesByUser.has(user)) {
      this.directMessagesByUser.set(user, new SortedLimitedEventSet(500));
    }
    this.directMessagesByUser.get(user)?.add(event);
  },
  handleKeyValue(event: Event) {
    if (event.pubkey !== Key.getPubKey()) {
      return;
    }
    //console.log('got key value event', event);
    const key = event.tags?.find((tag) => tag[0] === 'd')?.[1];
    if (key) {
      const existing = this.keyValueEvents.get(key);
      if (existing?.created_at >= event.created_at) {
        return;
      }
      this.keyValueEvents.set(key, event);
    }
  },
  isRepost(event: Event) {
    if (event.kind === 6) {
      return true;
    }
    const mentionIndex = event.tags?.findIndex((tag) => tag[0] === 'e' && tag[3] === 'mention');
    if (event.kind === 1 && event.content === `#[${mentionIndex}]`) {
      return true;
    }
    return false;
  },
  acceptEvent(event: Event) {
    if (globalFilter.maxFollowDistance) {
      if (!PubSub.subscribedAuthors.has(event.pubkey) && !PubSub.subscribedEventIds.has(event.id)) {
        // unless we specifically subscribed to the user or post, ignore long follow distance users
        if (SocialNetwork.followDistanceByUser.has(event.pubkey)) {
          const distance = SocialNetwork.followDistanceByUser.get(event.pubkey);
          if (distance > globalFilter.maxFollowDistance) {
            // follow distance too high, reject
            return false;
          }
          if (distance === globalFilter.maxFollowDistance) {
            // require at least 5 followers
            // TODO followers should be follow distance 2
            if (
              SocialNetwork.followersByUser.get(event.pubkey)?.size <
              (globalFilter.minFollowersAtMaxDistance ||
                DEFAULT_GLOBAL_FILTER.minFollowersAtMaxDistance)
            ) {
              // console.log('rejected because not enough followers', SocialNetwork.followersByUser.get(event.pubkey)?.size, '<', globalFilter.minFollowersAtMaxDistance);
              return false;
            } else {
              // console.log('accepted because enough followers', SocialNetwork.followersByUser.get(event.pubkey)?.size, '>=', globalFilter.minFollowersAtMaxDistance);
            }
          }
        } else {
          if (
            event.kind === 1 &&
            (Events.likesByMessageId.get(event.id)?.size > 0 ||
              Events.repostsByMessageId.get(event.id)?.size > 0)
          ) {
            // allow messages that have been liked by at least 1 user
          } else {
            // unconnected user, reject
            return false;
          }
        }
      }
    }
    return true;
  },
  find(filter: Filter, callback: (event: Event) => void) {
    const query = {};
    if (filter.authors) {
      query['pubkey'] = { $in: filter.authors };
    }
    if (filter.kinds) {
      query['kind'] = { $in: filter.kinds };
    }
    this.db
      .chain()
      .find(query)
      .where((e) => matchFilter(filter, e))
      .simplesort('created_at', { desc: true })
      .limit(filter.limit || Infinity)
      .data()
      .forEach((e) => {
        callback(e);
      });
  },
  handle(event: Event & { id: string }, force = false, saveToIdb = true): boolean {
    if (!event) return;
    if (!force && this.seen.has(event.id)) {
      return false;
    }
    if (!force && !this.acceptEvent(event)) {
      return false;
    }
    // Accepting metadata so we still get their name. But should we instead save the name on our own list?
    // They might spam with 1 MB events and keep changing their name or something.
    if (SocialNetwork.blockedUsers.has(event.pubkey) && event.kind !== 0) {
      return false;
    }
    if (this.deletedEvents.has(event.id)) {
      return false;
    }
    // move out of this fn?
    if (event.created_at > Date.now() / 1000) {
      this.futureEventIds.add(event);
      if (this.futureEventIds.has(event.id)) {
        this.insert(event); // TODO should limit stored future events
      }
      if (this.futureEventIds.first() === event.id) {
        this.handleNextFutureEvent();
      }
      return false;
    }

    this.seen.add(event.id);

    this.handledMsgsPerSecond++;

    PubSub.subscribedEventIds.delete(event.id);

    switch (event.kind) {
      case 0:
        if (this.handleMetadata(event) === false) {
          return false;
        }
        break;
      case 1:
        this.maybeAddNotification(event);
        if (this.isRepost(event)) {
          this.handleRepost(event);
        } else {
          this.handleNote(event);
        }
        break;
      case 4:
        this.handleDirectMessage(event);
        break;
      case 5:
        this.handleDelete(event);
        break;
      case 3:
        if (Events.db.findOne({ kind: 3, pubkey: event.pubkey })?.created_at >= event.created_at) {
          return false;
        }
        this.maybeAddNotification(event);
        this.handleFollow(event);
        break;
      case 6:
        this.maybeAddNotification(event);
        this.handleRepost(event);
        break;
      case 7:
        this.maybeAddNotification(event);
        this.handleReaction(event);
        break;
      case 9735:
        this.maybeAddNotification(event);
        this.handleZap(event);
        break;
      case 16462:
        // TODO return if already have
        this.handleBlockList(event);
        break;
      case 16463:
        this.handleFlagList(event);
        break;
      case 30000:
        this.handleKeyValue(event);
        break;
    }

    // save limited by author followdistance
    // TODO: don't save e.g. old profile & follow events
    // TODO since we're only querying relays since lastSeen, we need to store all beforeseen events and correctly query them on demand
    // otherwise feed will be incomplete
    if (saveToIdb) {
      const followDistance = SocialNetwork.followDistanceByUser.get(event.pubkey);
      if (followDistance <= 1) {
        // save all our own events and events from people we follow
        if (dev.indexedDbSave !== false) {
          IndexedDB.saveEvent(event as Event & { id: string });
        }
      } else if (followDistance <= 4 && [0, 3, 4].includes(event.kind)) {
        // save profiles and follow events up to follow distance 4
        if (dev.indexedDbSave !== false) {
          IndexedDB.saveEvent(event as Event & { id: string });
        }
      }
    }

    // should the whole method be moved to PubSub?
    PubSub.handle(event);
    return true;
  },
  handleNextFutureEvent() {
    if (this.futureEventIds.size === 0) {
      return;
    }
    clearTimeout(this.futureEventTimeout);
    const nextEventId = this.futureEventIds.first();
    const nextEvent = this.db.by('id', nextEventId);
    if (!nextEvent) {
      return;
    }
    this.futureEventTimeout = setTimeout(() => {
      this.futureEventIds.delete(nextEvent.id);
      this.handle(nextEvent, true);
      this.handleNextFutureEvent();
    }, (nextEvent.created_at - Date.now() / 1000) * 1000);
  },
  isMuted(event: Event) {
    let muted = false;
    if (mutedNotes) {
      muted = mutedNotes[event.id];
      if (!muted) {
        for (const tag of event.tags) {
          if (tag[0] === 'e' && mutedNotes[tag[1]]) {
            muted = mutedNotes[tag[1]];
            if (muted) {
              return true;
            }
          }
        }
      }
    }
    return muted;
  },
  getEventRoot(event: Event) {
    return event?.tags?.find((t) => t[0] === 'e' && t[3] === 'root')?.[1];
  },
  maybeAddNotification(event: Event) {
    // if we're mentioned in tags, add to notifications
    if (event.tags?.filter((tag) => tag[0] === 'p').length > 10) {
      // no hellthreads please. TODO: make configurable in settings
      return;
    }
    const myPub = Key.getPubKey();
    // TODO: if it's a like, only add if the last p tag is us
    if (event.pubkey !== myPub && event.tags?.some((tag) => tag[0] === 'p' && tag[1] === myPub)) {
      if (event.kind === 3) {
        // only notify if we know that they previously weren't following us
        const existingFollows = SocialNetwork.followedByUser.get(event.pubkey);
        if (!existingFollows || existingFollows.has(myPub)) {
          return;
        }
      }
      if (!this.isMuted(event)) {
        this.insert(event);
        const target = this.getEventRoot(event) || this.getEventReplyingTo(event) || event.id; // TODO get thread root instead
        const key = `${event.kind}-${target}`;
        const existing = this.latestNotificationByTargetAndKind.get(key); // also latestNotificationByAuthor?
        if (!existing || existing.created_at < event.created_at) {
          this.notifications.delete(existing?.id);
          this.notifications.add(event);
          this.latestNotificationByTargetAndKind.set(key, event.id);
        }
        this.updateUnseenNotificationCount();
      } else {
        // console.log('not notifying because muted');
      }
    }
  },
  updateUnseenNotificationCount: debounce(() => {
    if (!Events.notificationsSeenTime) {
      return;
    }
    let count = 0;
    for (const id of Events.notifications.eventIds) {
      const event = Events.db.by('id', id);
      if (event?.created_at > Events.notificationsSeenTime) {
        count++;
      } else {
        break;
      }
    }
    console.log('notificationsSeenTime', Events.notificationsSeenTime, 'count', count);
    localState.get('unseenNotificationCount').put(count);
  }, 1000),
  publish: async function (event: any) {
    if (!event.sig) {
      if (!event.tags) {
        event.tags = [];
      }
      event.content = event.content || '';
      event.created_at = event.created_at || Math.floor(Date.now() / 1000);
      event.pubkey = Key.getPubKey();
      event.id = getEventHash(event);
      event.sig = await Key.sign(event);
    }
    if (!(event.id && event.sig)) {
      console.error('Invalid event', event);
      throw new Error('Invalid event');
    }

    console.log('publishing event', event);
    this.handle(event);
    Relays.publish(event);

    // also publish at most 10 events referred to in tags
    const referredEvents = event.tags
      .filter((tag) => tag[0] === 'e')
      .reverse()
      .slice(0, 10);
    for (const ref of referredEvents) {
      const referredEvent = this.db.by('id', ref[1]);
      if (referredEvent) {
        Relays.publish(referredEvent);
      }
    }
    return event.id;
  },
  getZappingUser(eventId: string) {
    const description = Events.db.by('id', eventId)?.tags?.find((t) => t[0] === 'description')?.[1];
    if (!description) {
      return;
    }
    let obj;
    try {
      obj = JSON.parse(description);
    } catch (e) {
      return;
    }
    const npub = Key.toNostrBech32Address(obj.pubkey, 'npub');
    return npub;
  },
  getRepliesAndReactions(
    id: string,
    cb?: (
      replies: Set<string>,
      likedBy: Set<string>,
      threadReplyCount: number,
      repostedBy: Set<string>,
      zaps: Set<string>,
    ) => void,
  ): Unsubscribe {
    const callback = () => {
      cb &&
        cb(
          this.directRepliesByMessageId.get(id) ?? new Set(),
          this.likesByMessageId.get(id) ?? new Set(),
          this.threadRepliesByMessageId.get(id)?.size ?? 0,
          this.repostsByMessageId.get(id) ?? new Set(),
          this.zapsByNote.get(id) ?? new Set(),
        );
    };
    if (this.directRepliesByMessageId.has(id) || this.likesByMessageId.has(id)) {
      callback();
    }
    return PubSub.subscribe({ '#e': [id] }, callback, false);
  },
  // TODO: return Unsubscribe
  getEventById(id: string, proxyFirst = false, cb?: (event: Event) => void) {
    const event = this.db.by('id', id);
    if (cb && event) {
      cb(event);
      return;
    }

    if (proxyFirst) {
      // give proxy 300 ms to respond, then ask ws
      const askRelaysTimeout = setTimeout(() => {
        PubSub.subscribe({ ids: [id] }, (event) => cb(event));
      }, 300);
      fetch(`https://api.iris.to/event/${id}`).then((res) => {
        if (res.status === 200) {
          res.json().then((event) => {
            // TODO verify sig
            if (event && event.id === id) {
              clearTimeout(askRelaysTimeout);
              Events.handle(event, true);
              cb?.(event);
            }
          });
        }
      });
    } else {
      PubSub.subscribe({ ids: [id] }, cb, false);
    }
  },
  getDirectMessagesByUser(address: string, cb?: (messageIds: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.directMessagesByUser.get(address)?.eventIds);
    };
    this.directMessagesByUser.has(address) && callback();
    const myPub = Key.getPubKey();
    const unsub1 = PubSub.subscribe({ kinds: [4], '#p': [address], authors: [myPub] }, callback);
    const unsub2 = PubSub.subscribe({ kinds: [4], '#p': [myPub], authors: [address] }, callback);
    return () => {
      unsub1();
      unsub2();
    };
  },
  getDirectMessages(cb?: (event: Event) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.directMessagesByUser);
    };
    callback();
    const unsub1 = PubSub.subscribe({ kinds: [4], '#p': [Key.getPubKey()] }, callback);
    const unsub2 = PubSub.subscribe({ kinds: [4], authors: [Key.getPubKey()] }, callback);
    return () => {
      unsub1();
      unsub2();
    };
  },
};

export default Events;
