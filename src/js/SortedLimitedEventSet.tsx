import { Event } from './lib/nostr-tools';

export default class SortedLimitedEventSet {
  private events: { id: string; created_at: number }[];
  private maxSize: number;

  constructor(maxSize: number) {
    this.events = [];
    this.maxSize = maxSize;
  }

  add(event: Event): boolean {
    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }
    if (this.events.length < this.maxSize) {
      // If the set is not full, simply add the event
      this.events.push({ id: event.id, created_at: event.created_at });
    } else if (event.created_at > this.events[this.events.length - 1].created_at) {
      // If the set is full and the new event has a newer timestamp, replace the oldest event
      this.events[this.events.length - 1] = { id: event.id, created_at: event.created_at };
    } else {
      // If the set is full and the new event has an older timestamp, do nothing
      return false;
    }

    // Sort the events in descending order by created_at
    this.events.sort((a, b) => b.created_at - a.created_at);
    return true;
  }

  get eventIds(): string[] {
    return this.events.map((event) => event.id);
  }
}
