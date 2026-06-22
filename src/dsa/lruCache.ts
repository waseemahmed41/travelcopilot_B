class LRUNode<K, V> {
  public key: K;
  public value: V;
  public prev: LRUNode<K, V> | null = null;
  public next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  public get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) return null;

    // Move accessed node to head
    this.moveToHead(node);
    return node.value;
  }

  public put(key: K, value: V): void {
    const existingNode = this.map.get(key);
    if (existingNode) {
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    const newNode = new LRUNode(key, value);
    this.map.set(key, newNode);
    this.addToHead(newNode);

    if (this.map.size > this.capacity) {
      this.removeLRUItem();
    }
  }

  public clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  public getKeys(): K[] {
    return Array.from(this.map.keys());
  }

  private addToHead(node: LRUNode<K, V>): void {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    node.prev = null;
    node.next = null;
    this.addToHead(node);
  }

  private removeLRUItem(): void {
    if (!this.tail) return;
    const lruKey = this.tail.key;
    this.removeNode(this.tail);
    this.map.delete(lruKey);
  }
}
