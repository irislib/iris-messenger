import { Filter, Relay, relayInit } from '../lib/nostr-tools';
import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import SocialNetwork from './SocialNetwork';
import Subscriptions from './Subscriptions';

type SavedRelays = {
  [key: string]: {
    enabled: boolean;
  };
};

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
  DEFAULT_RELAYS.map((url) => [url, relayInit(url, (id) => Events.cache.has(id))]),
);

const searchRelays = new Map<string, Relay>(
  SEARCH_RELAYS.map((url) => [url, relayInit(url, (id) => Events.cache.has(id))]),
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
    }
    for (const relay of this.searchRelays.values()) {
      relay.on('notice', (notice) => {
        console.log('notice from ', relay.url, notice);
      });
    }

    localState.get('relays').put({});
    localState.get('relays').on((savedRelays: SavedRelays) => {
      if (!savedRelays) {
        return;
      }
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
          const relay = relayInit(url, (id) => Events.cache.has(id));
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
    const relay = relayInit(url, (id) => Events.cache.has(id));
    relay.on('connect', () => Subscriptions.resubscribe(relay));
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
  subscribe: function (filters: Filter[], id: string, once = false, unsubscribeTimeout = 0) {
    // if subs with same id already exists, remove them
    if (id) {
      const subs = Subscriptions.subscriptionsByName.get(id);
      if (subs) {
        subs.forEach((sub) => {
          //console.log('unsub', id);
          sub.unsub();
        });
      }
      Subscriptions.subscriptionsByName.delete(id);
      Subscriptions.subscribedFiltersByName.delete(id);
    }

    Subscriptions.subscribedFiltersByName.set(id, filters);

    if (unsubscribeTimeout) {
      setTimeout(() => {
        Subscriptions.subscriptionsByName.delete(id);
        Subscriptions.subscribedFiltersByName.delete(id);
      }, unsubscribeTimeout);
    }

    for (const relay of (id == 'keywords' ? this.searchRelays : this.relays).values()) {
      const subId = Subscriptions.getSubscriptionIdForName(id);
      const sub = relay.sub(filters, { id: subId });
      // TODO update relay lastSeen
      sub.on('event', (event) => Events.handle(event));
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!Subscriptions.subscriptionsByName.has(id)) {
        Subscriptions.subscriptionsByName.set(id, new Set());
      }
      Subscriptions.subscriptionsByName.get(id)?.add(sub);
      //console.log('subscriptions size', this.subscriptionsByName.size);
      if (unsubscribeTimeout) {
        setTimeout(() => {
          sub.unsub();
        }, unsubscribeTimeout);
      }
    }
  },
};
