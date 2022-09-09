import {Message} from './Message';
import { Config } from './Node';

export function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export class ActorContext {
    router?: string;
    config: Config;
    constructor(config: Config, router?: string) {
        this.router = router;
        this.config = config;
    }
}

export function startWorker(worker: Worker, context: ActorContext): Promise<BroadcastChannel> {
    const p = new Promise<BroadcastChannel>((resolve, _reject) => {
        worker.onmessage = (e) => {
            resolve(new BroadcastChannel(e.data));
        }
        worker.postMessage(context);
    });
    return p;
}

export function startSharedWorker(worker: SharedWorker, context: ActorContext): Promise<BroadcastChannel> {
    return new Promise<BroadcastChannel>((resolve, _reject) => {
        worker.port.start();
        worker.port.onmessage = (e) => {
            resolve(new BroadcastChannel(e.data));
        }
        worker.port.postMessage(context);
    });
}

export class Actor {
    channel: BroadcastChannel;
    context?: ActorContext;

    handle(message: Message) {
        throw new Error('not implemented');
    }

    getChannel() {
        return new BroadcastChannel(this.channel.name);
    }

    constructor(context?: ActorContext) {
        this.context = context;
        this.channel = new BroadcastChannel(generateUuid());
        this.channel.onmessage = (e) => {
            const message = Message.fromObject(e.data);
            this.handle(message);
        }
    }
}