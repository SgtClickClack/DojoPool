import { PerformanceMetrics } from '../types/monitoring';

interface DependencyMetrics {
    name: string;
    version: string;
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    timestamp: Date;
}

class DependencyPerformanceMonitor {
    private static instance: DependencyPerformanceMonitor;
    private metrics: Map<string, DependencyMetrics[]>;
    private readonly MAX_HISTORY_LENGTH = 3600; // 1 hour of data at 1 second intervals
    private updateInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.metrics = new Map();
    }

    public static getInstance(): DependencyPerformanceMonitor {
        if (!DependencyPerformanceMonitor.instance) {
            DependencyPerformanceMonitor.instance = new DependencyPerformanceMonitor();
        }
        return DependencyPerformanceMonitor.instance;
    }

    public startMonitoring(interval: number = 1000): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateMetrics(), interval);
    }

    public stopMonitoring(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    private updateMetrics(): void {
        // Get all loaded dependencies
        const dependencies = this.getLoadedDependencies();

        dependencies.forEach(dep => {
            const metrics: DependencyMetrics = {
                name: dep.name,
                version: dep.version,
                loadTime: this.measureLoadTime(dep),
                memoryUsage: this.measureMemoryUsage(dep),
                cpuUsage: this.measureCpuUsage(dep),
                errorCount: this.getErrorCount(dep),
                timestamp: new Date()
            };

            if (!this.metrics.has(dep.name)) {
                this.metrics.set(dep.name, []);
            }

            const history = this.metrics.get(dep.name)!;
            history.push(metrics);

            // Keep only the last hour of metrics
            if (history.length > this.MAX_HISTORY_LENGTH) {
                history.shift();
            }
        });
    }

    private getLoadedDependencies(): Array<{ name: string; version: string }> {
        // Get dependencies from package.json
        const packageJson = require('../../package.json');
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        return Object.entries(dependencies).map(([name, version]) => ({
            name,
            version: version as string
        }));
    }

    private measureLoadTime(dep: { name: string }): number {
        // Measure module load time
        const start = performance.now();
        try {
            require(dep.name);
            return performance.now() - start;
        } catch (error) {
            return -1; // Indicate error
        }
    }

    private measureMemoryUsage(dep: { name: string }): number {
        // Get memory usage for the module
        const memory = (performance as any).memory;
        if (memory) {
            return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        }
        return 0;
    }

    private measureCpuUsage(dep: { name: string }): number {
        // Estimate CPU usage based on module activity
        return Math.random() * 100; // Placeholder - implement actual CPU measurement
    }

    private getErrorCount(dep: { name: string }): number {
        // Get error count for the module
        return 0; // Placeholder - implement actual error counting
    }

    public getMetrics(dependencyName?: string): Map<string, DependencyMetrics[]> {
        if (dependencyName) {
            const result = new Map();
            if (this.metrics.has(dependencyName)) {
                result.set(dependencyName, this.metrics.get(dependencyName));
            }
            return result;
        }
        return new Map(this.metrics);
    }

    public getPerformanceIssues(): Array<{ dependency: string; issue: string; severity: 'warning' | 'error' }> {
        const issues: Array<{ dependency: string; issue: string; severity: 'warning' | 'error' }> = [];

        this.metrics.forEach((history, dependency) => {
            const latest = history[history.length - 1];
            if (!latest) return;

            // Check for performance issues
            if (latest.loadTime > 1000) {
                issues.push({
                    dependency,
                    issue: 'High load time',
                    severity: 'warning'
                });
            }

            if (latest.memoryUsage > 100) {
                issues.push({
                    dependency,
                    issue: 'High memory usage',
                    severity: 'warning'
                });
            }

            if (latest.cpuUsage > 80) {
                issues.push({
                    dependency,
                    issue: 'High CPU usage',
                    severity: 'error'
                });
            }

            if (latest.errorCount > 10) {
                issues.push({
                    dependency,
                    issue: 'High error count',
                    severity: 'error'
                });
            }
        });

        return issues;
    }
}

export default DependencyPerformanceMonitor; 