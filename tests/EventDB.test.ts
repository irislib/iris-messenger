import { Event } from 'nostr-tools';
import { beforeEach, describe, expect, test } from 'vitest';

import { EventDB } from '@/nostr/EventDB.ts';

import events from './events.json';

describe('EventDB', () => {
  let db: EventDB;
  let testEvent: Event;

  beforeEach(() => {
    db = new EventDB();

    testEvent = events[0];
    db.insert(testEvent);
  });

  test('should insert event', () => {
    const success = db.insert(events[1]);
    expect(success).toBe(true);
    expect(db.get(events[1].id)).toEqual(events[1]);
  });

  test('should get event by id', () => {
    const event = db.get(testEvent.id);
    expect(event).toEqual(testEvent);
  });

  test('should remove event by id', () => {
    db.remove(testEvent.id);
    expect(db.get(testEvent.id)).toBeUndefined();
  });

  test('should find events with a specific filter', () => {
    const filter = { authors: [testEvent.pubkey] };
    const foundEvents = db.findArray(filter);
    expect(foundEvents.length).toBeGreaterThanOrEqual(1);
    expect(foundEvents[0]).toEqual(testEvent);
  });

  test('should find and remove events based on filter', () => {
    const filter = { authors: [testEvent.pubkey] };
    db.findAndRemove(filter);
    expect(db.findArray(filter).length).toBe(0);
  });

  test('should return undefined for non-existing events', () => {
    const event = db.get('non-existing-id');
    expect(event).toBeUndefined();
  });

  test('should handle invalid event insertion', () => {
    const invalidEvent = { ...testEvent, id: undefined };
    expect(() => db.insert(invalidEvent as any)).toThrow('Invalid event');
  });

  test('should findOne event based on filter', () => {
    const filter = { authors: [testEvent.pubkey] };
    const foundEvent = db.findOne(filter);
    expect(foundEvent).toEqual(testEvent);
  });

});
