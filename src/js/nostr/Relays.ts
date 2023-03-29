import { sha256 } from '@noble/hashes/sha256';
import { debounce, shuffle, throttle } from 'lodash';

import Helpers from '../Helpers';
import { Event, Filter, Relay, relayInit, Sub } from '../lib/nostr-tools';
import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import PubSub, { Unsubscribe } from './PubSub';

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

type PublicRelaySettings = {
  read: boolean;
  write: boolean;
};

/**
 * Relay management and subscriptions. Bundles subscriptions in to max 10 larger batches.
 */
const Relays = {
  relays: new Map<string, Relay>(),
  searchRelays: new Map<string, Relay>(),
  writeRelaysByUser: new Map<string, Set<string>>(),
  filtersBySubscriptionName: new Map<string, string>(),
  subscribedEventTags: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  subscribedKeywords: new Set<string>(), // seach keywords
  subscriptionsByName: new Map<string, Set<Sub>>(),
  newAuthors: new Set<string>(),
  DEFAULT_RELAYS,
  init() {
    this.relays = new Map<string, Relay>(DEFAULT_RELAYS.map((url) => [url, this.relayInit(url)]));
    this.searchRelays = new Map<string, Relay>(
      SEARCH_RELAYS.map((url) => [url, this.relayInit(url)]),
    );
    this.manage();
  },
  getSubscriptionIdForName(name: string) {
    return Helpers.arrayToHex(sha256(name)).slice(0, 8);
  },
  getStatus: (relay: Relay) => {
    // workaround for nostr-tools bug
    try {
      return relay.status;
    } catch (e) {
      return 3;
    }
  },
  // get Map of relayUrl: {read:boolean, write:boolean}
  getUrlsFromFollowEvent(event: Event): Map<string, PublicRelaySettings> {
    const urls = new Map<string, PublicRelaySettings>();
    if (event.content) {
      try {
        const content = JSON.parse(event.content);
        for (const url in content) {
          try {
            const parsed = new URL(url).toString().replace(/\/$/, '');
            urls.set(parsed, content[url]);
          } catch (e) {
            console.log('invalid relay url', url, event);
          }
        }
      } catch (e) {
        console.log('failed to parse relay urls', event);
      }
    }
    return urls;
  },
  getPopularRelays: function () {
    console.log('getPopularRelays');
    const relays = new Map<string, number>();
    Events.db.find({ kind: 3 }).forEach((event) => {
      if (event.content) {
        try {
          // content is an object of relayUrl: {read:boolean, write:boolean}
          const content = JSON.parse(event.content);
          for (const url in content) {
            try {
              const parsed = new URL(url).toString().replace(/\/$/, '');
              const count = relays.get(parsed) || 0;
              relays.set(parsed, count + 1);
            } catch (e) {
              console.log('invalid relay url', url, event);
            }
          }
        } catch (e) {
          console.log('failed to parse relay urls', event);
        }
      }
    });
    const sorted = Array.from(relays.entries())
      .filter(([url]) => !this.relays.has(url))
      .sort((a, b) => b[1] - a[1]);
    return sorted.map((entry) => {
      return { url: entry[0], users: entry[1] };
    });
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
  getUserRelays(user: string): Array<[string, PublicRelaySettings]> {
    let relays = new Map<string, PublicRelaySettings>();
    if (typeof user !== 'string') {
      console.log('getUserRelays: invalid user', user);
      return [];
    }
    const followEvent = Events.db.findOne({ kind: 3, pubkey: user });
    if (followEvent) {
      relays = this.getUrlsFromFollowEvent(followEvent);
    }
    return Array.from(relays.entries());
  },
  publish(event: Event) {
    const myRelays = Array.from(this.relays.values()).filter(
      (relay: Relay) => relay.enabled !== false,
    ) as Relay[];
    for (const relay of myRelays) {
      relay.publish(event);
    }
    let recipientRelays: string[] = [];
    const mentionedUsers = event.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]);
    if (mentionedUsers.length > 10) {
      return;
    }
    for (const user of mentionedUsers) {
      if (user === Key.getPubKey()) {
        continue;
      }
      this.getUserRelays(user)
        .filter((entry) => entry[1].read)
        .forEach((entry) => recipientRelays.push(entry[0]));
    }
    // 3 random read relays of the recipient
    recipientRelays = shuffle(recipientRelays).slice(0, 3);
    for (const relayUrl of recipientRelays) {
      if (!myRelays.find((relay) => relay.enabled && relay.url === relayUrl)) {
        console.log('publishing event to recipient relay', relayUrl, event.id, event.content || '');
        const relay = this.relayInit(relayUrl, false);
        relay.publish(event);
        setTimeout(() => {
          relay.close();
        }, 5000);
      }
    }
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
          const relay = this.relayInit(url);
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
    const relay = this.relayInit(url);
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
    const existing = Events.db.findOne({ kind: 3, pubkey: Key.getPubKey() });
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
  resubscribe(relay?: Relay) {
    // TODO
  },
  relayInit(url: string, subscribeAll = true) {
    const relay = relayInit(url, (id) => {
      const have = !!Events.db.by('id', id);
      // console.log('have?', have);
      return have;
    });
    subscribeAll && relay.on('connect', () => this.resubscribe(relay));
    relay.on('notice', (notice) => {
      console.log('notice from ', relay.url, notice);
    });
    this.connect(relay);
    return relay;
  },
  groupFilter(filter: Filter): { name: string; groupedFilter: Filter } {
    // if filter has authors, add to subscribedAuthors and group by authors
    if (filter.authors && filter.kinds?.length === 1 && filter.kinds[0] === 0) {
      filter.authors.forEach((a) => {
        this.subscribedProfiles.add(a);
      });
      return {
        name: 'profiles',
        groupedFilter: { authors: Array.from(this.subscribedProfiles.values()), kinds: [0] },
      };
    }
    if (filter.authors) {
      filter.authors = Array.from(this.subscribedProfiles.values());
      return {
        name: 'authors',
        groupedFilter: { authors: Array.from(this.subscribedProfiles.values()) },
      };
    }
    if (filter.ids) {
      return {
        name: 'ids',
        groupedFilter: { ids: Array.from(this.subscribedEventIds.values()) },
      };
    }
    if (filter['#e']) {
      filter['#e'].forEach((e) => {
        this.subscribedEventTags.add(e);
      });
      return {
        name: 'eventsByTag',
        groupedFilter: { '#e': Array.from(this.subscribedEventTags.values()) },
      };
    }
    // do not bundle. TODO console.log, limit or sth
    return {
      name: JSON.stringify(filter),
      groupedFilter: filter,
    };
  },
  subscribe: function (
    filter: Filter,
    once = false,
    unsubscribeTimeout = 0,
    sinceLastSeen = false,
    relays?: Relay[],
  ): Unsubscribe {
    const { name, groupedFilter } = this.groupFilter(filter);

    const existingFilter = this.filtersBySubscriptionName.get(name);
    const filterString = JSON.stringify(groupedFilter);
    if (existingFilter === filterString) {
      return () => {
        //console.log('already subscribed to', name);
      };
    }
    this.filtersBySubscriptionName.set(name, filterString);
    console.log('filtersBySubscriptionNAme', Array.from(this.filtersBySubscriptionName.keys()));

    const unsubscribe = () => {
      console.log('unsub');
      const subs = this.subscriptionsByName.get(name);
      if (subs) {
        subs.forEach((sub) => {
          //console.log('unsub', id);
          sub.unsub();
        });
      }
      this.subscriptionsByName.delete(name);
    };
    unsubscribe();

    // TODO slice and dice too large filters? queue and wait for eose. or alternate between filters by interval.

    if (unsubscribeTimeout) {
      setTimeout(unsubscribe, unsubscribeTimeout);
    }

    let myRelays =
      relays || Array.from(name == 'keywords' ? this.searchRelays.values() : this.relays.values());
    const subId = Relays.getSubscriptionIdForName(name);

    /*
    let authorRelayUrls = [];
    if (!relays) {
      // if one of filters has .authors of length 1, subscribe to that author's relays
      if (filter.authors && filter.authors.length === 1) {
        const author = filter.authors[0];
        if (author === Key.getPubKey()) {
          return unsubscribe;
        }
        authorRelayUrls = this.getUserRelays(author).filter(([url, settings]) => {
          return settings.write && !this.relays.has(url);
        });
        // pick 3 random relays
        authorRelayUrls = shuffle(authorRelayUrls).slice(0, 3);
        const authorRelays = authorRelayUrls.map(([url]) => {
          const relay = this.relayInit(url, false);
          relay.on('notice', (notice) => {
            console.log('notice from ', relay.url, notice);
          });
          const sub = relay.sub([filter], { id: subId });
          sub.on('event', (event) => {
            console.log('got event from author relay', relay.url);
            Events.handle(event);
          });
          setTimeout(() => relay?.close(), 30 * 1000);
          return relay;
        });
        if (authorRelays.length) {
          console.log('subscribing to author relays', authorRelays);
        }
        this.subscribe(filter, true, 0, sinceLastSeen, authorRelays);
      }
    }
     */

    // random 3 my relays
    myRelays = shuffle(Array.from(myRelays)).slice(0, 3);
    for (const relay of myRelays) {
      if (sinceLastSeen && savedRelays[relay.url] && savedRelays[relay.url].lastSeen) {
        groupedFilter.since = savedRelays[relay.url].lastSeen;
      }
      const sub = relay.sub([groupedFilter], { id: subId });
      sub.on('event', (event) => {
        this.updateLastSeen(relay.url);
        Events.handle(event);
      });
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!this.subscriptionsByName.has(name)) {
        this.subscriptionsByName.set(name, new Set());
      }
      this.subscriptionsByName.get(name)?.add(sub);
      //console.log('subscriptions size', this.subscriptionsByName.size);
    }
    return unsubscribe;
  },
};

export default Relays;
