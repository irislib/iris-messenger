import {Actor, ActorContext} from '../Actor';
import {Message} from '../Message';
import Worker from './Websocket.worker.js';

export default class Websocket extends Actor {
    worker: Worker;
    wsUrl: string;

    constructor(wsUrl: string) {
        super();
        this.wsUrl = wsUrl;
        console.log('constructing worker');
    }

    start(context: ActorContext) {
        this.worker = new Worker();
        this.worker.postMessage({url: this.wsUrl});
        console.log('starting worker');
        this.worker.onmessage = (e) => {
            console.log('got message from worker', e);
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
        console.log('sending msg to websocket worker', message);
        this.worker.postMessage({message, fromUuid});
    }
}