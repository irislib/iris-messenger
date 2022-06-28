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
        this.on_subscriptions.forEach(cb => cb(value));
        if (this.parent) {
            this.parent.map_subscriptions.forEach(cb => cb(value));
        }
        localforage.setItem(this.id, value);
    }

    on(callback: Function): void {
        const id = this.counter++;
        this.on_subscriptions.set(id, callback);
        this.once(callback, { off: () => this.on_subscriptions.delete(id) });
    }

    async once(callback?: Function | null, event?: FunEventListener): Promise<any> {
        if (!this.value) {
            // note, getItem returns null if not found
            this.value = await localforage.getItem(this.id);
        }
        callback && callback(this.value, this.id.slice(this.id.lastIndexOf('/') + 1), {}, event);
        return this.value;
    }

    async map(callback: Function): Promise<any> {
        const id = this.counter++;
        const event = { off: () => this.map_subscriptions.delete(id) };
        this.map_subscriptions.set(this.counter++, callback);
        this.children.forEach(child => child.once(callback, event));
    }
}