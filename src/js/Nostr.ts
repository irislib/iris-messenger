import iris from 'iris-lib';
import { debounce } from 'lodash';
import { getBlankEvent, relayPool, signEvent } from 'nostr-tools';
const bech32 = require('bech32-buffer');

function arrayToHex(array: any) {
  return Array.from(array, (byte: any) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

export default {
  pool: null,
  profile: {},
  knownAddresses: new Set<string>(),
  followedUsers: new Set<string>(),
  followers: new Map<string, Set<string>>(),
  follow: function(address: string) {
    this.followedUsers.add(address);
    const event: any = getBlankEvent();
    event.created_at = Math.round(Date.now() / 1000);
    event.content = "";
    event.pubkey = iris.session.getKey().secp256k1.rpub;
    event.tags = Array.from(this.followedUsers).map((address: string) => {
      return ["p", address];
    });
    event.kind = 3;
    const signature = signEvent(event, iris.session.getKey().secp256k1.priv)[0];
    event.sig = signature;
    console.log('publishing event', event, signature);
    this.pool.publish(event);
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
  init: function () {
    this.pool = relayPool();
    iris
      .local()
      .get('loggedIn')
      .on(() => {
        const key = iris.session.getKey();
        this.pool.setPrivateKey(key.secp256k1.priv);

        this.pool.addRelay('wss://relay.damus.io', { read: true, write: true });
        this.pool.addRelay('wss://nostr-pub.wellorder.net', { read: true, write: true });

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
          this.pool.sub({ cb: onEvent, filter: { authors: [key.secp256k1.rpub] } });
          console.log('Nostr', this.pool);
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
      const event: any = getBlankEvent();
      event.created_at = Math.round(Date.now() / 1000);
      event.content = JSON.stringify(data);
      event.pubkey = iris.session.getKey().secp256k1.rpub;
      event.kind = 0;
      const signature = signEvent(event, iris.session.getKey().secp256k1.priv)[0];
      event.sig = signature;
      console.log('publishing event', event, signature);
      this.pool.publish(event);
    }, 1001);
  },
};
