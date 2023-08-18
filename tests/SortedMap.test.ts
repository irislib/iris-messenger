import { describe, expect, it } from 'vitest';

import RBSortedMap from '../src/js/utils/RBSortedMap';
import SortedMap from '../src/js/utils/SortedMap';

function runTestsForMap(MapConstructor: any, mapName: string) {
  describe(mapName, () => {
    it('should maintain order based on keys when no custom comparator is provided', () => {
      const map = new MapConstructor<number, string>();
      map.set(5, 'five');
      map.set(3, 'three');
      map.set(8, 'eight');

      const first = map.first();
      const last = map.last();

      expect(first).toEqual({ key: 3, value: 'three' });
      expect(last).toEqual({ key: 8, value: 'eight' });
    });

    it('should maintain order based on custom comparator', () => {
      const comparator = (a: { key: string; value: number }, b: { key: string; value: number }) =>
        a.value - b.value;
      const map = new MapConstructor<string, number>(comparator);

      map.set('a', 5);
      map.set('b', 3);
      map.set('c', 8);

      const first = map.first();
      const last = map.last();

      expect(first).toEqual({ key: 'b', value: 3 });
      expect(last).toEqual({ key: 'c', value: 8 });
    });

    it('should get correct value by key', () => {
      const map = new MapConstructor<number, string>();
      map.set(5, 'five');

      const value = map.get(5);

      expect(value).toBe('five');
    });

    it('should delete entry by key', () => {
      const map = new MapConstructor<number, string>();
      map.set(5, 'five');
      expect(map.has(5)).toBe(true);

      map.delete(5);
      expect(map.has(5)).toBe(false);
    });

    it('should iterate in order', () => {
      const map = new MapConstructor<number, string>();
      map.set(5, 'five');
      map.set(3, 'three');
      map.set(8, 'eight');

      const entries: [number, string][] = [];
      for (const entry of map.entries()) {
        entries.push(entry);
      }

      expect(entries).toEqual([
        [3, 'three'],
        [5, 'five'],
        [8, 'eight'],
      ]);
    });

    it('should give correct size', () => {
      const map = new MapConstructor<number, string>();
      map.set(5, 'five');
      map.set(3, 'three');

      expect(map.size).toBe(2);
    });
  });
}

// Run the tests for both map implementations.
runTestsForMap(SortedMap, 'SortedMap');
runTestsForMap(RBSortedMap, 'RBSortedMap');
