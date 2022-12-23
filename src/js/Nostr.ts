import iris from 'iris-lib';
import { debounce } from 'lodash';
import { Event, Filter, getEventHash, Relay, relayInit, signEvent } from 'nostr-tools';
const bech32 = require('bech32-buffer');

function arrayToHex(array: any) {
  return Array.from(array, (byte: any) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

const getRelayStatus = (relay: Relay) => {
  // workaround for nostr-tools bug
  try {
    return relay.status;
  } catch (e) {
    return 3;
  }
};

const INITIAL_RECURSION = 0; // 0 for now to limit the amount of requests. need to bundle the requests together.

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
  userProfiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  maxRelays: 3,
  relays: defaultRelays,
  messagesByUser: new Map<string, Set<string>>(),
  messagesById: new Map<string, Event>(),
  repliesByMessageId: new Map<string, Set<string>>(),
  likesByMessageId: new Map<string, Set<string>>(),

  follow: function (address: string) {
    const pubkey = iris.session.getKey().secp256k1.rpub;
    this.addFollower(address, pubkey);

    const event: Event = {
      kind: 3,
      created_at: Math.round(Date.now() / 1000),
      content: '',
      pubkey,
      tags: Array.from(this.followedByUser.get(pubkey)).map((address: string) => {
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
    if (!this.followersByUser.has(address)) {
      this.followersByUser.set(address, new Set<string>());
    }
    this.followersByUser.get(address)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<string>());
    }
    this.followedByUser.get(follower)?.add(address);
    if (follower === iris.session.getKey().secp256k1.rpub) {
      iris.public().get('follow').get(address).put(true);
      this.getMessagesByUser(address);
    }
    if (address === iris.session.getKey().secp256k1.rpub) {
      if (this.followersByUser.get(address)?.size === 1) {
        iris.local().get('hasNostrFollowers').put(true);
      }
    }
  },
  followerCount: function (address: string) {
    return this.followersByUser.get(address)?.size ?? 0;
  },
  toNostrBech32Address: function (address: string, prefix) {
    try {
      const decoded = bech32.decode(address);
      if (prefix !== decoded.prefix) {
        return null;
      }
      return bech32.encode(prefix, decoded.words);
    } catch (e) {}

    if (address.match(/^[0-9a-fA-F]{64}$/)) {
      const words = Buffer.from(address, 'hex');
      return bech32.encode(prefix, words);
    }
    return null;
  },
  toNostrHexAddress(str: string): string | null {
    if (str.match(/^[0-9a-fA-F]{64}$/)) {
      return str;
    }
    try {
      const { data } = bech32.decode(str);
      const addr = arrayToHex(data);
      return addr;
    } catch (e) {}
    return null;
  },
  publish: async function (event: any) {
    event.tags = event.tags || [];
    event.content = event.content || '';
    event.created_at = event.created_at || Math.floor(Date.now() / 1000);
    event.pubkey = iris.session.getKey().secp256k1.rpub;
    event.id = getEventHash(event);
    event.sig = await signEvent(event, iris.session.getKey().secp256k1.priv);
    if (!(event.id && event.sig)) {
      console.error('Failed to sign event', event);
      throw new Error('Invalid event');
    }
    for (const relay of this.relays.values()) {
      relay.publish(event);
    }
  },
  subscribe: function (cb: Function, filters: Filter[], opts = {}) {
    for (const relay of this.relays.values()) {
      const go = () => {
        const sub = relay.sub(filters, opts);
        sub.on('event', cb);
      };
      const status = getRelayStatus(relay);
      if (status === 0) {
        relay.on('connect', () => {
          go();
        });
      } else if (status === 1) {
        go();
      }
    }
  },
  manageRelays: function () {
    const go = () => {
      const relays: Array<Relay> = Array.from(this.relays.values());
      // ws status codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      const openRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 1);
      const connectingRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 0);
      if (openRelays.length + connectingRelays.length < this.maxRelays) {
        const closedRelays = relays.filter((relay: Relay) => getRelayStatus(relay) === 3);
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
        this.getProfile(key.secp256k1.rpub, null, INITIAL_RECURSION);
        this.getMessagesByUser(key.secp256k1.rpub);

        iris
          .public()
          .get('profile')
          .get('name')
          .on(
            debounce((name, _k, msg) => {
              const updatedAt = msg.put['>'];
              if (
                !this.profile.name ||
                (this.profile.name.value !== name && this.profile.name.updatedAt < updatedAt)
              ) {
                this.profile.name = { value: name, updatedAt };
                this.setMetadata();
              }
            }, 1000),
          );
        iris
          .public()
          .get('profile')
          .get('about')
          .on(
            debounce((about, _k, msg) => {
              const updatedAt = msg.put['>'];
              if (
                !this.profile.about ||
                (this.profile.about.value !== about && this.profile.about.updatedAt < updatedAt)
              ) {
                this.profile.about = { value: about, updatedAt };
                this.setMetadata();
              }
            }, 1000),
          );
        iris
          .public()
          .get('profile')
          .get('photo')
          .on(
            debounce((photo, _k, msg) => {
              const updatedAt = msg.put['>'];
              if (
                !this.profile.picture ||
                (this.profile.picture.value !== photo && this.profile.picture.updatedAt < updatedAt)
              ) {
                this.profile.picture = { value: photo, updatedAt };
                this.setMetadata();
              }
            }, 1000),
          );
      });
  },

  getRepliesAndLikes(id: string, cb: Function | null) {
    this.subscribe(
      (event) => {
        console.log('got reaction / reply', event);
        if (event.kind === 1) {
          if (!this.repliesByMessageId.has(id)) {
            this.repliesByMessageId.set(id, new Set());
          }
          this.repliesByMessageId.get(id).add({ hash: event.id, time: event.created_at * 1000 });
          cb && cb(this.repliesByMessageId.get(id), this.likesByMessageId.get(id));
        } else if (event.kind === 7) {
          if (!this.likesByMessageId.has(id)) {
            this.likesByMessageId.set(id, new Set());
          }
          this.likesByMessageId.get(id).add(event.pubkey);
          cb && cb(this.repliesByMessageId.get(id), this.likesByMessageId.get(id));
        }
      },
      [{ kinds: [1, 7], '#e': [id] }],
    );
  },

  async getMessageById(id: string) {
    if (this.messagesById.has(id)) {
      return this.messagesById.get(id);
    }

    return new Promise((resolve) => {
      this.subscribe(
        (event) => {
          this.messagesById.set(event.id, event);
          resolve(event);
        },
        [{ ids: [id] }],
      );
    });
  },

  getSomeRelayUrl() {
    // try to find a connected relay, but if none are connected, just return the first one
    const relays: Relay[] = Array.from(this.relays.values());
    const connectedRelays: Relay[] = relays.filter((relay: Relay) => getRelayStatus(relay) === 1);
    if (connectedRelays.length) {
      return connectedRelays[0].url;
    }
    return relays.length ? relays[0].url : null;
  },

  getMessagesByUser(address: string, cb: Function | undefined) {
    if (this.messagesByUser.has(address)) {
      cb && cb(this.messagesByUser.get(address));
      return;
    }

    this.messagesByUser.set(address, new Set());
    this.subscribe(
      (event) => {
        if (event.kind === 1 && event.pubkey === address) {
          this.messagesById.set(event.id, event);
          this.messagesByUser.get(address)?.add(event.id);
          cb && cb(this.messagesByUser.get(address));
        }
      },
      [{ kinds: [1, 7], authors: [address] }],
    );
  },

  getProfile(address, callback: Function | null, recursion = 0) {
    if (this.userProfiles.has(address)) {
      const profile = this.userProfiles.get(address);
      callback && callback(profile, address);
      return;
    }

    this.subscribe(
      // are we sure that event.pubkey === address ?
      async (event) => {
        if (event.kind === 0) {
          try {
            const content = JSON.parse(event.content);
            const profile: any = {
              name: content.name,
              about: content.about,
              photo: content.picture,
            };
            if (content.iris) {
              try {
                const irisData = JSON.parse(content.iris);
                const nostrAddrSignedByIris = await iris.Key.verify(irisData.sig, irisData.pub);
                if (nostrAddrSignedByIris === address) {
                  profile.iris = irisData.pub;
                }
              } catch (e) {
                // console.error('Invalid iris data', e);
              }
            }
            this.userProfiles.set(address, profile);
            iris.session.addToSearchIndex(address, {
              key: address,
              name: content.name,
              followers: this.followersByUser.get(address) ?? new Set(),
            });
            callback &&
              callback(
                { name: content.name, about: content.about, photo: content.picture },
                address,
              );
          } catch (e) {
            console.log('error parsing nostr profile', e);
          }
        } else if (event.kind === 3 && Array.isArray(event.tags)) {
          let i = 0;
          for (const tag of event.tags) {
            if (Array.isArray(tag) && tag[0] === 'p') {
              if (recursion) {
                i += 100;
                setTimeout(() => {
                  this.getProfile(tag[1], null, recursion - 1);
                }, i + (INITIAL_RECURSION - recursion) * 1000);
              }
              this.addFollower(tag[1], address);
              callback &&
                callback({ followedUserCount: this.followedByUser.get(address)?.size }, address);
            }
          }
        }
      },
      [{ authors: [address], kinds: [0, 3] }],
    );
  },

  setMetadata() {
    setTimeout(async () => {
      // for each child of this.profile, if it has a value, set it
      const irisData = JSON.stringify({
        pub: iris.session.getPubKey(),
        sig: await iris.Key.sign(iris.session.getKey().secp256k1.rpub, iris.session.getKey()),
      });
      const data = {
        iris: irisData,
      };
      for (const key in this.profile) {
        if (this.profile[key].value) {
          data[key] = this.profile[key].value;
        }
      }
      const event = {
        kind: 0,
        content: JSON.stringify(data),
      };

      this.publish(event);
    }, 1001);
  },
};
