import loki from 'lokijs';
import { Event, Filter } from 'nostr-tools';

import { ID, STR } from '@/utils/UniqueIds';

export class EventDB {
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
    const event = this.eventsCollection.by('id', ID(id));
    if (event) {
      return this.unpack(event);
    }
  }

  // map to internal UIDs to save memory
  private pack(event: Event) {
    const clone: any = { ...event };
    clone.tags = event.tags.map((tag) => {
      if (['e', 'p'].includes(tag[0])) {
        return [tag[0], ID(tag[1])];
      } else {
        return tag;
      }
    });
    clone.pubkey = ID(event.pubkey);
    clone.id = ID(event.id);
    return clone;
  }

  private unpack(packedEvent: any): Event {
    const original: any = { ...packedEvent };
    delete original.flatTags;
    delete original.$loki;
    delete original.meta;

    // Convert every ID back to original tag[1], tag[2], ...
    original.tags = packedEvent.tags.map((tag) => {
      if (['e', 'p'].includes(tag[0])) {
        return [tag[0], STR(tag[1])];
      } else {
        return tag;
      }
    });
    original.pubkey = STR(packedEvent.pubkey);
    original.id = STR(packedEvent.id);

    return original as Event;
  }

  insert(event: Event): boolean {
    // TODO map tags to UIDs

    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }

    const clone = this.pack(event);
    const flatTags = clone.tags
      .filter((tag) => ['e', 'p', 'd'].includes(tag[0]))
      .map((tag) => tag.join('_'));

    try {
      this.eventsCollection.insert({ ...clone, flatTags });
    } catch (e) {
      return false;
    }

    return true;
  }

  remove(eventId: string): void {
    const id = ID(eventId);
    this.eventsCollection.findAndRemove({ id });
  }

  find(filter: Filter, callback: (event: Event) => void): void {
    this.findArray(filter).forEach((event) => {
      // TODO map UID tags to STR
      callback(event);
    });
  }

  findArray(filter: Filter): Event[] {
    const query: any = this.constructQuery(filter);

    let chain = this.eventsCollection
      .chain()
      .find(query)
      .where((e: Event) => {
        if (filter.search && !e.content?.includes(filter.search)) {
          return false;
        }
        return true;
      })
      .simplesort('created_at', true);

    if (filter.limit) {
      chain = chain.limit(filter.limit);
    }

    return chain.data().map((e) => this.unpack(e));
  }

  findAndRemove(filter: Filter) {
    const query: any = this.constructQuery(filter);
    this.eventsCollection.findAndRemove(query);
  }

  private constructQuery(filter: Filter): any {
    const query: any = {};

    if (filter.ids) {
      query.id = { $in: filter.ids.map(ID) };
    } else {
      if (filter.authors) {
        query.pubkey = { $in: filter.authors.map(ID) };
      }
      if (filter.kinds) {
        query.kind = { $in: filter.kinds };
      }
      if (filter['#e']) {
        query.flatTags = { $contains: 'e_' + filter['#e'].map(ID) };
      } else if (filter['#p']) {
        query.flatTags = { $contains: 'p_' + filter['#p'].map(ID) };
      } else if (filter['#d']) {
        query.flatTags = { $contains: 'd_' + filter['#d'].map(ID) };
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

    return query;
  }

  findOne(filter: Filter): Event | undefined {
    return this.findArray(filter)[0];
  }
}

export default new EventDB();
