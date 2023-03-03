import localForage from 'localforage';
import { route } from 'preact-router';

import IrisTo from '../IrisTo';
import { Event, Filter, Path } from '../lib/nostr-tools';
import localState from '../LocalState';

import Events from './Events';
import IndexedDB from './IndexedDB';
import Key from './Key';
import LocalForage from './LocalForage';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';
import Subscriptions from './Subscriptions';

try {
  localStorage.setItem('gunPeers', JSON.stringify({})); // quick fix to not connect gun
} catch (e) {
  // ignore
}

const Session = {
  async logOut() {
    route('/');
    /*
    if (electron) {
      electron.get('user').put(null);
    }
    */
    // TODO: remove subscription from your channels
    if (navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.pushManager) {
        reg.active?.postMessage({ key: null });
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // TODO unsubscribe
        }
      }
    }
    IndexedDB.clear();
    localStorage.clear(); // TODO clear only iris data
    localForage.clear().then(() => {
      location.reload();
    });
  },
  onLoggedIn() {
    const myPub = Key.getPubKey();
    SocialNetwork.followDistanceByUser.set(myPub, 0);
    SocialNetwork.usersByFollowDistance.set(0, new Set([myPub]));
    const subscribe = (filters: Filter[], callback: (event: Event) => void): string => {
      const filter = filters[0];
      const key = filter['#d']?.[0];
      if (key) {
        const event = Events.keyValueEvents.get(key);
        if (event) {
          callback(event);
        }
      }
      Subscriptions.subscribe(filters, callback);
      return '0';
    };
    localState.get('globalFilter').once((globalFilter) => {
      if (!globalFilter) {
        localState.get('globalFilter').put(Events.DEFAULT_GLOBAL_FILTER);
      }
    });
    // TODO move private and public to State.ts
    this.private = new Path(
      (...args) => Events.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
      (...args) => Key.encrypt(...args),
      (...args) => Key.decrypt(...args),
    );
    this.public = new Path(
      (...args) => Events.publish(...args),
      subscribe,
      (...args) => this.unsubscribe(...args),
      { authors: [myPub] },
    );
    this.public.get('notifications/lastOpened', (time) => {
      if (time !== Events.notificationsSeenTime) {
        Events.notificationsSeenTime = time;
        Events.updateUnseenNotificationCount();
      }
    });
    this.public.get('settings/colorScheme', (colorScheme) => {
      if (colorScheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        return;
      } else if (colorScheme === 'default') {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          //OS theme setting detected as dark
          document.documentElement.setAttribute('data-theme', 'light');
          return;
        }
      }
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    Relays.manage();
    LocalForage.loadEvents();
    IndexedDB.loadIDBEvents();
    const timeout = setTimeout(() => {
      IrisTo.checkExistingAccount(myPub);
    }, 1000);
    SocialNetwork.getProfile(myPub, async (p) => {
      if (p && p.nip05 && p.nip05.endsWith('@iris.to')) {
        localState.get('showNoIrisToAddress').put(false);
        clearTimeout(timeout);
      }
    });
    setTimeout(() => {
      // TODO 'new' subscription should only be done when viewing Global
      // Relays.subscribe([{ kinds: [0, 1, 3, 6, 7, 9735], limit: 10 }], 'new', false, 0, true); // everything new
      Relays.subscribe([{ authors: [myPub] }], 'ours', false, 0, true); // our stuff
      Relays.subscribe([{ '#p': [myPub] }], 'notifications', false, 0, true); // notifications and DMs
    }, 200);
    setInterval(() => {
      console.log('handled msgs per second', Math.round(Events.handledMsgsPerSecond / 5));
      Events.handledMsgsPerSecond = 0;
    }, 5000);
  },
  init: function (options: any) {
    Key.getOrCreate(options);
    localState.get('loggedIn').on(() => this.onLoggedIn());
    let lastResubscribed = Date.now();
    document.addEventListener('visibilitychange', () => {
      // when iris returns to foreground after 1 min dormancy, resubscribe stuff
      // there might be some better way to manage resubscriptions?
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastResubscribed > 60 * 1000 * 1) {
          Relays.resubscribe();
          lastResubscribed = Date.now();
        }
      }
    });
  },
};

export default Session;
