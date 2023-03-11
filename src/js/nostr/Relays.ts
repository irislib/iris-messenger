import { throttle } from 'lodash';

import { Filter, Relay, relayInit } from '../lib/nostr-tools';
import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import PubSub from './PubSub';
import SocialNetwork from './SocialNetwork';

type SavedRelays = {
  [key: string]: {
    enabled?: boolean;
    lastSeen?: number;
  };
};

let savedRelays: SavedRelays = {};

const DEFAULT_RELAYS = [
  'wss://eden.nostr.land',
  'wss://nostr.fmt.wiz.biz',
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.nostr.info',
  'wss://offchain.pub',
  'wss://nos.lol',
  'wss://brb.io',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
  'wss://nostr.relayer.se',
];

const SEARCH_RELAYS = ['wss://relay.nostr.band'];

const defaultRelays = new Map<string, Relay>(
  DEFAULT_RELAYS.map((url) => [url, relayInit(url, (id) => !!Events.db.by('id', id))]),
);

const searchRelays = new Map<string, Relay>(
  SEARCH_RELAYS.map((url) => [url, relayInit(url, (id) => !!Events.db.by('id', id))]),
);

export default {
  relays: defaultRelays,
  searchRelays: searchRelays,
  getStatus: (relay: Relay) => {
    // workaround for nostr-tools bug
    try {
      return relay.status;
    } catch (e) {
      return 3;
    }
  },
  getConnectedRelayCount: function () {
    let count = 0;
    for (const relay of this.relays.values()) {
      if (this.getStatus(relay) === 1) {
        count++;
      }
    }
    return count;
  },
  connect: function (relay: Relay) {
    try {
      relay.connect();
    } catch (e) {
      console.log(e);
    }
  },
  manage: function () {
    const go = () => {
      for (const relay of this.relays.values()) {
        if (relay.enabled !== false && this.getStatus(relay) === 3) {
          this.connect(relay);
        }
        // if disabled
        if (relay.enabled === false && this.getStatus(relay) === 1) {
          relay.close();
        }
      }
      for (const relay of this.searchRelays.values()) {
        if (this.getStatus(relay) === 3) {
          this.connect(relay);
        }
      }
    };

    for (const relay of this.relays.values()) {
      relay.on('notice', (notice) => {
        console.log('notice from ', relay.url, notice);
      });
      relay.on('disconnect', () => {
        console.log('disconnected from ', relay.url);
      });
    }
    for (const relay of this.searchRelays.values()) {
      relay.on('notice', (notice) => {
        console.log('notice from ', relay.url, notice);
      });
    }

    localState.get('relays').put({});
    localState.get('relays').on((r: SavedRelays) => {
      if (!r) {
        return;
      }
      savedRelays = r;
      for (const url of this.relays.keys()) {
        if (savedRelays[url] === null) {
          this.remove(url);
        } else if (savedRelays[url] && savedRelays[url].enabled === false) {
          const r = this.relays.get(url);
          if (r) {
            r.enabled = false;
            this.relays.set(url, r);
          }
        }
      }
      for (const [url, data] of Object.entries(savedRelays)) {
        if (data === null) {
          this.relays.has(url) && this.remove(url);
          return;
        } else if (!this.relays.has(url)) {
          const relay = relayInit(url, (id) => Events.db.by('id', id));
          relay.enabled = data.enabled;
          this.relays.set(url, relay);
        }
      }
    });

    go();

    setInterval(go, 10000);
  },
  add(url: string) {
    if (this.relays.has(url)) return;
    const relay = relayInit(url, (id) => Events.db.by('id', id));
    relay.on('connect', () => this.resubscribe(relay));
    relay.on('notice', (notice) => {
      console.log('notice from ', relay.url, notice);
    });
    this.relays.set(url, relay);
  },
  remove(url: string) {
    try {
      this.relays.get(url)?.close();
    } catch (e) {
      console.log('error closing relay', e);
    }
    this.relays.delete(url);
  },
  restoreDefaults() {
    this.relays.clear();
    for (const url of DEFAULT_RELAYS) {
      this.add(url);
    }
    this.saveToContacts();
    // do not save these to contact list
    for (const url of SEARCH_RELAYS) {
      if (!this.relays.has(url)) this.add(url);
    }
    const relaysObj = {};
    for (const [url, relay] of this.relays.entries()) {
      relaysObj[url] = { enabled: relay.enabled };
    }
    localState.get('relays').put(relaysObj);
  },
  saveToContacts() {
    const relaysObj: any = {};
    for (const url of this.relays.keys()) {
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
  updateLastSeen: throttle(
    (url) => {
      const now = Math.floor(Date.now() / 1000);
      localState.get('relays').get(url).get('lastSeen').put(now);
    },
    5 * 1000,
    { leading: true },
  ),
  unsubscribe: function (id: string) {
    const subs = PubSub.subscriptionsByName.get(id);
    if (subs) {
      subs.forEach((sub) => {
        console.log('unsub', id);
        sub.unsub();
      });
    }
    PubSub.subscriptionsByName.delete(id);
    PubSub.subscribedFiltersByName.delete(id);
  },
  resubscribe(relay?: Relay) {
    console.log('subscribedFiltersByName.size', PubSub.subscribedFiltersByName.size);
    for (const [name, filters] of Array.from(PubSub.subscribedFiltersByName.entries())) {
      console.log('resubscribing to ', name, filters);
      this.subscribe(filters.filters, name, false, 0, filters.sinceRelayLastSeen, relay && [relay]);
    }
  },
  subscribe: function (
    filters: Filter[],
    id: string,
    once = false,
    unsubscribeTimeout = 0,
    sinceLastSeen = false,
    relays?: Relay[],
  ) {
    // if subs with same id already exists, remove them
    if (id) {
      const subs = PubSub.subscriptionsByName.get(id);
      if (subs) {
        subs.forEach((sub) => {
          //console.log('unsub', id);
          sub.unsub();
        });
      }
      PubSub.subscriptionsByName.delete(id);
      PubSub.subscribedFiltersByName.delete(id);
    }

    // TODO slice and dice too large filters? queue and wait for eose. or alternate between filters by interval.

    PubSub.subscribedFiltersByName.set(id, { filters, sinceRelayLastSeen: sinceLastSeen });

    if (unsubscribeTimeout) {
      setTimeout(() => {
        PubSub.subscriptionsByName.delete(id);
        PubSub.subscribedFiltersByName.delete(id);
      }, unsubscribeTimeout);
    }

    relays = relays || (id == 'keywords' ? this.searchRelays : this.relays).values();
    for (const relay of relays) {
      const subId = PubSub.getSubscriptionIdForName(id);
      if (sinceLastSeen && savedRelays[relay.url] && savedRelays[relay.url].lastSeen) {
        filters.forEach((filter) => {
          filter.since = savedRelays[relay.url].lastSeen;
        });
      }
      const sub = relay.sub(filters, { id: subId });
      sub.on('event', (event) => {
        this.updateLastSeen(relay.url);
        Events.handle(event);
      });
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!PubSub.subscriptionsByName.has(id)) {
        PubSub.subscriptionsByName.set(id, new Set());
      }
      PubSub.subscriptionsByName.get(id)?.add(sub);
      //console.log('subscriptions size', this.subscriptionsByName.size);
      if (unsubscribeTimeout) {
        setTimeout(() => {
          sub.unsub();
        }, unsubscribeTimeout);
      }
    }
  },
};
