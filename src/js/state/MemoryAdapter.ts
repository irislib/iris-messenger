import { Adapter, Callback, NodeValue, Unsubscribe } from '@/state/types.ts';

export default class MemoryAdapter extends Adapter {
  private storage = new Map<string, NodeValue>();

  get(path: string, callback: Callback): Unsubscribe {
    const storedValue = this.storage.get(path) || { value: undefined, updatedAt: undefined };
    callback(storedValue.value, path, storedValue.updatedAt, () => {});
    return () => {};
  }

  async set(path: string, value: NodeValue) {
    if (value.updatedAt === undefined) {
      throw new Error(`Invalid value: ${JSON.stringify(value)}`);
    }
    if (value === undefined) {
      this.storage.delete(path);
    } else {
      this.storage.set(path, value);
    }
  }

  list(path: string, callback: Callback): Unsubscribe {
    for (const [storedPath, storedValue] of this.storage) {
      if (storedPath.startsWith(`${path}/`)) {
        callback(storedValue.value, storedPath, storedValue.updatedAt, () => {});
      }
    }
    return () => {};
  }
}
