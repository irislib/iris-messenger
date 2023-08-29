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

export default class Node {
  id: string;
  parent: Node | null;
  children = new Map<string, Node>();
  on_subscriptions = new Map<number, Callback>();
  map_subscriptions = new Map<number, Callback>();
  adapters: Adapter[];
  counter = 0;

  constructor({ id = '', adapters, parent = null }: NodeProps = {}) {
    this.id = id;
    this.parent = parent;
    this.adapters = adapters ?? parent?.adapters ?? [new MemoryAdapter(), new LocalForageAdapter()];
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

  /**
   * Set a value to the node. If the value is an object, it will be converted to child nodes.
   * @param value
   * @example node.get('users').get('alice').put({name: 'Alice'})
   */
  async put(value, updatedAt = Date.now()) {
    if (typeof value === 'object' && value !== null) {
      this.adapters.forEach((adapter) => adapter.set(this.id, { value: '__DIR__', updatedAt }));
      const children = Object.keys(value);
      children.map((key) => this.get(key).put(value[key], updatedAt));
    } else {
      this.children = new Map();
      const nodeValue: NodeValue = {
        updatedAt,
        value,
      };
      this.adapters.forEach((adapter) => adapter.set(this.id, nodeValue));
      this.on_subscriptions.forEach((callback) => {
        callback(value, this.id, updatedAt, () => {});
      });
    }
  }

  /**
   * Subscribe to a value
   * @param callback
   */
  on(callback: Callback): Unsubscribe {
    let latest: NodeValue | null = null;
    // TODO handle case where it's a branch node
    const cb = (value, path, updatedAt, unsubscribe) => {
      if (latest === null || latest.updatedAt < value.updatedAt) {
        latest = { value, updatedAt };
        callback(value, path, updatedAt, unsubscribe);
      }
    };
    const subId = this.counter++;
    this.on_subscriptions.set(subId, cb);
    const adapterSubs = this.adapters.map((adapter) => adapter.get(this.id, cb));
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
      child.once(callback, unsubscribe);
    }
    return unsubscribe;
  }

  /**
   * Same as on(), but will unsubscribe after the first callback
   * @param callback
   * @param unsubscribe
   */
  once(callback?: Callback, unsubscribe?: Unsubscribe): Promise<any> {
    return new Promise((resolve) => {
      const cb = (value, updatedAt, path, unsub) => {
        if (unsubscribe) {
          unsubscribe();
        }
        resolve(value);
        callback?.(value, updatedAt, path, unsub);
        unsub();
      };
      this.on(cb);
    });
  }
}
