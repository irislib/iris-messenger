import {Actor} from "./Actor";
import { Put, Get } from "./Message";
// import * as Comlink from "comlink";

/*
class SeenGetMessage {
    constructor(id, from, lastReplyChecksum) {
        this.id = id;
        this.from = from;
        this.lastReplyChecksum = lastReplyChecksum;
    }
}
*/

class Router extends Actor {
    storageAdapters = new Set();
    networkAdapters = new Set();
    serverPeers = new Set();
    seenMessages = new Set();
    seenGetMessages = new Map();
    subscribersByTopic = new Map();
    msgCounter = 0;

    constructor() {
        super('router');
        this.storageAdapters.add(new BroadcastChannel('indexeddb'));
    }

    handle(message) {
        // console.log('router received', message);
        if (this.seenMessages.has(message.id)) {
            return;
        }
        this.seenMessages.add(message.id);
        if (message instanceof Put) {
            this.handlePut(message);
        } else if (message instanceof Get) {
            this.handleGet(message);
        }
    }

    handlePut(put) {
        Object.keys(put.updatedNodes).forEach(path => {
            const topic = path.split('/')[1] || '';
            const subscribers = this.subscribersByTopic.get(topic);
            // send to storage adapters
            console.log('put subscribers', subscribers);
            for (const storageAdapter of this.storageAdapters) {
                storageAdapter.postMessage(put);
            }

            if (subscribers) {
                for (const [k, v] of subscribers) {
                    if (k !== put.from) {
                        v.postMessage(put);
                    }
                }
            }
        });
    }

    handleGet(get) {
        const topic = get.nodeId.split('/')[1];
        for (const storageAdapter of this.storageAdapters) {
            storageAdapter.postMessage(get);
        }
        if (!this.subscribersByTopic.has(topic)) {
            this.subscribersByTopic.set(topic, new Map());
        }
        const subscribers = this.subscribersByTopic.get(topic);
        for (const [k, v] of subscribers) { // TODO: sample
            if (k !== get.from) {
                v.postMessage(get);
            }
        }
        if (!subscribers.has(get.from)) {
            subscribers.set(get.from, new BroadcastChannel(get.from));
        }
    }
}

let actor;
onconnect = () => {
    actor = actor || new Router();
}

// self.onconnect = (e) => Comlink.expose(actor, e.ports[0]);