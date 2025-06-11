/**
 * Performance measurement utilities for testing and monitoring
 */

import { performance, PerformanceObserver } from 'perf_hooks';

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
  const startMemory = collectMemory ? performance.memory?.usedJSHeapSize : undefined;

  // Execute function
  const result = await fn();

  // End measurement
  const endTime = performance.now();
  const endMemory = collectMemory ? performance.memory?.usedJSHeapSize : undefined;
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
      totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,
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
        samples.push(performance.memory?.usedJSHeapSize || 0);
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
  
  // Force a reflow
  document.body.offsetHeight;
  
  const firstRender = performance.now();
  const result = renderFn();
  
  // Force a repaint
  document.body.style.display = 'none';
  document.body.offsetHeight;
  document.body.style.display = '';
  
  const reflow = performance.now();
  const repaint = performance.now();
  const total = repaint - startTime;

  return {
    firstRender: firstRender - startTime,
    reflow: reflow - firstRender,
    repaint: repaint - reflow,
    total,
  };
};

export async function measurePerformance(
  fn: () => any,
  options: PerformanceOptions = {}
): Promise<PerformanceResult> {
  const {
    markName = 'performance',
    measureName = 'performance',
    collectMemory = false,
    collectMarks = false,
    collectMeasures = false,
    iterations = 1,
  } = options;

  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;

  performance.mark(startMark);

  let initialMemory: number | undefined;
  let maxMemory = 0;

  if (collectMemory) {
    initialMemory = process.memoryUsage().heapUsed;
  }

  for (let i = 0; i < iterations; i++) {
    await fn();
    if (collectMemory) {
      const currentMemory = process.memoryUsage().heapUsed;
      maxMemory = Math.max(maxMemory, currentMemory);
    }
  }

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const finalMemory = collectMemory ? process.memoryUsage().heapUsed : undefined;

  const result: PerformanceResult = {
    duration: performance.getEntriesByName(measureName)[0].duration,
  };

  if (collectMemory && initialMemory !== undefined && finalMemory !== undefined) {
    result.memoryUsage = {
      initial: initialMemory,
      final: finalMemory,
      max: maxMemory,
    };
  }

  if (collectMarks) {
    result.marks = performance.getEntriesByType('mark') as PerformanceMark[];
  }

  if (collectMeasures) {
    result.measures = performance.getEntriesByType('measure') as PerformanceMeasure[];
  }

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return result;
}

export async function measureFrameRate(
  fn: () => any,
  options: FrameRateOptions
): Promise<FrameRateResult> {
  const { duration, markName = 'frameRate', measureName = 'frameRate' } = options;

  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;

  performance.mark(startMark);

  const frameTimes: number[] = [];
  let lastFrameTime = performance.now();
  let droppedFrames = 0;

  const frame = () => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTime;
    frameTimes.push(frameTime);

    if (frameTime > 16.67) { // 60fps = 16.67ms per frame
      droppedFrames += Math.floor(frameTime / 16.67) - 1;
    }

    lastFrameTime = currentTime;
    fn();

    if (currentTime - performance.getEntriesByName(startMark)[0].startTime < duration) {
      requestAnimationFrame(frame);
    } else {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
    }
  };

  requestAnimationFrame(frame);

  await new Promise(resolve => setTimeout(resolve, duration));

  const totalFrames = frameTimes.length;
  const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
  const fps = (totalFrames / totalTime) * 1000;

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return {
    fps,
    frameTimes,
    droppedFrames,
  };
}

export async function measureMemoryUsage(
  fn: () => any,
  options: MemoryUsageOptions
): Promise<MemoryUsageResult> {
  const { interval, markName = 'memoryUsage', measureName = 'memoryUsage' } = options;

  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;

  performance.mark(startMark);

  const initialMemory = process.memoryUsage().heapUsed;
  const samples: number[] = [initialMemory];
  let maxMemory = initialMemory;

  const memoryInterval = setInterval(() => {
    const currentMemory = process.memoryUsage().heapUsed;
    samples.push(currentMemory);
    maxMemory = Math.max(maxMemory, currentMemory);
  }, interval);

  await fn();

  clearInterval(memoryInterval);
  const finalMemory = process.memoryUsage().heapUsed;
  samples.push(finalMemory);

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return {
    memoryUsage: {
      initial: initialMemory,
      final: finalMemory,
      max: maxMemory,
      samples,
    },
  };
}

export async function measureNetworkPerformance(
  fn: () => Promise<any>,
  options: NetworkPerformanceOptions = {}
): Promise<NetworkPerformanceResult> {
  const {
    iterations = 1,
    markName = 'networkPerformance',
    measureName = 'networkPerformance',
  } = options;

  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;

  performance.mark(startMark);

  const errors: Error[] = [];
  let successCount = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      await fn();
      successCount++;
    } catch (error) {
      errors.push(error as Error);
    }
  }

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const duration = performance.getEntriesByName(measureName)[0].duration;
  const successRate = successCount / iterations;

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return {
    duration,
    successRate,
    errors,
  };
}

export async function measureRenderPerformance(
  fn: () => any,
  options: RenderPerformanceOptions = {}
): Promise<RenderPerformanceResult> {
  const {
    iterations = 1,
    markName = 'renderPerformance',
    measureName = 'renderPerformance',
  } = options;

  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;

  performance.mark(startMark);

  const initialMemory = process.memoryUsage().heapUsed;
  let maxMemory = initialMemory;

  for (let i = 0; i < iterations; i++) {
    await fn();
    const currentMemory = process.memoryUsage().heapUsed;
    maxMemory = Math.max(maxMemory, currentMemory);
  }

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const finalMemory = process.memoryUsage().heapUsed;

  const result: RenderPerformanceResult = {
    duration: performance.getEntriesByName(measureName)[0].duration,
    memoryUsage: {
      initial: initialMemory,
      final: finalMemory,
      max: maxMemory,
    },
  };

  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return result;
} 