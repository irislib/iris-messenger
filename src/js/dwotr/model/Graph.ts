import { ID } from "../../nostr/UserIds";
import { sha256 } from "../Utils";
import TrustScore, { MAX_DEGREE } from "./TrustScore";

export enum EntityType {
    Key = 1,
    Item = 2,
    Unknown = 3,
}

export const UNDEFINED_DEGREE = 99;


export type VerticeUnsubscribe = () => void;

export class Vertice {
    id: number = 0; // The id of the vertice
    //key: string  = ""; // The public key of the subject or item
    out = Object.create(null); // Map of edges going out from this vertice. Key is the id of the target vertice. Use Object.create(null) to avoid prototype pollution.
    in = Object.create(null); // Map of edges going in to this vertice. Key is the id of the source vertice. Use Object.create(null) to avoid prototype pollution.
    degree: number = UNDEFINED_DEGREE;
    entityType: number = 1; // Type 1 is Key and 2 is item. Items cannot issue Trust claims.
    timestamp = 0; // Timestamp of lasest update, used to limit subscription at the relays to only new events.
    subscribed = 0; // True if subscribed to updates from relays
    score: TrustScore = new TrustScore(); // The score of the vertice, calculated from the trust edges, used to subscribe to updates from relays when the score is positive.
    profile: any = undefined; // The profile of the vertice, used to display the name and avatar of the vertice.

    constructor(id: number) {
        this.id = id;
    }
}

export class EdgeBase  {
    key: string = ""; // The public key of the edge
    type: number = 1; // The type of the edge, 1 is trust, 2 is distrust, 3 is neutral
    val: any = undefined; // The value of the edge
    context: string = ""; // The context of the edge
    note: string = ""; // A note about the edge
    timestamp = 0; // Timestamp of latest update, used to update the edge with only the latest values.
}


// Used in memory
export class Edge extends EdgeBase {

    out: Vertice | undefined; // The id of the source vertice, can be a reference now!!!
    in: Vertice | undefined; // The id of the target vertice

    partial: boolean = true; // True if the edge is partial, has not loaded all data

    static partial(record: EdgeRecord) : Edge {
        let edge = new Edge();
        edge.key = record.key;
        edge.type = record.type;
        edge.val = record.val;
        edge.timestamp = record.timestamp;
        return edge;
    }
    
    static getKey(type: number, outKey: string, inKey: string, context: string) : string {
        let key = `${type}|${outKey}|${inKey}|${context}`;
        return sha256(key);
    }

    // setKey() {
    //     this.key = Edge.getKey(this.type, this.out?.key || "", this.in?.key || "", this.context || "");
    // }

    fill(record: EdgeRecord) : void {
        this.val = record.val;
        this.context = record.context;
        this.note = record.note;
        this.timestamp = record.timestamp;
        this.partial = false;
    }
}

// Used in IndexedDB
export class EdgeRecord extends EdgeBase {
    from = ""; // The public key of the source vertice
    to = ""; // The public key of the target vertice
}


export default class Graph {
    vertices = {};
    edges = {};

    addVertice(id: number) : void {
        if(this.vertices[id] == undefined) {
            this.vertices[id] = new Vertice(id);
        }
    }

    addEdge(record: EdgeRecord, fill: boolean = false) : Edge {
        let edge = this.edges[record.key] as Edge;
        if(!edge) {
            this.addVertice(ID(record.from));
            this.addVertice(ID(record.to));

            edge = Edge.partial(record);

            let outV = this.vertices[ID(record.from)] as Vertice;
            let inV = this.vertices[ID(record.to)] as Vertice;

            if(outV) outV.out[inV.id] = edge;
            if(inV) inV.in[outV.id] = edge;

            edge.out = outV;
            edge.in = inV;
        } 

        // Memory saving feature, only fill all data if requested
        if(fill) {
            edge.fill(record);
        } else {
            edge.val = record.val;
            edge.timestamp = record.timestamp;
        }

        return edge;
    }

