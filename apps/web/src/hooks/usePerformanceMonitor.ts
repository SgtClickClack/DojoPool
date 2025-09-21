import { useEffect, useRef, useCallback } from 'react';
import { performance_monitor } from '../../core/monitoring/performance';
import { metrics_monitor } from '../../core/monitoring/metrics_monitor';

export interface ComponentPerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  mountTime: number;
  unmountTime?: number;
  propsChanges: number;
  stateChanges: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number; // ms
  maxRenderCount: number;
  maxMemoryUsage: number; // MB
}

const defaultThresholds: PerformanceThresholds = {
  maxRenderTime: 16, // 60fps = 16ms per frame
  maxRenderCount: 100,
  maxMemoryUsage: 50, // 50MB
};

export const usePerformanceMonitor = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const metricsRef = useRef<ComponentPerformanceMetrics>({
    componentName,
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    mountTime: performance.now(),
    propsChanges: 0,
    stateChanges: 0,
  });

  const renderStartTimeRef = useRef<number>(0);
  const prevPropsRef = useRef<any>(null);
  const prevStateRef = useRef<any>(null);

  const finalThresholds = { ...defaultThresholds, ...thresholds };

  // Track render performance
  const trackRender = useCallback(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTimeRef.current;
    
    const metrics = metricsRef.current;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    // Check thresholds and create alerts
    if (renderTime > finalThresholds.maxRenderTime) {
      metrics_monitor.addAlert(
        'warning' as any,
        `Component ${componentName} render time exceeded threshold: ${renderTime.toFixed(2)}ms`,
        {
          componentName,
          renderTime,
          threshold: finalThresholds.maxRenderTime,
          renderCount: metrics.renderCount,
        }
      );
    }

    if (metrics.renderCount > finalThresholds.maxRenderCount) {
      metrics_monitor.addAlert(
        'warning' as any,
        `Component ${componentName} render count exceeded threshold: ${metrics.renderCount}`,
        {
          componentName,
          renderCount: metrics.renderCount,
          threshold: finalThresholds.maxRenderCount,
        }
      );
    }

    // Track memory usage
    const memory = (performance as any).memory;
    if (memory) {
      const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
      if (memoryUsageMB > finalThresholds.maxMemoryUsage) {
        metrics_monitor.addAlert(
          'error' as any,
          `Memory usage exceeded threshold: ${memoryUsageMB.toFixed(2)}MB`,
          {
            componentName,
            memoryUsage: memoryUsageMB,
            threshold: finalThresholds.maxMemoryUsage,
          }
        );
      }
    }
  }, [componentName, finalThresholds]);

  // Track props changes
  const trackPropsChange = useCallback((props: any) => {
    if (prevPropsRef.current !== null) {
      const hasChanged = JSON.stringify(prevPropsRef.current) !== JSON.stringify(props);
      if (hasChanged) {
        metricsRef.current.propsChanges++;
      }
    }
    prevPropsRef.current = props;
  }, []);

  // Track state changes
  const trackStateChange = useCallback((state: any) => {
    if (prevStateRef.current !== null) {
      const hasChanged = JSON.stringify(prevStateRef.current) !== JSON.stringify(state);
      if (hasChanged) {
        metricsRef.current.stateChanges++;
      }
    }
    prevStateRef.current = state;
  }, []);

  // Start render timing
  useEffect(() => {
    renderStartTimeRef.current = performance.now();
  });

  // Track render completion
  useEffect(() => {
    trackRender();
  });

  // Track unmount
  useEffect(() => {
    return () => {
      metricsRef.current.unmountTime = performance.now();
      
      // Log final metrics
      console.log(`Performance metrics for ${componentName}:`, {
        ...metricsRef.current,
        totalLifetime: metricsRef.current.unmountTime - metricsRef.current.mountTime,
      });
    };
  }, [componentName]);

  return {
    metrics: metricsRef.current,
    trackPropsChange,
    trackStateChange,
    getPerformanceReport: () => ({
      ...metricsRef.current,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0,
      thresholds: finalThresholds,
    }),
  };
};

// Hook for tracking expensive operations
export const useOperationTimer = (operationName: string) => {
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    endTimeRef.current = performance.now();
    const duration = endTimeRef.current - startTimeRef.current;
    
    // Log slow operations
    if (duration > 100) { // 100ms threshold
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      
      metrics_monitor.addAlert(
        'warning' as any,
        `Slow operation: ${operationName} took ${duration.toFixed(2)}ms`,
        {
          operationName,
          duration,
          threshold: 100,
        }
      );
    }

    return duration;
  }, [operationName]);

  return { startTimer, endTimer };
};

// Hook for tracking API call performance
export const useAPIPerformanceMonitor = () => {
  const trackAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      // Track successful API calls
      if (duration > 1000) { // 1 second threshold
        metrics_monitor.addAlert(
          'warning' as any,
          `Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`,
          {
            endpoint,
            duration,
            threshold: 1000,
          }
        );
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Track failed API calls
      metrics_monitor.addAlert(
        'error' as any,
        `API call failed: ${endpoint} after ${duration.toFixed(2)}ms`,
        {
          endpoint,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      
      throw error;
    }
  }, []);

  return { trackAPICall };
};
