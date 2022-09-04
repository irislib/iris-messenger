import { messageFromJsonString } from "../Message";

let ws;
const startWebSocket = (url) => {
    ws = new WebSocket(url);
    ws.onopen = () => {
        console.log(`Connected to ${url}`);
    }
    ws.onmessage = (event) => {
        const message = messageFromJsonString(event.data);
        postMessage(message);
    }
    ws.onclose = () => {
        console.log(`Disconnected from ${url}`);
    }
    ws.onerror = () => {
        console.log(`Error on ${url}`);
    }
}

onmessage = (event) => {
    console.log('websocket worker got message', event);
    if (!ws && event.data.url) {
        startWebSocket(event.data.url);
    } else if (ws && event.data.message) {
        ws.send(event.data.message);
    }
}