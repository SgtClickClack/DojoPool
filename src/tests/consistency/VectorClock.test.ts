import { VectorClock } from "../../core/consistency/VectorClock";
import { VectorTimestamp } from "../../types/consistency";

describe("VectorClock", () => {
  let clock: VectorClock;
  let otherClock: VectorClock;

  beforeEach(() => {
    clock = new VectorClock();
    otherClock = new VectorClock();
  });

  describe("initialization", () => {
    it("should initialize with empty clock when no initial value provided", () => {
      expect(clock.getTimestamp()).toEqual({});
    });

    it("should initialize with provided clock values", () => {
      const initialClock: VectorTimestamp = { node1: 1, node2: 2 };
      const clock = new VectorClock(initialClock);
      expect(clock.getTimestamp()).toEqual(initialClock);
    });
  });

  describe("increment", () => {
    it("should increment counter for new node", () => {
      clock.increment("node1");
      expect(clock.getTimestamp()).toEqual({ node1: 1 });
    });

    it("should increment existing counter", () => {
      clock.increment("node1");
      clock.increment("node1");
      expect(clock.getTimestamp()).toEqual({ node1: 2 });
    });
  });

  describe("merge", () => {
    it("should take max values when merging clocks", () => {
      clock.increment("node1");
      clock.increment("node2");

      otherClock.increment("node1");
      otherClock.increment("node1");
      otherClock.increment("node3");

      clock.merge(otherClock);
      expect(clock.getTimestamp()).toEqual({
        node1: 2,
        node2: 1,
        node3: 1,
      });
    });

    it("should handle empty clock merges", () => {
      clock.increment("node1");
      const emptyClock = new VectorClock();
      clock.merge(emptyClock);
      expect(clock.getTimestamp()).toEqual({ node1: 1 });
    });
  });

  describe("isHappenedBefore", () => {
    it("should return true when clock happened before other", () => {
      clock.increment("node1");

      otherClock.increment("node1");
      otherClock.increment("node1");

      expect(clock.isHappenedBefore(otherClock)).toBe(true);
    });

    it("should return false when clock happened after other", () => {
      clock.increment("node1");
      clock.increment("node1");

      otherClock.increment("node1");

      expect(clock.isHappenedBefore(otherClock)).toBe(false);
    });

    it("should return false when clocks are concurrent", () => {
      clock.increment("node1");
      otherClock.increment("node2");

      expect(clock.isHappenedBefore(otherClock)).toBe(false);
    });
  });

  describe("isConcurrent", () => {
    it("should return true for concurrent events", () => {
      clock.increment("node1");
      otherClock.increment("node2");

      expect(clock.isConcurrent(otherClock)).toBe(true);
    });

    it("should return false when one clock happened before other", () => {
      clock.increment("node1");

      otherClock.increment("node1");
      otherClock.increment("node2");

      expect(clock.isConcurrent(otherClock)).toBe(false);
    });
  });

  describe("snapshot and restore", () => {
    it("should create and restore from snapshot correctly", () => {
      clock.increment("node1");
      clock.increment("node2");

      const snapshot = clock.createSnapshot();
      const newClock = new VectorClock();
      newClock.restoreFromSnapshot(snapshot);

      expect(newClock.getTimestamp()).toEqual(clock.getTimestamp());
    });
  });

  describe("compare", () => {
    it('should return "before" when clock is before other', () => {
      clock.increment("node1");
      const other: VectorTimestamp = { node1: 2 };
      expect(clock.compare(other)).toBe("before");
    });

    it('should return "after" when clock is after other', () => {
      clock.increment("node1");
      clock.increment("node1");
      const other: VectorTimestamp = { node1: 1 };
      expect(clock.compare(other)).toBe("after");
    });

    it('should return "concurrent" when clocks are concurrent', () => {
      clock.increment("node1");
      const other: VectorTimestamp = { node2: 1 };
      expect(clock.compare(other)).toBe("concurrent");
    });
  });

  describe("equals", () => {
    it("should return true for identical clocks", () => {
      clock.increment("node1");
      otherClock.increment("node1");
      expect(clock.equals(otherClock)).toBe(true);
    });

    it("should return false for different clocks", () => {
      clock.increment("node1");
      otherClock.increment("node2");
      expect(clock.equals(otherClock)).toBe(false);
    });

    it("should handle empty clocks", () => {
      expect(clock.equals(otherClock)).toBe(true);
    });
  });
});
