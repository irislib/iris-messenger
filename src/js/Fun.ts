import localforage from './lib/localforage.min';

type FunEventListener = {
  off: Function;
};

// Localforage returns null if an item is not found, so we use this uuid instead.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";

export default class Node {
    id: string;
    parent?: Node;
    children = new Map<string, Node>();
    on_subscriptions = new Map<number, Function>();
    map_subscriptions = new Map<number, Function>();
    value: any;
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
        console.log('put', this.id, value);
        if (typeof value === 'object' && value !== null && !(value instanceof Array)) {
            for (const key in value) {
                this.get(key).put(value[key]);
            }
            return;
        } else {
            this.value = value;
        }
        for (const [id, callback] of this.on_subscriptions) {
            console.log('on sub', this.id, value);
            const event = { off: () => this.on_subscriptions.delete(id) };
            callback(value, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
        }
        if (this.parent) {
            for (const [id, callback] of this.map_subscriptions) {
                console.log('map sub', this.id, value);
                const event = { off: () => this.map_subscriptions.delete(id) };
                callback(value, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            }
        }
        localforage.setItem(this.id, value === null ? LOCALFORAGE_NULL : value);
    }

    on(callback: Function): void {
        console.log('on', this.id);
        const id = this.counter++;
        const myCallback = (...args: any[]) => {
            console.log('on callback', this.id, ...args);
            callback(...args);
        }
        this.on_subscriptions.set(id, myCallback);
        this.once(myCallback, { off: () => this.on_subscriptions.delete(id) }, false);
    }

    async once(callback?: Function | null, event?: FunEventListener, returnIfUndefined = true): Promise<any> {
        let result;
        if (this.children.size) {
            result = {};
            await Promise.all(Array.from(this.children.keys()).map(async key => {
                result[key] = await this.get(key).once(callback, event);
            }));
        } else if (!this.value) {
            result = await localforage.getItem(this.id);
            // getItem returns null if not found
            if (result === null) {
                result = undefined;
            } else if (result === LOCALFORAGE_NULL) {
                result = null;
            }
            this.value = result;
        } else {
            result = this.value;
        }
        if (result !== undefined || returnIfUndefined) {
            console.log('once', this.id, result);
            callback && callback(result, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            return result;
        }
    }

    async map(callback: Function): Promise<any> {
        console.log('map', this.id);
        const id = this.counter++;
        const event = { off: () => this.map_subscriptions.delete(id) };
        const myCallback = (...args: any[]) => {
            console.log('map callback', this.id, ...args);
            callback(...args);
        }
        this.map_subscriptions.set(this.counter++, myCallback);
        for (const child of this.children.values()) {
            child.once(myCallback, event, false);
        }
    }
}