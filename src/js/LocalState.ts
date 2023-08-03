import localForage from 'localforage';
import _ from 'lodash';

export type Unsubscribe = () => void;

export type Callback = (data: any, path: string, unsubscribe: Unsubscribe) => void;

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = 'c2fc1ad0-f76f-11ec-b939-0242ac120002';
const notInLocalForage = new Set();

localForage.config({
  driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL],
});

/**
  Our very own implementation of the Gun (https://github.com/amark/gun) API. Used for local state management.
 */
class Node {
  id: string;
  parent: Node | null;
  children = new Map<string, Node>();
  on_subscriptions = new Map();
  map_subscriptions = new Map();
  value: any = undefined;
  counter = 0;
  loaded = false;

  /** */
  constructor(id = '', parent: Node | null = null) {
    this.id = id;
    this.parent = parent;
  }

  saveLocalForage = _.throttle(async () => {
    if (!this.loaded) {
      await this.loadLocalForage();
    }
    if (this.children.size) {
      const children = Array.from(this.children.keys());
      await localForage.setItem(this.id, children);
    } else if (this.value === undefined) {
      await localForage.removeItem(this.id);
    } else {
      await localForage.setItem(this.id, this.value === null ? LOCALFORAGE_NULL : this.value);
    }
  }, 500);

  loadLocalForage = _.throttle(async () => {
    if (notInLocalForage.has(this.id)) {
      return undefined;
    }
    // try to get the value from localforage
    let result = await localForage.getItem(this.id);
    // getItem returns null if not found
    if (result === null) {
      result = undefined;
      notInLocalForage.add(this.id);
    } else if (result === LOCALFORAGE_NULL) {
      result = null;
    } else if (Array.isArray(result)) {
      // result is a list of children
      const newResult = {};
      await Promise.all(
        result.map(async (key) => {
          newResult[key] = await this.get(key).once();
        }),
      );
      result = newResult;
    } else {
      // result is a value
      this.value = result;
    }
    this.loaded = true;
    return result;
  }, 500);

  doCallbacks = _.debounce(
    () => {
      for (const [id, callback] of this.on_subscriptions) {
        const unsubscribe = () => this.on_subscriptions.delete(id);
        this.once(callback, unsubscribe, false);
      }
      if (this.parent) {
        this.parent.doCallbacks();
        for (const [id, callback] of this.parent.map_subscriptions) {
          const unsubscribe = () => this.parent?.map_subscriptions.delete(id);
          this.once(callback, unsubscribe, false);
        }
      }
    },
    20,
    { maxWait: 40 },
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
    const new_node = new Node(`${this.id}/${key}`, this);
    this.children.set(key, new_node);
    this.saveLocalForage();
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
      await Promise.all(_.map(value, (val, key) => this.get(key).put(val)));
    } else {
      this.children = new Map();
      this.value = value;
    }
    this.doCallbacks();
    return this.saveLocalForage();
  }

  // protip: the code would be a lot cleaner if you separated the Node API from storage adapters.
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
    } else {
      result = await this.loadLocalForage();
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
    const id = this.counter++;
    this.on_subscriptions.set(id, callback);
    const unsubscribe = () => this.on_subscriptions.delete(id);
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
    const go = () => {
      for (const child of this.children.values()) {
        child.once(callback, unsubscribe, false);
      }
    };
    if (this.loaded) {
      go();
    } else {
      // ensure that the list of children is loaded
      this.loadLocalForage()?.then(go);
    }
    return unsubscribe;
  }
}

const localState = new Node();

export default localState;
