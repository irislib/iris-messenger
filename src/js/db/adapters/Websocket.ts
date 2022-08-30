import Actor, { ActorContext } from "../Actor";
import { Message, messageFromJsonString } from "../Message";

// Web Worker that sends outgoing messages to websockets and passes incoming messages to router
export default class Websocket implements Actor {
    url: string;
    ws?: WebSocket;

    constructor(url: string) {
        this.url = url;
    }

    preStart(context: ActorContext) {
        const ws = new WebSocket(this.url);
        ws.onopen = () => {
            console.log(`Connected to ${this.url}`);
        }
        ws.onmessage = (event) => {
            const message = messageFromJsonString(event.data);
            context.router.send(message);
        }
        ws.onclose = (event) => {
            console.log(`Disconnected from ${this.url}`);
        }
        ws.onerror = (event) => {
            console.log(`Error on ${this.url}`);
        }
        this.ws = ws;
    }

    handle(message: Message, context: ActorContext) {
        this.ws!.send(message.toJsonString());
    }
}