import iris from 'iris-lib';
import { debounce } from 'lodash';

import {
  Event,
  Filter,
  getEventHash,
  nip04,
  Relay,
  relayInit,
  signEvent,
  Sub,
} from './lib/nostr-tools';
const bech32 = require('bech32-buffer'); /* eslint-disable-line @typescript-eslint/no-var-requires */
import localForage from 'localforage';

import SortedLimitedEventSet from './SortedLimitedEventSet';

declare global {
  interface Window {
    nostr: any;
  }
}

const getRelayStatus = (relay: Relay) => {
  // workaround for nostr-tools bug
  try {
    return relay.status;
  } catch (e) {
    return 3;
  }
};

const saveLocalStorageEvents = debounce((_this: any) => {
  const latestMsgs = _this.latestNotesByFollows.eventIds.slice(0, 500).map((eventId: any) => {
    return _this.eventsById.get(eventId);
  });
  const latestMsgsByEveryone = _this.latestNotesByEveryone.eventIds
    .slice(0, 1000)
    .map((eventId: any) => {
      return _this.eventsById.get(eventId);
    });
  const notifications = _this.notifications.eventIds.map((eventId: any) => {
    return _this.eventsById.get(eventId);
  });
  console.log('saving some events to local storage');
  localForage.setItem('latestMsgs', latestMsgs);
  localForage.setItem('latestMsgsByEveryone', latestMsgsByEveryone);
  localForage.setItem('notificationEvents', notifications);
  // TODO save own block and flag events
}, 5000);

const saveLocalStorageProfilesAndFollows = debounce((_this) => {
  const profileEvents = Array.from(_this.profileEventByUser.values());
  const followEvents = Array.from(_this.followEventByUser.values());
  console.log('saving', profileEvents.length + followEvents.length, 'events to local storage');
  localForage.setItem('profileEvents', profileEvents);
  localForage.setItem('followEvents', followEvents);
}, 5000);

const MAX_MSGS_BY_USER = 500;
const MAX_LATEST_MSGS = 500;

const eventsById = new Map<string, Event>();

const DEFAULT_RELAYS = [
  'wss://jiggytom.ddns.net',
  'wss://nostr-relay.wlvs.space',
  'wss://nostr.fmt.wiz.biz',
  'wss://nostr.ono.re',
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.nostr.info',
  'wss://nostr.bitcoiner.social',
  'wss://nostr.onsats.org',
  'wss://nostr.mom',
  'wss://brb.io',
];

const defaultRelays = new Map<string, Relay>(
  DEFAULT_RELAYS.map((url) => [url, relayInit(url, eventsById)]),
);

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

let subscriptionId = 0;

