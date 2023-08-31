import { route } from 'preact-router';

import publicState from '@/state/PublicState.ts';
import Helpers from '@/utils/Helpers.tsx';

import localState from '../state/LocalState.ts';
import IrisTo from '../utils/IrisTo';
import { ID } from '../utils/UniqueIds';

import Events from './Events';
import IndexedDB from './IndexedDB';
import Key from './Key';
import PubSub from './PubSub';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';

try {
  localStorage.setItem('gunPeers', JSON.stringify({})); // quick fix to not connect gun
} catch (e) {
  // ignore
}

let loggedIn = false;

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
    localStorage.clear();
  },
  unsubscribe() {
    // wat dis
  },
  loadMyFollowList() {
    localState.get('myFollowList').once((myFollowList) => {
      if (!myFollowList) {
        return;
      }
      try {
        const event = JSON.parse(myFollowList);
        if (event?.kind === 3) {
          Events.handle(event);
        }
      } catch (e) {
        // ignore
      }
    });
  },
  onLoggedIn() {
    if (loggedIn) {
      return;
    }
    loggedIn = true;
    const myPub = Key.getPubKey();
    const myId = ID(myPub);
    SocialNetwork.followDistanceByUser.set(myId, 0);
    SocialNetwork.followersByUser.set(myId, new Set());
    SocialNetwork.usersByFollowDistance.set(0, new Set([myId]));
    this.loadMyFollowList();
    localState.get('globalFilter').once((globalFilter) => {
      if (!globalFilter) {
        localState.get('globalFilter').put(Events.DEFAULT_GLOBAL_FILTER);
      }
    });
    publicState
      .get('notifications')
      .get('lastOpened')
      .on((time) => {
        if (time !== Events.notificationsSeenTime) {
          Events.notificationsSeenTime = time;
          Events.updateUnseenNotificationCount();
        }
      });
    publicState
      .get('settings')
      .get('colorScheme')
      .on((colorScheme) => {
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
    if (window.location.pathname === '/') {
      Relays.init();
    }
    IndexedDB.init();
    const timeout = setTimeout(() => {
      IrisTo.checkExistingAccount(myPub);
    }, 1000);
    SocialNetwork.getProfile(myPub, async (p) => {
      if (p && p.nip05 && p.nip05.endsWith('@iris.to')) {
        localState.get('showNoIrisToAddress').put(false);
        localState.get('existingIrisToAddress').get('name').put(p.nip05.replace('@iris.to', ''));
        clearTimeout(timeout);
      }
    });
    let unsubFollowers = () => {};

    unsubFollowers = SocialNetwork.getFollowersByUser(myPub, (followers) => {
      if (!followers?.size) {
        localState.get('noFollowers').put(true);
      } else {
        localState.get('noFollowers').put(false);
        setTimeout(() => unsubFollowers());
      }
    });

    setTimeout(() => {
      PubSub.subscribe({ authors: [myPub] }, undefined, true); // our stuff
      PubSub.subscribe({ '#p': [myPub], kinds: [1, 3, 6, 7, 9735] }, undefined, true); // mentions, reactions, DMs
      PubSub.subscribe({ '#p': [myPub], kinds: [4] }, undefined, false, false); // dms for us
      PubSub.subscribe({ authors: [myPub], kinds: [4] }, undefined, false, false); // dms by us
      Events.subscribeGroups();
    }, 500);
    setInterval(() => {
      Events.handledMsgsPerSecond = 0;
    }, 5000);
  },
  init: function (options: any) {
    Key.getOrCreate(options);
    localState.get('isMyProfile').put(false);
    localState.get('loggedIn').on(() => this.onLoggedIn());
    Helpers.showConsoleWarning();
    if (window.location.pathname !== '/') {
      Relays.init();
    }
  },
};

export default Session;
