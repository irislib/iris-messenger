import iris from 'iris-lib';
import {relayPool, getBlankEvent, signEvent} from 'nostr-tools';
import {debounce} from "lodash";

export default {
  pool: null,
  profile: {},
  init: function() {
    this.pool = relayPool();
    iris.local().get('loggedIn').on(() => {
      const key = iris.session.getKey();
      this.pool.setPrivateKey(key.secp256k1.priv);

      this.pool.addRelay('wss://relay.nostr.info', {read: true, write: true})
      this.pool.addRelay('wss://nostr-pub.wellorder.net', {read: true, write: true})

      // example callback functions for listeners
      // callback functions take an object argument with following keys:
      //  - relay: relay url
      //  - type: type of listener
      //  - id: sub id for sub specific listeners ('EVENT' or 'EOSE')
      //  - event: event object, only for 'event' listener
      //  - notice: notice message, only for 'notice' listener

      const onEvent = event => {
        console.log('received event', event);
        if (event.kind === 0) {
          try {
            const content = JSON.parse(event.content);
            const updatedAt = event.created_at * 1000;
            if (content.name && (!this.profile.name || this.profile.name.updatedAt < updatedAt)) {
              this.profile.name = { value: content.name, updatedAt };
              iris.public().get('profile').get('name').put(content.name);
            }
            if (content.about && (!this.profile.about || this.profile.about.updatedAt < updatedAt)) {
              this.profile.about = { value: content.about, updatedAt };
              iris.public().get('profile').get('about').put(content.about);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      setTimeout(() => {
        console.log('subscribing to nostr events by', key.secp256k1.rpub);
        this.pool.sub({cb: onEvent, filter: {authors: [key.secp256k1.rpub]}});
        console.log('Nostr', this.pool);
      }, 1000);

      iris.public().get('profile').get('name').on(debounce((name, _k, msg) => {
        console.log('set nostr name', name, msg);
        const updatedAt = msg.put['>'];
        if (!this.profile.name || this.profile.name.updatedAt < updatedAt) {
          this.profile.name = { value: name, updatedAt };
          this.setMetadata({name});
        }
      }, 1000));
      iris.public().get('profile').get('about').on(debounce((about, _k, msg) => {
        console.log('set nostr bio', about, msg);
        const updatedAt = msg.put['>'];
        if (!this.profile.about || this.profile.about.updatedAt < updatedAt) {
          this.profile.about = { value: about, updatedAt };
          this.setMetadata({about});
        }
      }, 1000));
    });
  },

  setMetadata(data) {
    setTimeout(() => {
      let event: any = getBlankEvent();
      event.created_at = Math.round(Date.now() / 1000);
      event.content = JSON.stringify(data);
      event.pubkey = iris.session.getKey().secp256k1.rpub;
      event.kind = 0;
      const signature = signEvent(event, iris.session.getKey().secp256k1.priv)[0];
      event.sig = signature;
      console.log('publishing event', event, signature);
      this.pool.publish(event);
    }, 1001);
  }
};