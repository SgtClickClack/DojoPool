import { VectorClock } from "./VectorClock";
import { CRDTValue, VectorTimestamp } from "../../types/consistency";

/**
 * Last-Write-Wins Register CRDT implementation
 * Ensures eventual consistency with a clear winner in concurrent updates
 */
export class LWWRegister<T> {
  private value: CRDTValue<T>;
  private vectorClock: VectorClock;

  constructor(initialValue: T, nodeId: string) {
    this.vectorClock = new VectorClock(nodeId);
    this.value = {
      value: initialValue,
      timestamp: this.vectorClock.getCurrentTimestamp(),
    };
  }

  /**
   * Get the current value
   */
  getValue(): T {
    return this.value.value;
  }

  /**
   * Update the register with a new value
   */
  update(newValue: T): void {
    this.vectorClock.increment();
    this.value = {
      value: newValue,
      timestamp: this.vectorClock.getCurrentTimestamp(),
    };
  }

  /**
   * Merge with another register
   * Uses vector clock comparison for conflict resolution
   */
  merge(other: LWWRegister<T>): void {
    if (this.isNewer(other.value.timestamp)) {
      this.value = other.value;
      this.vectorClock.merge(other.vectorClock);
    }
  }

  /**
   * Check if a timestamp is newer than the current one
   */
  private isNewer(timestamp: VectorTimestamp): boolean {
    return timestamp.counter > this.value.timestamp.counter;
  }

  /**
   * Get the current vector clock
   */
  getVectorClock(): VectorClock {
    return this.vectorClock;
  }

  /**
   * Create a snapshot of the current state
   */
  snapshot(): { value: T; timestamp: VectorTimestamp } {
    return {
      value: this.value.value,
      timestamp: { ...this.value.timestamp },
    };
  }
}

/**
 * Grow-Only Set CRDT implementation
 * Allows only additions, perfect for tracking unique events
 */
export class GSet<T> {
  private items: Set<T>;
  private vectorClock: VectorClock;

  constructor(nodeId: string) {
    this.items = new Set<T>();
    this.vectorClock = new VectorClock(nodeId);
  }

  /**
   * Add an item to the set
   */
  add(item: T): void {
    this.items.add(item);
    this.vectorClock.increment();
  }

  /**
   * Get all items in the set
   */
  values(): T[] {
    return Array.from(this.items);
  }

  /**
   * Merge with another G-Set
   */
  merge(other: GSet<T>): void {
    other.values().forEach((item) => this.items.add(item));
    this.vectorClock.merge(other.vectorClock);
  }

  /**
   * Check if an item exists in the set
   */
  has(item: T): boolean {
    return this.items.has(item);
  }

  /**
   * Get the current size of the set
   */
  size(): number {
    return this.items.size;
  }
}

/**
 * Two-Phase Set CRDT implementation
 * Allows both additions and removals while maintaining consistency
 */
export class TwoPhaseSet<T> {
  private added: GSet<T>;
  private removed: GSet<T>;

  constructor(nodeId: string) {
    this.added = new GSet<T>(nodeId);
    this.removed = new GSet<T>(nodeId);
  }

  /**
   * Add an item to the set
   */
  add(item: T): void {
    if (!this.removed.has(item)) {
      this.added.add(item);
    }
  }

  /**
   * Remove an item from the set
   */
  remove(item: T): void {
    if (this.added.has(item)) {
      this.removed.add(item);
    }
  }

  /**
   * Get all current items (added but not removed)
   */
  values(): T[] {
    return this.added.values().filter((item) => !this.removed.has(item));
  }

  /**
   * Merge with another 2P-Set
   */
  merge(other: TwoPhaseSet<T>): void {
    this.added.merge(other.added);
    this.removed.merge(other.removed);
  }

  /**
   * Check if an item exists in the set
   */
  has(item: T): boolean {
    return this.added.has(item) && !this.removed.has(item);
  }

  /**
   * Get the current size of the set
   */
  size(): number {
    return this.values().length;
  }
}
