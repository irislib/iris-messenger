import {Actor, ActorContext} from '../Actor';
import {Message} from '../Message';
import Worker from './LocalForage.worker.js';

export default class LocalForage extends Actor {
    worker: Worker;
    dbName: string;

    constructor(dbName = 'iris') {
        super();
        this.dbName = dbName;
        console.log('constructing worker');
    }

    start(context: ActorContext) {
        this.worker = new Worker();
        this.worker.postMessage({dbName: this.dbName});
        console.log('starting worker');
        this.worker.onmessage = (e) => {
            const message = e.data;
            message.from = this;
            context.router.handle(message, context);
        }
        this.worker.onerror = (e) => {
            console.log('error', e);
        }
    }

    handle(message: Message, _context: ActorContext) {
        const fromUuid = message.from ? message.from.uuid : 'unknown';
        message.from = null;
        this.worker.postMessage({message, fromUuid});
    }
}