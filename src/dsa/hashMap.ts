class HashEntry<K, V> {
  public key: K;
  public value: V;
  public next: HashEntry<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class HashMap<K, V> {
  private size: number;
  private buckets: (HashEntry<K, V> | null)[];
  private count: number;

  constructor(size = 137) {
    this.size = size;
    this.buckets = new Array(size).fill(null);
    this.count = 0;
  }

  private hash(key: any): number {
    const keyStr = String(key);
    let total = 0;
    for (let i = 0; i < keyStr.length; i++) {
      total += keyStr.charCodeAt(i) * (i + 1);
    }
    return total % this.size;
  }

  public put(key: K, value: V): void {
    const index = this.hash(key);
    const newEntry = new HashEntry(key, value);

    if (this.buckets[index] === null) {
      this.buckets[index] = newEntry;
      this.count++;
      return;
    }

    let current = this.buckets[index]!;
    while (current.next !== null) {
      if (current.key === key) {
        current.value = value; // update existing key
        return;
      }
      current = current.next;
    }

    if (current.key === key) {
      current.value = value;
    } else {
      current.next = newEntry;
      this.count++;
    }
  }

  public get(key: K): V | null {
    const index = this.hash(key);
    let current = this.buckets[index];

    while (current !== null) {
      if (current.key === key) {
        return current.value;
      }
      current = current.next;
    }

    return null;
  }

  public delete(key: K): boolean {
    const index = this.hash(key);
    let current = this.buckets[index];
    let prev: HashEntry<K, V> | null = null;

    while (current !== null) {
      if (current.key === key) {
        if (prev === null) {
          this.buckets[index] = current.next;
        } else {
          prev.next = current.next;
        }
        this.count--;
        return true;
      }
      prev = current;
      current = current.next;
    }

    return false;
  }

  public getCount(): number {
    return this.count;
  }
}
