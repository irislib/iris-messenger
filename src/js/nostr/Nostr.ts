import iris from 'iris-lib';

import { Event, Filter, Path } from '../lib/nostr-tools';
const bech32 = require('bech32-buffer'); /* eslint-disable-line @typescript-eslint/no-var-requires */
import localForage from 'localforage';
import { route } from 'preact-router';

import Helpers from '../Helpers';

import Events from './Events';
import IndexedDB from './IndexedDB';
import Key from './Key';
import LocalForage from './LocalForage';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';
import Subscriptions from './Subscriptions';

declare global {
  interface Window {
    nostr: any;
    irisNostr: any;
  }
}

try {
  localStorage.setItem('gunPeers', JSON.stringify({})); // quick fix to not connect gun
} catch (e) {
  // ignore
}

const MAX_MSGS_BY_KEYWORD = 100;

const Nostr = {
  MAX_MSGS_BY_KEYWORD,
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
      const addr = Helpers.arrayToHex(data);
      return addr;
    } catch (e) {
      // not a bech32 address
    }
    return null;
  },
  SUGGESTED_FOLLOWS: [
    'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9', // snowden
    'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m', // jack
    'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk', // sirius
    'npub15dqlghlewk84wz3pkqqvzl2w2w36f97g89ljds8x6c094nlu02vqjllm5m', // saylor
    'npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p', // yegorpetrov
    'npub1az9xj85cmxv8e9j9y80lvqp97crsqdu2fpu3srwthd99qfu9qsgstam8y8', // nvk
    'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6', // fiatjaf
    'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s', // jb55
  ],
  saveRelaysToContacts() {
    const relaysObj: any = {};
    for (const url of Relays.relays.keys()) {
      relaysObj[url] = { read: true, write: true };
    }
    const existing = SocialNetwork.followEventByUser.get(Key.getPubKey());
    const content = JSON.stringify(relaysObj);

    const event = {
      kind: 3,
      content,
      tags: existing?.tags || [],
    };
    Events.publish(event);
  },
  async logOut() {
    route('/');
    await localForage.clear();
    iris.session.logOut();
  },
  loadSettings() {
    // fug. iris.local() doesn't callback properly the first time it's loaded from local storage
    localForage.getItem('notificationsSeenTime').then((val) => {
      if (val && !Events.notificationsSeenTime) {
        Events.notificationsSeenTime = val as number;
        Events.updateUnseenNotificationCount();
        console.log('notificationsSeenTime', Events.notificationsSeenTime);
      }
    });
  },
  onLoggedIn() {
    const key = iris.session.getKey();
    const subscribe = (filters: Filter[], callback: (event: Event) => void): string => {
      const filter = filters[0];
      const key = filter['#d']?.[0];
      if (key) {
        const event = Events.keyValueEvents.get(key);
        if (event) {
          callback(event);
        }
      }
      Subscriptions.subscribe(filters, callback);
      return '0';
    };
    const myPub = Key.getPubKey();
    this.private = new Path(
      (...args) => Events.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
      (...args) => Key.encrypt(...args),
      (...args) => Key.decrypt(...args),
    );
    this.public = new Path(
      (...args) => Events.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
    );
    this.public.get('notifications/lastOpened', (time) => {
      if (time !== this.notificationsSeenTime) {
        this.notificationsSeenTime = time;
        localForage.setItem('notificationsSeenTime', time);
        Events.updateUnseenNotificationCount();
      }
    });
    this.public.get('settings/colorScheme', (colorScheme) => {
      if (colorScheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        return;
      } else if (colorScheme === 'default') {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          //OS theme setting detected as dark
          document.documentElement.setAttribute('data-theme', 'light');
          return;
        }
      }
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    SocialNetwork.knownUsers.add(myPub);
    Relays.manage();
    LocalForage.loadEvents();
    IndexedDB.loadIDBEvents();
    SocialNetwork.getProfile(key.secp256k1.rpub, undefined);
    for (const suggestion of this.SUGGESTED_FOLLOWS) {
      const hex = this.toNostrHexAddress(suggestion);
      SocialNetwork.knownUsers.add(hex);
      SocialNetwork.getProfile(this.toNostrHexAddress(hex), undefined);
    }

    setTimeout(() => {
      Subscriptions.sendSubToRelays([{ kinds: [0, 1, 3, 6, 7], limit: 200 }], 'new'); // everything new
      Subscriptions.sendSubToRelays([{ authors: [key.secp256k1.rpub] }], 'ours'); // our stuff
      Subscriptions.sendSubToRelays([{ '#p': [key.secp256k1.rpub] }], 'notifications'); // notifications and DMs
    }, 200);
    setInterval(() => {
      console.log('handled msgs per second', Math.round(Events.handledMsgsPerSecond / 5));
      Events.handledMsgsPerSecond = 0;
    }, 5000);
  },
  init: function () {
    this.loadSettings();
    iris
      .local()
      .get('loggedIn')
      .on(() => this.onLoggedIn());
    let lastResubscribed = Date.now();
    document.addEventListener('visibilitychange', () => {
      // when PWA returns to foreground after 5 min dormancy, resubscribe stuff
      // there might be some better way to manage resubscriptions
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastResubscribed > 1000 * 60 * 5) {
          for (const relay of Relays.relays.values()) {
            this.resubscribe(relay);
          }
          lastResubscribed = Date.now();
        }
      }
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
          Events.directRepliesByMessageId.get(id) ?? new Set(),
          Events.likesByMessageId.get(id) ?? new Set(),
          Events.threadRepliesByMessageId.get(id)?.size ?? 0,
          Events.boostsByMessageId.get(id) ?? new Set(),
        );
    };
    if (Events.directRepliesByMessageId.has(id) || Events.likesByMessageId.has(id)) {
      callback();
    }
    Subscriptions.subscribe([{ kinds: [1, 6, 7], '#e': [id] }], callback);
  },
  async getEventById(id: string) {
    if (Events.cache.has(id)) {
      return Events.cache.get(id);
    }

    return new Promise((resolve) => {
      Subscriptions.subscribe([{ ids: [id] }], () => {
        // TODO turn off subscription
        const msg = Events.cache.get(id);
        msg && resolve(msg);
      });
    });
  },
  getNotifications: function (cb?: (notifications: string[]) => void) {
    const callback = () => {
      cb?.(Events.notifications.eventIds);
    };
    callback();
    Subscriptions.subscribe([{ '#p': [Key.getPubKey()] }], callback);
  },

  getMessagesByEveryone(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ) {
    const callback = () => {
      cb(
        includeReplies
          ? Events.latestNotesAndRepliesByEveryone.eventIds
          : Events.latestNotesByEveryone.eventIds,
        includeReplies,
      );
    };
    callback();
    Subscriptions.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByFollows(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ) {
    const callback = () => {
      cb(
        includeReplies
          ? Events.latestNotesAndRepliesByFollows.eventIds
          : Events.latestNotesByFollows.eventIds,
        includeReplies,
      );
    };
    callback();
    Subscriptions.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByKeyword(keyword: string, cb: (messageIds: string[]) => void) {
    const callback = (event) => {
      if (!Events.latestNotesByKeywords.has(keyword)) {
        Events.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
      }
      Events.latestNotesByKeywords.get(keyword)?.add(event);
      cb(Events.latestNotesByKeywords.get(keyword)?.eventIds);
    };
    // find among cached events
    const filter = { kinds: [1], keywords: [keyword] };
    for (const event of Events.cache.values()) {
      if (Events.matchFilter(event, filter)) {
        if (!Events.latestNotesByKeywords.has(keyword)) {
          Events.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
        }
        Events.latestNotesByKeywords.get(keyword)?.add(event);
      }
    }
    Events.latestNotesByKeywords.has(keyword) &&
      cb(Events.latestNotesByKeywords.get(keyword)?.eventIds);
    Subscriptions.subscribe([filter], callback);
  },
  getPostsAndRepliesByUser(address: string, cb?: (messageIds: string[]) => void) {
    // TODO subscribe on view profile and unsub on leave profile
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(Events.postsAndRepliesByUser.get(address)?.eventIds);
    };
    Events.postsAndRepliesByUser.has(address) && callback();
    Subscriptions.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getPostsByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(Events.postsByUser.get(address)?.eventIds);
    };
    Events.postsByUser.has(address) && callback();
    Subscriptions.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getLikesByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(Events.likesByUser.get(address)?.eventIds);
    };
    Events.likesByUser.has(address) && callback();
    Subscriptions.subscribe([{ kinds: [7, 5], authors: [address] }], callback);
  },

  getDirectMessages(cb?: (dms: Map<string, SortedLimitedEventSet>) => void) {
    const callback = () => {
      cb?.(Events.directMessagesByUser);
    };
    callback();
    Subscriptions.subscribe([{ kinds: [4] }], callback);
  },

  getDirectMessagesByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(Events.directMessagesByUser.get(address)?.eventIds);
    };
    Events.directMessagesByUser.has(address) && callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    Subscriptions.subscribe([{ kinds: [4], '#p': [address, myPub] }], callback);
  },

  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    Events.publish(event);
  },
};

window.irisNostr = Nostr;
export default Nostr;
