import localForage from 'localforage';
import _ from 'lodash';

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
const notInLocalForage = new Set();

localForage.config({
    driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL]
})

/**
  Our very own implementation of the Gun API. Used for iris.local() only. Memory and local storage only.
 */
export default class Node {
    /** */
    constructor(id = '', parent) {
        this.id = id;
        this.parent = parent;
        this.children = new Map();
        this.on_subscriptions = new Map();
        this.map_subscriptions = new Map();
        this.value = undefined;
        this.counter = 0;
        this.loaded = false;

        this.saveLocalForage = _.throttle(async () => {
            if (!this.loaded) {
                await this.loadLocalForage();
            }
            if (this.children.size) {
                const children = Array.from(this.children.keys());
                localForage.setItem(this.id, children);
            } else if (this.value === undefined) {
                localForage.removeItem(this.id);
            } else {
                localForage.setItem(this.id, this.value === null ? LOCALFORAGE_NULL : this.value);
            }
        }, 500);

        this.loadLocalForage = _.throttle(async () => {
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
                await Promise.all(result.map(async key => {
                    newResult[key] = await this.get(key).once();
                }));
                result = newResult;
            } else {
                // result is a value
                this.value = result;
            }
            this.loaded = true;
            return result;
        }, 500);

        this.doCallbacks = _.throttle(() => {
            for (const [id, callback] of this.on_subscriptions) {
                const event = { off: () => this.on_subscriptions.delete(id) };
                this.once(callback, event, false);
            }
            if (this.parent) {
                for (const [id, callback] of this.parent.on_subscriptions) {
                    const event = { off: () => this.parent.on_subscriptions.delete(id) };
                    this.parent.once(callback, event, false);
                }
                for (const [id, callback] of this.parent.map_subscriptions) {
                    const event = { off: () => this.parent.map_subscriptions.delete(id) };
                    this.once(callback, event, false);
                }
            }
        }, 40);
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
    put(value) {
        if (Array.isArray(value)) {
            throw new Error('Sorry, we don\'t deal with arrays');
        }
        if (typeof value === 'object' && value !== null) {
            this.value = undefined;
            for (const key in value) {
                this.get(key).put(value[key]);
            }
            _.defer(() => this.doCallbacks(), 100);
            return;
        }
        this.children = new Map();
        this.value = value;
        this.doCallbacks();
        this.saveLocalForage();
    }

    // protip: the code would be a lot cleaner if you separated the Node API from storage adapters.
    /**
     * Return a value without subscribing to it
     * @param callback
     * @param event
     * @param returnIfUndefined
     * @returns {Promise<*>}
     */
    async once(callback, event, returnIfUndefined = true) {
        let result;
        if (this.children.size) {
            // return an object containing all children
            result = {};
            await Promise.all(Array.from(this.children.keys()).map(async key => {
                result[key] = await this.get(key).once(null, event);
            }));
        } else if (this.value !== undefined) {
            result = this.value;
        } else {
            result = await this.loadLocalForage();
        }
        if (result !== undefined || returnIfUndefined) {
            callback && callback(result, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            return result;
        }
    }

    /**
     * Subscribe to a value
     * @param callback
     */
    on(callback) {
        const id = this.counter++;
        this.on_subscriptions.set(id, callback);
        const event = { off: () => this.on_subscriptions.delete(id) };
        this.once(callback, event, false);
    }

    /**
     * Subscribe to the children of a node. Callback is called separately for each child.
     * @param callback
     * @returns {Promise<void>}
     */
    async map(callback) {
        const id = this.counter++;
        this.map_subscriptions.set(id, callback);
        const event = { off: () => this.map_subscriptions.delete(id) };
        if (!this.loaded) {
            // ensure that the list of children is loaded
            await this.loadLocalForage();
        }
        for (const child of this.children.values()) {
            child.once(callback, event, false);
        }
    }
}