import TrustScore, { MAX_DEGREE } from "./TrustScore";

export enum EntityType {
    Key = 1,
    Item = 2,
    Unknown = 3,
}

export const UNDEFINED_DEGREE = 99;


export type VerticeUnsubscribe = () => void;

export class Vertice {
    id: number |undefined = undefined; // The id of the vertice
    key: string  = ""; // The public key of the subject or item
    out = Object.create(null); // Map of edges going out from this vertice. Key is the id of the target vertice. Use Object.create(null) to avoid prototype pollution.
    in = Object.create(null); // Map of edges going in to this vertice. Key is the id of the source vertice. Use Object.create(null) to avoid prototype pollution.
    degree: number = UNDEFINED_DEGREE;
    entityType: number = -1; // Type 1 is Key and 2 is item. Items cannot issue Trust claims.
    timestamp = 0; // Timestamp of lasest update, used to limit subscription at the relays to only new events.
    subscribed = 0; // True if subscribed to updates from relays
    score: TrustScore = new TrustScore(); // The score of the vertice, calculated from the trust edges, used to subscribe to updates from relays when the score is positive.
}

export class Edge  {
    id: number | undefined = undefined; // The id of the edge
    out = 0; // The id of the source vertice
    in = 0; // The id of the target vertice
    val: any = undefined; // The value of the edge
    context: string = ""; // The context of the edge
    note: string = ""; // A note about the edge
    timestamp = 0; // Timestamp of latest update, used to update the edge with only the latest values.
}


export default class Graph {
    vertices = {};
    edges = {};

    verticeMap: Map<string, number> = new Map<string, number>(); // Map of key to vertice id

    load(vertices: Vertice[], edges: Edge[]) {
        vertices.forEach(v => this.addVertice(v));
        edges.forEach(e => this.addEdge(e));
    }
   
    addVertice(v: Vertice) : void {

        if(!v.id) return;
        const id = v.id;
        
        if(this.vertices[id] == undefined) {
            this.vertices[id] = v;
            this.verticeMap.set(v.key, id);
        }
    }

    addEdge(e: Edge) : void {
        //if(e.val != 0) { // Only add edges with a value to the vertices
            const outV = this.vertices[e.out];
            const inV = this.vertices[e.in];
            if(outV) outV.out[inV.id] = e.id;
            if(inV) inV.in[outV.id] = e.id;
        //}
        this.edges[e.id as number] = e;
    }

    removeEdge(e: Edge) : void {
        const outV = this.vertices[e.out];
        const inV = this.vertices[e.in];
        if(outV) delete outV.out[inV.id];
        if(inV) delete inV.in[outV.id];
        delete this.edges[e.id as number];
    }

    getVertice(name: string) : Vertice | undefined {
        const id = this.getVerticeId(name);
        if(id == undefined) 
            return undefined;
        return this.vertices[id];
    }

    getEdge(id: number) : Edge | undefined {
        return this.edges[id];
    }


    getVerticeId(key: string | undefined | null) : number | undefined {
        if(!key) return undefined;
        let id = this.verticeMap.get(key);
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

                    const edge = this.edges[outV.out[inId]]; // Get the edge object
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
            const edge = this.edges[vertice.in[outId]];
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


    outTrust(entityType?:EntityType, maxDegree:number = MAX_DEGREE+1) : Array<Vertice> {
        let result = [] as Array<Vertice>;

        for(const key in this.vertices) {
            const v = this.vertices[key] as Vertice;

            if(v.degree <= maxDegree && (!entityType || v.entityType === entityType)) {
                result.push(v);
            }
        }   
        return result;
    }

    outTrustById(sourceId: number, entityType?:EntityType, trust1?:number) : Array<{ v:Vertice, edge: Edge}> {
        let result = [] as Array<{ v:Vertice, edge: Edge}>;
        const sourceV = this.vertices[sourceId] as Vertice;
        for(const key in sourceV.out) {
            const v = this.vertices[key] as Vertice;
            
            const edge = this.edges[v.in[key]];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral
            
            if(!entityType || v.entityType === entityType)
                result.push({v, edge});
        }
        return result;
    }

    trustedBy(sourceId: number, trust1?:number, maxDegree:number = MAX_DEGREE) : Array<{ v:Vertice, edge: Edge}> {
        let result = [] as Array<{ v:Vertice, edge: Edge}>;
        const sourceV = this.vertices[sourceId] as Vertice;
        for(const key in sourceV.in) {
            const v = this.vertices[key] as Vertice;
            if(!v || v.degree > maxDegree) continue; // Skip if the in vertice has no degree or above max degree

            const edge = this.edges[v.in[key]];
            if(!edge || edge.val == 0 || (trust1 && edge.val != trust1)) continue; // Skip if the edge has no value / neutral
            
            result.push({v, edge});
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