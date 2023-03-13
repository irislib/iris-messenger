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

export default {
  db,
  subscriptions: new Set<string>(),
  saveQueue: [] as Event[],
  clear() {
    return db.delete();
  },
  save: throttle((_this) => {
    const events = _this.saveQueue;
    _this.saveQueue = [];
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
  subscribe(filters: Filter[]) {
    const filter1 = filters.length === 1 ? filters[0] : undefined;
    let query: any = db.events;
    if (filter1.ids) {
      query = query.where('id').anyOf(filter1.ids);
    } else {
      const stringifiedFilters = JSON.stringify(filters);
      if (this.subscriptions.has(stringifiedFilters)) {
        return;
      }
      this.subscriptions.add(stringifiedFilters);
      if (filter1.authors) {
        query = query.where('pubkey').anyOf(filter1.authors);
      }
      if (filter1.kinds) {
        query = query.where
          ? query.where('kind').anyOf(filter1.kinds)
          : query.and((event) => filter1.kinds.includes(event.kind));
      }
      query = query.filter((event) => {
        for (const filter of filters) {
          if (matchFilter(filter, event)) {
            return true;
          }
        }
      });
      if (filter1.limit) {
        query = query.limit(filter1.limit); // TODO these are not sorted by created_at desc
      }
    }
    query.each((event) => {
      console.log('got event from idb');
      Events.handle(event, false, false);
    });
  },
};
