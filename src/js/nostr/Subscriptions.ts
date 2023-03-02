import { sha256 } from '@noble/hashes/sha256';
import { debounce, throttle } from 'lodash';

import Helpers from '../Helpers';
import { Event, Filter, Relay, Sub } from '../lib/nostr-tools';

import Events from './Events';
import Key from './Key';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

type Unsubscribe = () => void;

let subscriptionId = 0;

const Subscriptions = {
  internalSubscriptionsByName: new Map<string, number>(),
  subscriptionsByName: new Map<string, Set<Sub>>(),
  subscribedFiltersByName: new Map<string, Filter[]>(),
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  subscribedPosts: new Set<string>(),
  subscribedRepliesAndReactions: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  subscribedKeywords: new Set<string>(),
  getSubscriptionIdForName(name: string) {
    return Helpers.arrayToHex(sha256(name)).slice(0, 8);
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
  subscribeToRepliesAndReactions: debounce(() => {
    Relays.subscribe(
      [
        {
          kinds: [1, 6, 7, 9735],
          '#e': Array.from(Subscriptions.subscribedRepliesAndReactions.values()),
        },
      ],
      'subscribedRepliesAndReactions',
      true,
    );
  }, 500),
  subscribeToNewAuthors: new Set<string>(),
  subscribeToAuthors: debounce(() => {
    const now = Math.floor(Date.now() / 1000);
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    console.log(
      'subscribe to profiles and contacts of',
      Subscriptions.subscribeToNewAuthors.size,
      'new authors',
    );
    const authors = Array.from(Subscriptions.subscribeToNewAuthors.values()).slice(0, 1000);
    authors.forEach((author) => {
      Subscriptions.subscribeToNewAuthors.delete(author);
    });
    console.log('subscribing to authors.length', authors.length);
    Relays.subscribe(
      [
        {
          kinds: [0, 3],
          until: now,
          authors,
        },
      ],
      'followed',
      true,
    );
    if (Subscriptions.subscribedProfiles.size) {
      Relays.subscribe(
        [{ authors: Array.from(Subscriptions.subscribedProfiles.values()), kinds: [0] }],
        'subscribedProfiles',
        true,
      );
    }
    setTimeout(() => {
      Relays.subscribe(
        [{ authors: followedUsers, limit: 100, until: now }],
        'followedHistory',
        true,
      );
    }, 1000);
  }, 2000),
  subscribeToPosts: throttle(
    () => {
      if (Subscriptions.subscribedPosts.size === 0) return;
      console.log('subscribe to', Subscriptions.subscribedPosts.size, 'posts');
      Relays.subscribe(
        [{ ids: Array.from(Subscriptions.subscribedPosts).slice(0, 1000) }],
        'posts',
      );
    },
    3000,
    { leading: false },
  ),
  subscribeToKeywords: debounce(() => {
    if (Subscriptions.subscribedKeywords.size === 0) return;
    console.log('subscribe to keywords', Array.from(Subscriptions.subscribedKeywords));
    const go = () => {
      Relays.subscribe(
        [
          {
            kinds: [1],
            limit: Events.MAX_MSGS_BY_KEYWORD,
            keywords: Array.from(Subscriptions.subscribedKeywords),
          },
        ],
        'keywords',
      );
      // on page reload SocialNetwork is empty and thus all search results are dropped
      if (SocialNetwork.followersByUser.size < 1000) setTimeout(go, 2000);
    };
    go();
  }, 100),
  // TODO rename, this is for external subscription. clarify internal vs external subs distinction.
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
  /**
   * internal subscribe
   * @param filters
   * @param cb
   * @param name optional name for the subscription. replaces the previous one with the same name
   * @returns unsubscribe function
   */
  subscribe: function (filters: Filter[], cb?: (event: Event) => void, name?: string): Unsubscribe {
    let currentSubscriptionId;
    if (cb) {
      currentSubscriptionId = subscriptionId++;
      this.subscriptions.set(++subscriptionId, {
        filters,
        callback: cb,
      });
    }
    if (name) {
      const existing = this.internalSubscriptionsByName.get(name);
      if (existing) {
        this.subscriptions.delete(existing);
      }
      this.internalSubscriptionsByName.set(name, currentSubscriptionId);
    }

    // TODO: some queries are still not unsubscribed
    // console.log('subscribed', this.subscriptions.size, JSON.stringify(filters));

    const newAuthors = new Set<string>();
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
            newAuthors.add(author);
            this.subscribedUsers.add(author);
          }
        }
      }
      if (filter.ids) {
        for (const id of filter.ids) {
          if (!this.subscribedPosts.has(id)) {
            hasNewIds = true;
            this.subscribedPosts.add(Key.toNostrHexAddress(id));
          }
        }
      }
      if (Array.isArray(filter['#e'])) {
        for (const id of filter['#e']) {
          if (!this.subscribedRepliesAndReactions.has(id)) {
            hasNewReplyAndLikeSubs = true;
            this.subscribedRepliesAndReactions.add(id);
            setTimeout(() => {
              // remove after some time, so the requests don't grow too large
              this.subscribedRepliesAndReactions.delete(id);
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
    hasNewReplyAndLikeSubs && this.subscribeToRepliesAndReactions(this);
    if (newAuthors.size) {
      newAuthors.forEach((author) => {
        this.subscribeToNewAuthors.add(author);
      });
      this.subscribeToAuthors(this);
    }
    hasNewIds && this.subscribeToPosts(this);
    hasNewKeywords && this.subscribeToKeywords(this);
    return () => {
      if (currentSubscriptionId) {
        this.subscriptions.delete(currentSubscriptionId);
      }
      if (name) {
        this.internalSubscriptionsByName.delete(name);
      }
    };
  },
};

export default Subscriptions;
export { Unsubscribe };
