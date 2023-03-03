import { debounce } from 'lodash';

import { Event, Filter, getEventHash } from '../lib/nostr-tools';
import localState from '../LocalState';
import SearchIndex from '../SearchIndex';

import IndexedDB from './IndexedDB';
import Key from './Key';
import LocalForage from './LocalForage';
import Relays from './Relays';
import Session from './Session';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';
import Subscriptions, { Unsubscribe } from './Subscriptions';

const startTime = Date.now() / 1000;

const MAX_MSGS_BY_USER = 500;
const MAX_LATEST_MSGS = 500;
const MAX_MSGS_BY_KEYWORD = 100;
const MAX_ZAPS_BY_NOTE = 1000;

const cache = new Map<string, Event>();

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

// TODO separate files for different types of events
const Events = {
  DEFAULT_GLOBAL_FILTER,
  MAX_MSGS_BY_KEYWORD,
  getEventHash,
  cache: cache,
  deletedEvents: new Set<string>(),
  directMessagesByUser: new Map<string, SortedLimitedEventSet>(),
  likesByUser: new Map<string, SortedLimitedEventSet>(),
  postsByUser: new Map<string, SortedLimitedEventSet>(),
  postsAndRepliesByUser: new Map<string, SortedLimitedEventSet>(),
  notifications: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  zapsByNote: new Map<string, SortedLimitedEventSet>(),
  latestNotesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesAndRepliesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesAndRepliesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByKeywords: new Map<string, SortedLimitedEventSet>(),
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
    this.cache.set(event.id, event);
    if (!this.postsAndRepliesByUser.has(event.pubkey)) {
      this.postsAndRepliesByUser.set(event.pubkey, new SortedLimitedEventSet(MAX_MSGS_BY_USER));
    }
    this.postsAndRepliesByUser.get(event.pubkey)?.add(event);

    const replyingTo = this.getEventReplyingTo(event);
    const replyingToEvent = replyingTo && this.cache.get(replyingTo);
    this.latestNotesAndRepliesByEveryone.add(event);
    if (!replyingTo) {
      this.latestNotesByEveryone.add(event);
    }
    // just checking that someone isn't hiding posts with backdated replies to them
    if (replyingToEvent?.created_at < event.created_at) {
      // we don't want both the reply and the original post in the feed:
      this.latestNotesAndRepliesByEveryone.delete(replyingTo);
    }
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)) {
      const changed = this.latestNotesAndRepliesByFollows.add(event);
      if (replyingTo) {
        const replyingToEvent = this.cache.get(replyingTo);
        // just checking that someone isn't hiding posts with backdated replies to them
        if (replyingToEvent?.created_at < event.created_at) {
          // we don't want both the reply and the original post in the feed:
          this.latestNotesAndRepliesByFollows.delete(replyingTo);
        }
      } else {
        this.latestNotesByFollows.add(event);
      }
      if (changed && LocalForage.loaded) {
        LocalForage.saveEvents();
      }
    }

    // todo: handle astral ninja format repost (retweet) message
    // where content points to the original message tag: "content": "#[1]"

    const isRepost = this.isRepost(event);
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
    } else {
      if (!this.postsByUser.has(event.pubkey)) {
        this.postsByUser.set(event.pubkey, new SortedLimitedEventSet(MAX_MSGS_BY_USER));
      }
      this.postsByUser.get(event.pubkey)?.add(event);
    }
  },
  getEventReplyingTo: function (event: Event) {
    if (event.kind !== 1) {
      return undefined;
    }
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
    let id = event.tags?.find((tag) => tag[0] === 'e' && tag[3] === 'mention')?.[1];
    if (!id) {
      // last e tag is the reposted post
      id = event.tags
        .slice() // so we don't reverse event.tags in place
        .reverse()
        .find((tag: any) => tag[0] === 'e')?.[1];
    }
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

    if (!this.likesByUser.has(event.pubkey)) {
      this.likesByUser.set(event.pubkey, new SortedLimitedEventSet(MAX_MSGS_BY_USER));
    }
    this.likesByUser.get(event.pubkey).add({ id, created_at: event.created_at });
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)) {
      //Events.getEventById(id);
    }
  },
  handleFollow(event: Event) {
    const existing = SocialNetwork.followEventByUser.get(event.pubkey);
    if (existing && existing.created_at >= event.created_at) {
      return;
    }
    SocialNetwork.followEventByUser.set(event.pubkey, event);
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
  handleMetadata(event: Event) {
    try {
      const existing = SocialNetwork.profiles.get(event.pubkey);
      if (existing?.created_at >= event.created_at) {
        return false;
      }
      this.cache.set(event.id, event);
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
      SearchIndex.add({
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
      const deletedEvent = this.cache.get(id);
      // only we or the author can delete
      if (deletedEvent && [event.pubkey, myPub].includes(deletedEvent.pubkey)) {
        this.cache.delete(id);
        this.postsAndRepliesByUser.get(event.pubkey)?.delete(id);
        this.latestNotesByFollows.delete(id);
        this.latestNotesByEveryone.delete(id);
      }
    }
  },
  handleZap(event) {
    this.cache.set(event.id, event);
    const zappedNote = event.tags?.find((tag) => tag[0] === 'e')?.[1];
    if (!zappedNote) {
      return; // TODO you can also zap profiles
    }
    // console.log('zap!', Key.toNostrBech32Address(zappedNote, 'note'), event);
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
    this.cache.set(event.id, event);
    if (!this.directMessagesByUser.has(user)) {
      this.directMessagesByUser.set(user, new SortedLimitedEventSet(500));
    }
    this.directMessagesByUser.get(user)?.add(event);
  },
  handleKeyValue(event: Event) {
    if (event.pubkey !== Key.getPubKey()) {
      return;
    }
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
    } else {
      return false;
    }
  },
  acceptEvent(event: Event) {
    if (globalFilter.maxFollowDistance) {
      if (
        !Subscriptions.subscribedUsers.has(event.pubkey) &&
        !Subscriptions.subscribedPosts.has(event.id)
      ) {
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
        this.cache.set(event.id, event); // TODO should limit stored future events
      }
      if (this.futureEventIds.first() === event.id) {
        this.handleNextFutureEvent();
      }
      return false;
    }
    return true;
  },
  handle(event: Event, force = false, saveToIdb = true) {
    if (!event) return;
    if (this.cache.has(event.id) && !force) {
      return;
    }
    if (!this.acceptEvent(event)) {
      return;
    }

    this.handledMsgsPerSecond++;

    Subscriptions.subscribedPosts.delete(event.id);

    switch (event.kind) {
      case 0:
        if (this.handleMetadata(event) === false) {
          return;
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
        if (SocialNetwork.followEventByUser.get(event.pubkey)?.created_at >= event.created_at) {
          return;
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

    if (
      Subscriptions.subscribedProfiles.has(event.pubkey) &&
      SocialNetwork.blockedUsers.has(event.pubkey) &&
      SocialNetwork.followEventByUser.has(event.pubkey)
    ) {
      Subscriptions.subscribedProfiles.delete(event.pubkey);
    }

    // save limited by author followdistance
    if (saveToIdb && SocialNetwork.followDistanceByUser.get(event.pubkey) <= 3) {
      if (!globalFilter.maxFollowDistance) {
        // even if distance filter is disabled, still limit IDB writes
        const distance = SocialNetwork.followDistanceByUser.get(event.pubkey);
        if (distance <= 3) {
          IndexedDB.saveEvent(event);
        }
      } else {
        IndexedDB.saveEvent(event);
      }
    }

    // go through subscriptions and callback if filters match
    for (const sub of Subscriptions.subscriptions.values()) {
      if (!sub.filters) {
        return;
      }
      if (this.matchesOneFilter(event, sub.filters)) {
        sub.callback && sub.callback(event);
      }
    }
  },
  handleNextFutureEvent() {
    if (this.futureEventIds.size === 0) {
      return;
    }
    clearTimeout(this.futureEventTimeout);
    const nextEventId = this.futureEventIds.first();
    const nextEvent = this.cache.get(nextEventId);
    if (!nextEvent) {
      return;
    }
    this.futureEventTimeout = setTimeout(() => {
      this.futureEventIds.delete(nextEvent.id);
      this.handle(nextEvent, true);
      this.handleNextFutureEvent();
    }, (nextEvent.created_at - Date.now() / 1000) * 1000);
  },
  // if one of the filters matches, return true
  matchesOneFilter(event: Event, filters: Filter[]) {
    for (const filter of filters) {
      if (this.matchFilter(event, filter)) {
        return true;
      }
    }
    return false;
  },
  matchFilter(event: Event, filter: Filter) {
    if (filter.ids && !filter.ids.includes(event.id)) {
      return false;
    }
    if (filter.kinds && !filter.kinds.includes(event.kind)) {
      return false;
    }
    if (filter.authors && !filter.authors.includes(event.pubkey)) {
      return false;
    }
    const filterKeys = ['e', 'p', 'd'];
    for (const key of filterKeys) {
      if (
        filter[`#${key}`] &&
        !event.tags?.some((tag) => tag[0] === key && filter[`#${key}`].includes(tag[1]))
      ) {
        return false;
      }
    }
    if (filter['#d']) {
      const tag = event.tags?.find((tag) => tag[0] === 'd');
      if (tag) {
        const existing = this.keyValueEvents.get(tag[1]);
        if (existing?.created_at > event.created_at) {
          return false;
        }
      }
    }
    const content = event.content.toLowerCase();
    if (
      filter.keywords &&
      !filter.keywords.some((keyword: string) => {
        return keyword
          .toLowerCase()
          .split(' ')
          .every((word: string) => content.includes(word));
      })
    ) {
      return false;
    }

    return true;
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
  maybeAddNotification(event: Event) {
    // if we're mentioned in tags, add to notifications
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
        this.cache.set(event.id, event);
        this.notifications.add(event);
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
      const event = Events.cache.get(id);
      if (event.created_at > Events.notificationsSeenTime) {
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
    // also publish at most 10 events referred to in tags
    const referredEvents = event.tags
      .filter((tag) => tag[0] === 'e')
      .reverse()
      .slice(0, 10);
    for (const relay of Relays.relays.values()) {
      relay.publish(event);
      for (const ref of referredEvents) {
        const referredEvent = this.cache.get(ref[1]);
        if (referredEvent) {
          relay.publish(referredEvent);
        }
      }
    }
    this.handle(event);
    return event.id;
  },
  getZappingUser(eventId: string) {
    const description = Events.cache.get(eventId)?.tags.find((t) => t[0] === 'description')?.[1];
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
    return Subscriptions.subscribe([{ kinds: [1, 6, 7, 9735], '#e': [id] }], callback);
  },
  async getEventById(id: string, proxyFirst = false) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const askWs = () => {
      return new Promise((resolve) => {
        const unsub = Subscriptions.subscribe([{ ids: [id] }], () => {
          const msg = this.cache.get(id);
          if (msg) {
            resolve(msg);
            unsub();
          }
        });
      });
    };

    return new Promise((resolve) => {
      if (proxyFirst) {
        // give proxy 300 ms to respond, then ask ws
        const askWsTimeout = setTimeout(() => {
          askWs().then(resolve);
        }, 300);
        fetch(`https://api.iris.to/event/${id}`).then((res) => {
          if (res.status === 200) {
            res.json().then((event) => {
              if (event) {
                clearTimeout(askWsTimeout);
                Events.handle(event);
              }
            });
          }
        });
      } else {
        askWs().then(resolve);
      }
    });
  },
  getNotifications: function (cb?: (notifications: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.notifications.eventIds);
    };
    callback();
    return Subscriptions.subscribe([{ '#p': [Key.getPubKey()] }], callback);
  },

  getMessagesByEveryone(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ): Unsubscribe {
    const callback = () => {
      cb(
        includeReplies
          ? this.latestNotesAndRepliesByEveryone.eventIds
          : this.latestNotesByEveryone.eventIds,
        includeReplies,
      );
    };
    callback();
    return Subscriptions.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByFollows(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ): Unsubscribe {
    const callback = () => {
      cb(
        includeReplies
          ? this.latestNotesAndRepliesByFollows.eventIds
          : this.latestNotesByFollows.eventIds,
        includeReplies,
      );
    };
    callback();
    return Subscriptions.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByKeyword(keyword: string, cb: (messageIds: string[]) => void): Unsubscribe {
    const callback = (event) => {
      if (!this.latestNotesByKeywords.has(keyword)) {
        this.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
      }
      this.latestNotesByKeywords.get(keyword)?.add(event);
      cb(this.latestNotesByKeywords.get(keyword)?.eventIds);
    };
    // find among cached events
    const filter = { kinds: [1], keywords: [keyword] };
    for (const event of this.cache.values()) {
      if (this.matchFilter(event, filter)) {
        if (!this.latestNotesByKeywords.has(keyword)) {
          this.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
        }
        this.latestNotesByKeywords.get(keyword)?.add(event);
      }
    }
    this.latestNotesByKeywords.has(keyword) &&
      cb(this.latestNotesByKeywords.get(keyword)?.eventIds);
    return Subscriptions.subscribe([filter], callback);
  },
  getPostsAndRepliesByUser(address: string, cb?: (messageIds: string[]) => void): Unsubscribe {
    // TODO subscribe on view profile and unsub on leave profile
    const callback = () => {
      cb?.(this.postsAndRepliesByUser.get(address)?.eventIds);
    };
    this.postsAndRepliesByUser.has(address) && callback();
    return Subscriptions.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getPostsByUser(address: string, cb?: (messageIds: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.postsByUser.get(address)?.eventIds);
    };
    this.postsByUser.has(address) && callback();
    return Subscriptions.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getLikesByUser(address: string, cb?: (messageIds: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.likesByUser.get(address)?.eventIds);
    };
    this.likesByUser.has(address) && callback();
    return Subscriptions.subscribe([{ kinds: [7, 5], authors: [address] }], callback);
  },

  getDirectMessages(cb?: (dms: Map<string, SortedLimitedEventSet>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.directMessagesByUser);
    };
    callback();
    return Subscriptions.subscribe([{ kinds: [4] }], callback);
  },

  getDirectMessagesByUser(address: string, cb?: (messageIds: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.directMessagesByUser.get(address)?.eventIds);
    };
    this.directMessagesByUser.has(address) && callback();
    const myPub = Key.getPubKey();
    return Subscriptions.subscribe([{ kinds: [4], '#p': [address, myPub] }], callback);
  },
};

export default Events;
