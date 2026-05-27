export const enum Priority {
  LOW = 0,
  HIGH = 1000
}

function sortedIndex<T extends IQueueItem>(array: T[], value: T): number {
  let low = 0,
    high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (value.priority < array[mid].priority) {
      low = mid + 1;
    } else if (value.priority == array[mid].priority) {
      if (array[mid].date <= value.date) low = mid + 1;
      else high = mid;
    } else {
      high = mid;
    }
  }

  return low;
}

interface IQueueItem {
  _id: number
  priority: number
  date: Date
}

class Queue<T extends IQueueItem> {
  queue: T[] = [];

  constructor(items?: T[]) {
    if (items) {
      for (const item of items) {
        this.addItem(item);
      }
    }
  }

  get length() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }

  addItem(item: T) {
    const index = sortedIndex(this.queue, item);
    this.queue.splice(index, 0, item);
  }

  addMany(items: T[]) {
    for (const item of items) {
      this.addItem(item);
    }
  }

  deleteItem(id: number): boolean {
    const index = this.findIndex(p => p._id == id);
    if (index != -1) this.queue.splice(index, 1);
    return index != -1;
  }

  replaceItem(id: number, item: T): boolean {
    const index = this.findIndex(p => p._id == id);
    if (index == -1) return false;
    this.queue[index] = item;
    return true;
  }

  hasMoreItems(): boolean {
    return this.queue.length > 0;
  }

  hasItem(id: number) {
    return this.some(p => p._id == id);
  }

  pop(): T {
    return this.queue.shift() as T;
  }

  popFirst(total: number): T[] {
    return this.queue.splice(0, total);
  }

  removeAt(index: number): T {
    return this.queue.splice(index, 1)[0];
  }

  some(needle: (value: T, index?: number, obj?: T[]) => boolean): boolean {
    return this.queue.some(needle);
  }

  findIndex(needle: (value: T, index?: number, obj?: T[]) => boolean): number {
    return this.queue.findIndex(needle);
  }
}

export default Queue;