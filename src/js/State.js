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

    this.cache = new Map(); // TODO: reset cache when users are blocked
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
        const follows = {};
        requestAnimationFrame(() => {
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
          });
        });
      },

      _cached_map(cached, cacheKey, path, myEvent, callback) {
        if (!cached) {
          _this.cache.set(cacheKey, new Map());
          this.get(path, (node, from) => node.map((value, key, x) => {
            const item = {value, key, from};
            _this.cache.get(cacheKey).set(key, item);
            for (let cb of _this.callbacks.get(cacheKey).values()) {
              cb(value, key, x, myEvent, from);
            }
          }));
        } else {
          for (let item of cached.values()) {
            callback(item.value, item.key, 0, myEvent, item.from);
          }
        }
      },

      // TODO: this should probably store just the most recent value, not everyone's value
      // TODO: for counting of likes etc, use this.count() instead
      _cached_on(cached, cacheKey, path, myEvent, callback) {
        if (!cached) {
          _this.cache.set(cacheKey, new Map());
          this.get(path, (node, from) => node.on((value, key, x) => {
            const item = {value, key, from};
            _this.cache.get(cacheKey).set(from, item);
            for (let cb of _this.callbacks.get(cacheKey).values()) {
              cb(value, key, x, myEvent, from);
            }
          }));
        } else {
          for (let item of cached.values()) {
            callback(item.value, item.key, 0, myEvent, item.from);
          }
        }
      },

      _cached_map_or_on(fn, path, callback) {
        const cacheKey = fn + ':' + groupName + ':' + path;

        let id = _this.counterNext();
        if (_this.callbacks.has(cacheKey)) {
          _this.callbacks.get(cacheKey).set(id, callback);
        } else {
          _this.callbacks.set(cacheKey, new Map([[id, callback]]));
        }

        const myEvent = {off: () => {
          let callbacks = _this.callbacks.get(cacheKey);
          callbacks && callbacks.delete(id);
        }};

        const cached = _this.cache.get(cacheKey);

        if (fn === 'map') {
          this._cached_map(cached, cacheKey, path, myEvent, callback);
        } else {
          this._cached_on(cached, cacheKey, path, myEvent, callback);
        }
      },

      map(path, callback) { // group queries are slow, so we cache them
        this._cached_map_or_on('map', path, callback);
      },

      on(path, callback) {
        this._cached_map_or_on('on', path, callback);
      }
    }
  },
};

export default State;
