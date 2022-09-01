import {Actor, ActorContext} from "./Actor";
import { Message, Put, Get } from "./Message";
import WebsocketAdapter from "./adapters/Websocket";
import LocalForageAdapter from "./adapters/LocalForage";

export default class Router extends Actor {
    knownPeers = new Set<Actor>();
    storageAdapters = new Set<Actor>();
    networkAdapters = new Set<Actor>();
    serverPeers = new Set<Actor>();
    seenMessages = new Set<string>();
    getMessageSenders = new Map<string, Set<Actor>>();
    subscribersByTopic = new Map<string, Set<Actor>>();
    msgCounter = 0;

    start(context: ActorContext): void {
        const localForage = new LocalForageAdapter()
        localForage.start(context);
        this.storageAdapters.add(localForage);
        this.networkAdapters.add(new WebsocketAdapter('wss://gun-us.herokuapp.com/gun'));
    }

    handle(message: Message, context: ActorContext): void {
        if (this.seenMessages.has(message.id)) {
            return;
        }
        this.seenMessages.add(message.id);
        if (message instanceof Put) {
            this.handlePut(message, context);
        } else if (message instanceof Get) {
            this.handleGet(message, context);
        }
    }

    handlePut(put: Put, context: ActorContext): void {
        Object.keys(put.updatedNodes).forEach(topic => {
            const subscribers = this.subscribersByTopic.get(topic);
            // send to storage adapters
            for (const storageAdapter of this.storageAdapters) {
                storageAdapter.handle(put, context);
            }

            if (subscribers) {
                subscribers.forEach(subscriber => {
                    if (subscriber !== put.from) {
                        subscriber.handle(put, context);
                    }
                });
            }
        });
    }

    handleGet(get: Get, context: ActorContext): void {
        console.log('handleGet', get);
        const topic = get.nodeId.split('/')[1];
        for (const storageAdapter of this.storageAdapters) {
            storageAdapter.handle(get, context);
        }
        const subscribers = this.subscribersByTopic.get(topic);
        if (subscribers) {
            for (const subscriber of subscribers) {
                if (subscriber !== get.from) {
                    subscriber.handle(get, context);
                }
            }
        }
        if (!this.subscribersByTopic.has(topic)) {
            this.subscribersByTopic.set(topic, new Set());
        }
        this.subscribersByTopic.get(topic).add(get.from);
    }
}