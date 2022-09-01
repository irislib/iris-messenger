import localForage from '../../lib/localforage.min';

console.log('hi from worker');

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
const LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
const notInLocalForage = new Set();

localForage.config({
    driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL]
})

onmessage = (e) => {
    const message = e.data;
    if (message.dbName) {
        console.log('localforage got dbName', message.dbName);
    } else {
        console.log('localforage got message', message);
    }
}