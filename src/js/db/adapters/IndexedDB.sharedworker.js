import { Put, Get } from '../Message'
import { Actor } from '../Actor';
import _ from "lodash";
import Dexie from 'dexie';

const notStored = new Set();

onconnect = (event) => {
    const port = event.ports[0];
    port.onmessage = (message) => {
        console.log('indexedDB got msg ', message);
        const data = message.data;
        if (data.context) {
            console.log('indexedDB got context', data.context);
            const actor = new IndexedDBSharedWorker(data.context);
            port.postMessage(actor.channel.name);
        }
    }
}

class IndexedDBSharedWorker extends Actor {
    constructor(context) {
        super(context);
        this.putQueue = {};
        this.getQueue = {};
        this.i = 0;
        const dbName = (context.config && context.config.indexeddb && context.config.indexeddb.name) || 'iris';
        this.db = new Dexie(dbName);
        this.db.version(1).stores({
            nodes: ',value'
        });
        this.db.open().catch((err) => {
            console.error(err.stack || err);
        });
    }

    put(nodeId, value) {
        // add puts to a queue and dexie bulk write them once per 500ms
        this.putQueue[nodeId] = value;
        this.throttledPut();
    }

    throttledPut = _.throttle(() => {
        const keys = Object.keys(this.putQueue);
        console.log('putting ', keys.length, 'keys');
        const values = keys.map(key => this.putQueue[key]);
        this.db.nodes.bulkPut(values, keys);
        this.putQueue = {};
    }, 500);

    get(path, callback) {
        this.getQueue[path] = this.getQueue[path] || [];
        this.getQueue[path].push(callback);
        this.throttledGet();
    }

    throttledGet = _.throttle(() => {
        // clone this.getQueue and clear it
        const queue = this.getQueue;
        const keys = Object.keys(queue);
        this.db.nodes.bulkGet(keys).then((values) => {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = values[i];
                const callbacks = queue[key];
                for (const callback of callbacks) {
                    callback(value);
                }
            }
        });
        this.getQueue = {};
    }, 100);

    handle(message) {
        this.queue = (this.queue && this.queue++) || 1;
        if (this.queue > 10) {
            return;
        }
        if (message instanceof Put) {
            this.handlePut(message);
        } else if (message instanceof Get) {
            this.handleGet(message);
        } else {
            console.log('worker got unknown message', message);
        }
    }

    handleGet(message) {
        if (notStored.has(message.nodeId)) {
            console.log('notStored', message.nodeId);
            // TODO message implying that the key is not stored
            return;
        }
        this.get(message.nodeId, (value) => {
            // TODO: this takes a long time to return
            if (value === undefined) {
                console.log('have not', message.nodeId);
                notStored.add(message.nodeId);
                // TODO message implying that the key is not stored
            } else {
                console.log('have', message.nodeId, value);
                const putMessage = Put.newFromKv(message.nodeId, value, this.channel.name);
                putMessage.inResponseTo = message.id;
                console.log('respond with', putMessage);
                new BroadcastChannel(message.from || this.context.router).postMessage(putMessage);
            }
        });
    }

    mergeAndSave(path, newValue) {
        this.get(path, existing => {
            if (existing === undefined) {
                //console.log('saving new', path, newValue);
                this.put(path, newValue);
            } else if (!_.isEqual(existing, newValue)) {
                // if existing value is array, merge it
                //console.log('merging', path, existing, newValue);
                if (Array.isArray(existing) && Array.isArray(newValue)) {
                    newValue = _.uniq(existing.concat(newValue));
                }
                if (Array.isArray(newValue) && newValue.length === 0) {
                    console.log('no kids', path);
                }
                this.put(path, newValue);
            } else {
                //console.log('not updating', path, existing, newValue);
            }
        });
    }

    async handlePut(message) {
        for (const [nodeName, children] of Object.entries(message.updatedNodes)) {
            for (const [childName, newValue] of Object.entries(children)) {
                const path = `${nodeName}/${childName}`;
                if (newValue === undefined) {
                    this.db.nodes.delete(path);
                    notStored.add(path);
                } else {
                    notStored.delete(path);
                    this.mergeAndSave(path, newValue);
                }
            }
        }
    }




    /// old stuff
    _saveLocalForage = _.throttle(async () => {
        if (!this.loaded) {
            await this.loadLocalForage();
        }
        if (this.children.size) {
            const children = Array.from(this.children.keys());
            this.putQueue[this.id] = children;
        } else if (this.value === undefined) {
            this.db.nodes.delete(this.id);
        } else {
            this.putQueue[this.id] = this.value;
        }
    }, 500);

        // TODO: indexedDB has poor performance when there's lots of queries.
    //  we should perhaps store child values with the parent node in order to reduce queries
    _loadLocalForage = _.throttle(async () => {
        if (notStored.has(this.id)) {
            return undefined;
        }
        // try to get the value from localforage
        let result = await this.db.nodes.get(this.id);
        // getItem returns null if not found
        if (result === null) {
            result = undefined;
            notStored.add(this.id);
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