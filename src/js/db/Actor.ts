import {Message} from './Message';
import { Config } from './Node';

export function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export class Actor {
    channel: BroadcastChannel;

    handle(message: Message) {
        throw new Error('not implemented');
    }

    getChannel() {
        return new BroadcastChannel(this.channel.name);
    }

    constructor(id = generateUuid()) {
        this.channel = new BroadcastChannel(id);
        this.channel.onmessage = (e) => {
            const message = Message.fromObject(e.data);
            this.handle(message);
        }
    }
}