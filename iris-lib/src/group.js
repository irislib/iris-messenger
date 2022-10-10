import _ from "lodash";
import local from "./local";
import userSpace from './user';
import blockedUsers from './blockedUsers';

let counter = 0;
const cache = new Map();
const callbacks = new Map();

/**
 * Aggregates public data from all users in the group.
 *
 * For example, the public message feed, message replies and likes are aggregated using this.
 * @param groupName
 * @returns object
 */
export default function(groupName = 'everyone') {
  return {
    get(path, callback) {
      const groupNode = local().get('groups').get(groupName);
      const follows = {};
      requestAnimationFrame(() => {
        groupNode.map((isFollowing, user) => {
          if (blockedUsers()[user]) { return; } // TODO: allow to specifically query blocked users?
          if (follows[user] && follows[user] === isFollowing) { return; }
          follows[user] = isFollowing;
          if (isFollowing) { // TODO: callback on unfollow, for unsubscribe
            let node = userSpace(user);
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
        cache.set(cacheKey, new Map());
        this.get(path, (node, from) => node.map((value, key, x) => {
          const item = {value, key, from};
          cache.get(cacheKey).set(key, item);
          for (let cb of callbacks.get(cacheKey).values()) {
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
        cache.set(cacheKey, new Map());
        this.get(path, (node, from) => node.on((value, key, x) => {
          const item = {value, key, from};
          cache.get(cacheKey).set(from, item);
          for (let cb of callbacks.get(cacheKey).values()) {
            cb(value, key, x, myEvent, from);
          }
        }));
      } else {
        for (let item of cached.values()) {
          callback(item.value, item.key, 0, myEvent, item.from);
        }
      }
    },

    _cached_count(cached, cacheKey, path, myEvent, callback) {
      if (!cached) {
        cache.set(cacheKey, new Map());
        this.get(path, (node, from) => node.on((value, key) => {
          value ? cache.get(cacheKey).set(from, true) : cache.get(cacheKey).delete(from);
          const count = cache.get(cacheKey).size;
          for (let cb of callbacks.get(cacheKey).values()) {
            cb(count, key, null, myEvent, from);
          }
        }));
      } else {
        callback(cache.get(cacheKey).size, path.split('/').pop(), null, myEvent);
      }
    },

    _cached_fn(fn, path, callback) {
      const cacheKey = `${fn}:${groupName}:${path}`;

      let callbackId = counter++;
      if (callbacks.has(cacheKey)) {
        callbacks.get(cacheKey).set(callbackId, callback);
      } else {
        callbacks.set(cacheKey, new Map([[callbackId, callback]]));
      }

      const myEvent = {off: () => {
        let myCallbacks = callbacks.get(cacheKey);
        myCallbacks && myCallbacks.delete(callbackId);
      }};

      const cached = cache.get(cacheKey);

      switch (fn) {
        case 'map':
          this._cached_map(cached, cacheKey, path, myEvent, callback);
          break;
        case 'on':
          this._cached_on(cached, cacheKey, path, myEvent, callback);
          break;
        case 'count':
          this._cached_count(cached, cacheKey, path, myEvent, callback);
          break;
      }
    },

    map(path, callback) { // group queries are slow, so we cache them
      this._cached_fn('map', path, callback);
    },

    on(path, callback) {
      this._cached_fn('on', path, callback);
    },

    count(path, callback) {
      this._cached_fn('count', path, callback);
    }
  }
}