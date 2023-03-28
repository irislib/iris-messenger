import { sha256 } from '@noble/hashes/sha256';
import { debounce, throttle } from 'lodash';
import { RelayPool } from 'nostr-relaypool';

import Helpers from '../Helpers';
import { Event, Filter, matchFilter, Sub } from '../lib/nostr-tools';
import localState from '../LocalState';
import Events from '../nostr/Events';

import IndexedDB from './IndexedDB';
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
  logSubscriptions: false,
  indexed03: false,
  useRelayPool: false,
};
const relayPool = new RelayPool(Relays.DEFAULT_RELAYS, {
  useEventCache: false,

  externalGetEventById: (id) => Events.db.by('id', id),
});
localState.get('dev').on((d) => {
  dev = d;
  relayPool.logSubscriptions = dev.logSubscriptions;
});

let lastOpened = 0;
localState.get('lastOpened').once((lo) => {
  lastOpened = lo;
  localState.get('lastOpened').put(Math.floor(Date.now() / 1000));
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
    PubSub.subscribe(filters);
  }, 500),
  newAuthors: new Set<string>(),
  subscribeToAuthors: debounce(() => {
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    console.log('subscribe to profiles and contacts of', PubSub.newAuthors.size, 'new authors');
    const authors = Array.from(PubSub.newAuthors.values()).slice(0, 1000);
    authors.forEach((author) => {
      PubSub.newAuthors.delete(author);
    });
    console.log('subscribing to authors.length', authors.length);
    const filters = [
      {
        kinds: [0, 3],
        authors,
      },
    ];
    PubSub.subscribe(filters, undefined, 'followed', true);
    if (PubSub.subscribedProfiles.size) {
      const filters = [{ authors: Array.from(PubSub.subscribedProfiles.values()), kinds: [0] }];
      PubSub.subscribe(filters, undefined, 'subscribedProfiles');
    }
    const filters2 = [{ authors: followedUsers, limit: 100 }];
    setTimeout(() => {
      PubSub.subscribe(filters2, undefined, 'followedHistory', true);
    }, 1000);
  }, 2000),
  subscribeToPosts: throttle(
    () => {
      if (PubSub.subscribedPosts.size === 0) return;
      console.log('subscribe to', PubSub.subscribedPosts.size, 'posts');
      const filters = [{ ids: Array.from(PubSub.subscribedPosts).slice(0, 1000) }];
      PubSub.subscribe(filters, undefined, 'posts');
    },
    3000,
    { leading: false },
  ),
  subscribeToKeywords: debounce(() => {
    if (PubSub.subscribedKeywords.size === 0) return;
    console.log('subscribe to keywords', Array.from(PubSub.subscribedKeywords));
    const go = () => {
      PubSub.subscribe(
        [
          {
            kinds: [1],
            limit: MAX_MSGS_BY_KEYWORD,
            keywords: Array.from(PubSub.subscribedKeywords),
          },
        ],
        undefined,
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
  subscribe: function (
    filters: Filter[],
    cb?: (events: Event[]) => void,
    name?: string,
    sinceLastOpened = false,
  ): Unsubscribe {
    const events = new Map();
    const callback = (event) => {
      events.set(event.id, event);
      cb?.(Array.from(events.values()));
    };
    let currentSubscriptionId;
    if (cb) {
      currentSubscriptionId = subscriptionId++;
      this.subscriptions.set(++subscriptionId, {
        filters,
        callback,
      });
    }
    name = name || JSON.stringify(filters);

    const existing = this.internalSubscriptionsByName.get(name);
    if (existing) {
      this.subscriptions.delete(existing);
    }
    this.internalSubscriptionsByName.set(name, currentSubscriptionId);

    filters.forEach((f) => {
      const query = {};
      if (f.authors) {
        query['pubkey'] = { $in: f.authors };
      }
      if (f.kinds) {
        query['kind'] = { $in: f.kinds };
      }
      Events.db
        .find(query)
        .filter((e) => matchFilter(f, e))
        .forEach((e) => {
          callback(e);
        });
      // TODO other filters such as #p
    });

    setTimeout(() => {
      IndexedDB.subscribe(filters);
    }, 0);

    // TODO ask dexie
    // TODO if asking event by id or profile, ask http proxy

    let unsubRelays;
    if (dev.useRelayPool) {
      unsubRelays = this.subscribeRelayPool(filters, sinceLastOpened);
    } else {
      unsubRelays = Relays.subscribe(filters, name || JSON.stringify(filters), sinceLastOpened);
    }

    return () => {
      unsubRelays();
      if (currentSubscriptionId) {
        this.subscriptions.delete(currentSubscriptionId);
      }
      if (name) {
        this.internalSubscriptionsByName.delete(name);
      }
    };
  },

  subscribeRelayPool(filters: Filter[], sinceLastOpened: boolean) {
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
    if (sinceLastOpened) {
      filters.forEach((f) => {
        f.since = lastOpened;
      });
    }
    return relayPool.subscribe(
      filters,
      relays,
      (event) => {
        Events.handle(event);
      },
      100,
    );
  },
};

export default PubSub;
export { Unsubscribe };
