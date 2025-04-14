import { useEffect, useRef } from 'react';
import { performance, PerformanceObserver } from 'perf-hooks';
import { ReportHandler } from 'web-vitals';
import { EventEmitter } from 'events';

// Types
declare global {
  interface Performance extends Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

interface PerformanceMetrics {
    fps: number;
    memoryUsage: number;
    responseTime: number;
    loadTime: number;
    networkLatency: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        gpu?: number;
    };
}

interface PerformanceThresholds {
    minFps: number;
    maxResponseTime: number;
    maxLoadTime: number;
    maxNetworkLatency: number;
    maxMemoryUsage: number;
}

// Extended Performance interface to include memory
interface ExtendedPerformance extends Performance {
    memory?: {
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics;
    private thresholds: PerformanceThresholds;
    private observers: ((metrics: PerformanceMetrics) => void)[];
    private frameCount: number;
    private lastFrameTime: number;
    private monitoringInterval: NodeJS.Timeout | null;

    private constructor() {
        this.metrics = {
            fps: 0,
            memoryUsage: 0,
            responseTime: 0,
            loadTime: 0,
            networkLatency: 0,
            resourceUtilization: {
                cpu: 0,
                memory: 0,
            },
        };

        this.thresholds = {
            minFps: 30,
            maxResponseTime: 100,
            maxLoadTime: 2000,
            maxNetworkLatency: 50,
            maxMemoryUsage: 500,
        };

        this.observers = [];
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.monitoringInterval = null;
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public startMonitoring(): void {
        if (this.monitoringInterval) return;

        // Monitor FPS
        const measureFPS = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastFrameTime;
            this.frameCount++;

            if (elapsed >= 1000) {
                this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
                this.frameCount = 0;
                this.lastFrameTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        // Monitor other metrics
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.notifyObservers();
            this.checkThresholds();
        }, 1000);
    }

    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    }

    public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    private updateMetrics(): void {
        // Update memory usage
        const extendedPerformance = performance as ExtendedPerformance;
        if (extendedPerformance.memory) {
            this.metrics.memoryUsage = Math.round(
                extendedPerformance.memory.usedJSHeapSize / (1024 * 1024)
            );
        }

        // Update response time using Navigation Timing API
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
            this.metrics.responseTime = navigationTiming.responseEnd - navigationTiming.requestStart;
            this.metrics.loadTime = navigationTiming.loadEventEnd;
        }

        // Update network latency using Resource Timing API
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        if (resources.length > 0) {
            const latencies = resources.map(
                resource => resource.responseEnd - resource.requestStart
            );
            this.metrics.networkLatency = Math.round(
                latencies.reduce((a, b) => a + b) / latencies.length
            );
        }

        // Update resource utilization
        this.updateResourceUtilization();
    }

    private updateResourceUtilization(): void {
        // CPU usage estimation based on frame time
        const frameTime = performance.now() - this.lastFrameTime;
        const cpuUsage = Math.min(100, (frameTime / (1000 / 60)) * 100);
        this.metrics.resourceUtilization.cpu = Math.round(cpuUsage);

        // Memory usage percentage
        const extendedPerformance = performance as ExtendedPerformance;
        if (extendedPerformance.memory) {
            const memoryUsage =
                (extendedPerformance.memory.usedJSHeapSize /
                    extendedPerformance.memory.jsHeapSizeLimit) *
                100;
            this.metrics.resourceUtilization.memory = Math.round(memoryUsage);
        }

        // GPU utilization (if available through WebGL)
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                const extension = gl.getExtension('WEBGL_debug_renderer_info');
                if (extension) {
                    this.metrics.resourceUtilization.gpu = 0; // Placeholder for actual GPU metrics
                }
            }
        } catch (error) {
            console.warn('GPU metrics not available:', error);
        }
    }

    private checkThresholds(): void {
        if (this.metrics.fps < this.thresholds.minFps) {
            console.warn('FPS below threshold:', this.metrics.fps);
        }
        if (this.metrics.responseTime > this.thresholds.maxResponseTime) {
            console.warn('Response time above threshold:', this.metrics.responseTime);
        }
        if (this.metrics.loadTime > this.thresholds.maxLoadTime) {
            console.warn('Load time above threshold:', this.metrics.loadTime);
        }
        if (this.metrics.networkLatency > this.thresholds.maxNetworkLatency) {
            console.warn('Network latency above threshold:', this.metrics.networkLatency);
        }
        if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
            console.warn('Memory usage above threshold:', this.metrics.memoryUsage);
        }
    }

    private notifyObservers(): void {
        this.observers.forEach(observer => observer(this.getMetrics()));
    }
}

// React hook for using performance monitoring
export const usePerformanceMonitoring = (
    callback?: (metrics: PerformanceMetrics) => void
) => {
    const monitor = PerformanceMonitor.getInstance();
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        monitor.startMonitoring();

        if (callback) {
            unsubscribeRef.current = monitor.subscribe(callback);
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
            monitor.stopMonitoring();
        };
    }, [callback]);

    return {
        getMetrics: () => monitor.getMetrics(),
        setThresholds: (thresholds: Partial<PerformanceThresholds>) =>
            monitor.setThresholds(thresholds),
    };
};

export type { PerformanceMetrics, PerformanceThresholds };
export default PerformanceMonitor; 