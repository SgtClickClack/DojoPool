/**
 * Performance measurement utilities for testing and monitoring
 */

import { performance, PerformanceObserver } from 'perf_hooks';

// Cast performance to include memory property for browser compatibility
const performanceWithMemory = performance as any;

interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  marks?: PerformanceEntry[];
  measures?: PerformanceEntry[];
}

interface PerformanceOptions {
  markName?: string;
  measureName?: string;
  collectMemory?: boolean;
  collectMarks?: boolean;
  collectMeasures?: boolean;
  iterations?: number;
}

interface PerformanceResult {
  duration: number;
  memoryUsage?: {
    initial: number;
    final: number;
    max: number;
  };
  marks?: PerformanceMark[];
  measures?: PerformanceMeasure[];
}

interface FrameRateOptions {
  duration: number;
  markName?: string;
  measureName?: string;
}

interface FrameRateResult {
  fps: number;
  frameTimes: number[];
  droppedFrames: number;
}

interface MemoryUsageOptions {
  interval: number;
  markName?: string;
  measureName?: string;
}

interface MemoryUsageResult {
  memoryUsage: {
    initial: number;
    final: number;
    max: number;
    samples: number[];
  };
}

interface NetworkPerformanceOptions {
  iterations?: number;
  markName?: string;
  measureName?: string;
}

interface NetworkPerformanceResult {
  duration: number;
  successRate: number;
  errors: Error[];
}

interface RenderPerformanceOptions {
  iterations?: number;
  markName?: string;
  measureName?: string;
}

interface RenderPerformanceResult {
  duration: number;
  memoryUsage?: {
    initial: number;
    final: number;
    max: number;
  };
  marks?: PerformanceMark[];
  measures?: PerformanceMeasure[];
}

/**
 * Measures the performance of a function execution
 * @param fn Function to measure
 * @param options Measurement options
 * @returns Performance metrics
 */
export const measurePerformance = async <T>(
  fn: () => T | Promise<T>,
  options: {
    markName?: string;
    measureName?: string;
    collectMemory?: boolean;
    collectMarks?: boolean;
    collectMeasures?: boolean;
  } = {}
): Promise<PerformanceMetrics> => {
  const {
    markName = 'start',
    measureName = 'duration',
    collectMemory = false,
    collectMarks = false,
    collectMeasures = false,
  } = options;

  // Clear any existing marks/measures
  if (collectMarks || collectMeasures) {
    performance.clearMarks();
    performance.clearMeasures();
  }

  // Start measurement
  performance.mark(markName);
  const startTime = performance.now();
  const startMemory = collectMemory ? performanceWithMemory.memory?.usedJSHeapSize : undefined;

  // Execute function
  const result = await fn();

  // End measurement
  const endTime = performance.now();
  const endMemory = collectMemory ? performanceWithMemory.memory?.usedJSHeapSize : undefined;
  performance.mark(`${markName}-end`);

  if (collectMeasures) {
    performance.measure(measureName, markName, `${markName}-end`);
  }

  // Collect metrics
  const metrics: PerformanceMetrics = {
    duration: endTime - startTime,
    startTime,
    endTime,
  };

  if (collectMemory && startMemory && endMemory) {
    metrics.memory = {
      usedJSHeapSize: endMemory - startMemory,
      totalJSHeapSize: performanceWithMemory.memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: performanceWithMemory.memory?.jsHeapSizeLimit || 0,
    };
  }

  if (collectMarks) {
    metrics.marks = Array.from(performance.getEntriesByType('mark'));
  }

  if (collectMeasures) {
    metrics.measures = Array.from(performance.getEntriesByType('measure'));
  }

  return metrics;
};

/**
 * Measures frame rate for a given duration
 * @param duration Duration to measure in milliseconds
 * @param callback Function to execute each frame
 * @returns Frame rate metrics
 */
export const measureFrameRate = async (
  duration: number,
  callback: (frameCount: number) => void
): Promise<{
  fps: number;
  frameTimes: number[];
  frameDrops: number;
  averageFrameTime: number;
}> => {
  const frameTimes: number[] = [];
  let frameCount = 0;
  let lastFrameTime = performance.now();
  const endTime = lastFrameTime + duration;

  return new Promise((resolve) => {
    function frame() {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      frameCount++;

      callback(frameCount);

      if (currentTime < endTime) {
        lastFrameTime = currentTime;
        requestAnimationFrame(frame);
      } else {
        const totalFrames = frameTimes.length;
        const totalTime = frameTimes.reduce((a, b) => a + b, 0);
        const fps = (totalFrames / totalTime) * 1000;
        const averageFrameTime = totalTime / totalFrames;
        const frameDrops = frameTimes.filter(time => time > 33.33).length; // 30fps threshold

        resolve({
          fps,
          frameTimes,
          frameDrops,
          averageFrameTime,
        });
      }
    }

    requestAnimationFrame(frame);
  });
};

/**
 * Measures memory usage over time
 * @param duration Duration to measure in milliseconds
 * @param interval Measurement interval in milliseconds
 * @returns Memory usage metrics
 */
export const measureMemoryUsage = async (
  duration: number,
  interval: number = 1000
): Promise<{
  samples: number[];
  maxUsage: number;
  minUsage: number;
  averageUsage: number;
}> => {
  const samples: number[] = [];
  const startTime = performance.now();
  const endTime = startTime + duration;

  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      const currentTime = performance.now();
      if (currentTime >= endTime) {
        clearInterval(intervalId);
        const maxUsage = Math.max(...samples);
        const minUsage = Math.min(...samples);
        const averageUsage = samples.reduce((a, b) => a + b, 0) / samples.length;

        resolve({
          samples,
          maxUsage,
          minUsage,
          averageUsage,
        });
      } else {
        samples.push(performanceWithMemory.memory?.usedJSHeapSize || 0);
      }
    }, interval);
  });
};

/**
 * Measures network request performance
 * @param url URL to measure
 * @param options Request options
 * @returns Network performance metrics
 */
export const measureNetworkPerformance = async (
  url: string,
  options: RequestInit = {}
): Promise<{
  duration: number;
  startTime: number;
  endTime: number;
  responseSize: number;
  status: number;
}> => {
  const startTime = performance.now();
  const response = await fetch(url, options);
  const endTime = performance.now();
  const duration = endTime - startTime;

  const contentLength = response.headers.get('content-length');
  const responseSize = contentLength ? parseInt(contentLength, 10) : 0;

  return {
    duration,
    startTime,
    endTime,
    responseSize,
    status: response.status,
  };
};

/**
 * Measures component render performance
 * @param renderFn Function that renders the component
 * @returns Render performance metrics
 */
export const measureRenderPerformance = async <T>(
  renderFn: () => T
): Promise<{
  firstRender: number;
  reflow: number;
  repaint: number;
  total: number;
}> => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  const total = endTime - startTime;

  // These are simplified metrics - in a real implementation you'd use
  // more sophisticated performance APIs
  return {
    firstRender: total,
    reflow: total * 0.1, // Estimate
    repaint: total * 0.05, // Estimate
    total,
  };
}; 