import { VectorClock } from '../../core/consistency/VectorClock';
import { type VectorTimestamp } from '../../types/consistency';

describe('VectorClock', () => {
  let clock: VectorClock;
  let otherClock: VectorClock;

  beforeEach(() => {
    clock = new VectorClock('node1');
    otherClock = new VectorClock('node2');
  });

  describe('initialization', () => {
    it('should initialize with local node id and zero timestamp', () => {
      expect(clock.getTimestamp()).toEqual({ node1: 0 });
    });

    it('should initialize with provided clock values', () => {
      const initialClock: VectorTimestamp = { node1: 1, node2: 2 };
      const clock = new VectorClock('node1');
      clock.restoreFromSnapshot(initialClock);
      expect(clock.getTimestamp()).toEqual(initialClock);
    });
  });

  describe('increment', () => {
    it("should increment local node's counter", () => {
      clock.increment();
      expect(clock.getTimestamp()).toEqual({ node1: 1 });
    });

    it('should increment multiple times', () => {
      clock.increment();
      clock.increment();
      expect(clock.getTimestamp()).toEqual({ node1: 2 });
    });
  });

  describe('merge', () => {
    it('should take max values when merging clocks', () => {
      clock.increment(); // node1: 1
      otherClock.increment(); // node2: 1
      otherClock.increment(); // node2: 2
      const thirdClock = new VectorClock('node3');
      thirdClock.increment(); // node3: 1
      clock.merge(otherClock);
      clock.merge(thirdClock);
      expect(clock.getTimestamp()).toEqual({ node1: 1, node2: 2, node3: 1 });
    });

    it('should handle empty clock merges', () => {
      clock.increment();
      const emptyClock = new VectorClock('empty');
      clock.merge(emptyClock);
      expect(clock.getTimestamp()).toEqual({ node1: 1, empty: 0 });
    });
  });

  describe('isHappenedBefore', () => {
    it('should return true when clock happened before other', () => {
      clock.increment();
      otherClock.increment();
      otherClock.increment();
      const testClock = new VectorClock('node1');
      testClock.increment();
      testClock.increment();
      expect(clock.isHappenedBefore(testClock)).toBe(true);
    });

    it('should return false when clock happened after other', () => {
      clock.increment();
      clock.increment();
      otherClock.increment();
      expect(clock.isHappenedBefore(otherClock)).toBe(false);
    });

    it('should return false when clocks are concurrent', () => {
      clock.increment();
      otherClock.increment();
      expect(clock.isHappenedBefore(otherClock)).toBe(false);
    });
  });

  describe('isConcurrent', () => {
    it('should return true for concurrent events', () => {
      clock.increment();
      otherClock.increment();
      expect(clock.isConcurrent(otherClock)).toBe(true);
    });

    it('should return false when one clock happened before other', () => {
      clock.increment();
      otherClock.increment();
      otherClock.increment();
      expect(clock.isConcurrent(otherClock)).toBe(true);
    });
  });

  describe('snapshot and restore', () => {
    it('should create and restore from snapshot correctly', () => {
      clock.increment();
      const snapshot = clock.createSnapshot();
      const newClock = new VectorClock('node1');
      newClock.restoreFromSnapshot(snapshot);
      expect(newClock.getTimestamp()).toEqual(clock.getTimestamp());
    });
  });

  describe('compare', () => {
    it('should return "before" when clock is before other', () => {
      clock.increment();
      const other: { [key: string]: number } = { node1: 2 };
      expect(clock.compare(other)).toBe('before');
    });

    it('should return "after" when clock is after other', () => {
      clock.increment();
      clock.increment();
      const other: { [key: string]: number } = { node1: 1 };
      expect(clock.compare(other)).toBe('after');
    });

    it('should return "concurrent" when clocks are concurrent', () => {
      clock.increment();
      const other: { [key: string]: number } = { node2: 1 };
      expect(clock.compare(other)).toBe('concurrent');
    });
  });

  describe('equals', () => {
    it('should return true for identical clocks', () => {
      clock.increment();
      const anotherClock = new VectorClock('node1');
      anotherClock.increment();
      expect(clock.equals(anotherClock)).toBe(true);
    });

    it('should return false for different clocks', () => {
      clock.increment();
      otherClock.increment();
      expect(clock.equals(otherClock)).toBe(false);
    });

    it('should handle empty clocks', () => {
      const a = new VectorClock('a');
      const b = new VectorClock('b');
      expect(a.equals(b)).toBe(true);
    });
  });
});
