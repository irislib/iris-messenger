import localforage from './lib/localforage.min';

type FunEventListener = {
  off: Function;
};

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
        const new_node = new Node(`${this.id}/${key}`);
        this.children.set(key, new_node);
        return new_node;
    }

    put(value: any): void {
        if (typeof value === 'object') {
            for (const key in value) {
                this.get(key).put(value[key]);
            }
        } else {
            this.value = value;
        }
        for (const [id, callback] of this.on_subscriptions) {
            const event = { off: () => this.on_subscriptions.delete(id) };
            callback(value, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
        }
        if (this.parent) {
            for (const [id, callback] of this.map_subscriptions) {
                const event = { off: () => this.map_subscriptions.delete(id) };
                callback(value, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            }
        }
        localforage.setItem(this.id, value);
    }

    on(callback: Function): void {
        const id = this.counter++;
        this.on_subscriptions.set(id, callback);
        this.once(callback, { off: () => this.on_subscriptions.delete(id) }, false);
    }

    async once(callback?: Function | null, event?: FunEventListener, returnIfNull = true): Promise<any> {
        let result;
        if (this.children.size) {
            result = {};
            await Promise.all(Array.from(this.children.keys()).map(async key => {
                result[key] = await this.get(key).once(callback, event);
            }));
        } else if (!this.value) {
            // note, getItem returns null if not found
            result = await localforage.getItem(this.id);
            this.value = result;
        } else {
            result = this.value;
        }
        if (result !== null || returnIfNull) {
            callback && callback(result, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
            return result;
        }
    }

    async map(callback: Function): Promise<any> {
        const id = this.counter++;
        const event = { off: () => this.map_subscriptions.delete(id) };
        this.map_subscriptions.set(this.counter++, callback);
        this.children.forEach(child => child.once(callback, event, true));
    }
}