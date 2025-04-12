import { PerformanceMetrics, DependencyMetrics } from '../types/monitoring';
import { SystemMetricsCollector } from '../core/monitoring/system_metrics';
import { PerformanceMonitor } from '../core/monitoring/performance';
import { MetricsCache } from '../core/monitoring/cache';

interface DependencyIssue {
    dependency: string;
    issue: string;
    severity: 'warning' | 'error';
}

export class DependencyPerformanceMonitor {
    private static instance: DependencyPerformanceMonitor;
    private metricsCache: MetricsCache;
    private systemMetricsCollector: SystemMetricsCollector;
    private performanceMonitor: PerformanceMonitor;
    private monitoringInterval: NodeJS.Timeout | null;
    private batchSize: number;
    private metricsBuffer: Map<string, DependencyMetrics[]>;

    private constructor() {
        this.metricsCache = new MetricsCache();
        this.systemMetricsCollector = new SystemMetricsCollector();
        this.performanceMonitor = new PerformanceMonitor();
        this.monitoringInterval = null;
        this.batchSize = 10;
        this.metricsBuffer = new Map();
    }

    public static getInstance(): DependencyPerformanceMonitor {
        if (!DependencyPerformanceMonitor.instance) {
            DependencyPerformanceMonitor.instance = new DependencyPerformanceMonitor();
        }
        return DependencyPerformanceMonitor.instance;
    }

