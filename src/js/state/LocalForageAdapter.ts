import localForage from 'localforage';

import { Adapter, Callback } from '@/state/types.ts';

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = 'c2fc1ad0-f76f-11ec-b939-0242ac120002';

localForage.config({
  driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL],
});

const unsub = () => {};

export default class LocalForageAdapter extends Adapter {
  get(path: string, callback: Callback) {
    localForage.getItem(path).then((result) => {
      if (result === null) {
        result = undefined;
      } else if (result === LOCALFORAGE_NULL) {
        result = null;
      }
      callback(result, path, unsub);
    });
    return unsub;
  }

  set(path: string, data: any) {
    if (data === null) {
      localForage.setItem(path, LOCALFORAGE_NULL);
    } else if (data === undefined) {
      localForage.removeItem(path);
    } else {
      localForage.setItem(path, data);
    }
  }
}
