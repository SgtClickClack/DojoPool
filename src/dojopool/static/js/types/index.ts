export * from "./frame.types";
export * from "./kalman.types";
export * from "./memory.types";
export * from "./performance.types";
export * from "./webgl.types";
export * from "./worker.types";

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  frameTime: number;
  gpuTime: number;
  memoryStats: {
    jsHeapSize: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
  workerUtilization: number;
}

export interface BudgetStatus {
  isWithinBudget: boolean;
  violations: string[];
  utilizationPercentages: {
    cpu: number;
    gpu: number;
    memory: number;
  };
}