export default {
  localStorageLoaded: false,
  profiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  maxRelays: iris.util.isMobile ? 5 : 10,
  relays: defaultRelays,
  knownUsers: new Set<string>(),
  blockedUsers: new Set<string>(),
  flaggedUsers: new Set<string>(),
  deletedEvents: new Set<string>(),
  subscriptionsByName: new Map<string, Set<Sub>>(),
  subscribedFiltersByName: new Map<string, Filter[]>(),
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  subscribedPosts: new Set<string>(),
  subscribedRepliesAndLikes: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  likesByUser: new Map<string, SortedLimitedEventSet>(),
  postsByUser: new Map<string, SortedLimitedEventSet>(),
  postsAndRepliesByUser: new Map<string, SortedLimitedEventSet>(),
  eventsById,
  notifications: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestNotesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  profileEventByUser: new Map<string, Event>(),
  followEventByUser: new Map<string, Event>(),
  threadRepliesByMessageId: new Map<string, Set<string>>(),
  directRepliesByMessageId: new Map<string, Set<string>>(),
  likesByMessageId: new Map<string, Set<string>>(),
  boostsByMessageId: new Map<string, Set<string>>(),
  handledMsgsPerSecond: 0,
  notificationsSeenTime: 0,
  unseenNotificationCount: 0,

  arrayToHex(array: any) {
    return Array.from(array, (byte: any) => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
  },

  setFollowed: function (followedUser: string, follow = true) {
    followedUser = this.toNostrHexAddress(followedUser);
    const myPub = iris.session.getKey().secp256k1.rpub;

    if (follow) {
      this.addFollower(followedUser, myPub);
    } else {
      this.removeFollower(followedUser, myPub);
    }

    const existing = this.followEventByUser.get(myPub);

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.followedByUser.get(myPub)).map((address: string) => {
        return ['p', address];
      }),
    };

    this.publish(event);
  },

  setBlocked: function (blockedUser: string, block = true) {
    blockedUser = this.toNostrHexAddress(blockedUser);
    const myPub = iris.session.getKey().secp256k1.rpub;

    if (block) {
      this.blockedUsers.add(blockedUser);
      this.removeFollower(blockedUser, myPub);
    } else {
      this.blockedUsers.delete(blockedUser);
    }
  },

  loadLocalStorageEvents: async function () {
    const latestMsgs = await localForage.getItem('latestMsgs');
    const latestMsgsByEveryone = await localForage.getItem('latestMsgsByEveryone');
    const followEvents = await localForage.getItem('followEvents');
    const profileEvents = await localForage.getItem('profileEvents');
    const notificationEvents = await localForage.getItem('notificationEvents');
    this.localStorageLoaded = true;
    console.log('loaded from local storage');
    console.log('latestMsgs', latestMsgs);
    console.log('followEvents', followEvents);
    console.log('profileEvents', profileEvents);
    console.log('notificationEvents', notificationEvents);
    if (Array.isArray(followEvents)) {
      followEvents.forEach((e) => this.handleEvent(e));
    }
    if (Array.isArray(profileEvents)) {
      profileEvents.forEach((e) => this.handleEvent(e));
    }
    if (Array.isArray(latestMsgs)) {
      console.log('loaded latestmsgs');
      latestMsgs.forEach((msg) => {
        this.handleEvent(msg);
      });
    }
    if (Array.isArray(latestMsgsByEveryone)) {
      console.log('loaded latestMsgsByEveryone');
      latestMsgsByEveryone.forEach((msg) => {
        this.handleEvent(msg);
      });
    }
    if (Array.isArray(notificationEvents)) {
      console.log('loaded notificationEvents');
      notificationEvents.forEach((msg) => {
        this.handleEvent(msg);
      });
    }
  },
  addRelay(url: string) {
    if (this.relays.has(url)) return;
    const relay = relayInit(url, this.eventsById);
    relay.on('connect', () => {
      for (const [name, filters] of this.subscribedFiltersByName.entries()) {
        const sub = relay.sub(filters, {});
        if (!this.subscriptionsByName.has(name)) {
          this.subscriptionsByName.set(name, new Set());
        }
        this.subscriptionsByName.get(name)?.add(sub);
        //console.log('subscriptions size', this.subscriptionsByName.size);
      }
    });
    relay.on('notice', (notice) => {
      console.log('notice from ', relay.url, notice);
    });
    this.relays.set(url, relay);
  },
  removeRelay(url: string) {
    try {
      this.relays.get(url)?.close();
    } catch (e) {
      console.log('error closing relay', e);
    }
    this.relays.delete(url);
  },
  addFollower: function (followedUser: string, follower: string) {
    if (!this.followersByUser.has(followedUser)) {
      this.followersByUser.set(followedUser, new Set<string>());
    }
    this.knownUsers.add(followedUser);
    this.knownUsers.add(follower);
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<string>());
    }
    const myPub = iris.session.getKey().secp256k1.rpub;

    // if new follow, move all their posts to followedByUser
    if (follower === myPub && !this.followedByUser.get(myPub).has(followedUser)) {
      const posts = this.postsByUser.get(followedUser);
      if (posts) {
        posts.eventIds.forEach((eventId) => {
          const event = this.eventsById.get(eventId);
          event && this.latestNotesByFollows.add(event);
        });
      }
    }
    this.followedByUser.get(follower)?.add(followedUser);
    if (follower === myPub) {
      this.getPostsAndRepliesByUser(followedUser);
    }
    if (followedUser === myPub) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        iris.local().get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myPub)?.has(follower)) {
      if (!this.subscribedUsers.has(followedUser)) {
        this.subscribedUsers.add(followedUser); // subscribe to events from 2nd degree follows
        this.subscribeToAuthors(this);
      }
    }
  },
  removeFollower: function (unfollowedUser: string, follower: string) {
    this.followersByUser.get(unfollowedUser)?.delete(follower);
    this.followedByUser.get(follower)?.delete(unfollowedUser);
    const blocked = this.blockedUsers.has(unfollowedUser);
    this.latestNotesByFollows.eventIds.forEach((id) => {
      const fullEvent = this.eventsById.get(id);
      if (fullEvent?.pubkey === unfollowedUser) {
        this.latestNotesByFollows.delete(id);
        // if blocked user is in a p tag, remove the note
        fullEvent?.tags.forEach((tag) => {
          if (tag[0] === 'p' && tag[1] === unfollowedUser) {
            this.latestNotesByFollows.delete(id);
          }
        });
      }
    });
    if (blocked || this.followersByUser.get(unfollowedUser)?.size === 0) {
      // TODO: remove unfollowedUser from everyone's followersByUser.
      //  if resulting followersByUser(u).size is 0, remove that user as well
      this.followersByUser.delete(unfollowedUser);
      this.knownUsers.delete(unfollowedUser);
      this.subscribedUsers.delete(unfollowedUser);
      this.latestNotesByEveryone.eventIds.forEach((id) => {
        const fullEvent = this.eventsById.get(id);
        if (fullEvent?.pubkey === unfollowedUser) {
          this.latestNotesByEveryone.delete(id);
          this.eventsById.delete(id);
          fullEvent?.tags.forEach((tag) => {
            if (tag[0] === 'p' && tag[1] === unfollowedUser) {
              this.latestNotesByEveryone.delete(id);
            }
          });
        }
      });
    }
    saveLocalStorageEvents(this);
  },
  // TODO subscription methods for followersByUser and followedByUser. and maybe messagesByTime. and replies
  followerCount: function (address: string) {
    return this.followersByUser.get(address)?.size ?? 0;
  },
  toNostrBech32Address: function (address: string, prefix: string) {
    if (!prefix) {
      throw new Error('prefix is required');
    }
    try {
      const decoded = bech32.decode(address);
      if (prefix !== decoded.prefix) {
        return null;
      }
      return bech32.encode(prefix, decoded.data);
    } catch (e) {
      // not a bech32 address
    }

    if (address.match(/^[0-9a-fA-F]{64}$/)) {
      const words = Buffer.from(address, 'hex');
      return bech32.encode(prefix, words);
    }
    return null;
  },
  toNostrHexAddress(str: string): string | null {
    if (str.match(/^[0-9a-fA-F]{64}$/)) {
      return str;
    }
    try {
      const { data } = bech32.decode(str);
      const addr = this.arrayToHex(data);
      return addr;
    } catch (e) {
      // not a bech32 address
    }
    return null;
  },
  publish: async function (event: any) {
    if (!event.sig) {
      event.tags = event.tags || [];
      event.content = event.content || '';
      event.created_at = event.created_at || Math.floor(Date.now() / 1000);
      event.pubkey = iris.session.getKey().secp256k1.rpub;
      event.id = getEventHash(event);

      const myPriv = iris.session.getKey().secp256k1.priv;
      if (myPriv) {
        event.sig = await signEvent(event, myPriv);
      } else if (window.nostr) {
        event = await window.nostr.signEvent(event);
      } else {
        alert('no nostr extension to sign the event with');
        return;
      }
    }
    if (!(event.id && event.sig)) {
      console.error('Invalid event', event);
      throw new Error('Invalid event');
    }
    for (const relay of this.relays.values()) {
      relay.publish(event);
    }
    this.handleEvent(event);
    return event.id;
  },
  sendSubToRelays: function (filters: Filter[], id: string, once = false, unsubscribeTimeout = 0) {
    // if subs with same id already exists, remove them
    if (id) {
      const subs = this.subscriptionsByName.get(id);
      if (subs) {
        subs.forEach((sub) => {
          console.log('unsub', id);
          sub.unsub();
        });
      }
      this.subscriptionsByName.delete(id);
      this.subscribedFiltersByName.delete(id);
    }

    this.subscribedFiltersByName.set(id, filters);

    if (unsubscribeTimeout) {
      setTimeout(() => {
        this.subscriptionsByName.delete(id);
        this.subscribedFiltersByName.delete(id);
      }, unsubscribeTimeout);
    }

    for (const relay of this.relays.values()) {
      const sub = relay.sub(filters, {});
      // TODO update relay lastSeen
      sub.on('event', (event) => this.handleEvent(event));
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!this.subscriptionsByName.has(id)) {
        this.subscriptionsByName.set(id, new Set());
      }
      this.subscriptionsByName.get(id)?.add(sub);
      console.log('subscriptions size', this.subscriptionsByName.size);
      if (unsubscribeTimeout) {
        setTimeout(() => {
          sub.unsub();
        }, unsubscribeTimeout);
      }
    }
  },
  subscribeToRepliesAndLikes: debounce((_this) => {
    console.log('subscribeToRepliesAndLikes', _this.subscribedRepliesAndLikes);
    _this.sendSubToRelays(
      [{ kinds: [1, 6, 7], '#e': Array.from(_this.subscribedRepliesAndLikes.values()) }],
      'subscribedRepliesAndLikes',
      true,
    );
  }, 500),
  // TODO we shouldn't bang the history queries all the time. only ask a users history once per relay.
  // then we can increase the limit
  subscribeToAuthors: debounce((_this) => {
    const now = Math.floor(Date.now() / 1000);
    const myPub = iris.session.getKey().secp256k1.rpub;
    const followedUsers = Array.from(_this.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    const otherSubscribedUsers = Array.from(_this.subscribedUsers).filter(
      (u) => !followedUsers.includes(u),
    );
    console.log('subscribe to', followedUsers, otherSubscribedUsers);
    _this.sendSubToRelays(
      [{ kinds: [0, 3], until: now, authors: followedUsers }],
      'followed',
      true,
    );
    setTimeout(() => {
      _this.sendSubToRelays(
        [{ kinds: [0, 3], until: now, authors: otherSubscribedUsers }],
        'other',
        true,
      );
    }, 500);
    if (_this.subscribedProfiles.size) {
      _this.sendSubToRelays(
        [{ authors: Array.from(_this.subscribedProfiles.values()), kinds: [0] }],
        'subscribedProfiles',
        true,
      );
    }
    setTimeout(() => {
      _this.sendSubToRelays(
        [{ authors: followedUsers, limit: 500, until: now }],
        'followedHistory',
        true,
      );
    }, 1000);
    setTimeout(() => {
      _this.sendSubToRelays(
        [{ authors: otherSubscribedUsers, limit: 500, until: now }],
        'otherHistory',
        true,
      );
    }, 1500);
  }, 1000),
  subscribeToPosts: debounce((_this) => {
    if (_this.subscribedPosts.size === 0) return;
    console.log('subscribe to posts', Array.from(_this.subscribedPosts));
    _this.sendSubToRelays([{ ids: Array.from(_this.subscribedPosts) }], 'posts');
  }, 100),
  subscribe: function (filters: Filter[], cb?: (event: Event) => void) {
    cb &&
      this.subscriptions.set(subscriptionId++, {
        filters,
        callback: cb,
      });

    let hasNewAuthors = false;
    let hasNewIds = false;
    let hasNewReplyAndLikeSubs = false;
    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          if (!author) continue;
          // make sure the author is valid hex
          if (!author.match(/^[0-9a-fA-F]{64}$/)) {
            console.error('Invalid author', author);
            continue;
          }
          if (!this.subscribedUsers.has(author)) {
            hasNewAuthors = true;
            this.subscribedUsers.add(author);
          }
        }
      }
      if (filter.ids) {
        for (const id of filter.ids) {
          if (!this.subscribedPosts.has(id)) {
            hasNewIds = true;
            this.subscribedPosts.add(id);
          }
        }
      }
      if (Array.isArray(filter['#e'])) {
        for (const id of filter['#e']) {
          if (!this.subscribedRepliesAndLikes.has(id)) {
            hasNewReplyAndLikeSubs = true;
            this.subscribedRepliesAndLikes.add(id);
            setTimeout(() => {
              // remove after some time, so the requests don't grow too large
              this.subscribedRepliesAndLikes.delete(id);
            }, 60 * 1000);
          }
        }
      }
    }
    hasNewReplyAndLikeSubs && this.subscribeToRepliesAndLikes(this);
    hasNewAuthors && this.subscribeToAuthors(this); // TODO subscribe to old stuff from new authors, don't resubscribe to all
    hasNewIds && this.subscribeToPosts(this);
  },
  getConnectedRelayCount: function () {
    let count = 0;
    for (const relay of this.relays.values()) {
      if (getRelayStatus(relay) === 1) {
        count++;
      }
    }
    return count;
  },
  SUGGESTED_FOLLOW: 'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk',
  connectRelay: function (relay: Relay) {
    relay.connect();
  },
  manageRelays: function () {
    // TODO keep track of subscriptions and send them to new relays
    const go = () => {
      const relays: Array<Relay> = Array.from(this.relays.values());
      // ws status codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      const openRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 1);
      const connectingRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 0);
      if (openRelays.length + connectingRelays.length < this.maxRelays) {
        const closedRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 3);
        if (closedRelays.length) {
          const newRelay = relays[Math.floor(Math.random() * relays.length)];
          this.connectRelay(newRelay);
        }
      }
      if (openRelays.length > this.maxRelays) {
        openRelays[Math.floor(Math.random() * openRelays.length)].close();
      }
    };

    for (let i = 0; i < this.maxRelays; i++) {
      go();
    }

    for (const relay of this.relays.values()) {
      relay.on('notice', (notice) => {
        console.log('notice from ', relay.url, notice);
      });
    }

    setInterval(go, 1000);
  },
  handleNote(event: Event) {
    this.eventsById.set(event.id, event);
    if (!this.postsAndRepliesByUser.has(event.pubkey)) {
      this.postsAndRepliesByUser.set(event.pubkey, new SortedLimitedEventSet(MAX_MSGS_BY_USER));
    }
    this.postsAndRepliesByUser.get(event.pubkey)?.add(event);

    this.latestNotesByEveryone.add(event);
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (event.pubkey === myPub || this.followedByUser.get(myPub)?.has(event.pubkey)) {
      const changed = this.latestNotesByFollows.add(event);
      if (changed && this.localStorageLoaded) {
        saveLocalStorageEvents(this);
      }
    }

    // todo: handle astral ninja format boost (retweet) message
    // where content points to the original message tag: "content": "#[1]"

    const replyingTo = this.getEventReplyingTo(event);
    if (replyingTo) {
      if (!this.directRepliesByMessageId.has(replyingTo)) {
        this.directRepliesByMessageId.set(replyingTo, new Set<string>());
      }
      this.directRepliesByMessageId.get(replyingTo)?.add(event.id);

      // are boost messages screwing this up?
      const repliedMsgs = event.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1])
        .slice(0, 2);
      const myPub = iris.session.getKey().secp256k1.rpub;
      const isFollowed =
        event.pubkey === myPub || this.followedByUser.get(myPub)?.has(event.pubkey);
      for (const id of repliedMsgs) {
        if (isFollowed) {
          //this.getMessageById(id);
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
    const replyTags = event.tags.filter((tag) => tag[0] === 'e');
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
    const id = event.tags.reverse().find((tag: any) => tag[0] === 'e')?.[1]; // last e tag is the liked post
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
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (event.pubkey === myPub || this.followedByUser.get(myPub)?.has(event.pubkey)) {
      //this.getMessageById(id);
    }
  },
  handleFollow(event: Event) {
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag[0] === 'p') {
        this.addFollower(tag[1], event.pubkey);
      }
    }
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (event.pubkey === myPub && event.tags.length) {
      iris.local().get('noFollows').put(false);
    }
    if (event.pubkey === myPub || this.followedByUser.get(myPub)?.has(event.pubkey)) {
      const existing = this.followEventByUser.get(event.pubkey);
      if (!existing || existing.created_at < event.created_at) {
        this.followEventByUser.set(event.pubkey, event);
        this.localStorageLoaded && saveLocalStorageProfilesAndFollows(this);
      }
    }
    if (event.pubkey === myPub && event.content?.length) {
      try {
        const relays = JSON.parse(event.content);
        const urls = Object.keys(relays);
        if (urls.length) {
          // remove all existing relays that are not in urls. TODO: just disable
          console.log('setting relays from your contacs list', urls);
          for (const url of this.relays.keys()) {
            if (!urls.includes(url)) {
              this.removeRelay(url);
            }
          }
          for (const url of urls) {
            this.addRelay(url);
          }
        }
      } catch (e) {
        console.log('failed to parse your relays list', event);
      }
    }
  },
  restoreDefaultRelays() {
    this.relays.clear();
    for (const url of DEFAULT_RELAYS) {
      this.addRelay(url);
    }
    this.saveRelaysToContacts();
  },
  saveRelaysToContacts() {
    const relaysObj: any = {};
    for (const url of this.relays.keys()) {
      relaysObj[url] = { read: true, write: true };
    }
    const existing = this.followEventByUser.get(iris.session.getKey().secp256k1.rpub);
    const content = JSON.stringify(relaysObj);

    const event = {
      kind: 3,
      content,
      tags: existing?.tags || [],
    };
    this.publish(event);
  },
  async handleBlockList(event: Event) {
    if (this.myBlockEvent?.created_at > event.created_at) {
      return;
    }
    this.myBlockEvent = event;
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (event.pubkey === myPub) {
      try {
        const myPriv = iris.session.getKey().secp256k1.priv;
        let content;
        if (myPriv) {
          content = await nip04.decrypt(myPriv, myPub, event.content);
        } else {
          content = await window.nostr.nip04.decrypt(myPub, event.content);
        }
        const blockList = JSON.parse(content);
        this.blockedUsers = new Set(blockList);
      } catch (e) {
        console.log('failed to parse your block list', event);
      }
    }
  },
  handleFlagList(event: Event) {
    if (this.myFlagEvent?.created_at > event.created_at) {
      return;
    }
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (event.pubkey === myPub) {
      try {
        const flaggedUsers = JSON.parse(event.content);
        this.flaggedUsers = new Set(flaggedUsers);
      } catch (e) {
        console.log('failed to parse your flagged users list', event);
      }
    }
  },
  handleMetadata(event: Event) {
    try {
      const existing = this.profiles.get(event.pubkey);
      if (existing?.created_at >= event.created_at) {
        return;
      }
      const profile = JSON.parse(event.content);
      profile.created_at = event.created_at;
      delete profile['nip05valid']; // not robust
      this.profiles.set(event.pubkey, profile);
      const key = this.toNostrBech32Address(event.pubkey, 'npub');
      iris.session.addToSearchIndex(key, {
        key,
        name: profile.name,
        followers: this.followersByUser.get(event.pubkey) ?? new Set(),
      });
      // if by our pubkey, save to iris
      const existingEvent = this.profileEventByUser.get(event.pubkey);
      if (!existingEvent || existingEvent.created_at < event.created_at) {
        this.profileEventByUser.set(event.pubkey, event);
        this.localStorageLoaded && saveLocalStorageProfilesAndFollows(this);
      }
      //}
    } catch (e) {
      console.log('error parsing nostr profile', e, event);
    }
  },
  handleDelete(event: Event) {
    const id = event.tags.find((tag) => tag[0] === 'e')?.[1];
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (id) {
      const deletedEvent = this.eventsById.get(id);
      // only we or the author can delete
      if (deletedEvent && [event.pubkey, myPub].includes(deletedEvent.pubkey)) {
        this.eventsById.delete(id);
        this.postsAndRepliesByUser.get(event.pubkey)?.delete(id);
        this.latestNotesByFollows.delete(id);
        this.latestNotesByEveryone.delete(id);
      }
    }
  },
  updateUnseenNotificationCount: debounce((count) => {
    iris.local().get('unseenNotificationCount').put(count);
  }, 1000),
  maybeAddNotification(event: Event) {
    // if we're mentioned in tags, add to notifications
    const myPub = iris.session.getKey().secp256k1.rpub;
    // TODO: if it's a like, only add if the last p tag is us
    if (event.pubkey !== myPub && event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPub)) {
      if (event.kind === 3) {
        // only notify if we know that they previously weren't following us
        const existingFollows = this.followedByUser.get(event.pubkey);
        if (!existingFollows || existingFollows.has(myPub)) {
          return;
        }
      }
      this.eventsById.set(event.id, event);
      this.notifications.add(event);
      if (event.created_at > this.notificationsSeenTime) {
        this.unseenNotificationCount++;
        this.updateUnseenNotificationCount(this.unseenNotificationCount);
      }
    }
  },
  handleEvent(event: Event) {
    if (!event) return;
    if (this.eventsById.has(event.id)) {
      return;
    }
    if (!this.knownUsers.has(event.pubkey) && !this.subscribedPosts.has(event.id)) {
      return;
    }
    if (this.blockedUsers.has(event.pubkey)) {
      return;
    }
    if (this.deletedEvents.has(event.id)) {
      return;
    }
    if (event.created_at > Date.now() / 1000 + 60 * 1000) {
      return; // TODO put future messages into bounded queue and process them later
    }

    this.handledMsgsPerSecond++;

    switch (event.kind) {
      case 0:
        this.handleMetadata(event);
        break;
      case 1:
        this.maybeAddNotification(event);
        this.handleNote(event);
        break;
      case 5:
        this.handleDelete(event);
        break;
      case 3:
        // TODO if existing follow list doesn't include us and the new one does, add to notifications
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
        this.handleBlockList(event);
        break;
      case 16463:
        this.handleFlagList(event);
        break;
    }
    this.subscribedPosts.delete(event.id);

    if (
      this.subscribedProfiles.has(event.pubkey) &&
      this.profileEventByUser.has(event.pubkey) &&
      this.followEventByUser.has(event.pubkey)
    ) {
      this.subscribedProfiles.delete(event.pubkey);
    }

    // go through subscriptions and callback if filters match
    for (const sub of this.subscriptions.values()) {
      if (!sub.filters) {
        return;
      }
      if (this.matchesOneFilter(event, sub.filters)) {
        sub.callback && sub.callback(event);
      }
    }
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
    if (
      filter['#e'] &&
      !event.tags.some((tag: any) => tag[0] === 'e' && filter['#e'].includes(tag[1]))
    ) {
      return false;
    }
    if (
      filter['#p'] &&
      !event.tags.some((tag: any) => tag[0] === 'p' && filter['#p'].includes(tag[1]))
    ) {
      return false;
    }
    return true;
  },
  async logOut() {
    await localForage.clear();
    iris.session.logOut();
  },
  init: function () {
    iris
      .local()
      .get('notificationsSeenTime')
      .on((time) => {
        this.notificationsSeenTime = time;
        localForage.setItem('notificationsSeenTime', time);
      });
    iris
      .local()
      .get('maxRelays')
      .on((maxRelays) => {
        this.maxRelays = maxRelays;
        localForage.setItem('maxRelays', maxRelays);
      });
    iris
      .local()
      .get('unseenNotificationCount')
      .on((unseenNotificationCount) => {
        this.unseenNotificationCount = unseenNotificationCount;
      });
    // fug. iris.local() doesn't callback properly the first time it's loaded from local storage
    localForage.getItem('notificationsSeenTime').then((val) => {
      if (val !== null) {
        iris.local().get('notificationsSeenTime').put(val);
        this.notificationsSeenTime = val;
      }
    });
    localForage.getItem('maxRelays').then((val) => {
      if (val !== null) {
        iris.local().get('maxRelays').put(val);
        this.maxRelays = val;
      }
    });
    iris
      .local()
      .get('loggedIn')
      .on(() => {
        const key = iris.session.getKey();
        this.knownUsers.add(key);
        this.manageRelays();
        this.loadLocalStorageEvents();
        this.getProfile(key.secp256k1.rpub, undefined);
        const hex = this.toNostrHexAddress(this.SUGGESTED_FOLLOW);
        this.knownUsers.add(hex);
        this.getProfile(this.toNostrHexAddress(hex), undefined);
        this.sendSubToRelays([{ kinds: [0, 1, 3, 6, 7], limit: 200 }], 'new'); // everything new
        setTimeout(() => {
          this.sendSubToRelays([{ authors: [key.secp256k1.rpub] }], 'ours'); // our stuff
          this.sendSubToRelays([{ '#p': [key.secp256k1.rpub] }], 'notifications'); // notifications
        }, 200);
        setInterval(() => {
          console.log('handled msgs per second', this.handledMsgsPerSecond);
          this.handledMsgsPerSecond = 0;
        }, 1000);
        iris
          .public()
          .get('block')
          .map((isBlocked, address) => {
            const hex = this.toNostrHexAddress(address);
            hex && this.setBlocked(hex, isBlocked);
          });
      });
  },
  getRepliesAndLikes(
    id: string,
    cb?: (
      replies: Set<string>,
      likedBy: Set<string>,
      threadReplyCount: number,
      boostedBy: Set<string>,
    ) => void,
  ) {
    const callback = () => {
      cb &&
        cb(
          this.directRepliesByMessageId.get(id) ?? new Set(),
          this.likesByMessageId.get(id) ?? new Set(),
          this.threadRepliesByMessageId.get(id)?.size ?? 0,
          this.boostsByMessageId.get(id) ?? new Set(),
        );
    };
    if (this.directRepliesByMessageId.has(id) || this.likesByMessageId.has(id)) {
      callback();
    }
    this.subscribe([{ kinds: [1, 6, 7], '#e': [id] }], callback);
  },
  block: async function (address: string, isBlocked: boolean) {
    isBlocked ? this.blockedUsers.add(address) : this.blockedUsers.delete(address);
    let content = JSON.stringify(Array.from(this.blockedUsers));
    const myPub = iris.session.getKey().secp256k1.rpub;
    const myPriv = iris.session.getKey().secp256k1.priv;
    if (myPriv) {
      content = await nip04.encrypt(myPriv, myPub, content);
    } else {
      content = await window.nostr.nip04.encrypt(myPub, content);
    }
    this.publish({
      kind: 16462,
      content,
    });
  },
  flag: function (address: string, isFlagged: boolean) {
    isFlagged ? this.flaggedUsers.add(address) : this.flaggedUsers.delete(address);
    this.publish({
      kind: 16463,
      content: JSON.stringify(Array.from(this.flaggedUsers)),
    });
  },
  getBlockedUsers(cb?: (blocked: Set<string>) => void) {
    const callback = () => {
      cb?.(this.blockedUsers);
    };
    callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    this.subscribe([{ kinds: [16462], authors: [myPub] }], callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void) {
    const callback = () => {
      cb?.(this.flaggedUsers);
    };
    callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    this.subscribe([{ kinds: [16463], authors: [myPub] }], callback);
  },
  getFollowedByUser: function (user: string, cb?: (followedUsers: Set<string>) => void) {
    const callback = () => {
      cb?.(this.followedByUser.get(user) ?? new Set());
    };
    this.followedByUser.has(user) && callback();
    this.subscribe([{ kinds: [3], authors: [user] }], callback);
  },
  getFollowersByUser: function (address: string, cb?: (followers: Set<string>) => void) {
    const callback = () => {
      cb?.(this.followersByUser.get(address) ?? new Set());
    };
    this.followersByUser.has(address) && callback();
    this.subscribe([{ kinds: [3], '#p': [address] }], callback); // TODO this doesn't fire when a user is unfollowed
  },
  async getMessageById(id: string) {
    if (this.eventsById.has(id)) {
      return this.eventsById.get(id);
    }

    return new Promise((resolve) => {
      this.subscribe([{ ids: [id] }], () => {
        // TODO turn off subscription
        const msg = this.eventsById.get(id);
        msg && resolve(msg);
      });
    });
  },
  getNotifications: function (cb?: (notifications: string[]) => void) {
    const callback = () => {
      cb?.(this.notifications.eventIds);
    };
    callback();
    this.subscribe([{ '#p': [iris.session.getKey().secp256k1.rpub] }], callback);
  },

  getSomeRelayUrl() {
    // try to find a connected relay, but if none are connected, just return the first one
    const relays: Relay[] = Array.from(this.relays.values());
    const connectedRelays: Relay[] = relays.filter((relay: Relay) => getRelayStatus(relay) === 1);
    if (connectedRelays.length) {
      return connectedRelays[0].url;
    }
    return relays.length ? relays[0].url : null;
  },

  getMessagesByEveryone(cb: (messageIds: string[]) => void) {
    const callback = () => {
      cb(this.latestNotesByEveryone.eventIds);
    };
    callback();
    this.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByFollows(cb: (messageIds: string[]) => void) {
    const callback = () => {
      cb(this.latestNotesByFollows.eventIds);
    };
    callback();
    this.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getPostsAndRepliesByUser(address: string, cb?: (messageIds: string[]) => void) {
    // TODO subscribe on view profile and unsub on leave profile
    this.knownUsers.add(address);
    const callback = () => {
      cb?.(this.postsAndRepliesByUser.get(address)?.eventIds);
    };
    this.postsAndRepliesByUser.has(address) && callback();
    this.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getPostsByUser(address: string, cb?: (messageIds: string[]) => void) {
    this.knownUsers.add(address);
    const callback = () => {
      cb?.(this.postsByUser.get(address)?.eventIds);
    };
    this.postsByUser.has(address) && callback();
    this.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getLikesByUser(address: string, cb?: (messageIds: string[]) => void) {
    this.knownUsers.add(address);
    const callback = () => {
      cb?.(this.likesByUser.get(address)?.eventIds);
    };
    this.likesByUser.has(address) && callback();
    this.subscribe([{ kinds: [7, 5], authors: [address] }], callback);
  },
  getProfile(address, cb?: (profile: any, address: string) => void, verifyNip05 = false) {
    this.knownUsers.add(address);
    const callback = () => {
      cb?.(this.profiles.get(address), address);
    };

    const profile = this.profiles.get(address);
    if (profile) {
      callback();
      if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
        this.verifyNip05Address(profile.nip05, address).then((isValid) => {
          console.log('NIP05 address is valid?', isValid, profile.nip05, address);
          profile.nip05valid = isValid;
          this.profiles.set(address, profile);
          callback();
        });
      }
    }

    this.subscribedProfiles.add(address);
    this.subscribe([{ authors: [address], kinds: [0, 3] }], callback);
  },

  async verifyNip05Address(address: string, pubkey: string): Promise<boolean> {
    try {
      const [localPart, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${localPart}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return names[localPart] === pubkey;
    } catch (error) {
      // gives lots of cors errors:
      // console.error(error);
      return false;
    }
  },

  async getPubKeyByNip05Address(address: string): Promise<string | null> {
    try {
      const [localPart, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${localPart}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return names[localPart] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    this.publish(event);
  },
};
