import debounce from 'lodash/debounce';
import {
  Event,
  getEventHash,
  getPublicKey,
  nip04,
  validateEvent,
  verifySignature,
} from 'nostr-tools';
import { EventTemplate } from 'nostr-tools';

import EventDB from '@/nostr/EventDB';
import {
  getEventReplyingTo,
  getEventRoot,
  getLikedEventId,
  getNoteReplyingTo,
  getOriginalPostEventId,
  getRepostedEventId,
  isRepost,
} from '@/nostr/utils';
import { ID, STR, UniqueIds } from '@/utils/UniqueIds';

import localState from '../state/LocalState.ts';
import { Node } from '../state/LocalState.ts';
import { DecryptedEvent } from '../views/chat/ChatMessages';
import { addGroup, setGroupNameByInvite } from '../views/chat/NewChat';

import EventMetaStore from './EventsMeta';
import FuzzySearch from './FuzzySearch';
import IndexedDB from './IndexedDB';
import Key from './Key';
import PubSub, { Unsubscribe } from './PubSub';
import Relays from './Relays';
import Session from './Session';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';

const startTime = Date.now() / 1000;

const MAX_LATEST_MSGS = 500;
const MAX_ZAPS_BY_NOTE = 1000;

let mutedNotes;
localState.get('mutedNotes').on((v) => {
  mutedNotes = v;
});

