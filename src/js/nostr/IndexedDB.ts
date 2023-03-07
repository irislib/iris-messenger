import Dexie, { Table } from 'dexie';

import { Event, Filter, matchFilter } from '../lib/nostr-tools';

import Events from './Events';
import Key from './Key';
import SocialNetwork from './SocialNetwork';
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
  clear() {
    return db.delete();
  },
  saveEvent(event: Event & { id: string }) {
    db.events
      .add(event)
      .catch('ConstraintError', () => {
        // fails if already exists
      })
      .catch((e) => {
        console.error('error saving event', e);
      });
  },
  init() {
    const myPub = Key.getPubKey();
    let follows: string[];
    db.events
      .where({ pubkey: myPub })
      .each((event) => {
        Events.handle(event, false, false);
      })
      .then(() => {
        follows = Array.from(SocialNetwork.followedByUser.get(myPub) || []);
        return db.events
          .where('pubkey')
          .anyOf(follows)
          .each((event) => {
            Events.handle(event, false, false);
          });
      })
      .then(() => {
        // other follow events
        return db.events.where({ kind: 3 }).each((event) => {
          Events.handle(event, false, false);
        });
      });

    // other events to be loaded on demand
  },
  subscribe(filters: Filter[]) {
    const stringifiedFilters = JSON.stringify(filters);
    if (this.subscriptions.has(stringifiedFilters)) {
      return;
    }
    this.subscriptions.add(stringifiedFilters);
    const filter1 = filters.length === 1 ? filters[0] : undefined;
    let query: any = db.events;
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
    query.each((event) => {
      console.log('got event from idb');
      Events.handle(event, false, false);
    });
  },
};
