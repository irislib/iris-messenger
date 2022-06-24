import Gun from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import _ from 'lodash';

import PeerManager from './PeerManager';
import iris from './iris-lib';
import Helpers from './Helpers';

const State = {
  init(publicOpts) {
    Gun.log.off = true;
    const o = Object.assign({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity }, publicOpts);
    this.public = Gun(o);
    if (publicOpts && publicOpts.peers) {
      publicOpts.peers.forEach(url => PeerManager.addPeer({url}));
    }
    this.local = Gun({peers: [], multicast:false, rad: false, localStorage: true}).get('state');
    if (Helpers.isElectron) {
      this.electron = Gun({peers: ['http://localhost:8768/gun'], file: 'State.electron', multicast:false, localStorage: false}).get('state');
    }
    this.blockedUsers = {};

    this.cache = new Map();
    this.callbacks = new Map();
    this.counter = 0;

    // Is this the right place for this?
    this.local.get('block').map().on((isBlocked, user) => {
      if (isBlocked === this.blockedUsers[user]) { return; }
      if (isBlocked) {
        this.blockedUsers[user] = isBlocked;
        State.local.get('groups').map().once((v, k) => {
          State.local.get('groups').get(k).get(user).put(false);
        });
      } else {
        delete this.blockedUsers[user];
      }
    });

    window.State = this;
    iris.util.setPublicState && iris.util.setPublicState(this.public);
  },

  counterNext() {
    return this.counter++;
  },

  getBlockedUsers() {
    return this.blockedUsers;
  },

  group(groupName = 'everyone') {
    const _this = this;
    return {
      get(path, callback) {
        const groupNode = _this.local.get('groups').get(groupName);
        requestAnimationFrame(() => {
          const follows = {};
          groupNode.map((isFollowing, user) => {
            if (_this.blockedUsers[user]) { return; } // TODO: allow to specifically query blocked users?
            if (follows[user] && follows[user] === isFollowing) { return; }
            follows[user] = isFollowing;
            if (isFollowing) { // TODO: callback on unfollow, for unsubscribe
              let node = State.public.user(user);
              if (path && path !== '/') {
                node = _.reduce(path.split('/'), (sum, s) => sum.get(decodeURIComponent(s)), node);
              }
              callback(node, user);
            }
          })
        });
      },

      map(path, callback) { // group queries are slow, so we cache them
        const cacheKey = groupName + ':' + path;

        let id = _this.counterNext();
        if (_this.callbacks.has(cacheKey)) {
          _this.callbacks.get(cacheKey).set(id, callback);
        } else {
          _this.callbacks.set(cacheKey, new Map([[id, callback]]));
        }

        const myEvent = {off: () => {
          let map = _this.callbacks.get(cacheKey);
          map && map.delete(id);
        }};

        const cachedPath = _this.cache.get(cacheKey);
        if (!cachedPath) {
          _this.cache.set(cacheKey, new Map());
          this.get(path, (node, from) => node.map((value,key,x) => {
            const item = {value, key, from};
            _this.cache.get(cacheKey).set(key, item);
            for (let cb of _this.callbacks.get(cacheKey).values()) {
              cb(value,key,x,myEvent,from);
            }
          }));
        } else {
          for (let item of cachedPath.values()) {
            callback(item.value,item.key,0,myEvent,item.from);
          }
        }
      },

      on(path, callback) {
        this.get(path, (node, from) => node.on((...args) => callback(...args, from)));
      }
    }
  },
};

export default State;
