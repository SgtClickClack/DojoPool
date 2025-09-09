import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

export interface PerformanceConfig {
  enableLogging?: boolean;
  logThreshold?: number; // ms
  trackRenders?: boolean;
}

export const usePerformanceOptimization = (
  componentName: string,
  config: PerformanceConfig = {}
) => {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    logThreshold = 16, // 60fps threshold
    trackRenders = true,
  } = config;

  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const totalRenderTimeRef = useRef(0);
  const renderStartTimeRef = useRef(0);

  // Track render performance
  useEffect(() => {
    if (!trackRenders) return;

    renderCountRef.current++;
    const renderTime = performance.now() - renderStartTimeRef.current;
    lastRenderTimeRef.current = renderTime;
    totalRenderTimeRef.current += renderTime;

    if (enableLogging && renderTime > logThreshold) {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${logThreshold}ms)`
      );
    }

    return () => {
      renderStartTimeRef.current = performance.now();
    };
  });

  // Memoization utilities
  const memoizedCallback = useCallback(
    <T extends (...args: any[]) => any>(
      callback: T,
      deps: React.DependencyList
    ) => useCallback(callback, deps),
    []
  );

  const memoizedValue = useCallback(
    <T>(value: T, deps: React.DependencyList) => useMemo(() => value, deps),
    []
  );

  // Performance metrics
  const metrics: PerformanceMetrics = useMemo(() => ({
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    averageRenderTime:
      renderCountRef.current > 0
        ? totalRenderTimeRef.current / renderCountRef.current
        : 0,
    totalRenderTime: totalRenderTimeRef.current,
  }), []);

  return {
    metrics,
    memoizedCallback,
    memoizedValue,
  };
};

// Utility for creating memoized components
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) => {
  return React.memo(Component, propsAreEqual);
};

// Utility for debouncing expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Utility for throttling expensive operations
export const useThrottle = <T>(value: T, delay: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};
