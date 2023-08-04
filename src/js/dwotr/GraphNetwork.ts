import { Event } from 'nostr-tools';
import Graph, { Edge, EdgeRecord, EntityType, Vertice } from './model/Graph';
import WOTPubSub from './network/WOTPubSub';
import Key from '../nostr/Key';
import { MAX_DEGREE } from './model/TrustScore';
import dwotrDB from './network/DWoTRDexie';
import { debounce } from 'lodash';
import { MonitorItem } from './model/MonitorItem';
import { BECH32, ID } from '../nostr/UserIds';

export type ResolveTrustCallback = (result: any) => any;

export type ReadyCallback = () => void;

export const TrustScoreEventName = 'trustScoreEvent';

export class TrustScoreEvent extends CustomEvent<MonitorItem> {
  constructor(id: number, item: MonitorItem) {
    super(TrustScoreEvent.getEventId(id), { detail: item });
  }

  static getEventId(id: number): string {
    return TrustScoreEventName + id;
  }
}

export const TRUST1 = 'trust1';

class GraphNetwork {
  db: typeof dwotrDB;

  localDataLoaded = false;

  g = new Graph();

  sourceKey: string | undefined;
  sourceId: number = -1;

  wotPubSub: typeof WOTPubSub | undefined;
  unsubs = {};
  subscriptionsCounter = 0;

  verticeMonitor = Object.create(null); // Monitor vertices for changes
  maxDegree = MAX_DEGREE;
  readyCallbacks: ReadyCallback[] = [];

  processItems = {}; // Items to process
  processGraph = false; // True if graph has to reprocessed
  processScoreDebounce = debounce(this.processScore, 1000, { trailing: true }); // 'maxWait':

  submitTrustIndex = {};
  profilesLoaded = false;

  constructor(wotPubSub: typeof WOTPubSub, db: typeof dwotrDB) {
    this.wotPubSub = wotPubSub;
    this.db = db;
  }

  async init(source: string) {
    this.sourceKey = source;
    if (this.localDataLoaded) return;

    // let v = await this.db.vertices.where({ key: source }).first();
    // if (!v) {
    //   // Create source vertice
    //   v = await this.loadVertice(source, { degree: 0, entityType: EntityType.Key, timestamp: 0 });
    // }

    this.sourceId = ID(this.sourceKey);
    this.g.addVertice(this.sourceId); // Add the source vertice to the graph

    //let list = await this.db.edges.toArray();
    // Load edges from DB
    await this.db.edges.each((record) => { // Load one record at a time, to avoid memory issues (check that this is indeed the case with each())
      this.g.addEdge(record, false); // Load all edges from the DB into the graph with partial data
    });

    console.info(
      'Graph: ' +
        Object.entries(this.g.vertices).length +
        ' vertices and ' +
        Object.entries(this.g.edges).length +
        ' edges', 
      //'List: ' + list.length + ' edges'
    );

    this.processGraph = true; // Process the whole graph
    this.processScore(); // Process score for all vertices within degree of maxDegree and subscribe to trust events

    this.localDataLoaded = true;

    for (let callback of this.readyCallbacks) {
      callback();
    }

    this.readyCallbacks = [];
  }

