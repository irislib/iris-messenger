enum Color {
  Red,
  Black,
}

const Red = Color.Red;
const Black = Color.Black;

type Comparator<K, V> = (a: { key: K; value: V }, b: { key: K; value: V }) => number;

class TreeNode<K, V> {
  key: K;
  value: V;
  left: TreeNode<K, V> | null = null;
  right: TreeNode<K, V> | null = null;
  color: Color = Red; // Nodes are red by default when inserted

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export default class SortedMap<K, V> {
  private root: TreeNode<K, V> | null = null;
  private compare: Comparator<K, V>;

  constructor(compare?: string | Comparator<K, V>) {
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

  private rotateLeft(node: TreeNode<K, V>): TreeNode<K, V> {
    const newRoot = node.right!;
    node.right = newRoot.left;
    newRoot.left = node;
    newRoot.color = node.color;
    node.color = Red;
    return newRoot;
  }

  private rotateRight(node: TreeNode<K, V>): TreeNode<K, V> {
    const newRoot = node.left!;
    node.left = newRoot.right;
    newRoot.right = node;
    newRoot.color = node.color;
    node.color = Red;
    return newRoot;
  }

  private flipColors(node: TreeNode<K, V>): void {
    node.color = node.color === Black ? Red : Black;
    if (node.left) node.left.color = node.left.color === Black ? Red : Black;
    if (node.right) node.right.color = node.right.color === Black ? Red : Black;
  }

  private fixUp(node: TreeNode<K, V>): TreeNode<K, V> {
    if (node.right && node.right.color === Red && (!node.left || node.left.color === Black)) {
      node = this.rotateLeft(node);
    }

    if (node.left && node.left.color === Red && node.left.left && node.left.left.color === Red) {
      node = this.rotateRight(node);
    }

    if (node.left && node.left.color === Red && node.right && node.right.color === Red) {
      this.flipColors(node);
    }

    return node;
  }

  private insertNode(node: TreeNode<K, V> | null, key: K, value: V): TreeNode<K, V> {
    if (node === null) {
      return new TreeNode(key, value);
    }

    const comparison = this.compare({ key, value }, { key: node.key, value: node.value });

    if (comparison < 0) {
      node.left = this.insertNode(node.left, key, value);
    } else if (comparison > 0) {
      node.right = this.insertNode(node.right, key, value);
    } else {
      node.value = value;
    }

    return this.fixUp(node);
  }

  set(key: K, value: V) {
    this.root = this.insertNode(this.root, key, value);
    this.root!.color = Black; // Root is always black
  }

  private findNode(node: TreeNode<K, V> | null, key: K): TreeNode<K, V> | null {
    if (node === null) return null;

    const comparison = this.compare(
      { key, value: node.value },
      { key: node.key, value: node.value },
    );

    if (comparison < 0) return this.findNode(node.left, key);
    if (comparison > 0) return this.findNode(node.right, key);

    return node;
  }

  get(key: K): V | undefined {
    const node = this.findNode(this.root, key);
    return node ? node.value : undefined;
  }

  first(): { key: K; value: V } | undefined {
    let node = this.root;
    while (node && node.left) {
      node = node.left;
    }
    return node ? { key: node.key, value: node.value } : undefined;
  }

  last(): { key: K; value: V } | undefined {
    let node = this.root;
    while (node && node.right) {
      node = node.right;
    }
    return node ? { key: node.key, value: node.value } : undefined;
  }

  private *inOrderTraversal(node: TreeNode<K, V> | null): IterableIterator<{ key: K; value: V }> {
    if (node) {
      yield* this.inOrderTraversal(node.left);
      yield { key: node.key, value: node.value };
      yield* this.inOrderTraversal(node.right);
    }
  }

  *[Symbol.iterator](): Iterator<{ key: K; value: V }> {
    yield* this.inOrderTraversal(this.root);
  }

  *reverse(): Iterator<{ key: K; value: V }> {
    // For simplicity, we use an array to reverse
    const arr = [...this.inOrderTraversal(this.root)];
    for (let i = arr.length - 1; i >= 0; i--) {
      yield arr[i];
    }
  }

  *keys(): IterableIterator<K> {
    for (const entry of this.inOrderTraversal(this.root)) {
      yield entry.key;
    }
  }

  *values(): IterableIterator<V> {
    for (const entry of this.inOrderTraversal(this.root)) {
      yield entry.value;
    }
  }

  *entries(): IterableIterator<[K, V]> {
    for (const entry of this.inOrderTraversal(this.root)) {
      yield [entry.key, entry.value];
    }
  }

  range(
    options: {
      gte?: K;
      lte?: K;
      direction?: 'asc' | 'desc';
    } = {},
  ): IterableIterator<{ key: K; value: V }> {
    const { gte, lte, direction = 'asc' } = options;

    if (direction === 'asc') {
      return this.inOrderRange(this.root, gte, lte);
    } else {
      return this.reverseInOrderRange(this.root, gte, lte);
    }
  }

  private *inOrderRange(
    node: TreeNode<K, V> | null,
    gte?: K,
    lte?: K,
  ): Generator<{ key: K; value: V }> {
    if (!node) return;

    if (gte) {
      const gteComparison = this.compare(
        { key: gte, value: this.get(gte) as V },
        { key: node.key, value: node.value },
      );
      if (gteComparison > 0) {
        yield* this.inOrderRange(node.right, gte, lte);
        return;
      }
    }

    if (lte) {
      const lteComparison = this.compare(
        { key: lte, value: this.get(lte) as V },
        { key: node.key, value: node.value },
      );
      if (lteComparison < 0) {
        yield* this.inOrderRange(node.left, gte, lte);
        return;
      }
    }

    yield* this.inOrderRange(node.left, gte, lte);
    yield { key: node.key, value: node.value };
    yield* this.inOrderRange(node.right, gte, lte);
  }

  private *reverseInOrderRange(
    node: TreeNode<K, V> | null,
    gte?: K,
    lte?: K,
  ): Generator<{ key: K; value: V }> {
    if (!node) return;

    if (lte) {
      const lteComparison = this.compare(
        { key: lte, value: this.get(lte) as V },
        { key: node.key, value: node.value },
      );
      if (lteComparison < 0) {
        yield* this.reverseInOrderRange(node.left, gte, lte);
        return;
      }
    }

    if (gte) {
      const gteComparison = this.compare(
        { key: gte, value: this.get(gte) as V },
        { key: node.key, value: node.value },
      );
      if (gteComparison > 0) {
        yield* this.reverseInOrderRange(node.right, gte, lte);
        return;
      }
    }

    yield { key: node.key, value: node.value };
    yield* this.reverseInOrderRange(node.right, gte, lte);
    yield* this.reverseInOrderRange(node.left, gte, lte);
  }

  has(key: K): boolean {
    return this.findNode(this.root, key) !== null;
  }

  private isRed(node: TreeNode<K, V> | null): boolean {
    if (!node) return false;
    return node.color === Red;
  }

  private moveRedLeft(node: TreeNode<K, V>): TreeNode<K, V> {
    this.flipColors(node);
    if (node.right && this.isRed(node.right.left)) {
      node.right = this.rotateRight(node.right);
      node = this.rotateLeft(node);
      this.flipColors(node);
    }
    return node;
  }

  private moveRedRight(node: TreeNode<K, V>): TreeNode<K, V> {
    this.flipColors(node);
    if (node.left && this.isRed(node.left.left)) {
      node = this.rotateRight(node);
      this.flipColors(node);
    }
    return node;
  }

  private deleteMinNode(node: TreeNode<K, V>): TreeNode<K, V> | null {
    if (!node.left) return null;
    if (!this.isRed(node.left) && !this.isRed(node.left.left)) {
      node = this.moveRedLeft(node);
    }
    node.left = this.deleteMinNode(node.left!);
    return this.fixUp(node);
  }

  private minNode(node: TreeNode<K, V>): TreeNode<K, V> {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  private deleteNode(node: TreeNode<K, V> | null, key: K): TreeNode<K, V> | null {
    if (this.compare({ key, value: null! }, { key: node!.key, value: node!.value }) < 0) {
      if (!node!.left) return null;
      if (!this.isRed(node!.left) && !this.isRed(node!.left.left)) {
        node = this.moveRedLeft(node!);
      }
      node!.left = this.deleteNode(node!.left, key);
    } else {
      if (this.isRed(node!.left)) {
        node = this.rotateRight(node!);
      }
      if (
        this.compare({ key, value: null! }, { key: node!.key, value: node!.value }) === 0 &&
        !node!.right
      ) {
        return null;
      }
      if (!this.isRed(node!.right) && !this.isRed(node!.right!.left)) {
        node = this.moveRedRight(node!);
      }
      if (this.compare({ key, value: null! }, { key: node!.key, value: node!.value }) === 0) {
        const x = this.minNode(node!.right!);
        node!.key = x.key;
        node!.value = x.value;
        node!.right = this.deleteMinNode(node!.right!);
      } else {
        node!.right = this.deleteNode(node!.right, key);
      }
    }
    return this.fixUp(node!);
  }

  delete(key: K): boolean {
    if (!this.has(key)) return false;
    if (!this.isRed(this.root!.left) && !this.isRed(this.root!.right)) {
      this.root!.color = Red;
    }
    this.root = this.deleteNode(this.root, key);
    if (this.root) this.root!.color = Black;
    return true;
  }

  // Calculating size efficiently would require augmenting the tree with size data.
  get size(): number {
    // Naive implementation
    return [...this.keys()].length;
  }
}
