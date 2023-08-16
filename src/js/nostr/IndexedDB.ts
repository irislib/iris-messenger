import Dexie, { Table } from 'dexie';
import throttle from 'lodash/throttle';
import { Event, Filter } from 'nostr-tools';

import Events from './Events';
import Key from './Key';

export class MyDexie extends Dexie {
  events!: Table<Event & { id: string }>;

  constructor() {
    super('iris');
    this.version(2).stores({
      events: 'id, pubkey, kind, created_at', // Primary key and indexed props
    });
  }
}

const db = new MyDexie();

const handleEvent = (event: Event & { id: string }) => {
  Events.handle(event, false, false);
};

const IndexedDB = {
  db,
  subscribedEventIds: new Set<string>(),
  subscribedAuthors: new Set<string>(),
  seenFilters: new Set<string>(),
  saveQueue: [] as Event[],

  clear() {
    return db.delete();
  },

  save: throttle(async function (this: typeof IndexedDB) {
    const events = this.saveQueue;
    this.saveQueue = [];
    try {
      await db.events.bulkAdd(events);
    } catch {
      // Handle specific error messages if necessary
    }
  }, 500),

  saveEvent(event: Event & { id: string }) {
    this.saveQueue.push(event);
    this.save();
  },

  async init() {
    const myPub = Key.getPubKey();

    await db.events.where({ pubkey: myPub }).each(handleEvent);
    await db.events.where({ kind: 3 }).each(handleEvent);
    await db.events.where({ kind: 0 }).each(handleEvent);
    await db.events.where({ kind: 4 }).each(handleEvent);
    await db.events
      .orderBy('created_at')
      .reverse()
      .filter((event) => event.kind === 1)
      .limit(5000)
      .each(handleEvent);
  },

  subscribeToAuthors: throttle(async function (this: typeof IndexedDB, limit?: number) {
    const authors = [...this.subscribedAuthors];
    this.subscribedAuthors.clear();
    await db.events
      .where('pubkey')
      .anyOf(authors)
      .limit(limit || 1000)
      .each(handleEvent);
  }, 1000),

  subscribeToEventIds: throttle(async function (this: typeof IndexedDB) {
    const ids = [...this.subscribedEventIds];
    this.subscribedEventIds.clear();
    await db.events.where('id').anyOf(ids).each(handleEvent);
  }, 1000),

  async subscribe(filter: Filter) {
    if (!filter) return;

    if (filter['#e'] || filter['#p']) return; // TODO save reactions & replies

    if (filter.ids?.length) {
      filter.ids.forEach((id) => this.subscribedEventIds.add(id));
      await this.subscribeToEventIds();
      return;
    }

    if (filter.authors?.length) {
      filter.authors.forEach((author) => this.subscribedAuthors.add(author));
      await this.subscribeToAuthors();
      return;
    }

    const stringifiedFilter = JSON.stringify(filter);
    if (this.seenFilters.has(stringifiedFilter)) return;
    this.seenFilters.add(stringifiedFilter);


    let query: any = db.events;
    if (filter.kinds) {
      query = query.where('kind').anyOf(filter.kinds);
    }
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    await query.each(handleEvent);
  },
};

export default IndexedDB;