  // Load of vertices from the DB can take some time and is done async, so this function calls back when the data is loaded
  whenReady(callback: ReadyCallback) {
    if (this.localDataLoaded) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  async publishTrust(
    to: string,
    val: number = 0,
    entityType: EntityType = EntityType.Key,
    comment?: string,
    context: string = 'nostr',
  ) {
    // console.time("GraphNetwork.publishTrust");
    // Add the trust to the local graph, and update the score
    const timestamp = this.wotPubSub?.getTimestamp();
    const props = { from: this.sourceKey, to, val, entityType, context, note: comment, timestamp };

    const { outV, inV, preVal } = await this.setTrust(props, false);

    // Update the vertice monitors
    // graphNetwork.updateVerticeMonitor(outV); // Update the monitor for the source vertice before recalculating the score
    // graphNetwork.updateVerticeMonitor(inV);

    // Update the Graph score
    this.addToProcessScoreQueue(outV, inV);
    this.processScore();

    // Publish the trust to the network, using a debounce function to only publish the last call to the relays if multiple calls are made within X seconds on the same key.
    // Locally the trust is added immediately, but the relays is only updated after X seconds, to allow for "regret" of choice.
    let callKey = TRUST1 + this.sourceKey + to + context; // Create a unique key for this call, of: Type + from + to + context
    let publishTrustDebounce = this.submitTrustIndex[callKey];

    if (!publishTrustDebounce) {
      publishTrustDebounce = debounce(async (currentVal: number) => {
        // Test if anything has changed to the trust, as the user may have changed his mind within the X seconds
        // preVal will contain the value from when the function first was created.
        if (preVal == currentVal) return; // In the end, if trust value has not changed, then don't publish the trust to the network

        // Publish the trust to the network is pretty slow, may be web workers can be used to speed it up UI
        await graphNetwork.wotPubSub?.publishTrust(
          to,
          currentVal,
          comment,
          context,
          entityType,
          timestamp,
        );

        //console.log("GraphNetwork.publishTrust.debounce Fn Published to relays - " + to + "  preVal: " + preVal + "  currentVal: " + currentVal);
        delete this.submitTrustIndex[callKey];
      }, 3000); // wait a little time before publishing trust to the network, to allow for "regret" of choice

      this.submitTrustIndex[callKey] = publishTrustDebounce;
    }

    publishTrustDebounce(val); // Call the debounce function, which will only call the publishTrust() function after X seconds, if no other call is made within that time

    //console.timeEnd("GraphNetwork.publishTrust");
  }

  addToProcessScoreQueue(outV: Vertice, inV: Vertice) {
    if (outV.degree > this.maxDegree) return; // No need to update the score

    if (outV.degree == this.maxDegree) {
      this.processItems[inV.id as number] = true; // Add the vertice to the list of items to process
    } else {
      if (inV.entityType == EntityType.Key) {
        if (inV.degree == this.maxDegree) {
          // Only process the score of all outV vertices
          this.processGraph = true; // For now, process the whole graph
        } else this.processGraph = true; // Set the flag to process the whole graph
      } else {
        this.processItems[inV.id as number] = true; // Add the vertice to the list of items to process
      }
    }
  }

  // Calculate the score of all vertices within degree of maxDegree
  processScore() {
    let processItems = this.processGraph;

    if (this.processGraph) {
      graphNetwork.g.calculateScore(graphNetwork.sourceId, this.maxDegree); // Calculate the score for all vertices within degree of maxDegree
    } else {
      for (const key in graphNetwork.processItems) {
        graphNetwork.g.calculateItemScore(parseInt(key)); // Calculate the score each single vertice in the list
        processItems = true;
      }
    }

    // If processGraph was false and there was no items to process, then return
    if (!processItems) return; // No need to process the monitors

    for (const id in graphNetwork.verticeMonitor) {

      graphNetwork.callMonitor(parseInt(id));
    }

    if (this.processGraph) {
      // TODO: Make this async as it is slow
      graphNetwork.updateSubscriptions();
    }

    this.processGraph = false;
    this.processItems = {};
  }

  callMonitor(id: number) {
    let monitorItem = graphNetwork.verticeMonitor[id] as MonitorItem;
    if(!monitorItem) return; // No monitorItem found

    let vertice = this.g.vertices[id] as Vertice;
    if (!vertice) return; // No vertice found, no need to process Elements that are subscribed to this vertice
    if (!monitorItem.hasChanged(vertice)) return; // No change in the vertice

    let clone = monitorItem.clone();
    monitorItem.setScore(vertice); // Reset the old score to the current score

    document.dispatchEvent(new TrustScoreEvent(id, clone)); // Dispatch event with an clone of the monitorItem so oldScore is not changed when the syncScore() is called
  }

  addVerticeMonitor(id: number) {
    let monitorItem = this.verticeMonitor[id];
    if (!monitorItem) {
      monitorItem = new MonitorItem(id);
      this.verticeMonitor[id] = monitorItem;
    }
    monitorItem.counter++; // Increment the counter of elements that are subscribed to this monitor item
  }


  removeVerticeMonitor(id: number) {
    let monitorItem = this.verticeMonitor[id];
    if (!monitorItem) return;
    
    monitorItem.counter--; // Decrement the counter of elements that are subscribed to this monitor item

    if (monitorItem.counter <= 0) { // If no more elements are subscribed to this monitor item, then delete it
      delete this.verticeMonitor[id];
    }
  }

  updateSubscriptions() {
    let vertices = this.g.getUnsubscribedVertices(this.maxDegree);
    this.subscribeToTrustEvents(vertices);
  }

  async setTrust(props: any, isExternal: boolean): Promise<any> {
    let { edge, preVal, change } = await this.putEdge(props, isExternal);
    let outV = edge.out;
    let inV = edge.in;

    return { outV, inV, edge, preVal, change };
  }


  async putEdge(props: any, isExternal: boolean) {
    let { from, to, val, entityType, context, note, timestamp } = props;
    let type = 1; // Trust1
    let preVal = undefined;
    let change = false;

    let key =  Edge.key(type, from, to, context); // Create the key for the edge
    let edge = this.g.edges[key];

    if (!edge) {
      if (val == 0 && isExternal) return { edge, preVal, change }; // No need to add an edge if the value is 0

      let record = new EdgeRecord();
      record.type = type;
      record.key = key;
      record.from = from;
      record.to = to;
      record.val = val;
      record.entityType = entityType;
      record.context = context;
      record.note = note;
      record.timestamp = timestamp;
      await this.db.edges.put(record);

      edge = this.g.addEdge(record, false); // Add the record to the graph and return the graph edge

      change = true;
    } else {
      preVal = edge.val;

      // If data is older or the same as the current data and value, then ignore it.
      // Sometimes the value is different but the timestamp is the same, so we need to update the timestamp and value. Very fast hitting the trust / distrust buttons.
      if (edge.timestamp < timestamp || (edge.val != val && edge.timestamp == timestamp)) {
        // Always update the edge as timestamp is always updated.

        let updateObject = { timestamp: 0 };

        if (edge.val != val) edge.val = updateObject['val'] = val;
        if (edge.context != context) edge.context = updateObject['context'] = context;
        if (edge.note != note) edge.note = updateObject['note'] = note;

        edge.timestamp = updateObject.timestamp = timestamp; // Update the timestamp to the latest event.

        if (edge.val == 0 && isExternal) {
          // Delete the edge if the value is 0 / neutral and it is an external event
          await this.db.edges.delete(key);
          this.g.removeEdge(edge);
          edge = undefined;
        } else {
          await this.db.edges.update(key, updateObject);
        }

        change = true;
      }
    }

    return { edge, preVal, change };
  }

  subscribeToTrustEvents(vertices: Array<Vertice>) {
    if (vertices.length == 0) return; // Nothing to subscribe to

    let self = this;
    let id = this.subscriptionsCounter++;
    let since = 0;
    const authors = new Array<string>();

    for (let v of vertices) {
      if (since < v.timestamp) since = v.timestamp;
      authors.push(BECH32(v.id));
    }

    vertices.forEach((v) => (v.subscribed = id)); // Mark the vertices as subscribed with the current subscription counter

    // wait a little to the UI is done.
    setTimeout(() => {
      console.time('Subscribing to trust events');
      self.unsubs[id] = self.wotPubSub?.subscribeTrust(authors, since, self.trustEvent); // Subscribe to trust events
      console.timeEnd('Subscribing to trust events');
    }, 1);
  }

  unsubscribeAll() {
    for (let key in this.unsubs) {
      this.unsubs[key]?.();
    }
  }

  async trustEvent(event: Event) {
    let p, context, d, v, t, note: string;
    let author = event.pubkey;
    if (event.tags) {
      for (const tag of event.tags) {
        switch (tag[0]) {
          case 'p':
            p = tag[1];
            break;
          case 'c':
            context = tag[1];
            break;
          case 'd':
            d = tag[1];
            break;
          case 'v':
            v = tag[1];
            break;
          case 't':
            t = tag[1];
            break;
        }
      }
    }
    note = event.content;

    if (p && d && v) {
      let val = parseInt(v);
      if (isNaN(val) || val < -1 || val > 1) return; // Invalid value

      console.info(`Trust Event: ${author} -> ${p} = ${val} (${note})`);

      let entityType = t ? (parseInt(t) as EntityType) : EntityType.Item; // entityType be of value 1 or 2 (key or item)

      let from = Key.toNostrHexAddress(author) as string;
      let to = Key.toNostrHexAddress(p) as string;

      // Add the Trust Event to the memory Graph and IndexedDB
      let { outV, inV, change } = await graphNetwork.setTrust(
        { from, to, val, note, context, entityType, timestamp: event.created_at },
        true,
      );

      if (change) {
        graphNetwork.addToProcessScoreQueue(outV, inV);
        graphNetwork.processScoreDebounce(); // Wait a little before processing the score, to allow for multiple updates to be made at once
      }
    }
  }

  findOption(vertice: Vertice, options: Array<any> | undefined): any {
    if (!options || options.length === 0 || vertice.degree == 0) return undefined;

    let score = vertice.score;
    let { val, degree, count, hasScore } = score.resolve();
    //let degree = vertice.degree; // The degree of the vertice should be the same as the score degree

    if (!hasScore)
      // No trust yet
      return undefined;

    
    // If the score is directly trust by degree 0, return the first or last option or undefined
    if (degree === 1) {
      if (val > 0) return options[options.length - 1];
      else if (val < 0) return options[0];
      else return undefined;
    }

    let percent = ((val + count) * 100) / (count * 2);
    let index = Math.ceil(percent / (100.0 / options.length));

    index = index === 0 ? 1 : index > options.length ? options.length : index; // Ajust lower and upper out of bounce values.

    return options[index - 1];
  }

  getTrustList(inV: Vertice, val: number): Array<any> {
    if (!inV) return [];
    let result = new Array<any>();

    for (const outId in inV.in) {
      const edge = this.g.getEdge(inV.in[outId]) as Edge;

      let outV = this.g.vertices[outId] as Vertice;
      if (!outV) continue;

      if (edge.val == val) {
        result.push({ outV, edge });
      }
    }
    return result;
  }
}

const graphNetwork = new GraphNetwork(WOTPubSub, dwotrDB);

export default graphNetwork;
