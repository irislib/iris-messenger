import { Event } from '../lib/nostr-tools';

type CompareFn = (a: Event, b: Event) => number;

export default class SortedEventMap {
  private eventMap: Map<string, Event>; // or should we store just strings, getting Events from loki?
  private sortedEventIds: string[];
  private compareFn: CompareFn;

  constructor(compareFn: CompareFn) {
    this.eventMap = new Map<string, Event>();
    this.sortedEventIds = [];
    this.compareFn = compareFn;
  }

  has(eventId: string): boolean {
    return this.eventMap.has(eventId);
  }

  add(event: Event): boolean {
    if (!event || !event.id || !event.created_at) {
      throw new Error('Invalid event');
    }
    if (this.eventMap.has(event.id)) {
      return false;
    }

    this.eventMap.set(event.id, event);
    this.insertEventId(event.id);
    return true;
  }

  delete(eventId: string): boolean {
    const deleted = this.eventMap.delete(eventId);
    if (!deleted) {
      return false;
    }

    const index = this.sortedEventIds.findIndex((id) => id === eventId);
    if (index === -1) {
      return false;
    }

    this.sortedEventIds.splice(index, 1);
    return true;
  }

  get eventIds(): string[] {
    return this.sortedEventIds;
  }

  get(eventId: string): Event | undefined {
    return this.eventMap.get(eventId);
  }

  events(): Event[] {
    return this.sortedEventIds.map((id) => this.eventMap.get(id)!);
  }

  setComparator(compareFn: CompareFn): void {
    this.compareFn = compareFn;
    this.sortedEventIds.sort((a, b) => {
      const eventA = this.eventMap.get(a)!;
      const eventB = this.eventMap.get(b)!;

      return this.compareFn(eventA, eventB);
    });
  }

  get size(): number {
    return this.eventMap.size;
  }

  private insertEventId(eventId: string): void {
    const event = this.eventMap.get(eventId)!;
    let left = 0;
    let right = this.sortedEventIds.length;

    while (left < right) {
      const middle = Math.floor((left + right) / 2);
      const middleEvent = this.eventMap.get(this.sortedEventIds[middle])!;
      if (this.compareFn(event, middleEvent) < 0) {
        right = middle;
      } else {
        left = middle + 1;
      }
    }

    this.sortedEventIds.splice(left, 0, eventId);
  }
}
