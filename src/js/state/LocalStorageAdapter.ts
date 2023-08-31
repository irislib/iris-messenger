import { Adapter, Callback, NodeValue } from '@/state/types.ts';

const unsub = () => {};

export default class LocalStorageAdapter extends Adapter {
  get(path: string, callback: Callback) {
    try {
      const storedData = localStorage.getItem(path);
      const result = storedData ? JSON.parse(storedData) : null;

      if (result) {
        callback(result.value, path, result.updatedAt, unsub);
      } else {
        callback(undefined, path, undefined, unsub);
      }
    } catch (err) {
      console.error(err);
    }

    return unsub;
  }

  async set(path: string, data: NodeValue) {
    try {
      if (data === undefined) {
        localStorage.removeItem(path);
      } else {
        localStorage.setItem(path, JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    }
  }

  list(path: string, callback: Callback) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';

        const remainingPath = key.replace(`${path}/`, '');
        if (key.startsWith(`${path}/`) && remainingPath.length && !remainingPath.includes('/')) {
          const storedData = localStorage.getItem(key);
          const result = storedData ? JSON.parse(storedData) : null;

          if (result) {
            callback(result.value, key, result.updatedAt, unsub);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    return unsub;
  }
}
