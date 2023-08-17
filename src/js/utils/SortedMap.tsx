type Comparator<K, V> = (a: { key: K; value: V }, b: { key: K; value: V }) => number;

export default class SortedMap<K, V> {
  private map: Map<K, V>;
  private sortedKeys: K[];
  private compare: Comparator<K, V>;

  constructor(compare?: string | Comparator<K, V>) {
    this.map = new Map();
    this.sortedKeys = [];

    if (compare) {
      if (typeof compare === 'string') {
        this.compare = (a, b) =>
          a.value[compare] > b.value[compare] ? 1 : a.value[compare] < b.value[compare] ? -1 : 0;
      } else {
        this.compare = compare;
      }
    } else {
      this.compare = (a, b) => (a.key > b.key ? 1 : a.key < b.key ? -1 : 0);
    }
  }

  private binarySearch(key: K, value: V): number {
    let left = 0;
    let right = this.sortedKeys.length;
    while (left < right) {
      const mid = (left + right) >> 1; // bit shift for performance
      const midKey = this.sortedKeys[mid];
      const midValue = this.map.get(midKey) as V;

      if (this.compare({ key, value }, { key: midKey, value: midValue }) < 0) {
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

  *[Symbol.iterator](): Iterator<{ key: K; value: V }> {
    for (const key of this.sortedKeys) {
      yield { key, value: this.map.get(key) as V };
    }
  }

  *reverse(): Iterator<{ key: K; value: V }> {
    for (let i = this.sortedKeys.length - 1; i >= 0; i--) {
      const key = this.sortedKeys[i];
      yield { key, value: this.map.get(key) as V };
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
  ): IterableIterator<{ key: K; value: V }> {
    const { gte, lte, direction = 'asc' } = options;

    const startIndex = gte ? this.binarySearch(gte, this.map.get(gte) as V) : 0;
    const endIndex = lte ? this.binarySearch(lte, this.map.get(lte) as V) : this.sortedKeys.length;

    if (direction === 'asc') {
      for (let i = startIndex; i < endIndex; i++) {
        const key = this.sortedKeys[i];
        yield { key, value: this.map.get(key) as V };
      }
    } else {
      for (let i = endIndex - 1; i >= startIndex; i--) {
        const key = this.sortedKeys[i];
        yield { key, value: this.map.get(key) as V };
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
