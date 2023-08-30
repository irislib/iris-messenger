import LocalForageAdapter from '@/state/LocalForageAdapter.ts';
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
  on_subscriptions = new Map<number, Callback>();
  map_subscriptions = new Map<number, Callback>();
  adapters: Adapter[];
  private counter = 0;

  constructor({ id = '', adapters, parent = null }: NodeProps = {}) {
    this.id = id;
    this.parent = parent;
    this.adapters = adapters ?? parent?.adapters ?? [new MemoryAdapter(), new LocalForageAdapter()];
  }

  isBranchNode() {
    return this.children.size > 0;
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
        console.log('calling map callback of ', this.parent.id, ' with ', this.id, value);
        callback(value, this.id, updatedAt, () => {
          this.parent?.map_subscriptions.delete(id);
        });
      }
    }
  }

  doBranchNodeCallback(callback: Callback) {
    const aggregated: Record<string, any> = {};
    const keys = Array.from(this.children.keys());
    const total = keys.length;
    let count = 0;

    keys.forEach((key) => {
      this.children.get(key)?.once((childValue) => {
        aggregated[key] = childValue;
        count++;

        if (count === total) {
          callback(aggregated, this.id, Date.now(), () => {});
        }
      });
    });
  }

  // note to self: may be problematic that on behaves differently for leaf and branch nodes
  /**
   * Subscribe to a value
   * @param callback
   */
  on(callback: Callback, returnIfUndefined: boolean = false): Unsubscribe {
    let latest: NodeValue | null = null;
    const cb = (value, path, updatedAt, unsubscribe) => {
      if (value === undefined) {
        if (returnIfUndefined) {
          callback(value, path, updatedAt, unsubscribe);
        }
        return;
      }
      if (value !== DIR_VALUE && (latest === null || latest.updatedAt < value.updatedAt)) {
        latest = { value, updatedAt };
        callback(value, path, updatedAt, unsubscribe);
        // TODO send to other adapters? or PubSub which decides where to send?
      }
    };
    const subId = this.counter++;
    this.on_subscriptions.set(subId, cb);

    // if it's not a dir, adapters will call the callback directly
    const adapterSubs = this.adapters.map((adapter) => adapter.get(this.id, cb));

    if (this.isBranchNode()) {
      this.doBranchNodeCallback(callback);
    }

    const unsubscribe = () => {
      this.on_subscriptions.delete(subId);
      adapterSubs.forEach((unsub) => unsub());
    };
    return unsubscribe;
  }

  /**
   * Callback for each child node
   * @param callback
   */
  map(callback: Callback): Unsubscribe {
    const id = this.counter++;
    this.map_subscriptions.set(id, callback);
    const unsubscribe = () => this.map_subscriptions.delete(id);
    for (const child of this.children.values()) {
      child.once(callback, false, unsubscribe);
    }
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
