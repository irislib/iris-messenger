import iris from 'iris-lib';
import { debounce } from 'lodash';
import { Event, Filter, getEventHash, Relay, relayInit, signEvent } from './lib/nostr-tools';
const bech32 = require('bech32-buffer');
import SortedLimitedEventSet from './SortedLimitedEventSet';

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

const MAX_MSGS_BY_USER = 100;
const MAX_LATEST_MSGS = 500;

const defaultRelays = new Map<string, Relay>(
  [
    'wss://expensive-relay.fiatjaf.com',
    'wss://rsslay.fiatjaf.com',
    'wss://nostr-relay.wlvs.space',
    'wss://relay.damus.io',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.nostr.info',
    'wss://nostr.bitcoiner.social',
    'wss://nostr.onsats.org',
  ].map((url) => [url, relayInit(url)]),
);

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

let subscriptionId = 0;

export default {
  pool: null,
  profile: {},
  profiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  maxRelays: 3,
  relays: defaultRelays,
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  messagesByUser: new Map<string, SortedLimitedEventSet>(),
  messagesById: new Map<string, Event>(),
  latestMessagesByEveryone: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  latestMessagesByFollows: new SortedLimitedEventSet(MAX_LATEST_MSGS),
  repliesByMessageId: new Map<string, Map<string, any>>(),
  likesByMessageId: new Map<string, Set<string>>(),

  follow: function (address: string) {
    address = this.toNostrHexAddress(address);
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
    const myPub = iris.session.getKey().secp256k1.rpub;
    if (follower === myPub) {
      iris.public().get('follow').get(address).put(true);
      this.getMessagesByUser(address);
    }
    if (address === myPub) {
      if (this.followersByUser.get(address)?.size === 1) {
        iris.local().get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myPub)?.has(follower)) {
      if (!this.subscribedUsers.has(address)) {
        this.subscribedUsers.add(address); // subscribe to events from 2nd degree follows
        this.subscribeAuthors(this);
      }
    }
  },
  // TODO subscription methods for followersByUser and followedByUser. and maybe messagesByTime. and replies
  followerCount: function (address: string) {
    return this.followersByUser.get(address)?.size ?? 0;
  },
  toNostrBech32Address: function (address: string, prefix) {
    try {
      const decoded = bech32.decode(address);
      console.log(decoded);
      if (prefix !== decoded.prefix) {
        return null;
      }
      return bech32.encode(prefix, decoded.data);
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
    this.handleEvent(event);
    return event.id;
  },
  subscribeAuthors: debounce((_this) => {
    console.log('subscribe to', Array.from(_this.subscribedUsers));
    for (const relay of _this.relays.values()) {
      const go = () => {
        // first sub to profiles, then everything else
        const sub = relay.sub([{ kinds: [0, 3], authors: Array.from(_this.subscribedUsers) }], {});
        // TODO update relay lastSeen
        sub.on('event', (event) => _this.handleEvent(event));
        setTimeout(() => {
          const sub2 = relay.sub([{ authors: Array.from(_this.subscribedUsers) }], {});
          // TODO update relay lastSeen
          sub2.on('event', (event) => _this.handleEvent(event));
        }, 500);
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
  subscribe: function (filters: Filter[], cb: Function | undefined) {
    cb && this.subscriptions.set(subscriptionId++, {
      filters,
      callback: cb,
    });

    let hasNew = false;
    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          if (!this.subscribedUsers.has(author)) {
            hasNew = true;
            this.subscribedUsers.add(author);
          }
        }
      }
    }
    hasNew && this.subscribeAuthors(this);
  },
  getConnectedRelayCount: function () {
    let count = 0;
    for (const relay of this.relays.values()) {
      if (getRelayStatus(relay) === 1) {
        count++;
      }
    }
    return count;
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
      if (openRelays.length > this.maxRelays) {
        openRelays[Math.floor(Math.random() * openRelays.length)].close();
      }
    };

    for (let i = 0; i < this.maxRelays; i++) {
      go();
    }

    setInterval(go, 1000);
  },
  handleNote(event: Event) {
    if (this.messagesById.has(event.id)) {
      return;
    }
    this.messagesById.set(event.id, event);
    if (!this.messagesByUser.has(event.pubkey)) {
      this.messagesByUser.set(event.pubkey, new SortedLimitedEventSet(MAX_MSGS_BY_USER));
    }
    this.messagesByUser.get(event.pubkey)?.add(event);
    this.latestMessagesByEveryone.add(event);
    //this.latestMessagesByFollows.add(event);
    const repliedMessages = event.tags.filter((tag: any) => tag[0] === 'e');
    for (const [_, replyingTo, _preferredRelayUrl, marker] of repliedMessages) {
      if (marker === 'root') continue;
      if (!this.repliesByMessageId.has(replyingTo)) {
        this.repliesByMessageId.set(replyingTo, new Map<string, any>());
      }
      this.repliesByMessageId
        .get(replyingTo)
        ?.set(event.id, { hash: event.id, time: event.created_at });
    }
  },
  handleReaction(event: Event) {
    if (event.content !== '+' && event.content !== '') return; // for now we handle only likes
    const subjects = event.tags.filter((tag: any) => tag[0] === 'e');
    /*if (subjects.length > 1) {
      console.log('reaction with multiple subjects. what are these?', event);
    }*/
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
  handleMetadata(event: Event) {
    try {
      const content = JSON.parse(event.content);
      let profile: any = {
        name: content.name,
        photo: content.picture,
        about: content.about,
      };
      if (content.iris) {
        try {
          const irisData = JSON.parse(content.iris);
          iris.Key.verify(irisData.sig, irisData.pub).then((nostrAddrSignedByIris) => {
            if (nostrAddrSignedByIris === event.pubkey) {
              profile.iris = irisData.pub;
            }
          });
        } catch (e) {
          // console.error('Invalid iris data', e);
        }
      }
      const existing = this.profiles.get(event.pubkey);
      if (existing) {
        profile = { ...existing, ...profile };
      }
      this.profiles.set(event.pubkey, profile);
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
    if (
      filter['#e'] &&
      !event.tags.some((tag: any) => tag[0] === 'e' && filter['#e'].includes(tag[1]))
    ) {
      return false;
    }
    if (
      filter['#p'] &&
      !event.tags.some((tag: any) => tag[0] === 'e' && filter['#p'].includes(tag[1]))
    ) {
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
        this.getProfile(key.secp256k1.rpub, undefined);
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

  getRepliesAndLikes(id: string, cb: Function | undefined) {
    const callback = () => {
      cb && cb(new Set(this.repliesByMessageId.get(id)?.values()), this.likesByMessageId.get(id));
    };
    if (this.repliesByMessageId.has(id) || this.likesByMessageId.has(id)) {
      callback();
    }

    this.subscribe([{ kinds: [1, 7], '#e': [id] }], callback);
  },
  getFollowedByUser: function (address: string, cb: Function | undefined) {
    const callback = () => {
      cb && cb(this.followedByUser.get(address));
    };
    if (this.followedByUser.has(address)) {
      callback();
    }
    this.subscribe([{ kinds: [3], authors: [address] }], callback);
  },
  getFollowersByUser: function (address: string, cb: Function | undefined) {
    const callback = () => {
      cb && cb(this.followersByUser.get(address));
    };
    if (this.followersByUser.has(address)) {
      callback();
    }
    this.subscribe([{ kinds: [3], '#p': [address] }], callback);
  },
  async getMessageById(id: string) {
    if (this.messagesById.has(id)) {
      return this.messagesById.get(id);
    }

    return new Promise((resolve) => {
      for (const relay of this.relays.values()) {
        const go = () => {
          const sub = relay.sub([{ ids: [id] }], {});
          sub.on('event', (event) => {
            this.handleEvent(event);
            sub.unsub();
            resolve(event);
          });
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

  getMessagesByEveryone(cb: Function) {
    const callback = () => {
      cb && cb(this.latestMessagesByEveryone.eventIds);
    };
    callback();
    this.subscribe([{ kinds: [1, 7] }], callback);
  },

  getMessagesByUser(address: string, cb: Function | undefined) {
    if (!address) {
      return;
    }
    const callback = () => {
      cb && cb(this.messagesByUser.get(address).eventIds);
    };
    if (this.messagesByUser.has(address)) {
      callback();
    }
    this.subscribe([{ kinds: [1, 7], authors: [address] }], callback);
  },

  getProfile(address, cb: Function | undefined) {
    const callback = () => {
      const profile = this.profiles.get(address);
      cb && cb(profile, address);
    };
    if (this.profiles.has(address)) {
      callback();
    }

    this.subscribe([{ authors: [address], kinds: [0, 3] }], callback);
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
