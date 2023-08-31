import localForage from 'localforage';

import { Adapter, Callback, NodeValue } from '@/state/types.ts';

localForage.config({
  driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL],
});

const unsub = () => {};

export default class LocalForageAdapter extends Adapter {
  get(path: string, callback: Callback) {
    localForage
      .getItem<NodeValue | null>(path)
      .then((result) => {
        if (result) {
          callback(result.value, path, result.updatedAt, unsub);
        } else {
          callback(undefined, path, undefined, unsub);
        }
      })
      .catch((err) => console.error(err));
    return unsub;
  }

  async set(path: string, data: NodeValue) {
    if (data === undefined) {
      await localForage.removeItem(path);
    } else {
      await localForage.setItem(path, data);
    }
  }

  list(path: string, callback: Callback) {
    localForage
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          const remainingPath = key.replace(`${path}/`, '');
          if (key.startsWith(`${path}/`) && remainingPath.length && !remainingPath.includes('/')) {
            localForage
              .getItem<NodeValue | null>(key)
              .then((result) => {
                if (result) {
                  callback(result.value, key, result.updatedAt, unsub);
                }
              })
              .catch((err) => console.error(err));
          }
        });
      })
      .catch((err) => console.error(err));

    return unsub;
  }
}
