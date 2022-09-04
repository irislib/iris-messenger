import {Actor, ActorContext, startWorker} from "./Actor";
import { Message, Put, Get } from "./Message";
import WebsocketWorker from "./adapters/Websocket.worker.js";
import LocalForageWorker from "./adapters/LocalForage.worker.js";

class SeenGetMessage {
    id: string;
    from: string;
    lastReplyChecksum: string;
    constructor(id: string, from: string, lastReplyChecksum: string) {
        this.id = id;
        this.from = from;
        this.lastReplyChecksum = lastReplyChecksum;
    }
}

export default class Router extends Actor {
    storageAdapters = new Set<BroadcastChannel>();
    networkAdapters = new Set<BroadcastChannel>();
    serverPeers = new Set<BroadcastChannel>();
    seenMessages = new Set<string>();
    seenGetMessages = new Map<string, SeenGetMessage>();
    subscribersByTopic = new Map<string, Map<string, BroadcastChannel>>();
    msgCounter = 0;

    async start(context: ActorContext) {
        const localForage = await startWorker(new LocalForageWorker(), context);
        console.log('localForage uuid', localForage);
        this.storageAdapters.add(localForage);
        //const websocket = await startWorker(new WebsocketWorker('wss://gun-us.herokuapp.com/gun'), context);
        //websocket.start(context);
        //this.networkAdapters.add(websocket);
    }

    handle(message: Message): void {
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

    handlePut(put: Put): void {
        Object.keys(put.updatedNodes).forEach(topic => {
            const subscribers = this.subscribersByTopic.get(topic);
            // send to storage adapters
            for (const storageAdapter of this.storageAdapters) {
                console.log('send put to storage adapter', put);
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

    handleGet(get: Get): void {
        const topic = get.nodeId.split('/')[1];
        console.log('handleGet', get);
        for (const storageAdapter of this.storageAdapters) {
            console.log('send get to storage adapter', get);
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