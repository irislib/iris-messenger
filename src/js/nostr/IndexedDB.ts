import Dexie, { Table } from 'dexie';

import { Event } from '../lib/nostr-tools';

import Events from './Events';
import Key from './Key';
import SocialNetwork from './SocialNetwork';
export class MyDexie extends Dexie {
  events!: Table<Event>;

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
  clear() {
    return db.delete();
  },
  saveEvent(event: Event) {
    db.events
      .add(event)
      .catch('ConstraintError', () => {
        // fails if already exists
      })
      .catch((e) => {
        console.error('error saving event', e);
      });
  },
  loadIDBEvents() {
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
};
