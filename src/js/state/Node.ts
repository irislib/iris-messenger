import debounce from 'lodash/debounce';

import LocalForageAdapter from '@/state/LocalForageAdapter.ts';
import { Adapter, Callback, Unsubscribe } from '@/state/types.ts';

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
  on_subscriptions = new Map();
  map_subscriptions = new Map();
  adapters: Adapter[];
  value: any = undefined;
  counter = 0;

  constructor({ id = '', adapters, parent = null }: NodeProps = {}) {
    this.id = id;
    this.parent = parent;
    this.adapters = adapters ?? parent?.adapters ?? [new LocalForageAdapter()];
  }

  doCallbacks = debounce(
    () => {
      for (const [id, callback] of this.on_subscriptions) {
        const unsubscribe = () => this.on_subscriptions.delete(id);
        this.once(callback, unsubscribe, false);
      }
      if (this.parent) {
        this.parent.doCallbacks(); // maybe this shouldn't be recursive after all? in a file tree analogy, you wouldn't want
        // a change in a subdirectory to trigger a callback in all parent directories.
        // there could be a separate open() fn for recursive subscriptions.
        for (const [id, callback] of this.parent.map_subscriptions) {
          const unsubscribe = () => this.parent?.map_subscriptions.delete(id);
          this.once(callback, unsubscribe, false);
        }
      }
    },
    20,
    { maxWait: 40, leading: true },
  );

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
  async put(value) {
    // console.log('put', this.id, value);
    if (Array.isArray(value)) {
      throw new Error("Sorry, we don't deal with arrays");
    }
    if (typeof value === 'object' && value !== null) {
      this.value = undefined;
      await Promise.all(Object.entries(value).map(([key, val]) => this.get(key).put(val)));
    } else {
      this.children = new Map();
      this.value = value;
    }
    this.doCallbacks();
    this.adapters.forEach((adapter) => adapter.set(this.id, this.value));
  }

  /**
   * Return a value without subscribing to it
   * @param callback
   * @param event
   * @param returnIfUndefined
   * @returns {Promise<*>}
   */
  async once(
    callback?: Callback,
    unsubscribe?: Unsubscribe,
    returnIfUndefined = true,
  ): Promise<any> {
    let result: any;
    if (this.children.size) {
      // return an object containing all children
      result = {};
      await Promise.all(
        Array.from(this.children.keys()).map(async (key) => {
          result[key] = await this.get(key).once(undefined, unsubscribe);
        }),
      );
    } else if (this.value !== undefined) {
      result = this.value;
    }

    if (result !== undefined || returnIfUndefined) {
      callback &&
        callback(
          result,
          this.id.slice(this.id.lastIndexOf('/') + 1),
          unsubscribe ||
            (() => {
              /* do nothing */
            }),
        );
      return result;
    }
  }

  /**
   * Subscribe to a value
   * @param callback
   */
  on(callback: Callback): Unsubscribe {
    const subId = this.counter++;
    this.on_subscriptions.set(subId, callback);
    const adapterSubs = this.adapters.map((adapter) => adapter.get(this.id, callback));
    const unsubscribe = () => {
      this.on_subscriptions.delete(subId);
      adapterSubs.forEach((unsub) => unsub());
    };
    this.once(callback, unsubscribe, false);
    return unsubscribe;
  }

  /**
   * Subscribe to the children of a node. Callback is called separately for each child.
   * @param callback
   * @returns {Promise<void>}
   */
  map(callback: Callback): Unsubscribe {
    const id = this.counter++;
    this.map_subscriptions.set(id, callback);
    const unsubscribe = () => this.map_subscriptions.delete(id);
    for (const child of this.children.values()) {
      child.once(callback, unsubscribe, false);
    }
    return unsubscribe;
  }
}
