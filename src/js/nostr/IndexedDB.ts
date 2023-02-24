import Dexie, { Table } from 'dexie';

import { Event } from '../lib/nostr-tools';

import Nostr from './Nostr';
export class MyDexie extends Dexie {
  events!: Table<Event>;

  constructor() {
    super('iris');
    this.version(1).stores({
      events: 'id, pubkey, kind, created_at', // Primary key and indexed props
    });
  }
}

const db = new MyDexie();

export default {
  db,
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
    let i = 0;
    const myPub = Nostr.getPubKey();
    db.events.where({ pubkey: myPub }).each((event) => {
      Nostr.handleEvent(event, false, false);
      i++;
    });
    const follows: string[] = Array.from(Nostr.followedByUser.get(myPub) || []);
    db.events
      .where('pubkey')
      .anyOf(follows)
      .each((event) => {
        Nostr.handleEvent(event, false, false);
        i++;
      });
    // other follow events
    db.events
      .where('pubkey')
      .noneOf([myPub, ...follows])
      .and((event) => event.kind === 3)
      .each((event) => {
        Nostr.handleEvent(event, false, false);
        i++;
      });
    // other events
    db.events
      .where('pubkey')
      .noneOf([myPub, ...follows])
      .and((event) => event.kind !== 3)
      .each((event) => {
        Nostr.handleEvent(event, false, false);
        i++;
      });
    console.log('loaded', i, 'events from idb');
  },
};
