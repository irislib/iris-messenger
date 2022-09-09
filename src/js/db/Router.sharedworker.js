import {Actor, MySharedWorker} from "./Actor";
import { Put, Get } from "./Message";

/*
class SeenGetMessage {
    constructor(id, from, lastReplyChecksum) {
        this.id = id;
        this.from = from;
        this.lastReplyChecksum = lastReplyChecksum;
    }
}
*/

let actor;

// get context as message, respond with actor channel name
onconnect = (event) => {
    const port = event.ports[0];
    port.onmessage = (msg) => {
        const data = msg.data;
        console.log('router got msg ', data);
        if (data.context) {
            console.log('msg.context ', data.context);
            actor = new Router(data.context);
            port.postMessage(actor.channel.name);
        } else if (data.message && data.message.adapters) {
            console.log('got adapters', data.message);
            actor.addAdapters(data.message.adapters);
        }
    }
}

export default class Router extends Actor {
    storageAdapters = new Set();
    networkAdapters = new Set();
    serverPeers = new Set();
    seenMessages = new Set();
    seenGetMessages = new Map();
    subscribersByTopic = new Map();
    msgCounter = 0;

    addAdapters(adapters) {
        console.log('adding adapters', adapters);
        if (adapters.storage) {
            this.storageAdapters.add(new BroadcastChannel(adapters.storage));
        }
        if (adapters.network) {
            this.networkAdapters.add(new BroadcastChannel(adapters.network));
        }
    }

    handle(message) {
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
        Object.keys(put.updatedNodes).forEach(topic => {
            const subscribers = this.subscribersByTopic.get(topic);
            // send to storage adapters
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