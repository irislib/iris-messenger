import _ from 'lodash';
import {Actor, ActorContext}  from './Actor';
import {Get, Message, Put} from './Message';
import Router from './Router';

type FunEventListener = {
    off: Function;
};

export type Config = {
    peerId?: string;
    allowPublicSpace: boolean;
    myPublicKey?: string;
    enableStats: boolean;
    webSocketPeers?: string[];
}

export const DEFAULT_CONFIG: Config = {
    allowPublicSpace: false,
    enableStats: true
}

const debug = true;

function log(...args: any[]) {
    debug && console.log(...args);
}

export default class Node extends Actor {
    id: string;
    parent?: Node;
    children = new Map<string, Node>();
    on_subscriptions = new Map<number, Function>();
    map_subscriptions = new Map<number, Function>();
    value = undefined;
    counter = 0;
    loaded = false;
    actorContext: ActorContext;
    router: Router;
    routerStarted: Promise<void>;
    routerChannel: BroadcastChannel;
    config: Config;

    constructor(id = '', config?: Config, parent?: Node) {
        super();
        this.id = id;
        this.parent = parent;
        this.config = config || (parent && parent.config) || DEFAULT_CONFIG;
        if (parent && parent.actorContext) {
            this.actorContext = parent.actorContext;
            this.router = parent.router;
            this.routerChannel = parent.routerChannel;
            this.routerStarted = parent.routerStarted;
        } else {
            this.router = new Router();
            this.routerChannel = new BroadcastChannel(this.router.channel.name);
            this.actorContext = new ActorContext(config, this.router.channel.name);
            this.routerStarted = this.router.start(this.actorContext);
        }
    }

    handle(message: Message): void {
        if (message instanceof Put) {
            for (const [key, value] of Object.entries(message.updatedNodes)) {
                console.log('node', this.id,'got put response', key, value);
                if (key === this.id) {
                    console.log('yess');
                    this.put(value);
                }
            }
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
        this.children = new Map();
        this.value = value;
        this.doCallbacks();
        const split = this.id.split('/');
        const key = split[split.length - 1];
        const path = split.slice(0, split.length - 1).join('/');
        this.sendToRouter(Put.newFromKv(path, { [key]: value }, this.channel.name));
    }

    private sendToRouter(message: Message): void {
        this.routerStarted.then(() => {
            this.router.handle(message);
        });
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
            this.sendToRouter(Get.new(this.channel.name, this.id));
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
        for (const child of this.children.values()) {
            child.once(callback, event, false);
        }
    }
}