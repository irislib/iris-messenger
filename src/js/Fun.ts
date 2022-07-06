import localForage from './lib/localforage.min';
import _ from 'lodash';

type FunEventListener = {
  off: Function;
};

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
const notInLocalForage = new Set();

const debug = false;
function log(...args: any[]) {
  debug && console.log(...args);
}

export default class Node {
    id: string;
    parent?: Node;
    children = new Map<string, Node>();
    on_subscriptions = new Map<number, Function>();
    map_subscriptions = new Map<number, Function>();
    value = undefined;
    counter = 0;
    loaded = false;

    constructor(id = '', parent?: Node) {
        this.id = id;
        this.parent = parent;
    }

    private saveLocalForage = _.throttle(async () => {
        if (!this.loaded) {
            await this.loadLocalForage();
        }
        if (this.children.size) {
            const children = Array.from(this.children.keys());
            localForage.setItem(this.id, children);
        } else if (this.value === undefined) {
            localForage.remove(this.id);
        } else {
            localForage.setItem(this.id, this.value === null ? LOCALFORAGE_NULL : this.value);
        }
    }, 500);

    private async loadLocalForage() {
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
    }

    get(key: string): Node {
        const existing = this.children.get(key);
        if (existing) {
            return existing;
        }
        const new_node = new Node(`${this.id}/${key}`, this);
        this.children.set(key, new_node);
        this.saveLocalForage();
        return new_node;
    }

    private doCallbacks = _.throttle(() => {
        for (const [id, callback] of this.on_subscriptions) {
            log('on sub', this.id, this.value);
            const event = { off: () => this.on_subscriptions.delete(id) };
            this.once(callback, event, false);
        }
        if (this.parent) {
            for (const [id, callback] of this.parent.on_subscriptions) {
                log('on sub', this.id, this.value);
                const event = { off: () => this.parent.on_subscriptions.delete(id) };
                this.parent.once(callback, event, false);
            }
            for (const [id, callback] of this.parent.map_subscriptions) {
                log('map sub', this.id, this.value);
                const event = { off: () => this.parent.map_subscriptions.delete(id) };
                this.once(callback, event, false);
            }
        }
    }, 40);

    put(value: any): void {
        if (Array.isArray(value)) {
            throw new Error('Sorry, we don\'t deal with arrays');
        }
        if (typeof value === 'object' && value !== null) {
            this.value = undefined;
            for (const key in value) {
                this.get(key).put(value[key]);
            }
            return;
        }
        this.value = value;
        this.doCallbacks();
        this.saveLocalForage();
    }

    // protip: the code would be a lot cleaner if you separated the Node API from storage adapters.
    async once(callback?: Function | null, event?: FunEventListener, returnIfUndefined = true): Promise<any> {
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
            log('once', this.id, result);
            callback && callback(result, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            return result;
        }
    }

    on(callback: Function): void {
        log('on', this.id);
        const id = this.counter++;
        this.on_subscriptions.set(id, callback);
        const event = { off: () => this.map_subscriptions.delete(id) };
        this.once(callback, event, false);
    }

    async map(callback: Function): Promise<any> {
        log('map', this.id);
        const id = this.counter++;
        this.map_subscriptions.set(this.counter++, callback);
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