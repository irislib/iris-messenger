type Comparator<K, V> = (a: { key: K; value: V }, b: { key: K; value: V }) => number;

export default class SortedMap<K, V> {
  private map: Map<K, V>;
  private sortedKeys: K[];
  private compare: Comparator<K, V>;

  constructor(compare?: Comparator<K, V>) {
    this.map = new Map();
    this.sortedKeys = [];
    this.compare = compare ?? ((a, b) => (a.key > b.key ? 1 : a.key < b.key ? -1 : 0));
  }

  set(key: K, value: V) {
    if (this.map.has(key)) {
      const index = this.sortedKeys.indexOf(key);
      if (index !== -1) {
        this.sortedKeys.splice(index, 1);
      }
    }

    // Add to map
    this.map.set(key, value);

    // Binary search and insertion
    let left = 0;
    let right = this.sortedKeys.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (
        this.compare(
          { key, value },
          { key: this.sortedKeys[mid], value: this.map.get(this.sortedKeys[mid]) as V },
        ) < 0
      ) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    this.sortedKeys.splice(left, 0, key);
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
