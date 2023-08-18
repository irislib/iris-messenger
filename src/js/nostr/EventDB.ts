import loki from 'lokijs';
import { Event, matchFilter } from 'nostr-tools';

import Filter from '@/nostr/Filter.ts';

class EventDB {
  private db: any;
  private eventsCollection: any;

  constructor() {
    this.db = new loki('EventDB');
    this.eventsCollection = this.db.addCollection('events', {
      unique: ['id'],
      indices: ['pubkey', 'kind', 'flatTags', 'created_at'],
    });
  }

  get(id: any): Event | undefined {
    return this.eventsCollection.by('id', id);
  }

  insert(event: Event): boolean {
    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }

    try {
      const flatTags = event.tags.filter((tag) => tag[0] === 'e').map((tag) => tag.join('_'));
      this.eventsCollection.insert({ ...event, flatTags });
    } catch (e) {
      return false;
    }

    return true;
  }

  remove(eventId: string): void {
    const doc = this.get(eventId);
    if (doc) {
      this.eventsCollection.remove(doc);
    }
  }

  find(filter: Filter, callback: (event: Event) => void): void {
    this.findArray(filter).forEach((event) => {
      callback(event);
    });
  }

  findArray(filter: Filter): Event[] {
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
        // hmm $contains doesn't seem to use binary indexes
        query.flatTags = { $contains: 'e_' + filter['#e'] };
      }
      if (filter['#p']) {
        // not indexing for now
        //query.flatTags = { $contains: 'p_' + filter['#p'] };
      }
      if (filter.since && filter.until) {
        query.created_at = { $between: [filter.since, filter.until] };
      }
      if (filter.since) {
        query.created_at = { $gte: filter.since };
      }
      if (filter.until) {
        query.created_at = { $lte: filter.until };
      }
    }

    let chain = this.eventsCollection
      .chain()
      .find(query)
      .where((e: Event) => {
        if (!matchFilter(filter, e)) {
          return false;
        }
        if (filter.keywords && !filter.keywords.some((keyword) => e.content?.includes(keyword))) {
          return false;
        }
        return true;
      })
      .simplesort('created_at', true);

    if (filter.limit) {
      chain = chain.limit(filter.limit);
    }

    return chain.data();
  }

  findAndRemove(filter: Filter) {
    const eventsToRemove = this.findArray(filter);
    eventsToRemove.forEach((event) => this.remove(event.id));
  }

  findOne(filter: Filter): Event | undefined {
    return this.findArray(filter)[0];
  }
}

export default new EventDB();
