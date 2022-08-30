import {Addr} from './Actor';

export interface Message {
    id: string;
    from: Addr;
    toJsonString(): string;
}

function generateMsgId(): string {
    return Math.random().toString(36).slice(2, 10);
}

export class Get implements Message {
    id: string;
    from: Addr;
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

    static new(from: Addr, nodeId: string, recipients?: string[], childKey?: string, jsonStr?: string, checksum?: string): Get {
        const id = generateMsgId();
        return new Get(id, from, nodeId, recipients, childKey, jsonStr, checksum);
    }

    constructor(id: string, from: Addr, nodeId: string, recipients?: string[], childKey?: string, jsonStr?: string, checksum?: string) {
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
    id: string;
    from: Addr;
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

    static new(from: Addr, nodeId: string, childKey: string, inResponseTo?: string, recipients?: string[], jsonStr?: string, checksum?: string): Put {
        const id = generateMsgId();
        return new Put(id, from, nodeId, childKey, inResponseTo, recipients, jsonStr, checksum);
    }

    constructor(id: string, from: Addr, nodeId: string, childKey: string, inResponseTo?: string, recipients?: string[], jsonStr?: string, checksum?: string) {
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

export function messageFromJsonString(jsonStr: string): Message {
    const obj = JSON.parse(jsonStr);
    if (obj.get) {
        return new Get(obj.id, obj.from, obj.nodeId, obj.recipients, obj.childKey, obj.jsonStr, obj.checksum);
    } else if (obj.put) {
        return new Put(obj.id, obj.from, obj.nodeId, obj.childKey, obj.inResponseTo, obj.recipients, obj.jsonStr, obj.checksum);
    } else {
        throw new Error('Unknown message type');
    }
}