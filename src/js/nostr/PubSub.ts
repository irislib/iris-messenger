import { sha256 } from '@noble/hashes/sha256';
import { debounce, throttle } from 'lodash';
import { RelayPool } from 'nostr-relaypool';

import Helpers from '../Helpers';
import { Event, Filter, Sub } from '../lib/nostr-tools';
import localState from '../LocalState';
import Events from '../nostr/Events';

//import IndexedDB from './IndexedDB';
import Key from './Key';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

type FiltersWithOptions = {
  filters: Filter[];
  sinceRelayLastSeen?: boolean;
};

type Unsubscribe = () => void;

let subscriptionId = 0;

let dev: any = {
  relayPool: false,
  logSubscriptions: false,
  indexed03: false,
};
const relayPool = new RelayPool(Relays.DEFAULT_RELAYS, {
  useEventCache: false,
  externalGetEventById: (id) => Events.db.by('id', id),
});
localState.get('dev').on((d) => {
  dev = d;
  relayPool.logSubscriptions = dev.logSubscriptions;
});

const MAX_MSGS_BY_KEYWORD = 1000;

/**
 * Iris (mostly) internal Subscriptions. Juggle between LokiJS (memory), IndexedDB, http proxy and Relays.
 *
 * TODO:
 * 1) Only subscribe to what is needed for current view, unsubscribe on unmount
 * 2) Ask memory cache first, then dexie, then http proxy, then relays
 */
const PubSub = {
  internalSubscriptionsByName: new Map<string, number>(),
  subscriptionsByName: new Map<string, Set<Sub>>(),
  subscribedFiltersByName: new Map<string, FiltersWithOptions>(),
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  subscribedPosts: new Set<string>(),
  subscribedRepliesAndReactions: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  subscribedKeywords: new Set<string>(),
  getSubscriptionIdForName(name: string) {
    return Helpers.arrayToHex(sha256(name)).slice(0, 8);
  },
  subscribeToRepliesAndReactions: debounce(() => {
    const filters = [
      {
        kinds: [1, 6, 7, 9735],
        '#e': Array.from(PubSub.subscribedRepliesAndReactions.values()),
      },
    ];
    Relays.subscribe(filters, 'subscribedRepliesAndReactions', true);
    //IndexedDB.subscribe(filters);
  }, 500),
  subscribeToNewAuthors: new Set<string>(),
  subscribeToAuthors: debounce(() => {
    const now = Math.floor(Date.now() / 1000);
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    console.log(
      'subscribe to profiles and contacts of',
      PubSub.subscribeToNewAuthors.size,
      'new authors',
    );
    const authors = Array.from(PubSub.subscribeToNewAuthors.values()).slice(0, 1000);
    authors.forEach((author) => {
      PubSub.subscribeToNewAuthors.delete(author);
    });
    console.log('subscribing to authors.length', authors.length);
    const filters = [
      {
        kinds: [0, 3],
        until: now,
        authors,
      },
    ];
    const subscribe = (filters, id, once, unsubscribeTimeout?, sinceLastSeen?) => {
      if (dev.relayPool) {
        return PubSub.subscribe(filters);
      } else {
        return Relays.subscribe(filters, id, once, unsubscribeTimeout, sinceLastSeen);
      }
    };
    subscribe(filters, 'followed', true, 0, true);
    //IndexedDB.subscribe(filters);
    if (PubSub.subscribedProfiles.size) {
      const filters = [{ authors: Array.from(PubSub.subscribedProfiles.values()), kinds: [0] }];
      subscribe(filters, 'subscribedProfiles', true);
      //IndexedDB.subscribe(filters);
    }
    const filters2 = [{ authors: followedUsers, limit: 100, until: now }];
    setTimeout(() => {
      subscribe(filters2, 'followedHistory', true, 0, true);
      //IndexedDB.subscribe(filters2);
    }, 1000);
  }, 2000),
  subscribeToPosts: throttle(
    () => {
      if (PubSub.subscribedPosts.size === 0) return;
      console.log('subscribe to', PubSub.subscribedPosts.size, 'posts');
      const filters = [{ ids: Array.from(PubSub.subscribedPosts).slice(0, 1000) }];
      Relays.subscribe(filters, 'posts');
      //IndexedDB.subscribe(filters);
    },
    3000,
    { leading: false },
  ),
  subscribeToKeywords: debounce(() => {
    if (PubSub.subscribedKeywords.size === 0) return;
    console.log('subscribe to keywords', Array.from(PubSub.subscribedKeywords));
    const go = () => {
      Relays.subscribe(
        [
          {
            kinds: [1],
            limit: MAX_MSGS_BY_KEYWORD,
            keywords: Array.from(PubSub.subscribedKeywords),
          },
        ],
        'keywords',
      );
      // on page reload SocialNetwork is empty and thus all search results are dropped
      if (SocialNetwork.followersByUser.size < 1000) setTimeout(go, 2000);
    };
    go();
  }, 100),
  /**
   * internal subscribe
   * @param filters
   * @param cb
   * @param name optional name for the subscription. replaces the previous one with the same name
   * @returns unsubscribe function
   */
  subscribe: function (filters: Filter[], cb?: (event: Event) => void, name?: string): Unsubscribe {
    if (dev.relayPool) {
      let relays: any = undefined;
      // if any of filters[] doesn't have authors, we need to define default relays
      if (filters.some((f) => !f.authors)) {
        relays = Relays.DEFAULT_RELAYS;
      }
      if (
        dev.indexed03 &&
        filters.every((f) => f.kinds && f.kinds.every((k) => k === 0 || k === 3))
      ) {
        relays = ['wss://us.rbr.bio', 'wss://eu.rbr.bio'];
      }
      return relayPool.subscribe(
        filters,
        relays,
        (event) => {
          delete event['$loki'];
          Events.handle(event);
          cb?.(event);
        },
        100,
      );
    }

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
          const hex = Key.toNostrHexAddress(id);
          if (!this.subscribedPosts.has(hex)) {
            hasNewIds = true;
            this.subscribedPosts.add(hex);
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
    if (name === 'global') {
      Relays.subscribe(filters, 'global');
      //IndexedDB.subscribe(filters);
    }
    return () => {
      if (currentSubscriptionId) {
        this.subscriptions.delete(currentSubscriptionId);
      }
      if (name) {
        this.internalSubscriptionsByName.delete(name);
        if (name === 'global') {
          Relays.unsubscribe('global');
          console.log('unsubscribed global');
        }
      }
    };
  },
};

export default PubSub;
export { Unsubscribe };
