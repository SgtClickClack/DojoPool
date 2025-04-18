import { PerformanceBudgetManager } from "../performance-budget";
import { PerformanceSnapshot } from "../../types";

describe("PerformanceBudgetManager", () => {
  let budgetManager: PerformanceBudgetManager;
  let mockSnapshot: PerformanceSnapshot & { drawCalls?: number };

  beforeEach(() => {
    budgetManager = PerformanceBudgetManager.getInstance();
    mockSnapshot = {
      timestamp: Date.now(),
      fps: 60,
      frameTime: 16.67,
      gpuTime: 10,
      memoryStats: {
        jsHeapSize: 100 * 1024 * 1024,
        totalJSHeapSize: 200 * 1024 * 1024,
        usedJSHeapSize: 50 * 1024 * 1024,
      },
      workerUtilization: 0.5,
      drawCalls: 500,
    };
  });

  afterEach(() => {
    budgetManager.cleanup();
  });

  describe("Initialization", () => {
    it("should initialize with default budget values", () => {
      expect(budgetManager["budget"]).toEqual({
        maxFrameTime: 16.67,
        minFps: 55,
        maxGpuTime: 12,
        maxMemoryUsage: 512 * 1024 * 1024,
        maxWorkerUtilization: 0.8,
        maxDrawCalls: 1000,
      });
    });

    it("should initialize with custom budget values", () => {
      const customBudget = {
        maxFrameTime: 20,
        minFps: 50,
        maxGpuTime: 15,
      };
      const customManager = PerformanceBudgetManager.getInstance(customBudget);
      expect(customManager["budget"]).toEqual(
        expect.objectContaining(customBudget),
      );
      customManager.cleanup();
    });
  });

  describe("Budget Management", () => {
    it("should update budget values", () => {
      const newBudget = {
        maxFrameTime: 20,
        minFps: 50,
      };
      budgetManager.setBudget(newBudget);
      expect(budgetManager["budget"]).toEqual(
        expect.objectContaining(newBudget),
      );
    });

    it("should set warning threshold", () => {
      budgetManager.setWarningThreshold(0.7);
      expect(budgetManager["warningThreshold"]).toBe(0.7);
    });

    it("should throw error for invalid warning threshold", () => {
      expect(() => budgetManager.setWarningThreshold(1.5)).toThrow(
        "Warning threshold must be between 0 and 1",
      );
      expect(() => budgetManager.setWarningThreshold(-0.5)).toThrow(
        "Warning threshold must be between 0 and 1",
      );
    });
  });

  describe("Performance Checking", () => {
    it("should detect frame time violations", () => {
      mockSnapshot.frameTime = 20;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("frameTime");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should detect FPS violations", () => {
      mockSnapshot.fps = 30;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("fps");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should detect GPU time violations", () => {
      mockSnapshot.gpuTime = 15;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("gpuTime");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should detect memory usage violations", () => {
      mockSnapshot.memoryStats.usedJSHeapSize = 600 * 1024 * 1024;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("memoryUsage");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should detect worker utilization violations", () => {
      mockSnapshot.workerUtilization = 0.9;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("workerUtilization");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should detect draw call violations", () => {
      mockSnapshot.drawCalls = 1200;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].metric).toBe("drawCalls");
      expect(status.isWithinBudget).toBe(false);
    });

    it("should calculate utilization percentages", () => {
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.utilizationPercentages).toBeDefined();
      expect(status.utilizationPercentages.frameTime).toBeCloseTo(1, 2);
      expect(status.utilizationPercentages.fps).toBeCloseTo(0.92, 2);
      expect(status.utilizationPercentages.gpuTime).toBeCloseTo(0.83, 2);
      expect(status.utilizationPercentages.memoryUsage).toBeCloseTo(0.1, 2);
      expect(status.utilizationPercentages.workerUtilization).toBeCloseTo(
        0.63,
        2,
      );
      expect(status.utilizationPercentages.drawCalls).toBeCloseTo(0.5, 2);
    });
  });

  describe("Warning Thresholds", () => {
    beforeEach(() => {
      budgetManager.setWarningThreshold(0.8);
    });

    it("should trigger warnings for high utilization", () => {
      mockSnapshot.frameTime = 15;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].severity).toBe("warning");
      expect(status.isWithinBudget).toBe(true);
    });

    it("should trigger critical violations for exceeding budget", () => {
      mockSnapshot.frameTime = 20;
      const status = budgetManager.checkPerformance(mockSnapshot);
      expect(status.violations).toHaveLength(1);
      expect(status.violations[0].severity).toBe("critical");
      expect(status.isWithinBudget).toBe(false);
    });
  });

  describe("Violation History", () => {
    it("should maintain violation history", () => {
      mockSnapshot.frameTime = 20;
      budgetManager.checkPerformance(mockSnapshot);
      const history = budgetManager.getViolationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].metric).toBe("frameTime");
    });

    it("should limit violation history size", () => {
      for (let i = 0; i < 150; i++) {
        mockSnapshot.timestamp = Date.now() + i;
        mockSnapshot.frameTime = 20;
        budgetManager.checkPerformance(mockSnapshot);
      }
      const history = budgetManager.getViolationHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Event Listeners", () => {
    it("should notify listeners of violations", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);
      mockSnapshot.frameTime = 20;
      budgetManager.checkPerformance(mockSnapshot);
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].metric).toBe("frameTime");
    });

    it("should remove listeners", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);
      budgetManager.removeViolationListener(listener);
      mockSnapshot.frameTime = 20;
      budgetManager.checkPerformance(mockSnapshot);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should clear violations and listeners", () => {
      const listener = jest.fn();
      budgetManager.onViolation(listener);
      mockSnapshot.frameTime = 20;
      budgetManager.checkPerformance(mockSnapshot);
      budgetManager.cleanup();
      expect(budgetManager.getViolationHistory()).toHaveLength(0);
      mockSnapshot.frameTime = 20;
      budgetManager.checkPerformance(mockSnapshot);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
