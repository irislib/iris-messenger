import { Event } from 'nostr-tools';

import Events from '../nostr/Events';

export default class SortedEventMap {
  private eventMap: Map<string, Event>; // or should we store just strings, getting Events from loki?
  private sortedEventIds: string[];
  private sortBy: string;
  private sortDirection: string;

  constructor(sortBy = 'created_at', sortDirection = 'desc') {
    this.sortBy = sortBy;
    this.sortDirection = sortDirection;
    this.eventMap = new Map<string, Event>();
    this.sortedEventIds = [];
  }

  compareFn(a, b) {
    let aVal;
    let bVal;
    if (!a || !b) return 0;
    if (a && !b) return -1;
    if (!a && b) return 1;
    if (this.sortBy === 'created_at') {
      aVal = a.created_at;
      bVal = b.created_at;
    } else if (this.sortBy === 'likes') {
      aVal = Events.likesByMessageId.get(a.id)?.size || 0;
      bVal = Events.likesByMessageId.get(b.id)?.size || 0;
    } else if (this.sortBy === 'zaps') {
      aVal = Events.zapsByNote.get(a.id)?.size || 0;
      bVal = Events.zapsByNote.get(b.id)?.size || 0;
    }
    if (this.sortDirection === 'desc') {
      return bVal - aVal;
    } else {
      return aVal - bVal;
    }
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

  last(): Event | undefined {
    return this.eventMap.get(this.sortedEventIds[this.sortedEventIds.length - 1]);
  }

  first(): Event | undefined {
    return this.eventMap.get(this.sortedEventIds[0]);
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
