import iris from 'iris-lib';
import { debounce } from 'lodash';
import { Event, Filter, getEventHash, Relay, relayInit, signEvent } from 'nostr-tools';
const bech32 = require('bech32-buffer');

function arrayToHex(array: any) {
  return Array.from(array, (byte: any) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

const defaultRelays = new Map<string, Relay>([
  ['wss://relay.damus.io', relayInit('wss://relay.damus.io')],
  ['wss://nostr-pub.wellorder.net', relayInit('wss://nostr-pub.wellorder.net')],
  ['wss://relay.nostr.info', relayInit('wss://relay.nostr.info')],
  ['wss://nostr.bitcoiner.social', relayInit('wss://nostr.bitcoiner.social')],
  ['wss://nostr.onsats.org', relayInit('wss://nostr.onsats.org')],
]);

export default {
  pool: null,
  profile: {},
  knownAddresses: new Set<string>(),
  followedUsers: new Set<string>(),
  followers: new Map<string, Set<string>>(),
  maxRelays: 3,
  relays: defaultRelays,
  follow: function (address: string) {
    this.followedUsers.add(address);

    const event: Event = {
      kind: 3,
      created_at: Math.round(Date.now() / 1000),
      content: '',
      pubkey: iris.session.getKey().secp256k1.rpub,
      tags: Array.from(this.followedUsers).map((address: string) => {
        return ['p', address];
      }),
    };

    this.publish(event);
  },
  addRelay(url: string) {
    if (this.relays.has(url)) return;

    this.relays.set(url, relayInit(url));
  },
  removeRelay(url: string) {
    this.relays.get(url)?.close();
    this.relays.delete(url);
  },
  addFollower: function (address: string, follower: string) {
    if (!this.followers.has(address)) {
      this.followers.set(address, new Set<string>());
    }
    this.followers.get(address)?.add(follower);
  },
  followerCount: function (address: string) {
    return this.followers.get(address)?.size ?? 0;
  },
  toNostrAddress(str: string) {
    if (str.match(/^[0-9a-fA-F]{64}$/)) {
      this.knownAddresses.add(str);
      return str;
    }
    try {
      const { prefix, data } = bech32.decode(str);
      if (prefix === 'npub') {
        const addr = arrayToHex(data);
        this.knownAddresses.add(addr);
        return addr;
      }
    } catch (e) {}
    return null;
  },
  publish: async function (event: Event) {
    event.id = getEventHash(event);
    event.sig = await signEvent(event, iris.session.getKey().secp256k1.priv);
    if (!(event.id && event.sig)) {
      console.error('Failed to sign event', event);
      throw new Error('Invalid event');
    }
    for (const relay of this.relays.values()) {
      console.log('publishing event', event, 'to', relay);
      relay.publish(event);
    }
  },
  subscribe: function (cb: Function, filters: Filter[], opts = {}) {
    for (const relay of this.relays.values()) {
      const sub = relay.sub(filters, opts);
      sub.on('event', cb);
    }
  },
  manageRelays: function () {
    const getStatus = (relay: Relay) => {
      // workaround for nostr-tools bug
      try {
        return relay.status;
      } catch (e) {
        return 3;
      }
    };

    const go = () => {
      const relays: Array<Relay> = Array.from(this.relays.values());
      // ws status codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      const openRelays = relays.filter((relay: Relay) => getStatus(relay) === 1);
      const connectingRelays = relays.filter((relay: Relay) => getStatus(relay) === 0);
      if (openRelays.length + connectingRelays.length < this.maxRelays) {
        const closedRelays = relays.filter((relay: Relay) => getStatus(relay) === 3);
        if (closedRelays.length) {
          relays[Math.floor(Math.random() * relays.length)].connect();
        }
      }
    };

    for (let i = 0; i < this.maxRelays; i++) {
      go();
    }

    setInterval(go, 1000);
  },
  init: function () {
    iris
      .local()
      .get('loggedIn')
      .on(() => {
        const key = iris.session.getKey();
        this.manageRelays();

        // example callback functions for listeners
        // callback functions take an object argument with following keys:
        //  - relay: relay url
        //  - type: type of listener
        //  - id: sub id for sub specific listeners ('EVENT' or 'EOSE')
        //  - event: event object, only for 'event' listener
        //  - notice: notice message, only for 'notice' listener

        const onEvent = (event) => {
          console.log('received event', event);
          if (event.kind === 0) {
            try {
              const content = JSON.parse(event.content);
              const updatedAt = event.created_at * 1000;
              if (content.name && (!this.profile.name || this.profile.name.updatedAt < updatedAt)) {
                this.profile.name = { value: content.name, updatedAt };
                iris.public().get('profile').get('name').put(content.name);
              }
              if (
                content.about &&
                (!this.profile.about || this.profile.about.updatedAt < updatedAt)
              ) {
                this.profile.about = { value: content.about, updatedAt };
                iris.public().get('profile').get('about').put(content.about);
              }
            } catch (e) {
              console.error(e);
            }
          } else if (event.kind === 3) {
            for (const tag of event.tags) {
              if (tag[0] === 'p') {
                this.addFollower(tag[1], event.pubkey);
                this.followedUsers.add(tag[1]);
              }
            }
          }
        };

        setTimeout(() => {
          console.log('subscribing to nostr events by', key.secp256k1.rpub);
          this.subscribe(onEvent, [{ authors: [key.secp256k1.rpub] }]);
        }, 1000);

        iris
          .public()
          .get('profile')
          .get('name')
          .on(
            debounce((name, _k, msg) => {
              console.log('set nostr name', name, msg);
              const updatedAt = msg.put['>'];
              if (!this.profile.name || this.profile.name.updatedAt < updatedAt) {
                this.profile.name = { value: name, updatedAt };
                const metadata = { name };
                if (this.profile.about) {
                  metadata['about'] = this.profile.about.value;
                }
                this.setMetadata(metadata);
              }
            }, 1000),
          );
        iris
          .public()
          .get('profile')
          .get('about')
          .on(
            debounce((about, _k, msg) => {
              console.log('set nostr bio', about, msg);
              const updatedAt = msg.put['>'];
              if (!this.profile.about || this.profile.about.updatedAt < updatedAt) {
                this.profile.about = { value: about, updatedAt };
                const metadata = { about };
                if (this.profile.name) {
                  metadata['name'] = this.profile.name.value;
                }
                this.setMetadata(metadata);
              }
            }, 1000),
          );
      });
  },

  setMetadata(data) {
    setTimeout(() => {
      const event: Event = {
        kind: 0,
        pubkey: iris.session.getKey().secp256k1.rpub,
        content: JSON.stringify(data),
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      };

      this.publish(event);
    }, 1001);
  },
};
