import iris from 'iris-lib';
import { debounce, throttle } from 'lodash';

import {
  Event,
  Filter,
  getEventHash,
  nip04,
  Path,
  Relay,
  signEvent,
  Sub,
} from '../lib/nostr-tools';
const bech32 = require('bech32-buffer'); /* eslint-disable-line @typescript-eslint/no-var-requires */
import { sha256 } from '@noble/hashes/sha256';
import localForage from 'localforage';
import { route } from 'preact-router';

import IndexedDB from './IndexedDB';
import LocalForage from './LocalForage';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';
import SortedLimitedEventSet from './SortedLimitedEventSet';

const startTime = Date.now() / 1000;

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

const MAX_MSGS_BY_USER = 500;
const MAX_LATEST_MSGS = 500;
const MAX_MSGS_BY_KEYWORD = 100;

const eventsById = new Map<string, Event>();

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

let subscriptionId = 0;

const Nostr = {
  deletedEvents: new Set<string>(),
  directMessagesByUser: new Map<string, SortedLimitedEventSet>(),
  subscriptionsByName: new Map<string, Set<Sub>>(),
  subscribedFiltersByName: new Map<string, Filter[]>(),
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  subscribedPosts: new Set<string>(),
  subscribedRepliesAndLikes: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  subscribedKeywords: new Set<string>(),
  likesByUser: new Map<string, SortedLimitedEventSet>(),
  postsByUser: new Map<string, SortedLimitedEventSet>(),
  postsAndRepliesByUser: new Map<string, SortedLimitedEventSet>(),
  eventsById,
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
  windowNostrQueue: [],
  isProcessingQueue: false,
  notificationsSeenTime: 0,
  futureEventIds: new SortedLimitedEventSet(100, false),
  futureEventTimeout: 0,

  arrayToHex(array: any) {
    return Array.from(array, (byte: any) => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
  },

  async decryptMessage(id, cb: (decrypted: string) => void) {
    const existing = this.decryptedMessages.get(id);
    if (existing) {
      cb(existing);
      return;
    }
    try {
      const myPub = this.getPubKey();
      const msg = this.eventsById.get(id);
      const theirPub =
        msg.pubkey === myPub ? msg.tags.find((tag: any) => tag[0] === 'p')[1] : msg.pubkey;
      if (!(msg && theirPub)) {
        return;
      }

      let decrypted = await this.decrypt(msg.content, theirPub);
      if (decrypted.content) {
        decrypted = decrypted.content; // what? TODO debug
      }
      this.decryptedMessages.set(id, decrypted);
      cb(decrypted);
    } catch (e) {
      console.error(e);
    }
  },
  getSubscriptionIdForName(name: string) {
    return this.arrayToHex(sha256(name)).slice(0, 8);
  },
  resubscribe(relay: Relay) {
    for (const [name, filters] of this.subscribedFiltersByName.entries()) {
      const id = this.getSubscriptionIdForName(name);
      const sub = relay.sub(filters, { id });
      if (!this.subscriptionsByName.has(name)) {
        this.subscriptionsByName.set(name, new Set());
      }
      this.subscriptionsByName.get(name)?.add(sub);
    }
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
  getEventHash,
  publish: async function (event: any) {
    if (!event.sig) {
      if (!event.tags) {
        event.tags = [];
      }
      event.content = event.content || '';
      event.created_at = event.created_at || Math.floor(Date.now() / 1000);
      event.pubkey = this.getPubKey();
      event.id = getEventHash(event);
      event.sig = await this.sign(event);
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
        const referredEvent = this.eventsById.get(ref[1]);
        if (referredEvent) {
          relay.publish(referredEvent);
        }
      }
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

    for (const relay of (id == 'keywords' ? Relays.searchRelays : Relays.relays).values()) {
      const subId = this.getSubscriptionIdForName(id);
      const sub = relay.sub(filters, { id: subId });
      // TODO update relay lastSeen
      sub.on('event', (event) => this.handleEvent(event));
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!this.subscriptionsByName.has(id)) {
        this.subscriptionsByName.set(id, new Set());
      }
      this.subscriptionsByName.get(id)?.add(sub);
      //console.log('subscriptions size', this.subscriptionsByName.size);
      if (unsubscribeTimeout) {
        setTimeout(() => {
          sub.unsub();
        }, unsubscribeTimeout);
      }
    }
  },
  subscribeToRepliesAndLikes: debounce(() => {
    console.log('subscribeToRepliesAndLikes', Nostr.subscribedRepliesAndLikes);
    Nostr.sendSubToRelays(
      [{ kinds: [1, 6, 7], '#e': Array.from(Nostr.subscribedRepliesAndLikes.values()) }],
      'subscribedRepliesAndLikes',
      true,
    );
  }, 500),
  // TODO we shouldn't bang the history queries all the time. only ask a users history once per relay.
  // then we can increase the limit
  subscribeToAuthors: debounce(() => {
    const now = Math.floor(Date.now() / 1000);
    const myPub = Nostr.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    console.log('subscribe to', followedUsers.length, 'followedUsers');
    Nostr.sendSubToRelays(
      [{ kinds: [0, 3], until: now, authors: followedUsers }],
      'followed',
      true,
    );
    if (Nostr.subscribedProfiles.size) {
      Nostr.sendSubToRelays(
        [{ authors: Array.from(Nostr.subscribedProfiles.values()), kinds: [0] }],
        'subscribedProfiles',
        true,
      );
    }
    setTimeout(() => {
      Nostr.sendSubToRelays(
        [{ authors: followedUsers, limit: 500, until: now }],
        'followedHistory',
        true,
      );
    }, 1000);
  }, 1000),
  subscribeToPosts: throttle(
    () => {
      if (Nostr.subscribedPosts.size === 0) return;
      console.log('subscribe to', Nostr.subscribedPosts.size, 'posts');
      Nostr.sendSubToRelays([{ ids: Array.from(Nostr.subscribedPosts) }], 'posts');
    },
    3000,
    { leading: false },
  ),
  subscribeToKeywords: debounce(() => {
    if (Nostr.subscribedKeywords.size === 0) return;
    console.log(
      'subscribe to keywords',
      Array.from(Nostr.subscribedKeywords),
      SocialNetwork.knownUsers.size,
    );
    const go = () => {
      Nostr.sendSubToRelays(
        [
          {
            kinds: [1],
            limit: MAX_MSGS_BY_KEYWORD,
            keywords: Array.from(Nostr.subscribedKeywords),
          },
        ],
        'keywords',
      );
      // on page reload knownUsers are empty and thus all search results are dropped
      if (SocialNetwork.knownUsers.size < 1000) setTimeout(go, 2000);
    };
    go();
  }, 100),
  encrypt: async function (data: string, pub?: string) {
    const k = iris.session.getKey().secp256k1;
    pub = pub || k.rpub;
    if (k.priv) {
      return nip04.encrypt(k.priv, pub, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'encrypt', data, pub, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  decrypt: async function (data, pub?: string) {
    const k = iris.session.getKey().secp256k1;
    pub = pub || k.rpub;
    if (k.priv) {
      return nip04.decrypt(k.priv, pub, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'decrypt', data, pub, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  sign: async function (event: Event) {
    const priv = iris.session.getKey().secp256k1.priv;
    if (priv) {
      return signEvent(event, priv);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'sign', data: event, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  processWindowNostr(item: any) {
    this.windowNostrQueue.push(item);
    if (!this.isProcessingQueue) {
      this.processWindowNostrQueue();
    }
  },
  async processWindowNostrQueue() {
    if (!this.windowNostrQueue.length) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    const { op, data, pub, callback } = this.windowNostrQueue[0];

    let fn = Promise.resolve();
    if (op === 'decrypt') {
      fn = this.handlePromise(window.nostr.nip04.decrypt(pub, data), callback);
    } else if (op === 'encrypt') {
      fn = this.handlePromise(window.nostr.nip04.encrypt(pub, data), callback);
    } else if (op === 'sign') {
      fn = this.handlePromise(window.nostr.signEvent(data), (signed) => callback(signed.sig));
    }
    await fn;
    this.windowNostrQueue.shift();
    this.processWindowNostrQueue();
  },
  handlePromise(promise, callback) {
    return promise
      .then((result) => {
        callback(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
  unsubscribe: function (id: string) {
    const subs = this.subscriptionsByName.get(id);
    if (subs) {
      subs.forEach((sub) => {
        console.log('unsub', id);
        sub.unsub();
      });
    }
    this.subscriptionsByName.delete(id);
    this.subscribedFiltersByName.delete(id);
  },
  subscribe: function (filters: Filter[], cb?: (event: Event) => void) {
    cb &&
      this.subscriptions.set(subscriptionId++, {
        filters,
        callback: cb,
      });

    let hasNewAuthors = false;
    let hasNewIds = false;
    let hasNewReplyAndLikeSubs = false;
    let hasNewKeywords = false;
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
            this.subscribedPosts.add(this.toNostrHexAddress(id));
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
      if (filter.keywords) {
        for (const keyword of filter.keywords) {
          if (!this.subscribedKeywords.has(keyword)) {
            hasNewKeywords = true;
            // only 1 keyword at a time, otherwise a popular kw will consume the whole 'limit'
            this.subscribedKeywords.clear();
            this.subscribedKeywords.add(keyword);
          }
        }
      }
    }
    hasNewReplyAndLikeSubs && this.subscribeToRepliesAndLikes(this);
    hasNewAuthors && this.subscribeToAuthors(this); // TODO subscribe to old stuff from new authors, don't resubscribe to all
    hasNewIds && this.subscribeToPosts(this);
    hasNewKeywords && this.subscribeToKeywords(this);
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
  handleNote(event: Event) {
    this.eventsById.set(event.id, event);
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
    const myPub = this.getPubKey();
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
          this.getMessageById(id);
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
    const myPub = this.getPubKey();
    if (event.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(event.pubkey)) {
      //this.getMessageById(id);
    }
  },
  handleFollow(event: Event) {
    const existing = SocialNetwork.followEventByUser.get(event.pubkey);
    if (existing && existing.created_at >= event.created_at) {
      return;
    }
    SocialNetwork.followEventByUser.set(event.pubkey, event);
    const myPub = this.getPubKey();

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
          this.removeFollower(previouslyFollowed, event.pubkey);
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
  saveRelaysToContacts() {
    const relaysObj: any = {};
    for (const url of Relays.relays.keys()) {
      relaysObj[url] = { read: true, write: true };
    }
    const existing = SocialNetwork.followEventByUser.get(this.getPubKey());
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
    const myPub = this.getPubKey();
    if (event.pubkey === myPub) {
      try {
        const content = await this.decrypt(event.content);
        const blockList = JSON.parse(content);
        SocialNetwork.blockedUsers = new Set(blockList);
      } catch (e) {
        console.log('failed to parse your block list', event);
      }
    }
  },
  handleFlagList(event: Event) {
    if (this.myFlagEvent?.created_at > event.created_at) {
      return;
    }
    const myPub = this.getPubKey();
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
      const key = this.toNostrBech32Address(event.pubkey, 'npub');
      iris.session.addToSearchIndex(key, {
        key,
        name: profile.name,
        display_name: profile.display_name,
        followers: SocialNetwork.followersByUser.get(event.pubkey) ?? new Set(),
      });
      // if by our pubkey, save to iris
      const existingEvent = this.eventsById.get(event.pubkey);
      if (!existingEvent || existingEvent.created_at < event.created_at) {
        this.eventsById.set(event.pubkey, event);
        LocalForage.loaded && LocalForage.saveProfilesAndFollows();
      }
      //}
    } catch (e) {
      console.log('error parsing nostr profile', e, event);
    }
  },
  handleDelete(event: Event) {
    const id = event.tags.find((tag) => tag[0] === 'e')?.[1];
    const myPub = this.getPubKey();
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
  updateUnseenNotificationCount: debounce(() => {
    if (!Nostr.notificationsSeenTime) {
      return;
    }
    let count = 0;
    for (const id of Nostr.notifications.eventIds) {
      const event = Nostr.eventsById.get(id);
      if (event.created_at > Nostr.notificationsSeenTime) {
        count++;
      } else {
        break;
      }
    }
    console.log('notificationsSeenTime', Nostr.notificationsSeenTime, 'count', count);
    iris.local().get('unseenNotificationCount').put(count);
  }, 1000),
  maybeAddNotification(event: Event) {
    // if we're mentioned in tags, add to notifications
    const myPub = this.getPubKey();
    // TODO: if it's a like, only add if the last p tag is us
    if (event.pubkey !== myPub && event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPub)) {
      if (event.kind === 3) {
        // only notify if we know that they previously weren't following us
        const existingFollows = SocialNetwork.followedByUser.get(event.pubkey);
        if (!existingFollows || existingFollows.has(myPub)) {
          return;
        }
      }
      this.eventsById.set(event.id, event);
      this.notifications.add(event);
      this.updateUnseenNotificationCount(this);
    }
  },
  handleDirectMessage(event: Event) {
    const myPub = this.getPubKey();
    let user = event.pubkey;
    if (event.pubkey === myPub) {
      user = event.tags.find((tag) => tag[0] === 'p')?.[1] || user;
    } else {
      const forMe = event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPub);
      if (!forMe) {
        return;
      }
    }
    this.eventsById.set(event.id, event);
    if (!this.directMessagesByUser.has(user)) {
      this.directMessagesByUser.set(user, new SortedLimitedEventSet(500));
    }
    this.directMessagesByUser.get(user)?.add(event);
  },
  handleKeyValue(event: Event) {
    if (event.pubkey !== this.getPubKey()) {
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
  handleEvent(event: Event, force = false, saveToIdb = true) {
    if (!event) return;
    if (this.eventsById.has(event.id) && !force) {
      return;
    }
    if (!SocialNetwork.knownUsers.has(event.pubkey) && !this.subscribedPosts.has(event.id)) {
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
        this.eventsById.set(event.id, event); // TODO should limit stored future events
      }
      if (this.futureEventIds.first() === event.id) {
        this.handleNextFutureEvent();
      }
      return;
    }

    this.handledMsgsPerSecond++;

    this.subscribedPosts.delete(event.id);

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
      this.subscribedProfiles.has(event.pubkey) &&
      SocialNetwork.blockedUsers.has(event.pubkey) &&
      SocialNetwork.followEventByUser.has(event.pubkey)
    ) {
      this.subscribedProfiles.delete(event.pubkey);
    }

    if (saveToIdb) {
      IndexedDB.saveEvent(event);
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
  handleNextFutureEvent() {
    if (this.futureEventIds.size === 0) {
      return;
    }
    clearTimeout(this.futureEventTimeout);
    const nextEventId = this.futureEventIds.first();
    const nextEvent = this.eventsById.get(nextEventId);
    if (!nextEvent) {
      return;
    }
    this.futureEventTimeout = setTimeout(() => {
      this.futureEventIds.delete(nextEvent.id);
      this.handleEvent(nextEvent, true);
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
  async logOut() {
    route('/');
    await localForage.clear();
    iris.session.logOut();
  },
  loadSettings() {
    // fug. iris.local() doesn't callback properly the first time it's loaded from local storage
    localForage.getItem('notificationsSeenTime').then((val) => {
      if (val && !this.notificationsSeenTime) {
        this.notificationsSeenTime = val;
        this.updateUnseenNotificationCount(this);
        console.log('notificationsSeenTime', this.notificationsSeenTime);
      }
    });
  },
  getPubKey() {
    return iris.session.getKey()?.secp256k1?.rpub; // TODO use this everywhere :D
  },
  onLoggedIn() {
    const key = iris.session.getKey();
    const subscribe = (filters: Filter[], callback: (event: Event) => void): string => {
      const filter = filters[0];
      const key = filter['#d']?.[0];
      if (key) {
        const event = this.keyValueEvents.get(key);
        if (event) {
          callback(event);
        }
      }
      this.subscribe(filters, callback);
      return '0';
    };
    const myPub = this.getPubKey();
    this.private = new Path(
      (...args) => this.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
      (...args) => this.encrypt(...args),
      (...args) => this.decrypt(...args),
    );
    this.public = new Path(
      (...args) => this.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
    );
    this.public.get('notifications/lastOpened', (time) => {
      if (time !== this.notificationsSeenTime) {
        this.notificationsSeenTime = time;
        localForage.setItem('notificationsSeenTime', time);
        this.updateUnseenNotificationCount(this);
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
      this.sendSubToRelays([{ kinds: [0, 1, 3, 6, 7], limit: 200 }], 'new'); // everything new
      this.sendSubToRelays([{ authors: [key.secp256k1.rpub] }], 'ours'); // our stuff
      this.sendSubToRelays([{ '#p': [key.secp256k1.rpub] }], 'notifications'); // notifications and DMs
    }, 200);
    setInterval(() => {
      console.log('handled msgs per second', Math.round(this.handledMsgsPerSecond / 5));
      this.handledMsgsPerSecond = 0;
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
    this.subscribe([{ '#p': [this.getPubKey()] }], callback);
  },

  getMessagesByEveryone(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ) {
    const callback = () => {
      cb(
        includeReplies
          ? this.latestNotesAndRepliesByEveryone.eventIds
          : this.latestNotesByEveryone.eventIds,
        includeReplies,
      );
    };
    callback();
    this.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByFollows(
    cb: (messageIds: string[], includeReplies: boolean) => void,
    includeReplies = false,
  ) {
    const callback = () => {
      cb(
        includeReplies
          ? this.latestNotesAndRepliesByFollows.eventIds
          : this.latestNotesByFollows.eventIds,
        includeReplies,
      );
    };
    callback();
    this.subscribe([{ kinds: [1, 3, 5, 7] }], callback);
  },
  getMessagesByKeyword(keyword: string, cb: (messageIds: string[]) => void) {
    const callback = (event) => {
      if (!this.latestNotesByKeywords.has(keyword)) {
        this.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
      }
      this.latestNotesByKeywords.get(keyword)?.add(event);
      cb(this.latestNotesByKeywords.get(keyword)?.eventIds);
    };
    // find among cached events
    const filter = { kinds: [1], keywords: [keyword] };
    for (const event of this.eventsById.values()) {
      if (this.matchFilter(event, filter)) {
        if (!this.latestNotesByKeywords.has(keyword)) {
          this.latestNotesByKeywords.set(keyword, new SortedLimitedEventSet(MAX_MSGS_BY_KEYWORD));
        }
        this.latestNotesByKeywords.get(keyword)?.add(event);
      }
    }
    this.latestNotesByKeywords.has(keyword) &&
      cb(this.latestNotesByKeywords.get(keyword)?.eventIds);
    this.subscribe([filter], callback);
  },
  getPostsAndRepliesByUser(address: string, cb?: (messageIds: string[]) => void) {
    // TODO subscribe on view profile and unsub on leave profile
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(this.postsAndRepliesByUser.get(address)?.eventIds);
    };
    this.postsAndRepliesByUser.has(address) && callback();
    this.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getPostsByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(this.postsByUser.get(address)?.eventIds);
    };
    this.postsByUser.has(address) && callback();
    this.subscribe([{ kinds: [1, 5, 7], authors: [address] }], callback);
  },
  getLikesByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(this.likesByUser.get(address)?.eventIds);
    };
    this.likesByUser.has(address) && callback();
    this.subscribe([{ kinds: [7, 5], authors: [address] }], callback);
  },

  getDirectMessages(cb?: (dms: Map<string, SortedLimitedEventSet>) => void) {
    const callback = () => {
      cb?.(this.directMessagesByUser);
    };
    callback();
    this.subscribe([{ kinds: [4] }], callback);
  },

  getDirectMessagesByUser(address: string, cb?: (messageIds: string[]) => void) {
    SocialNetwork.knownUsers.add(address);
    const callback = () => {
      cb?.(this.directMessagesByUser.get(address)?.eventIds);
    };
    this.directMessagesByUser.has(address) && callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    this.subscribe([{ kinds: [4], '#p': [address, myPub] }], callback);
  },

  async verifyNip05Address(address: string, pubkey: string): Promise<boolean> {
    try {
      const [username, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${username}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return names[username] === pubkey || names[username.toLowerCase()] === pubkey;
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

window.irisNostr = Nostr;
export default Nostr;
