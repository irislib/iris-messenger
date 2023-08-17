import loki from 'lokijs';
import { Event, matchFilter } from 'nostr-tools';

import Filter from '@/nostr/Filter.ts';

export default class EventDB {
  private db: any;
  private eventsCollection: any;

  constructor() {
    this.db = new loki('EventDB');
    this.eventsCollection = this.db.addCollection('events', {
      unique: ['id'],
      indices: ['pubkey', 'kind', 'tags', 'created_at'],
    });
  }

  get(id: any): Event | undefined {
    return this.eventsCollection.by('id', id);
  }

  insert(event: Event): boolean {
    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }

    if (this.get(event.id)) {
      return false;
    }
    this.eventsCollection.insert(event);

    return true;
  }

  remove(eventId: string): void {
    const doc = this.get(eventId);
    if (doc) {
      this.eventsCollection.remove(doc);
    }
  }

  find(filter: Filter, callback: (event: Event) => void): void {
    const query: any = {};

    if (filter.ids) {
      query.id = { $in: filter.ids };
    } else {
      if (filter.authors) {
        query.pubkey = { $in: filter.authors };
      }
      if (filter.kinds) {
        query.kind = { $in: filter.kinds };
      }
      if (filter['#e']) {
        query.tags = { $contains: ['e', filter['#e']] };
      }
      if (filter['#p']) {
        query.tags = { $contains: ['p', filter['#p']] };
      }
    }

    const results = this.eventsCollection
      .chain()
      .find(query)
      .where((e: Event) => matchFilter(filter, e))
      .simplesort('created_at', true)
      .data();

    results.forEach(callback);
  }

  findArray(filter: Filter): Event[] {
    const events: Event[] = [];
    this.find(filter, (event) => events.push(event));
    return events;
  }

  findAndRemove(filter: Filter) {
    const eventsToRemove = this.findArray(filter);
    eventsToRemove.forEach((event) => this.remove(event.id));
  }

  findOne(filter: Filter): Event | undefined {
    return this.findArray(filter)[0];
  }
}