const DEFAULT_GLOBAL_FILTER = {
  maxFollowDistance: 3,
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
  eventsMetaDb: new EventMetaStore(),
  deletedEvents: new Set<string>(),
  latestNotificationByTargetAndKind: new Map<string, string>(),
  notifications: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  zapsByNote: new Map<string, SortedLimitedEventSet>(),
  keyValueEvents: new Map<string, Event>(),
  threadRepliesByMessageId: new Map<string, Set<string>>(),
  likesByMessageId: new Map<string, Set<string>>(),
  repostsByMessageId: new Map<string, Set<string>>(),
  handledMsgsPerSecond: 0,
  decryptedMessages: new Map<string, string>(),
  futureEventIds: new SortedLimitedEventSet(100, false),
  futureEventTimeout: null as any,
  notificationsSeenTime: 0,
  myBlockEvent: null as Event | null,
  myFlagEvent: null as Event | null,
  handleNote(event: Event) {
    const has = EventDB.get(event.id);
    if (!has) {
      EventDB.insert(event);
    }

    const eventIsRepost = isRepost(event);
    const replyingTo = !eventIsRepost && getNoteReplyingTo(event);
    const myPub = Key.getPubKey();

    if (replyingTo && !eventIsRepost) {
      const repliedMsgs = event.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1])
        .slice(0, 2);
      for (const id of repliedMsgs) {
        if (
          event.created_at > startTime ||
          event.pubkey === myPub ||
          SocialNetwork.isFollowing(myPub, event.pubkey)
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
  handleRepost(event: Event) {
    const id = getRepostedEventId(event);
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
    const id = getLikedEventId(event);
    if (!id) return;
    if (!this.likesByMessageId.has(id)) {
      this.likesByMessageId.set(id, new Set());
    }
    this.likesByMessageId.get(id)?.add(event.pubkey);
    EventDB.insert(event);
  },
  handleFollow(event: Event) {
    const existing = EventDB.findOne({ kinds: [3], authors: [event.pubkey] });
    if (existing && existing.created_at >= event.created_at) {
      return;
    }
    if (existing) {
      //EventDB.findAndRemove({ kinds: [3], authors: [event.pubkey] });
    }
    // no need to store follow events in memory because they're already in SocialNetwork.
    // when we start doing p2p, we can perhaps keep them in memory or just ask from dexie
    //EventDB.insert(event);
    const myPub = Key.getPubKey();

    if (event.tags) {
      for (const tag of event.tags) {
        if (Array.isArray(tag) && tag[0] === 'p') {
          const pub = tag[1];
          // ensure pub is hex
          if (pub.length === 64 && /^[0-9a-f]+$/.test(pub)) {
            SocialNetwork.addFollower(ID(tag[1]), ID(event.pubkey));
          } else {
            // console.error('non-hex follow tag', tag, 'by', event.pubkey);
          }
        }
      }
    }
    if (SocialNetwork.followedByUser.has(ID(event.pubkey))) {
      for (const previouslyFollowed of SocialNetwork.followedByUser.get(ID(event.pubkey)) || []) {
        if (
          !event.tags ||
          !event.tags?.find((t) => t[0] === 'p' && t[1] === STR(previouslyFollowed))
        ) {
          SocialNetwork.removeFollower(previouslyFollowed, ID(event.pubkey));
        }
      }
    }
    if (event.pubkey === myPub && event.tags?.length) {
      if ((SocialNetwork.followedByUser.get(ID(myPub))?.size || 0) > 10) {
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
    if ((this.myBlockEvent?.created_at || -Infinity) > event.created_at) {
      return;
    }
    this.myBlockEvent = event;
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub) {
      let content;
      try {
        content = await Key.decrypt(event.content);
        const blockList = JSON.parse(content).map(ID);
        SocialNetwork.blockedUsers = new Set(blockList);
      } catch (e) {
        console.log('failed to parse your block list', content, event);
      }
    }
  },
  handleFlagList(event: Event) {
    if ((this.myFlagEvent?.created_at || 0) > event.created_at) {
      return;
    }
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub) {
      try {
        const flaggedUsers = JSON.parse(event.content).map(ID);
        SocialNetwork.flaggedUsers = new Set(flaggedUsers);
      } catch (e) {
        console.log('failed to parse your flagged users list', event);
      }
    }
  },
  handleMetadata(event: Event) {
    if (!event.content?.length) {
      return;
    }
    try {
      const existing = SocialNetwork.profiles.get(ID(event.pubkey));
      if (existing?.created_at >= event.created_at) {
        return false;
      }
      if (existing) {
        //EventDB.findAndRemove({ authors: [event.pubkey], kinds: [0] });
      }
      // same as handleFollow, no need to store in memory for now
      //EventDB.insert(event);
      const profile = JSON.parse(event.content);
      // if we have previously deleted our account, log out. appease app store.
      if (event.pubkey === Key.getPubKey() && profile.deleted) {
        Session.logOut();
        return;
      }
      profile.created_at = event.created_at;
      delete profile['nip05valid']; // not robust
      SocialNetwork.profiles.set(ID(event.pubkey), profile);
      const key = Key.toNostrBech32Address(event.pubkey, 'npub');
      FuzzySearch.add({
        key,
        name: profile.name,
        display_name: profile.display_name,
        followers: SocialNetwork.followersByUser.get(ID(event.pubkey)) ?? new Set(),
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
      const deletedEvent = EventDB.get(id);
      // only we or the author can delete
      if (deletedEvent && [event.pubkey, myPub].includes(deletedEvent.pubkey)) {
        EventDB.remove(id);
      }
    }
  },
  handleZap(event) {
    EventDB.insert(event);
    const zappedNote = event.tags?.find((tag) => tag[0] === 'e')?.[1];
    if (!zappedNote) {
      return; // TODO you can also zap profiles
    }
    if (!this.zapsByNote.has(zappedNote)) {
      this.zapsByNote.set(zappedNote, new SortedLimitedEventSet(MAX_ZAPS_BY_NOTE));
    }
    this.zapsByNote.get(zappedNote)?.add(event);
  },
  async saveDMToLocalState(event: DecryptedEvent, chatNode: Node) {
    const latest = chatNode.get('latest');
    const e = await latest.once();
    if (!e || !e.created_at || e.created_at < event.created_at) {
      latest.put({ id: event.id, created_at: event.created_at, text: event.text });
    }
  },
  async handleDirectMessage(event: DecryptedEvent) {
    const myPub = Key.getPubKey();
    let chatId;
    let maybeSecretChat = false;
    if (event.pubkey === myPub) {
      chatId = event.tags?.find((tag) => tag[0] === 'p')?.[1] || chatId;
    } else {
      chatId = event.pubkey;
      const forMe = event.tags?.some((tag) => tag[0] === 'p' && tag[1] === myPub);
      if (!forMe) {
        maybeSecretChat =
          event.tags?.length === 1 &&
          event.tags?.some((tag) => tag[0] === 'p' && tag[1] === event.pubkey);
        if (!maybeSecretChat) {
          return;
        }
      }
    }
    try {
      // TODO decrypting & trying to json parse all dms might be slow, how to avoid? only process new msgs?
      const decrypted = await Key.decrypt(event.content, event.pubkey);
      if (decrypted) {
        event.text = decrypted;
        this.decryptedMessages.set(event.id, decrypted); // don't do if maybeSecretChat?
      }
      // also save to localState, so we don't have to decrypt every time?
      const innerEvent = JSON.parse(decrypted.slice(decrypted.indexOf('{')));
      if (validateEvent(innerEvent) && verifySignature(innerEvent)) {
        // parse nsec from message by regex. nsec is bech32 encoded in the message
        // no follow distance check here for now
        const nsec = innerEvent.content.match(/nsec1[023456789acdefghjklmnpqrstuvwxyz]{6,}/gi)?.[0];
        if (nsec) {
          const hexPriv = Key.toNostrHexAddress(nsec);
          if (hexPriv) {
            // TODO browser notification?
            addGroup(hexPriv, false, innerEvent.pubkey); // for some reason, groups don't appear on 1st load after login
            setGroupNameByInvite(hexPriv, innerEvent.pubkey);
            localState.get('chatInvites').get(innerEvent.pubkey).put({ priv: hexPriv });
            return;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    EventDB.insert(event);
    if (!maybeSecretChat) {
      this.saveDMToLocalState(event, localState.get('chats').get(chatId));
    }
  },
  getEventFromText(text) {
    try {
      const maybeJson = text.slice(text.indexOf('{'));
      const e = JSON.parse(maybeJson);
      if (validateEvent(e) && verifySignature(e)) {
        return e;
      }
    } catch (e) {
      // ignore
    }
  },
  subscribeGroups() {
    localState.get('groups').map((data, groupId) => {
      if (data.key) {
        const pubKey = getPublicKey(data.key);
        if (pubKey) {
          PubSub.subscribe({ authors: [pubKey], kinds: [4], '#p': [pubKey] }, async (event) => {
            const decrypted = await nip04.decrypt(data.key, pubKey, event.content);
            const innerEvent = this.getEventFromText(decrypted);
            if (
              innerEvent &&
              innerEvent.tags.length === 1 &&
              innerEvent.tags[0][0] === 'p' &&
              innerEvent.tags[0][1] === pubKey
            ) {
              innerEvent.text = innerEvent.content;
              this.saveDMToLocalState(innerEvent, localState.get('groups').get(groupId));
            }
          });
        }
      }
    });
  },
  handleKeyValue(event: Event) {
    if (event.pubkey !== Key.getPubKey()) {
      return;
    }
    //console.log('got key value event', event);
    const key = event.tags?.find((tag) => tag[0] === 'd')?.[1];
    if (key) {
      const existing = this.keyValueEvents.get(key);
      if ((existing?.created_at || -Infinity) >= event.created_at) {
        return;
      }
      this.keyValueEvents.set(key, event);
    }
  },
  acceptEvent(event: Event) {
    // quick fix: disable follow distance filter when not logged in
    const myPub = Key.getPubKey();
    if (myPub === event.pubkey) {
      return true;
    }
    if (globalFilter.maxFollowDistance && !!myPub) {
      // let dms through in case it's an anonymous chat invite. otherwise discard in handleDirectMessage.
      if (event.kind === 4) {
        return true;
      }
      if (!PubSub.subscribedAuthors.has(event.pubkey) && !PubSub.subscribedEventIds.has(event.id)) {
        // unless we specifically subscribed to the user or post, ignore long follow distance users
        if (!event.pubkey) {
          console.log('what', event);
          return false;
        }
        if (UniqueIds.has(event.pubkey) && SocialNetwork.getFollowDistance(event.pubkey) < 1000) {
          const distance = SocialNetwork.getFollowDistance(event.pubkey);
          if (distance > globalFilter.maxFollowDistance) {
            // follow distance too high, reject
            return false;
          }
          if (distance === globalFilter.maxFollowDistance) {
            // require at least 5 followers
            // TODO followers should be follow distance 2
            const followerCount = SocialNetwork.followersByUser.get(ID(event.pubkey))?.size || 0;
            if (
              followerCount <
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
          const likes = Events.likesByMessageId.get(event.id)?.size || 0;
          const reposts = Events.repostsByMessageId.get(event.id)?.size || 0;
          if (event.kind === 1 && (likes > 0 || reposts > 0)) {
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
  handle(event: Event & { id: string }, force = false, saveToIdb = true, retries = 2): boolean {
    if (!event?.id) return false;
    if (!force && UniqueIds.has(event.id)) {
      return false;
    }
    ID(event.id); // add to UniqueIds
    if (!force && !this.acceptEvent(event)) {
      if (retries) {
        // should we retry only if iris has been opened within the last few seconds or the social graph changed?
        setTimeout(() => {
          this.handle(event, force, saveToIdb, retries - 1);
        }, 3000);
      }
      return false;
    }
    if (retries === 1) {
      //console.log('accepted event on 1st retry', event);
    }
    if (!retries) {
      // we get some of these
      //console.log('accepted event on 2nd retry', event);
    }
    // Accepting metadata so we still get their name. But should we instead save the name on our own list?
    // They might spam with 1 MB events and keep changing their name or something.
    if (SocialNetwork.isBlocked(event.pubkey) && event.kind !== 0) {
      return false;
    }
    if (this.deletedEvents.has(event.id)) {
      return false;
    }
    // move out of this fn?
    if (event.created_at > Date.now() / 1000) {
      this.futureEventIds.add(event);
      if (this.futureEventIds.has(event.id)) {
        EventDB.insert(event); // TODO should limit stored future events
      }
      if (this.futureEventIds.first() === event.id) {
        this.handleNextFutureEvent();
      }
      return false;
    }

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
        if (isRepost(event)) {
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
      case 3: {
        const foundEvent = EventDB.findOne({ kinds: [3], authors: [event.pubkey] });
        if (foundEvent && foundEvent.created_at >= event.created_at) {
          return false;
        }
        this.maybeAddNotification(event);
        this.handleFollow(event);
        break;
      }
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      case 16462:
        // TODO return if already have
        this.handleBlockList(event);
        break;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      case 16463:
        this.handleFlagList(event);
        break;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      case 30000:
        this.handleKeyValue(event);
        break;
    }

    // save limited by author followdistance
    // TODO: don't save e.g. old profile & follow events
    // TODO since we're only querying relays since lastSeen, we need to store all beforeseen events and correctly query them on demand
    // otherwise feed will be incomplete
    if (saveToIdb && dev.indexedDbSave !== false) {
      const followDistance = SocialNetwork.getFollowDistance(event.pubkey);
      if (followDistance <= 1) {
        IndexedDB.saveEvent(event as Event & { id: string });
      } else if (
        [2, 3].includes(followDistance) &&
        event.tags.some((tag) => tag[0] === 'p' && tag[1] === Key.getPubKey())
      ) {
        IndexedDB.saveEvent(event as Event & { id: string });
      } else if (followDistance <= 4 && [0, 3, 4].includes(event.kind)) {
        IndexedDB.saveEvent(event as Event & { id: string });
      }
    }

    // should the whole method be moved to PubSub?
    PubSub.handle(event);
    return true;
  },
  // metadata for an event: e.g. on which relays event was found on.
  handleEventMetadata({ url, event }: { url: string; event: Event }) {
    const id = getOriginalPostEventId(event);
    if (!id) {
      return;
    }
    this.eventsMetaDb.upsert(id, { relays: new Set([url]) });
  },
  handleNextFutureEvent() {
    if (this.futureEventIds.size === 0) {
      return;
    }
    clearTimeout(this.futureEventTimeout);
    const nextEventId = this.futureEventIds.first();
    const nextEvent = nextEventId && EventDB.get(nextEventId);
    if (!nextEvent) {
      return;
    }
    this.futureEventTimeout = setTimeout(
      () => {
        this.futureEventIds.delete(nextEvent.id);
        this.handle(nextEvent, true);
        this.handleNextFutureEvent();
      },
      (nextEvent.created_at - Date.now() / 1000) * 1000,
    );
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
    if (event.kind !== 3 && event.tags?.filter((tag) => tag[0] === 'p').length > 10) {
      // no hellthreads please. TODO: make configurable in settings
      return;
    }
    const myPub = Key.getPubKey();
    // TODO: if it's a like, only add if the last p tag is us
    if (event.pubkey !== myPub && event.tags?.some((tag) => tag[0] === 'p' && tag[1] === myPub)) {
      if (event.kind === 3) {
        // only notify if we know that they previously weren't following us
        const existingFollows = SocialNetwork.followedByUser.get(ID(event.pubkey));
        if (!existingFollows || existingFollows.has(ID(myPub))) {
          return;
        }
      }
      if (!this.isMuted(event)) {
        const target = getEventRoot(event) || getEventReplyingTo(event) || event.id; // TODO get thread root instead
        const key = `${event.kind}-${target}`;
        const existing = this.latestNotificationByTargetAndKind.get(key); // also latestNotificationByAuthor?
        const existingEvent = existing && EventDB.get(existing);
        if (!existingEvent || existingEvent.created_at < event.created_at) {
          existing && this.notifications.delete(existing);
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
      const event = EventDB.get(id);
      if (event && event.created_at > Events.notificationsSeenTime) {
        count++;
      } else {
        break;
      }
    }
    console.log('notificationsSeenTime', Events.notificationsSeenTime, 'count', count);
    localState.get('unseenNotificationCount').put(count);
  }, 1000),
  publish: async function (event: Partial<Event>): Promise<Event> {
    if (!event.sig) {
      await this.sign(event as EventTemplate);
    }
    if (!(event.id && event.sig)) {
      console.error('Invalid event', event);
      throw new Error('Invalid event');
    }

    PubSub.publish(event as Event);

    console.log('publishing event', event);
    this.handle(event as Event, true);

    // also publish at most 10 events referred to in tags
    const referredEvents = event.tags
      ?.filter((tag) => tag[0] === 'e')
      .reverse()
      .slice(0, 10);
    for (const ref of referredEvents || []) {
      const referredEvent = EventDB.get(ref[1]);
      if (referredEvent) {
        PubSub.publish(referredEvent);
      }
    }
    return event as Event;
  },
  async sign(event: any) {
    if (!event.tags) {
      event.tags = [];
    }
    event.content = event.content || '';
    event.created_at = event.created_at || Math.floor(Date.now() / 1000);
    event.pubkey = Key.getPubKey();
    event.id = getEventHash(event as Event);
    event.sig = await Key.sign(event as Event);
    return event as Event;
  },
  getLikes(id: string, cb?: (likedBy: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.likesByMessageId.get(id) ?? new Set());
    };
    callback();
    return PubSub.subscribe({ '#e': [id], kinds: [7] }, callback, false);
  },

  getThreadRepliesCount(id: string, cb?: (threadReplyCount: number) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.threadRepliesByMessageId.get(id)?.size ?? 0);
    };
    callback();
    return PubSub.subscribe({ '#e': [id], kinds: [1] }, callback, false);
  },

  getReposts(id: string, cb?: (repostedBy: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.repostsByMessageId.get(id) ?? new Set());
    };
    callback();
    return PubSub.subscribe({ '#e': [id], kinds: [1, 6] }, callback, false);
  },

  getZaps(id: string, cb?: (zaps: Set<string> | SortedLimitedEventSet) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.zapsByNote.get(id) ?? new Set());
    };
    callback();
    return PubSub.subscribe({ '#e': [id], kinds: [9735] }, callback, false);
  },

  // TODO: return Unsubscribe
  getEventById(id: string, proxyFirst = false, cb?: (event: Event) => void) {
    let calledBack = false;
    const callback = (event: Event) => {
      if (!calledBack) {
        calledBack = true;
        cb?.(event);
      }
    };
    const event = EventDB.get(id);
    if (event) {
      callback(event);
      return;
    }

    if (proxyFirst) {
      // give proxy 300 ms to respond, then ask ws
      const askRelaysTimeout = setTimeout(() => {
        PubSub.subscribe({ ids: [id] }, (event) => callback(event));
      }, 300);
      fetch(`https://api.iris.to/event/${id}`).then((res) => {
        if (res.status === 200) {
          res.json().then((event) => {
            // TODO verify sig
            if (event && event.id === id) {
              clearTimeout(askRelaysTimeout);
              Events.handle(event, true);
              callback(event);
            }
          });
        }
      });
    } else {
      PubSub.subscribe({ ids: [id] }, callback, false);
    }
  },
};

export default Events;
