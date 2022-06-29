import localforage from './lib/localforage.min';

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

    constructor(id = '', parent?: Node) {
        this.id = id;
        this.parent = parent;
    }

    get(key: string): Node {
        const existing = this.children.get(key);
        if (existing) {
            return existing;
        }
        const new_node = new Node(`${this.id}/${key}`, this);
        this.children.set(key, new_node);
        return new_node;
    }

    put(value: any): void {
        // TODO this logic is wrong. make sure only the correct callbacks are called with correct data.
        if (typeof value === 'object' && value !== null && !(value instanceof Array)) {
            this.value = undefined;
            for (const key in value) {
                this.get(key).put(value[key]);
            }
            return;
        }
        this.value = value;
        setTimeout(() => {
            log('put', this.id, value, 'subs:', this.on_subscriptions.size, this.parent.map_subscriptions.size);
            for (const [id, callback] of this.on_subscriptions) {
                log('on sub', this.id, this.value);
                const event = { off: () => this.on_subscriptions.delete(id) };
                this.once(callback, event, false);
            }
            if (this.parent) {
                for (const [id, callback] of this.parent.map_subscriptions) {
                    log('map sub', this.id, this.value);
                    const event = { off: () => this.parent.map_subscriptions.delete(id) };
                    this.once(callback, event, false);
                }
            }
        }, 0);
        localforage.setItem(this.id, value === null ? LOCALFORAGE_NULL : value);
    }

    async once(callback?: Function | null, event?: FunEventListener, returnIfUndefined = true): Promise<any> {
        let result;
        if (this.children.size) {
            // return an object containing all children
            result = {};
            await Promise.all(Array.from(this.children.keys()).map(async key => {
                result[key] = await this.get(key).once(null, event);
            }));
        } else if (this.value === undefined && !notInLocalForage.has(this.id)) {
            // try to get the value from localforage
            result = await localforage.getItem(this.id);
            // getItem returns null if not found
            if (result === null) {
                result = undefined;
                notInLocalForage.add(this.id);
            } else if (result === LOCALFORAGE_NULL) {
                result = null;
            }
            this.value = result;
        } else {
            // if the value was already memory cached
            result = this.value;
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

    map(callback: Function): void {
        log('map', this.id);
        const id = this.counter++;
        this.map_subscriptions.set(this.counter++, callback);
        const event = { off: () => this.map_subscriptions.delete(id) };
        setTimeout(() => {
            for (const child of this.children.values()) {
                child.once(callback, event, false);
            }
        }, 0);
    }
}