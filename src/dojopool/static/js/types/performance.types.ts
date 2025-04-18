export interface PerformanceMetrics {
  captureTime: number;
  processingTime: number;
  totalTime: number;
  fps: number;
  memoryUsage?: {
    jsHeapSize: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export interface MemoryStats {
  jsHeapSize: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  frameTime: number;
  gpuTime: number;
  memoryStats: MemoryStats;
  workerUtilization: number;
}

export interface PerformanceMarks {
  FRAME_START: string;
  CAPTURE_END: string;
  PROCESS_END: string;
}
