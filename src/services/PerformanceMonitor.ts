import { useEffect } from 'react';

interface PerformanceMetrics {
    timeToFirstByte: number;
    firstContentfulPaint: number;
    domInteractive: number;
    domComplete: number;
    loadTime: number;
    resourceTiming: ResourceTiming[];
    memoryUsage?: {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    };
    longTasks: PerformanceEntry[];
    networkInfo?: {
        downlink: number;
        effectiveType: string;
        rtt: number;
        saveData: boolean;
    };
}

interface ResourceTiming {
    name: string;
    initiatorType: string;
    duration: number;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics = {
        timeToFirstByte: 0,
        firstContentfulPaint: 0,
        domInteractive: 0,
        domComplete: 0,
        loadTime: 0,
        resourceTiming: [],
        longTasks: []
    };
    private observers: Map<string, PerformanceObserver> = new Map();
    private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

    private constructor() {
        this.initializeObservers();
        this.collectInitialMetrics();
        this.setupNetworkMonitoring();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private initializeObservers() {
        // Paint timing observer
        if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
            const paintObserver = new PerformanceObserver((entries) => {
                entries.getEntries().forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = entry.startTime;
                        this.notifySubscribers();
                    }
                });
            });
            paintObserver.observe({ entryTypes: ['paint'] });
            this.observers.set('paint', paintObserver);
        }

        // Long tasks observer
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            const longTaskObserver = new PerformanceObserver((entries) => {
                const longTasks = entries.getEntries();
                this.metrics.longTasks = [...this.metrics.longTasks, ...longTasks];
                this.notifySubscribers();
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        }

        // Resource timing observer
        if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
            const resourceObserver = new PerformanceObserver((entries) => {
                const resources = entries.getEntries().map(entry => ({
                    name: entry.name,
                    initiatorType: entry.initiatorType,
                    duration: entry.duration,
                    transferSize: (entry as PerformanceResourceTiming).transferSize,
                    encodedBodySize: (entry as PerformanceResourceTiming).encodedBodySize,
                    decodedBodySize: (entry as PerformanceResourceTiming).decodedBodySize
                }));
                this.metrics.resourceTiming = [...this.metrics.resourceTiming, ...resources];
                this.notifySubscribers();
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        }
    }

    private collectInitialMetrics() {
        // Navigation timing
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
            this.metrics.timeToFirstByte = navigationTiming.responseStart - navigationTiming.requestStart;
            this.metrics.domInteractive = navigationTiming.domInteractive;
            this.metrics.domComplete = navigationTiming.domComplete;
            this.metrics.loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
        }

        // Memory info
        if ((performance as any).memory) {
            this.metrics.memoryUsage = {
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize
            };
        }
    }

    private setupNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection) {
                const updateNetworkInfo = () => {
                    this.metrics.networkInfo = {
                        downlink: connection.downlink,
                        effectiveType: connection.effectiveType,
                        rtt: connection.rtt,
                        saveData: connection.saveData
                    };
                    this.notifySubscribers();
                };

                connection.addEventListener('change', updateNetworkInfo);
                updateNetworkInfo();
            }
        }
    }

    public subscribe(callback: (metrics: PerformanceMetrics) => void) {
        this.callbacks.push(callback);
        callback(this.metrics); // Initial callback with current metrics
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    private notifySubscribers() {
        this.callbacks.forEach(callback => callback(this.metrics));
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public clearMetrics() {
        this.metrics = {
            timeToFirstByte: 0,
            firstContentfulPaint: 0,
            domInteractive: 0,
            domComplete: 0,
            loadTime: 0,
            resourceTiming: [],
            longTasks: []
        };
        this.notifySubscribers();
    }

    public disconnect() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.callbacks = [];
    }
}

// React hook for using performance monitoring
export const usePerformanceMonitoring = (
    callback: (metrics: PerformanceMetrics) => void
) => {
    useEffect(() => {
        const monitor = PerformanceMonitor.getInstance();
        return monitor.subscribe(callback);
    }, [callback]);

    return PerformanceMonitor.getInstance();
};

export default PerformanceMonitor; 