    removeEdge(e: Edge) : void {

        const outV = e.out as Vertice;
        const inV = e.in as Vertice;
        if(outV) delete outV.out[inV.id as number];
        if(inV) delete inV.in[outV.id as number];
        delete this.edges[e.key];
    }

    getVertice(key: string) : Vertice | undefined {
        const id = this.getVerticeId(key);
        if(id == undefined) 
            return undefined;
        return this.vertices[id];
    }

    getEdge(key: string) : Edge | undefined {
        return this.edges[key];
    }


    getVerticeId(key: string | undefined | null) : number | undefined {
        if(!key) return undefined;
        let id = ID(key);
        return id;
    }

    // Make sure all relevant vertices have score and degree set
    calculateScore(sourceId: number, maxDegree: number) {

        let queue = [] as Array<Vertice>;
        let nextQueue = Object.create(null); // Use null to avoid prototype pollution

        this.resetScore(); // Reset all scores in the graph

        let startV = this.vertices[sourceId] as Vertice;
        let degree = startV.degree = 0;

        queue.push(startV); // Add the source vertice id to the queue as starting point

        while (queue.length > 0 && degree <= maxDegree) {

            for(let outV of queue) {

                if(degree > 0 && !outV.score.isTrusted(degree-1)) continue; // Skip if the vertice is distrusted or not trusted and is not the start vertice
        
                let nextDegree = degree + 1;

                for(const inId in outV.out) {

                    const inV = this.vertices[inId] as Vertice;

                    const edge = outV.out[inId]; // Get the edge object
                    if(!edge || edge.val === 0) continue; // Skip if the edge has no value / neutral

                    inV.score.addValue(edge.val, degree); // Add the edge value to the score

                    if(degree >= inV.degree) continue; // Skip if degree is already set by a shorter path

                    inV.degree = nextDegree; // Set the degree to next level

                    if(degree < maxDegree 
                        && inV.entityType === EntityType.Key 
                        && !nextQueue[inId])  // Only add keys to the queue, setting values takes time
                        nextQueue[inId] = inV; // Only add the in vertice to the queue once
                }
            }

            queue = Object.values(nextQueue) as Array<Vertice>;
            nextQueue = Object.create(null); // Clear the next queue
            degree++;
        }
    }


    // Calculate the score of a single item, used when a value is added to an item
    // Theres no need to calculate the score of all vertices as the score of the item cannot affect the score of other items.
    calculateItemScore(id: number) {
        let vertice = this.vertices[id] as Vertice;
    
        vertice.score = new TrustScore();

        let lowestDegree = UNDEFINED_DEGREE;

        // Find lowest degree
        for(const outId in vertice.in) {
            const outV = this.vertices[outId] as Vertice;
            const edge = vertice.in[outId];
            if(!edge || edge.val == 0) continue; // Skip if the edge has no value / neutral

            if(outV.degree < lowestDegree) lowestDegree = outV.degree;

            vertice.score.addValue(edge.val, outV.degree);
        }

        vertice.degree = lowestDegree + 1;
    }

    resetScore() {
        for(let key in this.vertices) {
            const v = this.vertices[key];
            v.score = new TrustScore();
            v.degree = UNDEFINED_DEGREE;
        }
    }


    wotNetwork(entityType?:EntityType, maxDegree:number = MAX_DEGREE+1) : Array<Vertice> {
        let result = [] as Array<Vertice>;

        for(const key in this.vertices) {
            const v = this.vertices[key] as Vertice;

            if(v.degree <= maxDegree                                // Only add vertices with a degree less than maxDegree
                && v.degree > 0                                     // Skip the source vertice
                && (!entityType || v.entityType === entityType)) {  // Only add vertices of the specified type
                result.push(v);
            }
        }   
        return result;
    }


