type Comparator<K, V> = (a: [K, V], b: [K, V]) => number;

export default class SortedMap<K, V> {
  private map: Map<K, V>;
  private sortedKeys: K[];
  private compare: Comparator<K, V>;

  constructor(initialEntries?: Iterable<readonly [K, V]>, compare?: string | Comparator<K, V>) {
    this.map = new Map(initialEntries || []);

    if (compare) {
      if (typeof compare === 'string') {
        this.compare = (a, b) =>
          a[1][compare] > b[1][compare] ? 1 : a[1][compare] < b[1][compare] ? -1 : 0;
      } else {
        this.compare = compare;
      }
    } else {
      this.compare = (a, b) => (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0);
    }

    this.sortedKeys = initialEntries
      ? [...this.map.entries()].sort(this.compare).map(([key]) => key)
      : [];
  }

  private binarySearch(key: K, value: V): number {
    let left = 0;
    let right = this.sortedKeys.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      const midKey = this.sortedKeys[mid];
      const midValue = this.map.get(midKey) as V;

      if (this.compare([key, value], [midKey, midValue]) < 0) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    return left;
  }

  set(key: K, value: V) {
    const exists = this.map.has(key);
    this.map.set(key, value);

    if (exists) {
      const index = this.sortedKeys.indexOf(key);
      if (index !== -1) {
        this.sortedKeys.splice(index, 1);
      }
    }

    const insertAt = this.binarySearch(key, value);
    this.sortedKeys.splice(insertAt, 0, key);
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  last(): [K, V] | undefined {
    if (this.sortedKeys.length === 0) {
      return undefined;
    }
    const key = this.sortedKeys[this.sortedKeys.length - 1];
    return [key, this.map.get(key) as V];
  }

  first(): [K, V] | undefined {
    if (this.sortedKeys.length === 0) {
      return undefined;
    }
    const key = this.sortedKeys[0];
    return [key, this.map.get(key) as V];
  }

  *[Symbol.iterator](): Iterator<[K, V]> {
    for (const key of this.sortedKeys) {
      yield [key, this.map.get(key) as V];
    }
  }

  *reverse(): Iterator<[K, V]> {
    for (let i = this.sortedKeys.length - 1; i >= 0; i--) {
      const key = this.sortedKeys[i];
      yield [key, this.map.get(key) as V];
    }
  }

  *keys(): IterableIterator<K> {
    for (const key of this.sortedKeys) {
      yield key;
    }
  }

  *values(): IterableIterator<V> {
    for (const key of this.sortedKeys) {
      yield this.map.get(key) as V;
    }
  }

  *entries(): IterableIterator<[K, V]> {
    for (const key of this.sortedKeys) {
      yield [key, this.map.get(key) as V];
    }
  }

  *range(
    options: {
      gte?: K;
      lte?: K;
      direction?: 'asc' | 'desc';
    } = {},
  ): IterableIterator<[K, V]> {
    const { gte, lte, direction = 'asc' } = options;

    const startIndex = gte ? this.binarySearch(gte, this.map.get(gte) as V) : 0;
    const endIndex = lte ? this.binarySearch(lte, this.map.get(lte) as V) : this.sortedKeys.length;

    if (direction === 'asc') {
      for (let i = startIndex; i < endIndex; i++) {
        const key = this.sortedKeys[i];
        yield [key, this.map.get(key) as V];
      }
    } else {
      for (let i = endIndex - 1; i >= startIndex; i--) {
        const key = this.sortedKeys[i];
        yield [key, this.map.get(key) as V];
      }
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    if (this.map.delete(key)) {
      const index = this.sortedKeys.indexOf(key);
      if (index !== -1) {
        this.sortedKeys.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  get size(): number {
    return this.map.size;
  }
}