    public startMonitoring(): void {
        if (this.monitoringInterval) return;

        // Start system metrics collection
        this.systemMetricsCollector.start();
        this.performanceMonitor.start();

        // Start dependency monitoring with batched processing
        this.monitoringInterval = setInterval(() => {
            this.collectDependencyMetrics();
        }, 5000); // Collect metrics every 5 seconds
    }

    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.systemMetricsCollector.stop();
        this.performanceMonitor.stop();
        this.flushMetricsBuffer();
    }

    private collectDependencyMetrics(): void {
        try {
            // Get system metrics
            const systemMetrics = this.systemMetricsCollector.get_current_metrics();
            
            // Get performance metrics
            const performanceMetrics = this.performanceMonitor.get_performance_metrics();

            // Process dependencies in batches
            const dependencies = this.getDependencies();
            let currentBatch = 0;

            const processBatch = () => {
                const startIdx = currentBatch * this.batchSize;
                const endIdx = Math.min(startIdx + this.batchSize, dependencies.length);
                const batch = dependencies.slice(startIdx, endIdx);

                batch.forEach(dependency => {
                    const metrics: DependencyMetrics = {
                        name: dependency.name,
                        version: dependency.version,
                        loadTime: this.calculateLoadTime(dependency),
                        memoryUsage: this.calculateMemoryUsage(dependency, systemMetrics),
                        cpuUsage: this.calculateCpuUsage(dependency, systemMetrics),
                        errorCount: this.getErrorCount(dependency),
                        timestamp: new Date()
                    };

                    // Add to buffer
                    if (!this.metricsBuffer.has(dependency.name)) {
                        this.metricsBuffer.set(dependency.name, []);
                    }
                    const dependencyMetrics = this.metricsBuffer.get(dependency.name)!;
                    dependencyMetrics.push(metrics);

                    // Check for performance issues
                    this.checkPerformanceIssues(metrics, performanceMetrics);
                });

                // Process next batch if available
                currentBatch++;
                if (currentBatch * this.batchSize < dependencies.length) {
                    setTimeout(processBatch, 0); // Yield to event loop
                } else {
                    this.flushMetricsBuffer();
                }
            };

            processBatch();
        } catch (error) {
            console.error('Error collecting dependency metrics:', error);
        }
    }

    private flushMetricsBuffer(): void {
        for (const [dependency, metrics] of this.metricsBuffer.entries()) {
            const cacheKey = `metrics:${dependency}`;
            const cachedMetrics = this.metricsCache.get<DependencyMetrics[]>(cacheKey) || [];
            const updatedMetrics = [...cachedMetrics, ...metrics].slice(-100);
            this.metricsCache.set<DependencyMetrics[]>(cacheKey, updatedMetrics, 300000);
        }
        this.metricsBuffer.clear();
    }

    private getDependencies(): Array<{ name: string; version: string }> {
        // Get list of dependencies from package.json
        const packageJson = require('../../package.json');
        return Object.entries(packageJson.dependencies || {})
            .map(([name, version]) => ({ name, version: version as string }));
    }

    private calculateLoadTime(dependency: { name: string }): number {
        const cacheKey = `loadTime:${dependency.name}`;
        const cachedLoadTime = this.metricsCache.get<number>(cacheKey);
        if (cachedLoadTime !== undefined) {
            return cachedLoadTime;
        }

        const loadTime = 0;
        this.metricsCache.set<number>(cacheKey, loadTime, 60000);
        return loadTime;
    }

    private calculateMemoryUsage(dependency: { name: string }, systemMetrics: any): number {
        const cacheKey = `memoryUsage:${dependency.name}`;
        const cachedMemoryUsage = this.metricsCache.get<number>(cacheKey);
        if (cachedMemoryUsage !== undefined) {
            return cachedMemoryUsage;
        }

        const memoryUsage = 0;
        this.metricsCache.set<number>(cacheKey, memoryUsage, 60000);
        return memoryUsage;
    }

    private calculateCpuUsage(dependency: { name: string }, systemMetrics: any): number {
        const cacheKey = `cpuUsage:${dependency.name}`;
        const cachedCpuUsage = this.metricsCache.get<number>(cacheKey);
        if (cachedCpuUsage !== undefined) {
            return cachedCpuUsage;
        }

        const cpuUsage = 0;
        this.metricsCache.set<number>(cacheKey, cpuUsage, 60000);
        return cpuUsage;
    }

    private getErrorCount(dependency: { name: string }): number {
        const cacheKey = `errorCount:${dependency.name}`;
        const cachedErrorCount = this.metricsCache.get<number>(cacheKey);
        if (cachedErrorCount !== undefined) {
            return cachedErrorCount;
        }

        const errorCount = 0;
        this.metricsCache.set<number>(cacheKey, errorCount, 60000);
        return errorCount;
    }

    private checkPerformanceIssues(metrics: DependencyMetrics, performanceMetrics: any): void {
        // Check for performance issues based on thresholds
        const thresholds = {
            loadTime: 1000, // 1 second
            memoryUsage: 100, // 100 MB
            cpuUsage: 50, // 50%
            errorCount: 5 // 5 errors
        };

        const issues: string[] = [];
        if (metrics.loadTime > thresholds.loadTime) {
            issues.push(`High load time: ${metrics.loadTime}ms`);
        }
        if (metrics.memoryUsage > thresholds.memoryUsage) {
            issues.push(`High memory usage: ${metrics.memoryUsage}MB`);
        }
        if (metrics.cpuUsage > thresholds.cpuUsage) {
            issues.push(`High CPU usage: ${metrics.cpuUsage}%`);
        }
        if (metrics.errorCount > thresholds.errorCount) {
            issues.push(`High error count: ${metrics.errorCount}`);
        }

        if (issues.length > 0) {
            // Report issues to performance monitor
            this.performanceMonitor.reportIssue({
                component: metrics.name,
                issues,
                severity: 'warning',
                timestamp: metrics.timestamp
            });
        }
    }

    public getMetrics(): Map<string, DependencyMetrics[]> {
        return this.metricsCache.getMetrics<DependencyMetrics[]>();
    }

    public getPerformanceIssues(): DependencyIssue[] {
        const issues: DependencyIssue[] = [];
        
        this.metricsCache.getMetrics<DependencyMetrics[]>().forEach((metrics, dependency) => {
            metrics.forEach(metric => {
                if (metric.errorCount > 0) {
                    issues.push({
                        dependency,
                        issue: `Error count: ${metric.errorCount}`,
                        severity: 'error'
                    });
                }
                if (metric.loadTime > 1000) {
                    issues.push({
                        dependency,
                        issue: `High load time: ${metric.loadTime}ms`,
                        severity: 'warning'
                    });
                }
            });
        });

        return issues;
    }
} 