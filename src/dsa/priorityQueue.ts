export interface PQNode<T> {
  element: T;
  priority: number;
}

export class PriorityQueue<T> {
  private heap: PQNode<T>[];

  constructor() {
    this.heap = [];
  }

  public enqueue(element: T, priority: number): void {
    const node = { element, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): T | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0].element;
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  public peek(): T | null {
    return this.heap.length > 0 ? this.heap[0].element : null;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const current = this.heap[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;
      let leftChild: PQNode<T> | null = null;
      let rightChild: PQNode<T> | null = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.priority < current.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swapIndex === null && rightChild.priority < current.priority) ||
          (swapIndex !== null && rightChild.priority < leftChild!.priority)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;

      this.swap(index, swapIndex);
      index = swapIndex;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
