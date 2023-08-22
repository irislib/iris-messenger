import throttle from 'lodash/throttle';
import { Event, matchFilter } from 'nostr-tools';

import EventDB from '@/nostr/EventDB';
import Filter from '@/nostr/Filter';
import getRelayPool from '@/nostr/relayPool';

import Events from '../nostr/Events';
import localState from '../state/LocalState.ts';

import IndexedDB from './IndexedDB';
import Relays from './Relays';

type Subscription = {
  filter: Filter;
  callback?: (event: Event) => void;
};

export type Unsubscribe = () => void;

let subscriptionId = 0;
let dev = {
  logSubscriptions: false,
  indexedDbLoad: true,
};

let lastOpened = 0;

localState.get('dev').on((d) => {
  dev = d;
});

localState.get('lastOpened').once((lo) => {
  lastOpened = lo;
  localState.get('lastOpened').put(Math.floor(Date.now() / 1000));
});

const PubSub = {
  subscriptions: new Map<number, Subscription>(),
  subscribedEventIds: new Set<string>(),
  subscribedAuthors: new Set<string>(),
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

    // TODO if filter.ids & found in EventDB, don't ask others

    callback && EventDB.find(filter, callback);

    if (dev.indexedDbLoad !== false) {
      setTimeout(() => {
        // seems blocking. use web worker? bulk get?
        IndexedDB.find(filter);
      });
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
    getRelayPool().publish(event, Array.from(Relays.enabledRelays()));
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

    return getRelayPool().subscribe(
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
