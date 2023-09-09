import LocalStorageAdapter from '@/state/LocalStorageAdapter.ts';
import MemoryAdapter from '@/state/MemoryAdapter.ts';
import { Adapter, Callback, NodeValue, Unsubscribe } from '@/state/types.ts';

/**
  Inspired by https://github.com/amark/gun
 */

type NodeProps = {
  id?: string;
  adapters?: Adapter[];
  parent?: Node | null;
};

export const DIR_VALUE = '__DIR__';

/**
 * Nodes represent queries into the tree rather than the tree itself. The actual tree data is stored by Adapters.
 *
 * Node can be a branch node or a leaf node. Branch nodes have children, leaf nodes have a value (stored in an adapter).
 */
export default class Node {
  id: string;
  parent: Node | null;
  children = new Map<string, Node>();
  // should subscriptions also include the desired level of recursion?
  on_subscriptions = new Map<number, Callback>();
  map_subscriptions = new Map<number, Callback>();
  adapters: Adapter[];
  private counter = 0;

  constructor({ id = '', adapters, parent = null }: NodeProps = {}) {
    this.id = id;
    this.parent = parent;
    this.adapters = adapters ??
      parent?.adapters ?? [new MemoryAdapter(), new LocalStorageAdapter()];
  }

  /**
   *
   * @param key
   * @returns {Node}
   * @example node.get('users').get('alice').put({name: 'Alice'})
   */
  get(key) {
    const existing = this.children.get(key);
    if (existing) {
      return existing;
    }
    const new_node = new Node({ id: `${this.id}/${key}`, parent: this });
    this.children.set(key, new_node);
    return new_node;
  }

  private async putValue(value: any, updatedAt: number) {
    if (value !== DIR_VALUE) {
      this.children = new Map();
    }
    const nodeValue: NodeValue = {
      updatedAt,
      value,
    };
    const promises = this.adapters.map((adapter) => adapter.set(this.id, nodeValue));
    this.on_subscriptions.forEach((callback) => {
      callback(value, this.id, updatedAt, () => {});
    });
    await Promise.all(promises);
  }

  private async putChildValues(value: Record<string, any>, updatedAt: number) {
    const promises = this.adapters.map((adapter) =>
      adapter.set(this.id, { value: DIR_VALUE, updatedAt }),
    );
    const children = Object.keys(value);
    // the following probably causes the same callbacks to be fired too many times
    const childPromises = children.map((key) => this.get(key).put(value[key], updatedAt));
    await Promise.all([...promises, ...childPromises]);
  }

  /**
   * Set a value to the node. If the value is an object, it will be converted to child nodes.
   * @param value
   * @example node.get('users').get('alice').put({name: 'Alice'})
   */
  async put(value: any, updatedAt = Date.now()) {
    if (typeof value === 'object' && value !== null) {
      await this.putChildValues(value, updatedAt);
    } else {
      await this.putValue(value, updatedAt);
    }

    if (this.parent) {
      await this.parent.put(DIR_VALUE, updatedAt);
      const childName = this.id.split('/').pop()!;
      if (!this.parent.children.has(childName)) {
        this.parent.children.set(childName, this);
      }
      for (const [id, callback] of this.parent.map_subscriptions) {
        callback(value, this.id, updatedAt, () => {
          this.parent?.map_subscriptions.delete(id);
        });
      }
    }
  }

  /**
   * Callback for all child nodes in the same object
   * @param callback
   * @param recursion
   */
  open(callback: Callback, recursion = 0): Unsubscribe {
    const aggregated: Record<string, any> = {};
    let latestTime;
    return this.map((childValue, path, updatedAt) => {
      if (updatedAt && (!latestTime || latestTime < updatedAt)) {
        latestTime = updatedAt;
      }
      const childName = path.split('/').pop()!;
      aggregated[childName] = childValue;
      callback(aggregated, this.id, latestTime, () => {});
    }, recursion);
  }

