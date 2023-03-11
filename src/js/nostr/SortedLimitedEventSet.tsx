import { Event } from '../lib/nostr-tools';

export default class SortedLimitedEventSet {
  private events: { id: string; created_at: number }[];
  private eventIdSet: Set<string>;
  private maxSize: number;
  private descending: boolean;

  constructor(maxSize: number, descending = true) {
    this.events = [];
    this.eventIdSet = new Set(); // so we can check if an event is already in the set in O(1) time
    this.maxSize = maxSize;
    this.descending = descending;
  }

  get size(): number {
    return this.events.length;
  }

  first(): string | undefined {
    return this.events[0]?.id;
  }

  has(eventId: string): boolean {
    return this.eventIdSet.has(eventId);
  }

  add(event: Event): boolean {
    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }
    if (this.eventIdSet.has(event.id)) {
      return false;
    }
    if (this.events.length < this.maxSize) {
      // If the set is not full, simply add the event
      this.events.push({ id: event.id, created_at: event.created_at });
    } else if (event.created_at > this.events[this.events.length - 1].created_at) {
      // If the set is full and the new event has a newer timestamp, replace the oldest event
      this.eventIdSet.delete(this.events[this.events.length - 1].id);
      this.events[this.events.length - 1] = { id: event.id, created_at: event.created_at };
      this.eventIdSet.add(event.id);
      // TODO evict deleted event from Events.db if not indexed anywhere else
    } else {
      // If the set is full and the new event has an older timestamp, do nothing
      return false;
    }

    // Sort the events in descending order by created_at
    this.eventIdSet.add(event.id);
    this.events.sort((a, b) =>
      this.descending ? b.created_at - a.created_at : a.created_at - b.created_at,
    );
    return true;
  }

  delete(eventId: string): boolean {
    const deleted = this.eventIdSet.delete(eventId);
    if (!deleted) {
      return false;
    }
    const index = this.events.findIndex((event) => event.id === eventId);
    if (index === -1) {
      return false;
    }
    this.events.splice(index, 1);
    return true;
  }

  get eventIds(): string[] {
    return this.events.map((event) => event.id);
  }

  values(): string[] {
    return this.events.map((event) => event.id);
  }
}
