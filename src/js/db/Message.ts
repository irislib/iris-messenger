import { Actor } from './Actor';

export interface Message {
    type: string;
    id: string;
    from: string;
    toJsonString(): string;
}

function generateMsgId(): string {
    return Math.random().toString(36).slice(2, 10);
}

export class Get implements Message {
    type: string = 'get';
    id: string;
    from: string;
    nodeId: string;
    recipients?: string[];
    childKey?: string;
    jsonStr?: string;
    checksum?: string;

    toJsonString(): string {
        return JSON.stringify({
            id: this.id,
            from: this.from,
            nodeId: this.nodeId,
            recipients: this.recipients,
            childKey: this.childKey,
            jsonStr: this.jsonStr,
            checksum: this.checksum
        });
    }

    static new(from: string, nodeId: string, recipients?: string[], childKey?: string, jsonStr?: string, checksum?: string): Get {
        const id = generateMsgId();
        return new Get(id, from, nodeId, recipients, childKey, jsonStr, checksum);
    }

    constructor(id: string, from: string, nodeId: string, recipients?: string[], childKey?: string, jsonStr?: string, checksum?: string) {
        this.id = id;
        this.from = from;
        this.nodeId = nodeId;
        this.recipients = recipients;
        this.childKey = childKey;
        this.jsonStr = jsonStr;
        this.checksum = checksum;
    }
}

export class Put implements Message {
    type: string = 'put';
    id: string;
    from: string;
    nodeId: string;
    childKey: string;
    updatedNodes: object;
    inResponseTo?: string;
    recipients?: string[];
    jsonStr?: string;
    checksum?: string;

    toJsonString(): string {
        return JSON.stringify(this);
    }

    static new(from: string, nodeId: string, childKey: string, inResponseTo?: string, recipients?: string[], jsonStr?: string, checksum?: string): Put {
        const id = generateMsgId();
        return new Put(id, from, nodeId, childKey, inResponseTo, recipients, jsonStr, checksum);
    }

    constructor(id: string, from: string, nodeId: string, childKey: string, inResponseTo?: string, recipients?: string[], jsonStr?: string, checksum?: string) {
        this.id = id;
        this.from = from;
        this.nodeId = nodeId;
        this.childKey = childKey;
        this.inResponseTo = inResponseTo;
        this.recipients = recipients;
        this.jsonStr = jsonStr;
        this.checksum = checksum;
    }
}

const parseGet = (get: any, from: string): Get => {
    return new Get(get.id, from, get.nodeId, get.recipients, get.childKey, get.jsonStr, get.checksum);
}

const parsePut = (put: any, from: string): Put => {
    return new Put(put.id, from, put.nodeId, put.childKey, put.inResponseTo, put.recipients, put.jsonStr, put.checksum);
}

export function messageFromJsonString(jsonStr: string, from: string): Message {
    const obj = JSON.parse(jsonStr);
    if (obj.get) {
        return parseGet(obj.get, from);
    } else if (obj.put) {
        return parsePut(obj.put, from);
    } else {
        throw new Error('Unknown message type');
    }
}