  /**
   * Subscribe to a value
   * @param callback
   */
  on(callback: Callback, returnIfUndefined: boolean = false, recursion = 0): Unsubscribe {
    let latestValue: NodeValue | null = null;
    let openUnsubscribe: Unsubscribe | undefined;
    const uniqueId = this.counter++;

    const localCallback = (value, path, updatedAt, unsubscribe) => {
      const olderThanLatest = latestValue && latestValue.updatedAt >= updatedAt;
      const noReturnUndefined = !returnIfUndefined && value === undefined;
      if (olderThanLatest || noReturnUndefined) {
        return;
      }

      const returnUndefined = !latestValue && returnIfUndefined && value === undefined;
      if (returnUndefined) {
        callback(value, path, updatedAt, unsubscribe);
        return;
      }

      if (value !== undefined) {
        latestValue = { value, updatedAt };
      }

      if (value === DIR_VALUE && recursion > 0 && !openUnsubscribe) {
        openUnsubscribe = this.open(callback, recursion - 1);
      }

      if (value !== DIR_VALUE || recursion === 0) {
        callback(value, path, updatedAt, unsubscribe);
      }
    };

    this.on_subscriptions.set(uniqueId, localCallback);

    const adapterUnsubscribes = this.adapters.map((adapter) => adapter.get(this.id, localCallback));

    const unsubscribeAll = () => {
      this.on_subscriptions.delete(uniqueId);
      adapterUnsubscribes.forEach((unsub) => unsub());
      openUnsubscribe?.();
    };

    return unsubscribeAll;
  }

  /**
   * Callback for each child node
   * @param callback
   */
  map(callback: Callback, recursion = 0): Unsubscribe {
    const id = this.counter++;
    this.map_subscriptions.set(id, callback);
    const latestMap = new Map<string, NodeValue>();

    let adapterSubs: Unsubscribe[] = [];
    const openUnsubs: Record<string, Unsubscribe> = {}; // Changed to a dictionary

    const unsubscribeFromAdapters = () => {
      adapterSubs.forEach((unsub) => unsub());
    };

    const cb = (value: any, path: string, updatedAt: number | undefined) => {
      const latest = latestMap.get(path);
      if (updatedAt !== undefined && latest && latest.updatedAt >= updatedAt) {
        return;
      }

      if (updatedAt !== undefined) {
        latestMap.set(path, { value, updatedAt });
      }

      const childName = path.split('/').pop()!;
      this.get(childName).put(value, updatedAt);

      if (recursion > 0 && value === DIR_VALUE) {
        if (!openUnsubs[childName]) {
          // Check if an Unsubscribe exists for this child
          openUnsubs[childName] = this.get(childName).open(callback, recursion - 1);
        }
      } else {
        callback(value, path, updatedAt, () => {
          this.map_subscriptions.delete(id);
          unsubscribeFromAdapters();
          Object.values(openUnsubs).forEach((unsub) => unsub()); // Unsubscribe all
        });
      }
    };

    adapterSubs = this.adapters.map((adapter) => adapter.list(this.id, cb));

    const unsubscribe = () => {
      this.map_subscriptions.delete(id);
      unsubscribeFromAdapters();
      Object.values(openUnsubs).forEach((unsub) => unsub()); // Unsubscribe all
    };

    return unsubscribe;
  }

  /**
   * Same as on(), but will unsubscribe after the first callback
   * @param callback
   * @param unsubscribe
   */
  once(callback?: Callback, returnIfUndefined = false, unsubscribe?: Unsubscribe): Promise<any> {
    return new Promise((resolve) => {
      const cb = (value, updatedAt, path, unsub) => {
        if (unsubscribe) {
          unsubscribe();
        }
        resolve(value);
        callback?.(value, updatedAt, path, () => {});
        unsub();
      };
      this.on(cb, returnIfUndefined);
    });
  }
}
