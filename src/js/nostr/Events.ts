import iris from 'iris-lib';
import { debounce } from 'lodash';

import { Event, Filter, getEventHash } from '../lib/nostr-tools';

import IndexedDB from './IndexedDB';
import Key from './Key';
import LocalForage from './LocalForage';
import Nostr from './Nostr';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';
import Subscriptions from './Subscriptions';

const startTime = Date.now() / 1000;

const MAX_MSGS_BY_USER = 500;
const MAX_LATEST_MSGS = 500;

const cache = new Map<string, Event>();

const Events = {
  cache: cache,
  deletedEvents: new Set<string>(),
  directMessagesByUser: new Map<string, SortedLimitedEventSet>(),
  likesByUser: new Map<string, SortedLimitedEventSet>(),
  postsByUser: new Map<string, SortedLimitedEventSet>(),
  postsAndRepliesByUser: new Map<string, SortedLimitedEventSet>(),
  notifications: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesAndRepliesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesAndRepliesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByKeywords: new Map<string, SortedLimitedEventSet>(),
  keyValueEvents: new Map<string, Event>(),
  threadRepliesByMessageId: new Map<string, Set<string>>(),
  directRepliesByMessageId: new Map<string, Set<string>>(),
  likesByMessageId: new Map<string, Set<string>>(),
  boostsByMessageId: new Map<string, Set<string>>(),
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
    this.latestNotesAndRepliesByEveryone.add(event);
    if (!replyingTo) {
      this.latestNotesByEveryone.add(event);
    }
    // we don't want both the reply and the original post in the feed:
    replyingTo && this.latestNotesByEveryone.delete(replyingTo);
    const myPub = Key.getPubKey();
    if (event.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)) {
      const changed = this.latestNotesAndRepliesByFollows.add(event);
      // we don't want both the reply and the original post in the feed:
      if (replyingTo) {
        this.latestNotesAndRepliesByFollows.delete(replyingTo);
      } else {
        this.latestNotesByFollows.add(event);
      }
      replyingTo && this.latestNotesByFollows.delete(replyingTo);
      if (changed && LocalForage.loaded) {
        LocalForage.saveEvents();
      }
    }

    // todo: handle astral ninja format boost (retweet) message
    // where content points to the original message tag: "content": "#[1]"

    const isBoost = this.isBoost(event);
    if (replyingTo && !isBoost) {
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
          Nostr.getEventById(id);
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
    const replyTags = event.tags.filter((tag) => tag[0] === 'e' && tag[3] !== 'mention');
    if (replyTags.length === 1) {
      return replyTags[0][1];
    }
    const replyTag = event.tags.find((tag) => tag[0] === 'e' && tag[3] === 'reply');
    if (replyTag) {
      return replyTag[1];
    }
    if (replyTags.length > 1) {
      return replyTags[1][1];
    }
    return undefined;
  },
  handleBoost(event: Event) {
    let id = event.tags.find((tag) => tag[0] === 'e' && tag[3] === 'mention')?.[1];
    if (!id) {
      // last e tag is the boosted post
      id = event.tags
        .slice() // so we don't reverse event.tags in place
        .reverse()
        .find((tag: any) => tag[0] === 'e')?.[1];
    }
    if (!id) return;
    if (!this.boostsByMessageId.has(id)) {
      this.boostsByMessageId.set(id, new Set());
    }
    // only handle one boost per post per user. TODO update with newer event if needed.
    if (!this.boostsByMessageId.get(id)?.has(event.pubkey)) {
      this.boostsByMessageId.get(id)?.add(event.pubkey);
      this.handleNote(event);
    }
  },
  handleReaction(event: Event) {
    const id = event.tags.reverse().find((tag: any) => tag[0] === 'e')?.[1]; // last e tag is the liked post
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
      //Nostr.getEventById(id);
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
          SocialNetwork.addFollower(tag[1], event.pubkey);
        }
      }
    }
    if (SocialNetwork.followedByUser.has(event.pubkey)) {
      for (const previouslyFollowed of SocialNetwork.followedByUser.get(event.pubkey)) {
        if (!event.tags || !event.tags.find((t) => t[0] === 'p' && t[1] === previouslyFollowed)) {
          SocialNetwork.removeFollower(previouslyFollowed, event.pubkey);
        }
      }
    }
    if (event.pubkey === myPub && event.tags.length) {
      if (SocialNetwork.followedByUser.get(myPub)?.size > 10) {
        iris.local().get('showFollowSuggestions').put(false);
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
      const profile = JSON.parse(event.content);
      profile.created_at = event.created_at;
      delete profile['nip05valid']; // not robust
      SocialNetwork.profiles.set(event.pubkey, profile);
      const key = Nostr.toNostrBech32Address(event.pubkey, 'npub');
      iris.session.addToSearchIndex(key, {
        key,
        name: profile.name,
        display_name: profile.display_name,
        followers: SocialNetwork.followersByUser.get(event.pubkey) ?? new Set(),
      });
      // if by our pubkey, save to iris
      const existingEvent = this.cache.get(event.pubkey);
      if (!existingEvent || existingEvent.created_at < event.created_at) {
        this.cache.set(event.pubkey, event);
        LocalForage.loaded && LocalForage.saveProfilesAndFollows();
      }
      //}
    } catch (e) {
      console.log('error parsing nostr profile', e, event);
    }
  },
  handleDelete(event: Event) {
    const id = event.tags.find((tag) => tag[0] === 'e')?.[1];
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
  handleDirectMessage(event: Event) {
    const myPub = Key.getPubKey();
    let user = event.pubkey;
    if (event.pubkey === myPub) {
      user = event.tags.find((tag) => tag[0] === 'p')?.[1] || user;
    } else {
      const forMe = event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPub);
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
    const key = event.tags.find((tag) => tag[0] === 'd')?.[1];
    if (key) {
      const existing = this.keyValueEvents.get(key);
      if (existing?.created_at >= event.created_at) {
        return;
      }
      this.keyValueEvents.set(key, event);
    }
  },
  isBoost(event: Event) {
    const mentionIndex = event.tags.findIndex((tag) => tag[0] === 'e' && tag[3] === 'mention');
    if (event.content === `#[${mentionIndex}]`) {
      return true;
    } else {
      return false;
    }
  },
  handle(event: Event, force = false, saveToIdb = true) {
    if (!event) return;
    if (this.cache.has(event.id) && !force) {
      return;
    }
    if (
      !SocialNetwork.knownUsers.has(event.pubkey) &&
      !Subscriptions.subscribedPosts.has(event.id)
    ) {
      return;
    }
    if (SocialNetwork.blockedUsers.has(event.pubkey)) {
      return;
    }
    if (this.deletedEvents.has(event.id)) {
      return;
    }
    if (event.created_at > Date.now() / 1000) {
      this.futureEventIds.add(event);
      if (this.futureEventIds.has(event.id)) {
        this.cache.set(event.id, event); // TODO should limit stored future events
      }
      if (this.futureEventIds.first() === event.id) {
        this.handleNextFutureEvent();
      }
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
        if (this.isBoost(event)) {
          this.handleBoost(event);
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
        this.handleBoost(event);
        break;
      case 7:
        this.maybeAddNotification(event);
        this.handleReaction(event);
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

    if (saveToIdb) {
      IndexedDB.saveEvent(event);
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
        !event.tags.some((tag) => tag[0] === key && filter[`#${key}`].includes(tag[1]))
      ) {
        return false;
      }
    }
    if (filter['#d']) {
      const tag = event.tags.find((tag) => tag[0] === 'd');
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
  maybeAddNotification(event: Event) {
    // if we're mentioned in tags, add to notifications
    const myPub = Key.getPubKey();
    // TODO: if it's a like, only add if the last p tag is us
    if (event.pubkey !== myPub && event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPub)) {
      if (event.kind === 3) {
        // only notify if we know that they previously weren't following us
        const existingFollows = SocialNetwork.followedByUser.get(event.pubkey);
        if (!existingFollows || existingFollows.has(myPub)) {
          return;
        }
      }
      this.cache.set(event.id, event);
      this.notifications.add(event);
      this.updateUnseenNotificationCount();
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
    iris.local().get('unseenNotificationCount').put(count);
  }, 1000),
  getEventHash,
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
        const referredEvent = Events.cache.get(ref[1]);
        if (referredEvent) {
          relay.publish(referredEvent);
        }
      }
    }
    Events.handle(event);
    return event.id;
  },
};

export default Events;
