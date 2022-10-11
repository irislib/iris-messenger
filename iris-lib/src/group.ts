import local from "./local";
import userSpace from './public';
import blockedUsers from './blockedUsers';

let counter = 0;
const cache = new Map<string, Map<string, any>>();
const callbacks = new Map();

type Event = {
  off: () => void;
}

/**
 * Aggregates public data from all users in the group.
 *
 * For example, the public message feed, message replies and likes are aggregated using this.
 * @param groupName
 * @returns object
 */
export default function(groupName = 'everyone') {
  return {
    get(path: string, callback: any) {
      const groupNode = local().get('groups').get(groupName);
      const follows: { [key: string]: boolean; } = {};
      requestAnimationFrame(() => {
        groupNode.map((isFollowing: any, user: string) => {
          if (blockedUsers()[user]) { return; } // TODO: allow to specifically query blocked users?
          if (follows[user] && follows[user] === isFollowing) { return; }
          follows[user] = isFollowing;
          if (isFollowing) { // TODO: callback on unfollow, for unsubscribe
            let node = userSpace(user);
            if (path && path !== '/') {
              node = path.split('/').reduce((sum:any, s:string) => sum.get(decodeURIComponent(s)), node);
            }
            callback(node, user);
          }
        });
      });
    },

    _cached_map(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function) {
      if (!cached) {
        const cached = new Map();
        cache.set(cacheKey, cached);
        this.get(path, (node: any, from: string) => node.map((value: any, key: string, x: any) => {
          const item = {value, key, from};
          cached.set(key, item);
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
    _cached_on(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function) {
      if (!cached) {
        const cached = new Map();
        cache.set(cacheKey, cached);
        this.get(path, (node: any, from: string) => node.on((value: any, key: string, x: any) => {
          const item = {value, key, from};
          cached.set(from, item);
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

    _cached_count(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function) {
      if (!cached) {
        const cached = new Map();
        cache.set(cacheKey, cached);
        this.get(path, (node: any, from: string) => node.on((value: any, key: string) => {
          value ? cached.set(from, true) : cached.delete(from);
          const count = cached.size;
          for (let cb of callbacks.get(cacheKey).values()) {
            cb(count, key, null, myEvent, from);
          }
        }));
      } else {
        callback(cached.size, path.split('/').pop(), null, myEvent);
      }
    },

    _cached_fn(fn: string, path: string, callback: Function) {
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

    map(path: string, callback: Function) { // group queries are slow, so we cache them
      this._cached_fn('map', path, callback);
    },

    on(path: string, callback: Function) {
      this._cached_fn('on', path, callback);
    },

    count(path: string, callback: Function) {
      this._cached_fn('count', path, callback);
    }
  }
}