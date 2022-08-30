import {Message} from './Message';

export interface Addr {
    id: string;
    send(message: Message): void;
}

export class CallbackAddr implements Addr {
    id: string;
    callback: (message: Message) => void;
    constructor(id: string, callback: (message: Message) => void) {
        this.id = id;
        this.callback = callback;
    }
    send(message: Message): void {
        this.callback(message);
    }
}

export class ServiceWorkerAddr implements Addr {
    id: string;
    serviceWorker: ServiceWorker;
    constructor(id: string, serviceWorker: ServiceWorker) {
        this.id = id;
        this.serviceWorker = serviceWorker;
    }
    send(message: Message): void {
        this.serviceWorker.postMessage(message);
    }
}

export class ActorContext {
    addr: Addr;
    router: Addr;
    peerId: string;
    rootNode: Node;
    constructor(addr: Addr, router: Addr, peerId: string, rootNode: Node) {
        this.addr = addr;
        this.router = router;
        this.peerId = peerId;
        this.rootNode = rootNode;
    }
}

export default interface Actor {
    handle: (message: Message, context: ActorContext) => void;
}