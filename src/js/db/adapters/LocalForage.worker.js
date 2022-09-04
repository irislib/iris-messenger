import localForage from '../../lib/localforage.min';
import { Message, Put, Get } from '../Message'
import { Actor } from '../Actor';
import _ from "lodash";

console.log('worker loaded');

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
const notInLocalForage = new Set();

localForage.config({
    driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL]
});

// get context as message, respond with actor channel name
onmessage = (context) => {
    console.log('worker got context, starting')
    const actor = new LocalForage(context);
    postMessage(actor.channel.name);
}

class LocalForage extends Actor {
    handle(message) {
        if (message instanceof Put) {
            this.handlePut(message);
        } else if (message instanceof Get) {
            this.handleGet(message);
        } else {
            console.log('worker got unknown message', message);
        }
    }

    handleGet(message) {
        if (notInLocalForage.has(message.nodeId)) {
            console.log('have not', message);
            // TODO message implying that the key is not in localforage
            return;
        }
        localForage.getItem(message.nodeId).then((value) => {
            if (value === null) {
                console.log('have not', message);
                notInLocalForage.add(message.nodeId);
                // TODO message implying that the key is not in localforage
            } else {
                const putMessage = Put.newFromKv(message.nodeId, value, this.channel.name);
                putMessage.inResponseTo = message.id;
                console.log('have', message);
                console.log('respond with', putMessage);
                new BroadcastChannel(message.from || this.context.router).postMessage(putMessage);
            }
        });
    }

    handlePut(message) {
        Object.keys(message.updatedNodes).forEach(nodeName => {
            const children = message.updatedNodes[nodeName];
            Object.keys(children).forEach(childName => {
                const path = `${nodeName}/${childName}`;
                notInLocalForage.delete(path);
                const value = children[childName];
                if (value === null) {
                    localForage.removeItem(path);
                } else {
                    localForage.setItem(path, value);
                }
            });
        });
    }




    ///aaaaa
    _saveLocalForage = _.throttle(async () => {
        if (!this.loaded) {
            await this.loadLocalForage();
        }
        if (this.children.size) {
            const children = Array.from(this.children.keys());
            localForage.setItem(this.id, children);
        } else if (this.value === undefined) {
            localForage.removeItem(this.id);
        } else {
            localForage.setItem(this.id, this.value === null ? LOCALFORAGE_NULL : this.value);
        }
    }, 500);

        // TODO: indexedDB has poor performance when there's lots of queries.
    //  we should perhaps store child values with the parent node in order to reduce queries
    _loadLocalForage = _.throttle(async () => {
        if (notInLocalForage.has(this.id)) {
            return undefined;
        }
        // try to get the value from localforage
        let result = await localForage.getItem(this.id);
        // getItem returns null if not found
        if (result === null) {
            result = undefined;
            notInLocalForage.add(this.id);
        } else if (result === LOCALFORAGE_NULL) {
            result = null;
        } else if (Array.isArray(result)) {
            // result is a list of children
            const newResult = {};
            await Promise.all(result.map(async key => {
                newResult[key] = await this.get(key).once();
            }));
            result = newResult;
        } else {
            // result is a value
            this.value = result;
        }
        this.loaded = true;
        return result;
    }, 500);
}