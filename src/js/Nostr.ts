import iris from 'iris-lib';
import {relayPool, getBlankEvent, signEvent} from 'nostr-tools';
import {debounce} from "lodash";

export default {
  pool: null,
  init: function() {
    this.pool = relayPool();
    setTimeout(() => {
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
      function onEvent(event) {
        console.log('received event', event);
      }
      console.log('subscribing to nostr events by', key.secp256k1.rpub);
      this.pool.sub({ cb: onEvent, filter: { authors: [key.secp256k1.rpub] } });
      console.log('Nostr', this.pool);
      window.nostr = this.pool;

      iris.local().get('loggedIn').on(() => {
      iris.public().get('profile').get('name').on(debounce(name => {
        console.log('set nostr name', name);
        this.setMetadata({ name });
      }, 1000));
      iris.public().get('profile').get('about').on(debounce(about => {
        console.log('set nostr bio', about);
        this.setMetadata({ about });
      }, 1000));
    });

    }, 1000);
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