import { throttle } from 'lodash';
import { RelayPool } from 'nostr-relaypool';
import { Event, Filter, matchFilter } from 'nostr-tools';
import { nip42 } from 'nostr-tools';
const { authenticate } = nip42;
import localState from '../LocalState';
import Events from '../nostr/Events';

import IndexedDB from './IndexedDB';
import Relays from './Relays';

type Subscription = {
  filter: Filter;
  callback?: (event: Event) => void;
};

export type Unsubscribe = () => void;

let subscriptionId = 0;

let dev: any = {
  logSubscriptions: false,
};
const relayPool = new RelayPool(Relays.enabledRelays(), {
  useEventCache: false,
  autoReconnect: true,
  externalGetEventById: (id) => {
    return (
      (Events.seen.has(id) && {
        // make externalGetEventById take booleans instead of events?
        sig: '',
        id: '',
        kind: 0,
        tags: [],
        content: '',
        created_at: 0,
        pubkey: '',
      }) ||
      undefined
    );
  },
});
relayPool.onnotice((relayUrl, notice) => {
  console.log('notice', notice, ' from relay ', relayUrl);
});
const compareUrls = (a, b) => {
  // A bit more lenient url comparison.
  // Wouldn't want to fail on a trailing slash or something.
  return new URL(a).host === new URL(b).host;
};
relayPool.onauth(async (relay, challenge) => {
  // Random relay auths shouldn't be bothered with, because it makes the
  // approval popup appear every time unless given the permission.
  if (!Relays.enabledRelays().some((r) => compareUrls(r, relay.url))) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await authenticate({ relay, challenge, sign: Events.sign });
  } catch (e) {
    console.log('error: authenticate to relay:', e);
    relayPool.removeRelay(relay.url);
    Relays.disable(relay.url);
  }
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

let lastResubscribed = Date.now();

const reconnect = () => {
  if (Date.now() - lastResubscribed > 60 * 1000 * 1) {
    lastResubscribed = Date.now();
    // trigger reconnect and resubscribe
    relayPool.reconnect();
  }
};

document.addEventListener('visibilitychange', () => {
  // when iris returns to foreground after 1 min dormancy, resubscribe stuff
  // there might be some better way to manage resubscriptions?
  if (document.visibilityState === 'visible') {
    reconnect();
  }
});
document.addEventListener('online', () => {
  reconnect();
});

/**
 * Iris (mostly) internal Subscriptions. Juggle between LokiJS (memory), IndexedDB, http proxy and Relays.
 *
 * TODO:
 * 1) Only subscribe to what is needed for current view, unsubscribe on unmount
 * 2) Ask memory cache first, then dexie, then http proxy, then relays
 */
const PubSub = {
  subscriptions: new Map<number, Subscription>(),
  subscribedEventIds: new Set<string>(),
  subscribedAuthors: new Set<string>(), // all events by authors
  relayPool,
  log: throttle((...args) => {
    console.log(...args);
  }, 1000),
  /**
   * Internal subscription. First looks up in memory, then in IndexedDB, then in http proxy, then in relays.
   * @param filters
   * @param cb
   * @param name optional name for the subscription. replaces the previous one with the same name
   * @returns unsubscribe function
   */
  subscribe: function (
    filter: Filter,
    callback?: (event: Event) => void,
    sinceLastOpened = false,
    mergeSubscriptions = true,
  ): Unsubscribe {
    let currentSubscriptionId;
    if (callback) {
      currentSubscriptionId = subscriptionId++;
      this.subscriptions.set(++subscriptionId, {
        filter,
        callback,
      });
    }

    this.log(
      'subscriptions',
      this.subscriptions.size,
      'subscribedEventIds',
      this.subscribedEventIds.size,
      'subscribedAuthors',
      this.subscribedAuthors.size,
    );

    if (filter.authors) {
      filter.authors.forEach((a) => {
        this.subscribedAuthors.add(a);
      });
    }

    //debugger; 
    callback && Events.find(filter, callback); 

    if (filter.ids) {
      filter.ids = filter.ids.filter((id) => !Events.seen.has(id));
      if (!filter.ids.length) {
        return () => {
          /* noop */
        };
      }
      filter.ids.forEach((a) => {
        this.subscribedEventIds.add(a);
      });
    }

    if (dev.indexedDbLoad !== false) {
      IndexedDB.subscribe(filter);
    }

    // TODO if asking event by id or profile, ask http proxy

    const unsubRelays = this.subscribeRelayPool(filter, sinceLastOpened, mergeSubscriptions);

    return () => {
      unsubRelays?.();
      if (currentSubscriptionId) {
        this.subscriptions.delete(currentSubscriptionId);
      }
    };
  },

  publish(event) {
    const relays = Array.from(Relays.enabledRelays());
    relayPool.publish(event, relays);
  },

  handle(event: Event & { id: string }) {
    // go through subscriptions and callback if filters match
    for (const sub of this.subscriptions.values()) {
      if (!sub.filter) {
        continue;
      }
      if (matchFilter(sub.filter, event)) {
        sub.callback?.(event);
      }
    }
  },

  subscribeRelayPool(filter: Filter, sinceLastOpened: boolean, mergeSubscriptions: boolean) {
    let relays: any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (filter.keywords) {
      // TODO bomb all relays with searches, or add more search relays
      relays = Array.from(Relays.searchRelays.keys());
    } else if (mergeSubscriptions || filter.authors?.length !== 1) {
      relays = Relays.enabledRelays();
    }
    if (sinceLastOpened) {
      filter.since = lastOpened;
    }
    const defaultRelays = Relays.enabledRelays();
    return relayPool.subscribe(
      [filter],
      relays,
      (event, _, url) => {
        setTimeout(() => {
          Events.handle(event);
          if (url) {
            Events.handleEventMetadata({
              url,
              event,
            });
          }
        }, 0);
      },
      mergeSubscriptions ? 100 : 0,
      undefined,
      {
        // enabled relays
        defaultRelays,
      },
    );
  },
};

export default PubSub;
