import throttle from 'lodash/throttle';
import { RelayPool } from 'nostr-relaypool';
import { Event, matchFilter, nip42 } from 'nostr-tools';

import Filter from '@/nostr/Filter';
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

const relayPool = new RelayPool(Relays.enabledRelays(), {
  useEventCache: false,
  autoReconnect: true,
  externalGetEventById: (id) => {
    return (
      (Events.seen.has(id) && {
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

const compareUrls = (a: string, b: string): boolean => {
  return new URL(a).host === new URL(b).host;
};

relayPool.onauth(async (relay, challenge) => {
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

let subscriptionId = 0;
let dev = {
  logSubscriptions: false,
  indexedDbLoad: true,
};

let lastOpened = 0;
let lastResubscribed = Date.now();

localState.get('dev').on((d) => {
  dev = d;
  relayPool.logSubscriptions = dev.logSubscriptions;
});

localState.get('lastOpened').once((lo) => {
  lastOpened = lo;
  localState.get('lastOpened').put(Math.floor(Date.now() / 1000));
});

const reconnect = () => {
  if (Date.now() - lastResubscribed > 60 * 1000) {
    lastResubscribed = Date.now();
    relayPool.reconnect();
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    reconnect();
  }
});
document.addEventListener('online', reconnect);

const PubSub = {
  subscriptions: new Map<number, Subscription>(),
  subscribedEventIds: new Set<string>(),
  subscribedAuthors: new Set<string>(),
  relayPool,
  log: throttle(console.log, 1000),

  subscribe(
    filter: Filter,
    callback?: (event: Event) => void,
    sinceLastOpened = false,
    mergeSubscriptions = true,
  ): Unsubscribe {
    let currentSubscriptionId;
    if (callback) {
      currentSubscriptionId = ++subscriptionId;
      this.subscriptions.set(currentSubscriptionId, { filter, callback });
    }

    if (filter.authors) {
      filter.authors.forEach((a) => this.subscribedAuthors.add(a));
    }

    callback && Events.find(filter, callback);

    if (dev.indexedDbLoad !== false) {
      IndexedDB.subscribe(filter);
    }

    const unsubRelays = this.subscribeRelayPool(filter, sinceLastOpened, mergeSubscriptions);

    return () => {
      unsubRelays?.();
      if (currentSubscriptionId) {
        this.subscriptions.delete(currentSubscriptionId);
      }
    };
  },

  publish(event: Event) {
    relayPool.publish(event, Array.from(Relays.enabledRelays()));
  },

  handle(event: Event & { id: string }) {
    for (const sub of this.subscriptions.values()) {
      if (sub.filter && matchFilter(sub.filter, event)) {
        sub.callback?.(event);
      }
    }
  },

  subscribeRelayPool(filter: Filter, sinceLastOpened: boolean, mergeSubscriptions: boolean) {
    let relays;
    if (filter.keywords) {
      relays = Array.from(Relays.searchRelays.keys());
    } else if (mergeSubscriptions || filter.authors?.length !== 1) {
      relays = Relays.enabledRelays();
    }

    if (sinceLastOpened) {
      filter.since = lastOpened;
    }

    return relayPool.subscribe(
      [filter],
      relays,
      (event, _, url) => {
        setTimeout(() => {
          Events.handle(event);
          if (url) {
            Events.handleEventMetadata({ url, event });
          }
        });
      },
      mergeSubscriptions ? 100 : 0,
      undefined,
      { defaultRelays: Relays.enabledRelays() },
    );
  },
};

export default PubSub;
