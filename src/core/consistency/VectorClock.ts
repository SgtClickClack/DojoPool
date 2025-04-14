export interface VectorTimestamp {
  [nodeId: string]: number;
}

/**
 * Vector Clock implementation for distributed event ordering
 * Ensures causal consistency across distributed game states
 */
export class VectorClock {
  private timestamps: VectorTimestamp;
  private nodeId: string;

  constructor(nodeId: string) {
    this.timestamps = {};
    this.nodeId = nodeId;
    this.timestamps[nodeId] = 0;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Increment the local node's logical clock
   */
  public increment(): void {
    this.timestamps[this.nodeId] = (this.timestamps[this.nodeId] || 0) + 1;
  }

  /**
   * Get the current vector timestamp
   */
  public getTimestamp(): VectorTimestamp {
    return { ...this.timestamps };
  }

  /**
   * Get the current timestamp map
   */
  public getCurrentTimestamp(): VectorTimestamp {
    return { ...this.timestamps };
  }

  /**
   * Merge with another vector clock
   * Takes the maximum value for each node
   */
  public merge(other: VectorClock): void {
    Object.entries(other.timestamps).forEach(([id, count]) => {
      this.timestamps[id] = Math.max(count, this.timestamps[id] || 0);
    });
  }

  /**
   * Check if this clock happened before another clock
   */
  public isHappenedBefore(other: VectorClock): boolean {
    let hasLesser = false;
    for (const [id, count] of Object.entries(this.timestamps)) {
      const otherCount = other.timestamps[id] || 0;
      if (count > otherCount) return false;
      if (count < otherCount) hasLesser = true;
    }
    return hasLesser;
  }

  /**
   * Check if this clock is concurrent with another clock
   */
  public isConcurrent(other: VectorClock): boolean {
    return !this.isHappenedBefore(other) && !other.isHappenedBefore(this);
  }

  /**
   * Create a snapshot of the current clock state
   */
  public createSnapshot(): VectorTimestamp {
    return { ...this.timestamps };
  }

  /**
   * Reset the clock to a specific snapshot
   */
  public restoreFromSnapshot(snapshot: VectorTimestamp): void {
    this.timestamps = { ...snapshot };
  }

  public compare(other: VectorTimestamp): 'before' | 'after' | 'concurrent' {
    let isBefore = false;
    let isAfter = false;

    const allNodes = new Set([
      ...Object.keys(this.timestamps),
      ...Object.keys(other)
    ]);

    for (const nodeId of allNodes) {
      const selfTime = typeof this.timestamps[nodeId] === 'number' ? this.timestamps[nodeId] : 0;
      const otherTime = typeof other[nodeId] === 'number' ? other[nodeId] : 0;

      if (selfTime < otherTime) {
        isBefore = true;
      } else if (selfTime > otherTime) {
        isAfter = true;
      }

      if (isBefore && isAfter) {
        return 'concurrent';
      }
    }

    if (isBefore && !isAfter) return 'before';
    if (isAfter && !isBefore) return 'after';
    return 'concurrent';
  }

  getCurrentValue(): VectorTimestamp {
    return { ...this.timestamps };
  }

  public clone(): VectorClock {
    return new VectorClock(this.getNodeId());
  }

  public equals(other: VectorClock): boolean {
    const allNodeIds = new Set([
      ...Object.keys(this.timestamps),
      ...Object.keys(other.timestamps)
    ]);

    for (const nodeId of allNodeIds) {
      if ((this.timestamps[nodeId] || 0) !== (other.timestamps[nodeId] || 0)) {
        return false;
      }
    }
    return true;
  }
} 