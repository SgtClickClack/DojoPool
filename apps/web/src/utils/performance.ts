/**
 * Performance Utilities
 * 
 * Comprehensive performance monitoring, optimization, and analysis tools
 * for the Dojo Pool application.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor resource timing
    this.observeResourceTiming();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor layout shifts
    this.observeLayoutShifts();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        result[name] = {
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.recordMetric('firstByte', navEntry.responseStart - navEntry.requestStart);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Failed to observe navigation timing:', error);
    }
  }

  private observeResourceTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resourceLoadTime', resourceEntry.responseEnd - resourceEntry.requestStart);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Failed to observe resource timing:', error);
    }
  }

  private observeLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.recordMetric('longTaskDuration', entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Failed to observe long tasks:', error);
    }
  }

  private observeLayoutShifts(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.recordMetric('layoutShift', (entry as any).value);
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Failed to observe layout shifts:', error);
    }
  }
}

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStart = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    const renderEnd = Date.now();
    const renderTime = renderEnd - renderStart.current;
    renderCount.current += 1;

    // Record render performance
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordMetric(`${componentName}_render`, renderTime);

    // Warn about slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`[Performance] ${componentName} render took ${renderTime}ms (target: <16ms)`);
    }

    // Update start time for next render
    renderStart.current = renderEnd;
  });

  return {
    renderCount: renderCount.current,
    getAverageRenderTime: () => {
      const monitor = PerformanceMonitor.getInstance();
      const metrics = monitor.getMetrics();
      return metrics[`${componentName}_render`]?.avg || 0;
    },
  };
};

/**
 * Hook for measuring API call performance
 */
export const useApiPerformance = () => {
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Record API performance
      const monitor = PerformanceMonitor.getInstance();
      monitor.recordMetric(`api_${endpoint}`, duration);
      
      // Warn about slow API calls
      if (duration > 1000) { // 1 second threshold
        console.warn(`[Performance] API call to ${endpoint} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Record failed API performance
      const monitor = PerformanceMonitor.getInstance();
      monitor.recordMetric(`api_${endpoint}_error`, duration);
      
      throw error;
    }
  }, []);

  return { measureApiCall };
};

/**
 * Hook for measuring memory usage
 */
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    };

    // Update memory info every 5 seconds
    const interval = setInterval(updateMemoryInfo, 5000);
    updateMemoryInfo(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Hook for measuring bundle size impact
 */
export const useBundleAnalysis = () => {
  const analyzeBundleImport = useCallback(async (modulePath: string) => {
    const startTime = performance.now();
    
    try {
      const module = await import(modulePath);
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Record bundle load performance
      const monitor = PerformanceMonitor.getInstance();
      monitor.recordMetric(`bundle_${modulePath}`, loadTime);
      
      return { module, loadTime };
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    }
  }, []);

  return { analyzeBundleImport };
};

/**
 * Service Worker manager for performance optimization
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private sw: ServiceWorker | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.sw = registration.active;
      
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async unregister(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      this.sw = null;
      
      console.log('Service Worker unregistered successfully');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }
}

/**
 * Image optimization utilities
 */
export const optimizeImage = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // For Next.js Image component, return the original src
  // The optimization will be handled by Next.js
  return src;
};

/**
 * Lazy loading utility with Intersection Observer
 */
export const useLazyLoading = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Debounce utility for performance optimization
 */
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

/**
 * Throttle utility for performance optimization
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};