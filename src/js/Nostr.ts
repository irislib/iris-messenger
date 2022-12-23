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

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
}

let subscriptionId = 0;

export default {
  pool: null,
  profile: {},
  userProfiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  maxRelays: 3,
  relays: defaultRelays,
  subscriptions: new Map<Number, Subscription>(),
  subscribedUsers: new Set<string>(),
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
  subscribeAuthors: debounce((_this) => {
    console.log('subscribe to', Array.from(_this.subscribedUsers));
    for (const relay of _this.relays.values()) {
      const go = () => {
        const sub = relay.sub([{authors: Array.from(_this.subscribedUsers)}], {});
        sub.on('event', event => _this.handleEvent(event));
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
  }, 1000),
  subscribe: function (filters: Filter[], cb: Function) {
    this.subscriptions.set(subscriptionId++, {
      filter: filters,
      callback: cb,
    });

    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          this.subscribedUsers.add(author);
        }
      }
    }
    this.subscribeAuthors(this);
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
  handleNote(event: Event) {
    this.messagesById.set(event.id, event);
    this.messagesByUser.get(event.pubkey)?.add(event.id);
    const repliedMessages = event.tags.filter((tag: any) => tag[0] === 'e');
    for (const [_, replyId] of repliedMessages) {
      if (!this.repliesByMessageId.has(event.id)) {
        this.repliesByMessageId.set(event.id, new Set<string>());
      }
      this.repliesByMessageId.get(event.id)?.add(replyId);
    }
  },
  handleReaction(event: Event) {
    if (event.content !== '+') return; // for now we handle only likes
    const subjects = event.tags.filter((tag: any) => tag[0] === 'e');
    for (const subject of subjects) {
      const id = subject[1];
      if (!this.likesByMessageId.has(id)) {
        this.likesByMessageId.set(id, new Set());
      }
      this.likesByMessageId.get(id).add(event.pubkey);
    }
  },
  handleFollow(event: Event) {
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag[0] === 'p') {
        this.addFollower(tag[1], event.pubkey);
      }
    }
  },
  async handleMetadata(event: Event) {
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
          if (nostrAddrSignedByIris === event.pubkey) {
            profile.iris = irisData.pub;
          }
        } catch (e) {
          // console.error('Invalid iris data', e);
        }
      }
      this.userProfiles.set(event.pubkey, profile);
      iris.session.addToSearchIndex(event.pubkey, {
        key: event.pubkey,
        name: content.name,
        followers: this.followersByUser.get(event.pubkey) ?? new Set(),
      });
    } catch (e) {
      console.log('error parsing nostr profile', e);
    }
  },
  handleEvent(event: Event) {
    switch (event.kind) {
      case 0:
        this.handleMetadata(event);
        break;
      case 1:
        this.handleNote(event);
        break;
      case 3:
        this.handleFollow(event);
        break;
      case 7:
        this.handleReaction(event);
        break;
    }
    // go through subscriptions and callback if filters match
    for (const sub of this.subscriptions.values()) {
      if (!sub.filters) {
        return;
      }
      if (this.matchesOneFilter(event, sub.filters)) {
        sub.callback && sub.callback(event);
      }
    }
  },
  // if one of the filters matches, return true
  matchesOneFilter(event: Event, filters: Filter[]) {
    for (const filter of filters) {
      if (this.matchFilter(event, filter)) {
        return true;
      }
    }
    return false;
  },
  matchFilter(event: Event, filter: Filter) {
    if (filter.ids && !filter.ids.includes(event.id)) {
      return false;
    }
    if (filter.kinds && !filter.kinds.includes(event.kind)) {
      return false;
    }
    if (filter.authors && !filter.authors.includes(event.pubkey)) {
      return false;
    }
    if (filter['#e'] && !event.tags.some((tag: any) => tag[0] === 'e' && tag[1] === filter['#e'])) {
      return false;
    }
    if (filter['#p'] && !event.tags.some((tag: any) => tag[0] === 'e' && tag[1] === filter['#p'])) {
      return false;
    }
    return true;
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
    this.subscribe([{ kinds: [1, 7], '#e': [id] }], (event) => {
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
    });
  },

  async getMessageById(id: string) {
    if (this.messagesById.has(id)) {
      return this.messagesById.get(id);
    }

    return new Promise((resolve) => {
      this.subscribe([{ ids: [id] }], (event) => {
        this.messagesById.set(event.id, event);
        resolve(event);
      });
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
    this.subscribe([{ kinds: [1, 7], authors: [address] }], (event) => {
      if (event.kind === 1 && event.pubkey === address) {
        this.messagesById.set(event.id, event);
        this.messagesByUser.get(address)?.add(event.id);
        cb && cb(this.messagesByUser.get(address));
      }
    });
  },

  getProfile(address, callback: Function | null, recursion = 0) {
    if (this.userProfiles.has(address)) {
      const profile = this.userProfiles.get(address);
      callback && callback(profile, address);
      return;
    }

    this.subscribe(
      [{ authors: [address], kinds: [0, 3] }],
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
