import _ from 'lodash';
import {Actor}  from './Actor';
import {Get, Message, Put} from './Message';
import Router from './Router.sharedworker.js';
import IndexedDBWorker from "./adapters/IndexedDB.sharedworker.js";
import * as Comlink from "comlink";

type FunEventListener = {
    off: Function;
};

export type Config = {
    peerId?: string;
    allowPublicSpace: boolean;
    myPublicKey?: string;
    enableStats: boolean;
    webSocketPeers?: string[];
    localOnly: boolean;
}

export const DEFAULT_CONFIG: Config = {
    allowPublicSpace: false,
    enableStats: true,
    localOnly: true
}

const debug = false;

function log(...args: any[]) {
    debug && console.log(...args);
}

export default class Node extends Actor {
    id: string;
    parent?: Node;
    children = new Map<string, Node>();
    once_subscriptions = new Map<number, Function>();
    on_subscriptions = new Map<number, Function>();
    map_subscriptions = new Map<number, Function>();
    value = undefined;
    counter = 0;
    loaded = false;
    config: Config;
    router = new BroadcastChannel('router');

    constructor(id = '', config?: Config, parent?: Node) {
        super();
        this.id = id;
        this.parent = parent;
        this.config = config || (parent && parent.config) || DEFAULT_CONFIG;
        if (!parent) {
            const routerWorker = new Router();
            const idbWorker = new IndexedDBWorker();
            //const router = Comlink.wrap(routerWorker);
        }
    }

    handle(message: Message): void {
        if (message instanceof Put) {
            for (const [key, value] of Object.entries(message.updatedNodes)) {
                if (key === this.id) {
                    if (Array.isArray(value)) {
                        value.forEach(childKey => this.get(childKey));
                    } else {
                        this.value = value;
                    }
                    if (this.value && this.value.indexOf && this.value.indexOf('asdf') !== -1) {
                        console.log('asdf', this.id, this.value);
                        this.doCallbacks(true);
                    }
                    this.parent.handle(message);
                    for (const child of this.children.values()) {
                        child.handle(message);
                    }
                }
            }
            setTimeout(() => this.doCallbacks(), 100);
        }
    };

    get(key: string): Node {
        const existing = this.children.get(key);
        if (existing) {
            return existing;
        }
        const newNode = new Node(`${this.id}/${key}`, this.config, this);
        this.children.set(key, newNode);
        return newNode;
    }

    doCallbacks = _.throttle((log = false) => {
        log && console.log('doCallbacks', this.id, this.value, this.on_subscriptions.size, this.map_subscriptions.size);
        log && console.log('this.parent.on_subscriptions.size', this.parent && this.parent.on_subscriptions.size);
        log && console.log('this.parent.map_subscriptions.size', this.parent && this.parent.map_subscriptions.size);
        for (const [id, callback] of this.on_subscriptions) {
            log && console.log('on sub', this.id, this.value);
            const event = { off: () => this.on_subscriptions.delete(id) };
            this.once(callback, event, false);
        }
        for (const [id, callback] of this.once_subscriptions) {
            log && console.log('once sub', this.id, this.value);
            this.once(callback, undefined, false);
            this.once_subscriptions.delete(id);
        }
        if (this.parent) {
            for (const [id, callback] of this.parent.on_subscriptions) {
                log && console.log('on sub', this.id, this.value);
                const event = { off: () => this.parent.on_subscriptions.delete(id) };
                this.parent.once(callback, event, false);
            }
            for (const [id, callback] of this.parent.map_subscriptions) {
                log && console.log('map sub', this.id, this.value);
                const event = { off: () => this.parent.map_subscriptions.delete(id) };
                this.once(callback, event, false);
            }
        }
    }, 40);

    put(value: any): void {
        if (this.value === value) {
            return; // TODO: when timestamps are added, this should be changed
        }
        if (Array.isArray(value)) {
            throw new Error('put() does not support arrays');
        }
        if (typeof value === 'object' && value !== null) {
            this.value = undefined;
            // TODO: update the whole path of parent nodes
            for (const key in value) {
                this.get(key).put(value[key]);
            }
            return;
        }
        this.children = new Map();
        this.value = value;
        this.doCallbacks();
        const updatedNodes = {};
        this.addParentNodes(updatedNodes);
        this.router.postMessage(Put.new(updatedNodes, this.channel.name));
    }

    private addParentNodes(updatedNodes: object) {
        if (this.parent) {
            this.parent.value = undefined;
            const children = {};
            for (const [key, child] of this.parent.children) {
                if (child.children.size > 0) {
                    children[key] = Array.from(child.children.keys());
                } else if (child.value !== undefined) {
                    children[key] = child.value;
                }
            }
            updatedNodes[this.parent.id] = children;
            this.parent.addParentNodes(updatedNodes);
        }
    }

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
            this.router.postMessage(Get.new(this.id, this.channel.name));
            const id = this.counter++;
            callback && this.once_subscriptions.set(this.counter++, callback);
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
        const event = { off: () => this.on_subscriptions.delete(id) };
        this.once(callback, event, false);
    }

    map(callback: Function): void {
        log('map', this.id);
        const id = this.counter++;
        this.map_subscriptions.set(id, callback);
        const event = { off: () => this.map_subscriptions.delete(id) };
        for (const child of this.children.values()) {
            child.once(callback, event, false);
        }
    }
}