import localForage from '../../lib/localforage.min';
import { Put } from '../Message'
import { Actor } from '../Actor';

console.log('hi from worker');

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
const notInLocalForage = new Set();

localForage.config({
    driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL]
});

// get context as message, respond with actor channel name
onmessage = (context) => {
    const actor = new LocalForage();
    actor.start(context);
    postMessage(actor.channel.name);
}

class LocalForage extends Actor {
    handleGet(message) {
        if (notInLocalForage.has(message.nodeId)) {
            // TODO message implying that the key is not in localforage
            return;
        }
        localForage.getItem(message.nodeId).then((value) => {
            if (value === null) {
                notInLocalForage.add(message.nodeId);
                // TODO message implying that the key is not in localforage
            } else {
                const putMessage = Put.new('', message.nodeId, value, message.id);
                this.send(putMessage);
            }
        });
    }

    handlePut(message) {
        message.updatedNodes.forEach(nodeName => {
            const nodeId = message.nodeId + '/' + nodeName;
            notInLocalForage.delete(nodeId);
            localForage.setItem(nodeId, message.updatedNodes[nodeName]);
        });
    }
}