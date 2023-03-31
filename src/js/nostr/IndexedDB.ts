import Dexie, { Table } from 'dexie';
import { throttle } from 'lodash';

import { Event, Filter, matchFilter } from '../lib/nostr-tools';

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

const IndexedDB = {
  db,
  subscribedEventIds: new Set<string>(),
  subscribedAuthors: new Set<string>(),
  subscriptions: new Set<string>(),
  saveQueue: [] as Event[],
  clear() {
    return db.delete();
  },
  save: throttle((_this) => {
    const events = _this.saveQueue;
    _this.saveQueue = [];
    // TODO delete earlier events if kind in 0, 3 or >= 30000
    db.events.bulkAdd(events).catch(() => {
      // lots of "already exists" errors
      // console.error('error saving events', e);
    });
  }, 500),
  saveEvent(event: Event & { id: string }) {
    this.saveQueue.push(event);
    this.save(this);
  },
  init() {
    const myPub = Key.getPubKey();
    db.events
      .where({ pubkey: myPub })
      .each((event) => {
        Events.handle(event, false, false);
      })
      .then(() => {
        // other follow events
        // are they loaded in correct order to build the WoT?
        return db.events.where({ kind: 3 }).each((event) => {
          Events.handle(event, false, false);
        });
      })
      .then(() => {
        // profiles
        return db.events.where({ kind: 0 }).each((event) => {
          Events.handle(event, false, false);
        });
      })
      .then(() => {
        // profiles
        return db.events.where({ kind: 4 }).each((event) => {
          Events.handle(event, false, false);
        });
      })
      .then(() => {
        // some latest global events
        return db.events
          .orderBy('created_at')
          .reverse()
          .filter((event) => event.kind === 1)
          .limit(5000)
          .each((event) => {
            Events.handle(event, false, false);
          });
      });

    // other events to be loaded on demand
  },
  subscribeToAuthors: throttle((limit) => {
    const authors = Array.from(IndexedDB.subscribedAuthors.values());
    IndexedDB.subscribedAuthors.clear();
    db.events
      .where('pubkey')
      .anyOf(authors)
      .limit(limit || 1000)
      .each((event) => {
        Events.handle(event, false, false);
      });
  }, 500),
  subscribeToEventIds: throttle(() => {
    const ids = Array.from(IndexedDB.subscribedEventIds.values());
    IndexedDB.subscribedEventIds.clear();
    db.events
      .where('id')
      .anyOf(ids)
      .each((event) => {
        Events.handle(event, false, false);
      });
  }, 500),
  subscribe(filter: Filter) {
    if (!filter) {
      return;
    }
    if (filter['#e'] || filter['#p']) {
      // currently inefficient lookups
      return;
    }
    let query: any = db.events;
    if (filter.ids?.length) {
      filter.ids.forEach((id) => {
        this.subscribedEventIds.add(id);
      });
      this.subscribeToEventIds();
      return;
    } else if (filter.authors?.length) {
      filter.authors.forEach((author) => {
        this.subscribedAuthors.add(author);
      });
      this.subscribeToAuthors();
      return;
    } else {
      const stringifiedFilter = JSON.stringify(filter);
      if (this.subscriptions.has(stringifiedFilter)) {
        return;
      }
      this.subscriptions.add(stringifiedFilter);
      if (filter.kinds) {
        query = query.where
          ? query.where('kind').anyOf(filter.kinds)
          : query.and((event) => filter.kinds.includes(event.kind));
      }
      if (filter.limit) {
        query = query.limit(filter.limit); // TODO these are not sorted by created_at desc
      }
    }
    query.each((event) => {
      Events.handle(event, false, false);
    });
  },
};

export default IndexedDB;
