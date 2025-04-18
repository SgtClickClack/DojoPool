import { PerformanceBudgetManager } from "../performance-budget";
import { PerformanceSnapshot } from "../../types";

describe("PerformanceBudgetManager", () => {
  let budgetManager: PerformanceBudgetManager;
  const defaultBudget = {
    maxFrameTime: 16.67,
    minFps: 55,
    maxGpuTime: 12,
    maxMemoryUsage: 512 * 1024 * 1024,
    maxWorkerUtilization: 0.8,
    maxDrawCalls: 1000,
  };

  beforeEach(() => {
    budgetManager = PerformanceBudgetManager.getInstance();
    budgetManager.setBudget(defaultBudget);
  });

  afterEach(() => {
    budgetManager.cleanup();
  });

  describe("Initialization", () => {
    it("should initialize with default budget values", () => {
      expect(budgetManager).toBeDefined();
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(true);
    });

    it("should allow custom budget values", () => {
      const customBudget = {
        maxFrameTime: 20,
        minFps: 50,
        maxGpuTime: 15,
      };
      budgetManager.setBudget(customBudget);
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 55,
        frameTime: 18,
        gpuTime: 14,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(true);
    });
  });

  describe("Budget Violations", () => {
    it("should detect frame time violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 20, // Exceeds maxFrameTime
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(false);
      expect(status.violations.some((v) => v.metric === "frameTime")).toBe(
        true,
      );
    });

    it("should detect FPS violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 50, // Below minFps
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(false);
      expect(status.violations.some((v) => v.metric === "fps")).toBe(true);
    });

    it("should detect GPU time violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 16.67,
        gpuTime: 15, // Exceeds maxGpuTime
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(false);
      expect(status.violations.some((v) => v.metric === "gpuTime")).toBe(true);
    });

    it("should detect memory usage violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 600 * 1024 * 1024, // Exceeds maxMemoryUsage
          totalJSHeapSize: 800 * 1024 * 1024,
          usedJSHeapSize: 600 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(false);
      expect(status.violations.some((v) => v.metric === "memoryUsage")).toBe(
        true,
      );
    });

    it("should detect worker utilization violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.9, // Exceeds maxWorkerUtilization
      });
      expect(status.isWithinBudget).toBe(false);
      expect(
        status.violations.some((v) => v.metric === "workerUtilization"),
      ).toBe(true);
    });

    it("should detect draw call violations", () => {
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
        drawCalls: 1200, // Exceeds maxDrawCalls
      });
      expect(status.isWithinBudget).toBe(false);
      expect(status.violations.some((v) => v.metric === "drawCalls")).toBe(
        true,
      );
    });
  });

  describe("Warning Threshold", () => {
    it("should set warning threshold correctly", () => {
      budgetManager.setWarningThreshold(0.7);
      const status = budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 60,
        frameTime: 15, // Within warning threshold
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });
      expect(status.isWithinBudget).toBe(true);
    });

    it("should throw error for invalid warning threshold", () => {
      expect(() => {
        budgetManager.setWarningThreshold(1.5);
      }).toThrow("Warning threshold must be between 0 and 1");
    });
  });

  describe("Violation History", () => {
    it("should maintain violation history", () => {
      const snapshot: PerformanceSnapshot = {
        timestamp: performance.now(),
        fps: 50,
        frameTime: 20,
        gpuTime: 15,
        memoryStats: {
          jsHeapSize: 600 * 1024 * 1024,
          totalJSHeapSize: 800 * 1024 * 1024,
          usedJSHeapSize: 600 * 1024 * 1024,
        },
        workerUtilization: 0.9,
      };

      budgetManager.checkPerformance(snapshot);
      const history = budgetManager.getViolationHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it("should limit violation history size", () => {
      for (let i = 0; i < 150; i++) {
        budgetManager.checkPerformance({
          timestamp: performance.now(),
          fps: 50,
          frameTime: 20,
          gpuTime: 15,
          memoryStats: {
            jsHeapSize: 600 * 1024 * 1024,
            totalJSHeapSize: 800 * 1024 * 1024,
            usedJSHeapSize: 600 * 1024 * 1024,
          },
          workerUtilization: 0.9,
        });
      }
      const history = budgetManager.getViolationHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Event Listeners", () => {
    it("should notify listeners of violations", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);

      budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 50,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });

      expect(listener).toHaveBeenCalled();
    });

    it("should remove listeners correctly", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);
      budgetManager.removeViolationListener(listener);

      budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 50,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should clear violations and listeners on cleanup", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);

      budgetManager.checkPerformance({
        timestamp: performance.now(),
        fps: 50,
        frameTime: 16.67,
        gpuTime: 10,
        memoryStats: {
          jsHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 200 * 1024 * 1024,
          usedJSHeapSize: 100 * 1024 * 1024,
        },
        workerUtilization: 0.5,
      });

      budgetManager.cleanup();
      expect(budgetManager.getViolationHistory().length).toBe(0);
    });
  });
});