    inOutTrustById(sourceId: number, entityType?:EntityType, trust1?:number) : Array<Vertice> {
        let obj = Object.create(null) as {[key: string]: Vertice};
        const sourceV = this.vertices[sourceId] as Vertice;
        for(const key in sourceV.in) {
            const outV = this.vertices[key] as Vertice;
            if(!outV || outV.degree > MAX_DEGREE) continue; // Skip if the in vertice has no degree or above max degree

            const edge = sourceV.in[key];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral
            
            obj[key] = outV;
        }
        for(const key in sourceV.out) {
            const edge = sourceV.out[key];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral

            const inV = this.vertices[key] as Vertice;
            if(!entityType || inV.entityType === entityType)
                obj[key] = inV;
        }
        return Object.values(obj);
    }



    outTrustById(sourceId: number, entityType?:EntityType, trust1?:number) : Array<Vertice> {
        let result = [] as Array<Vertice>;
        const sourceV = this.vertices[sourceId] as Vertice;
        for(const key in sourceV.out) {
            const inV = this.vertices[key] as Vertice;
            
            const edge = sourceV.out[key];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral
            
            if(!entityType || inV.entityType === entityType)
                result.push(inV);
        }
        return result;
    }

    trustedBy(sourceId: number, entityType?:EntityType, trust1?:number, maxDegree:number = MAX_DEGREE) : Array<Vertice> {
        let result = [] as Array<Vertice>;
        const sourceV = this.vertices[sourceId] as Vertice;

        for(const key in sourceV.in) {
            const outV = this.vertices[key] as Vertice;
            if(!outV || outV.degree > maxDegree) continue; // Skip if the in vertice has no degree or above max degree

            const edge = sourceV.in[key];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral
            
            if(!entityType || outV.entityType === entityType)
                result.push(outV);
        }
        return result;
    }

    getPath(sourceId: number, targetId: number) : Array<Vertice> {
        let maxDegree = MAX_DEGREE;
        let result = [] as Array<Vertice>;
        const sourceV = this.vertices[sourceId] as Vertice;
        const targetV = this.vertices[targetId] as Vertice;

        if(!sourceV || !targetV) return result;

        let queue = [] as Array<Vertice>;
        let nextQueue = Object.create(null) as {[key: string]: Vertice}; // Use null to avoid prototype pollution
        let startV = this.vertices[sourceId] as Vertice;
        let degree = startV.degree = 0;

        queue.push(startV); // Add the source vertice id to the queue as starting point

        while (queue.length > 0 && degree <= maxDegree) {

            for(let outV of queue) {

                if(degree > 0 && !outV.score.isTrusted(degree-1)) continue; // Skip if the vertice is distrusted or not trusted and is not the start vertice
        
                let nextDegree = degree + 1;

                for(const inId in outV.out) {

                    const inV = this.vertices[inId] as Vertice;

                    const edge = outV.out[inId]; // Get the edge object
                    if(!edge || edge.val === 0) continue; // Skip if the edge has no value / neutral

                    inV.score.addValue(edge.val, degree); // Add the edge value to the score

                    if(degree >= inV.degree) continue; // Skip if degree is already set by a shorter path

                    inV.degree = nextDegree; // Set the degree to next level

                    if(degree < maxDegree 
                        && inV.entityType === EntityType.Key 
                        && !nextQueue[inId])  // Only add keys to the queue, setting values takes time
                        nextQueue[inId] = inV; // Only add the in vertice to the queue once
                }
            }

            queue = Object.values(nextQueue) as Array<Vertice>;
            nextQueue = Object.create(null); // Clear the next queue
            degree++;
        }

        return result;
    }


    getUnsubscribedVertices(maxDegree: number) : Array<Vertice> {
        let vertices = new Array<Vertice>();
        for(const key in this.vertices) {
            const v = this.vertices[key] as Vertice;
            
            if(v.degree <= maxDegree                                                // Is within degree 
                && v.subscribed == 0                                                // Is not subscribed
                && v.entityType == EntityType.Key
                && (v.degree == 0 || v.score.isTrusted(v.degree - 1)))
                vertices.push(v);
        }
        return vertices;
    }

               
 }