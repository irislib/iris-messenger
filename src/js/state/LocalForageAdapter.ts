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
        }
      })
      .catch((err) => console.error(err));
    return unsub;
  }

  set(path: string, data: NodeValue) {
    if (data === undefined) {
      localForage.removeItem(path);
    } else {
      localForage.setItem(path, data);
    }
  }
}
