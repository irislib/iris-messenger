import {Actor, startWorker} from "./Actor";
import { Put, Get } from "./Message";
//import WebsocketWorker from "./adapters/Websocket.worker.js";
import LocalForageWorker from "./adapters/LocalForage.worker.js";

/*
class SeenGetMessage {
    constructor(id, from, lastReplyChecksum) {
        this.id = id;
        this.from = from;
        this.lastReplyChecksum = lastReplyChecksum;
    }
}
*/

// get context as message, respond with actor channel name
onmessage = (context) => {
    console.log('worker got context, starting')
    const actor = new Router(context);
    postMessage(actor.channel.name);
}

export default class Router extends Actor {
    storageAdapters = new Set();
    networkAdapters = new Set();
    serverPeers = new Set();
    seenMessages = new Set();
    seenGetMessages = new Map();
    subscribersByTopic = new Map();
    msgCounter = 0;

    async start(context) {
        const localForage = await startWorker(new LocalForageWorker(), context);
        console.log('localForage uuid', localForage);
        this.storageAdapters.add(localForage);
        //const websocket = await startWorker(new WebsocketWorker('wss://gun-us.herokuapp.com/gun'), context);
        //websocket.start(context);
        //this.networkAdapters.add(websocket);
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