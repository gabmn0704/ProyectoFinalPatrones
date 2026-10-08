export class HashMap<T> {
  private readonly buckets: Array<Array<[string, T]>>;
  private count = 0;

  constructor(private readonly capacity = 31) {
    this.buckets = Array.from({ length: capacity }, () => []);
  }

  set(key: string, value: T): void {
    const bucket = this.buckets[this.hash(key)];
    const entry = bucket.find(([storedKey]) => storedKey === key);
    if (entry) {
      entry[1] = value;
      return;
    }
    bucket.push([key, value]);
    this.count += 1;
  }

  get(key: string): T | undefined {
    return this.buckets[this.hash(key)].find(([storedKey]) => storedKey === key)?.[1];
  }

  entries(): Array<[string, T]> {
    return this.buckets.flatMap((bucket) => bucket.map(([key, value]): [string, T] => [key, value]));
  }

  get size(): number {
    return this.count;
  }

  private hash(key: string): number {
    let hashValue = 0;
    for (let index = 0; index < key.length; index += 1) {
      hashValue = (hashValue * 31 + key.charCodeAt(index)) % this.capacity;
    }
    return hashValue;
  }
}

export class Queue<T> {
  private readonly items: T[] = [];
  private head = 0;

  enqueue(value: T): void {
    this.items.push(value);
  }

  dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const value = this.items[this.head];
    this.head += 1;
    if (this.head > 32 && this.head * 2 > this.items.length) {
      this.items.splice(0, this.head);
      this.head = 0;
    }
    return value;
  }

  get size(): number {
    return this.items.length - this.head;
  }
}

export class Stack<T> {
  private readonly items: T[] = [];

  push(value: T): void {
    this.items.push(value);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get size(): number {
    return this.items.length;
  }
}

interface ListNode<T> {
  value: T;
  next?: ListNode<T>;
  previous?: ListNode<T>;
}

export class DoublyLinkedList<T> implements Iterable<T> {
  private first?: ListNode<T>;
  private last?: ListNode<T>;
  private length = 0;

  append(value: T): void {
    const node: ListNode<T> = { value, previous: this.last };
    if (this.last) this.last.next = node;
    else this.first = node;
    this.last = node;
    this.length += 1;
  }

  get size(): number {
    return this.length;
  }

  *[Symbol.iterator](): Iterator<T> {
    let current = this.first;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

interface TreeNode<T> {
  key: number;
  value: T;
  left?: TreeNode<T>;
  right?: TreeNode<T>;
}

export class BinarySearchTree<T> {
  private root?: TreeNode<T>;

  insert(key: number, value: T): void {
    const place = (node: TreeNode<T> | undefined): TreeNode<T> => {
      if (!node) return { key, value };
      if (key === node.key) node.value = value;
      else if (key < node.key) node.left = place(node.left);
      else node.right = place(node.right);
      return node;
    };
    this.root = place(this.root);
  }

  inOrder(): T[] {
    const result: T[] = [];
    const visit = (node?: TreeNode<T>): void => {
      if (!node) return;
      visit(node.left);
      result.push(node.value);
      visit(node.right);
    };
    visit(this.root);
    return result;
  }
}

export class PriorityQueue<T> {
  private readonly heap: Array<{ value: T; priority: number }> = [];

  enqueue(value: T, priority: number): void {
    this.heap.push({ value, priority });
    let child = this.heap.length - 1;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.heap[parent].priority <= this.heap[child].priority) break;
      [this.heap[parent], this.heap[child]] = [this.heap[child], this.heap[parent]];
      child = parent;
    }
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const first = this.heap[0].value;
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
        if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
        if (smallest === parent) break;
        [this.heap[parent], this.heap[smallest]] = [this.heap[smallest], this.heap[parent]];
        parent = smallest;
      }
    }
    return first;
  }

  get size(): number {
    return this.heap.length;
  }
}

export class CareNetworkGraph {
  private readonly adjacency = new Map<string, Set<string>>();

  connect(first: string, second: string): void {
    if (!this.adjacency.has(first)) this.adjacency.set(first, new Set());
    if (!this.adjacency.has(second)) this.adjacency.set(second, new Set());
    this.adjacency.get(first)?.add(second);
    this.adjacency.get(second)?.add(first);
  }

  reachableFrom(start: string): string[] {
    const visited = new Set([start]);
    const queue = new Queue<string>();
    queue.enqueue(start);
    const result: string[] = [];
    while (queue.size > 0) {
      const current = queue.dequeue();
      if (!current) continue;
      for (const neighbor of this.adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        result.push(neighbor);
        queue.enqueue(neighbor);
      }
    }
    return result;
  }
}
