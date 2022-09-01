import {Message} from './Message';
import { Config } from './Node';

export function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export class ActorContext {
    router?: Actor;
    config: Config;
    constructor(config: Config, router?: Actor) {
        this.router = router;
        this.config = config;
    }
}

export class Actor {
    uuid: string;

    handle(message: Message, context: ActorContext) {
        throw new Error('not implemented');
    }

    constructor() {
        this.uuid = generateUuid();
    }
}