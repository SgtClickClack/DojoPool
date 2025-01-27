import { PerformanceSnapshot } from '../types';
import { BaseManager } from './base-manager';
import { BudgetViolation, PerformanceBudget, PerformanceBudgetManager } from './performance-budget';
import { PerformanceVisualizer, VisualizerOptions } from './performance-visualizer';
import { ResourceVisualizer, ResourceVisualizerOptions } from './resource-visualizer';
import { WebGLProfiler, WebGLTimingInfo } from './webgl-profiler';
import { WorkerProfiler } from './worker-profiler';

export interface MonitorOptions {
    visualizer?: VisualizerOptions;
    resourceVisualizer?: ResourceVisualizerOptions;
    budget?: PerformanceBudget;
    autoStart?: boolean;
    sampleInterval?: number;
}

export interface PerformanceReport {
    timestamp: number;
    fps: number;
    frameTime: number;
    gpuMetrics: WebGLTimingInfo;
    workerMetrics: {
        totalUtilization: number;
        averageProcessingTime: number;
        totalErrors: number;
        activeWorkers: number;
    };
    memoryUsage: {
        jsHeapSize: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    };
    budgetStatus: {
        violations: BudgetViolation[];
        isWithinBudget: boolean;
        utilizationPercentages: { [key: string]: number };
    };
}

export class PerformanceMonitor extends BaseManager<PerformanceMonitor> {
    private webglProfiler?: WebGLProfiler;
    private readonly workerProfiler: WorkerProfiler;
    private readonly budgetManager: PerformanceBudgetManager;
    private visualizer?: PerformanceVisualizer;
    private resourceVisualizer?: ResourceVisualizer;
    private monitoringInterval?: number;
    private readonly sampleInterval: number;
    private lastFrameTime: number = 0;
    private reports: PerformanceReport[] = [];
    private readonly maxReports: number = 1000;
    private isMonitoring: boolean = false;

    protected constructor(options: MonitorOptions = {}) {
        super();
        this.sampleInterval = options.sampleInterval || 1000;
        this.workerProfiler = WorkerProfiler.getInstance();
        this.budgetManager = PerformanceBudgetManager.getInstance(options.budget);

        if (options.visualizer) {
            this.visualizer = PerformanceVisualizer.getInstance(options.visualizer);
        }

        if (options.resourceVisualizer) {
            this.resourceVisualizer = ResourceVisualizer.getInstance(options.resourceVisualizer);
        }

        if (options.autoStart) {
            this.start();
        }
    }

    public static override getInstance(options?: MonitorOptions): PerformanceMonitor {
        return BaseManager.getInstance.call(PerformanceMonitor) || new PerformanceMonitor(options);
    }

    public initializeWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
        this.webglProfiler = WebGLProfiler.getInstance(gl);
    }

    public registerWorker(worker: Worker): void {
        this.workerProfiler.registerWorker(worker);
    }

    public start(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.lastFrameTime = performance.now();
        this.startMonitoring();
    }

    public stop(): void {
        if (!this.isMonitoring) return;
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }

    private startMonitoring(): void {
        this.monitoringInterval = window.setInterval(() => {
            const report = this.generateReport();
            this.reports.push(report);
            if (this.reports.length > this.maxReports) {
                this.reports.shift();
            }

            // Update performance visualizer
            if (this.visualizer) {
                const snapshot: PerformanceSnapshot = {
                    timestamp: report.timestamp,
                    fps: report.fps,
                    frameTime: report.frameTime,
                    gpuTime: report.gpuMetrics.gpuTime,
                    memoryStats: report.memoryUsage,
                    workerUtilization: report.workerMetrics.totalUtilization
                };

                this.visualizer.updateData(
                    snapshot,
                    report.budgetStatus.violations,
                    this.budgetManager['budget']
                );
            }

            // Update resource visualizer
            if (this.resourceVisualizer) {
                // Update WebGL resources
                if (this.webglProfiler) {
                    this.resourceVisualizer.updateWebGLResources(this.webglProfiler.getResourceStats());
                }

                // Update memory usage
                const memoryStats = report.memoryUsage;
                this.resourceVisualizer.updateMemoryUsage(
                    memoryStats.usedJSHeapSize,
                    memoryStats.totalJSHeapSize
                );

                // Update worker status
                const workerMetrics = Array.from(this.workerProfiler.getAllMetrics().values());
                const activeWorkers = workerMetrics.filter(m => m.queueLength > 0).length;
                const idleWorkers = workerMetrics.length - activeWorkers;
                const queuedTasks = workerMetrics.reduce((sum, m) => sum + m.queueLength, 0);
                const errorCount = workerMetrics.reduce((sum, m) => sum + m.errors, 0);

                this.resourceVisualizer.updateWorkerStatus(
                    activeWorkers,
                    idleWorkers,
                    queuedTasks,
                    errorCount
                );
            }
        }, this.sampleInterval);
    }

    private generateReport(): PerformanceReport {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const gpuMetrics = this.webglProfiler?.endFrame() || {
            gpuTime: 0,
            drawCalls: 0,
            triangleCount: 0,
            contextLost: false
        };

        // Start next frame timing
        this.webglProfiler?.startFrame();

        // Calculate worker metrics
        const workerMetrics = Array.from(this.workerProfiler.getAllMetrics().values());
        const totalWorkerMetrics = workerMetrics.reduce(
            (acc, metrics) => ({
                totalUtilization: acc.totalUtilization + metrics.utilization,
                averageProcessingTime: acc.averageProcessingTime + metrics.averageProcessingTime,
                totalErrors: acc.totalErrors + metrics.errors
            }),
            { totalUtilization: 0, averageProcessingTime: 0, totalErrors: 0 }
        );

        const snapshot: PerformanceSnapshot & { drawCalls: number } = {
            timestamp: now,
            fps: 1000 / frameTime,
            frameTime,
            gpuTime: gpuMetrics.gpuTime,
            memoryStats: this.getMemoryStats(),
            workerUtilization: totalWorkerMetrics.totalUtilization / workerMetrics.length,
            drawCalls: gpuMetrics.drawCalls
        };

        const budgetStatus = this.budgetManager.checkPerformance(snapshot);

        return {
            timestamp: now,
            fps: snapshot.fps,
            frameTime,
            gpuMetrics,
            workerMetrics: {
                ...totalWorkerMetrics,
                averageProcessingTime: totalWorkerMetrics.averageProcessingTime / workerMetrics.length,
                activeWorkers: workerMetrics.length
            },
            memoryUsage: snapshot.memoryStats,
            budgetStatus
        };
    }

    private getMemoryStats(): { jsHeapSize: number; totalJSHeapSize: number; usedJSHeapSize: number } {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                jsHeapSize: memory.jsHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                usedJSHeapSize: memory.usedJSHeapSize
            };
        }
        return {
            jsHeapSize: 0,
            totalJSHeapSize: 0,
            usedJSHeapSize: 0
        };
    }

    public getReports(count?: number): ReadonlyArray<PerformanceReport> {
        if (count === undefined) return [...this.reports];
        return this.reports.slice(-count);
    }

    public getLatestReport(): PerformanceReport | undefined {
        return this.reports[this.reports.length - 1];
    }

    public onBudgetViolation(callback: (violation: BudgetViolation) => void): void {
        this.budgetManager.onViolation(callback);
    }

    public override cleanup(): void {
        this.stop();
        this.reports = [];
        this.webglProfiler?.cleanup();
        this.workerProfiler.cleanup();
        this.budgetManager.cleanup();
        this.visualizer?.cleanup();
        this.resourceVisualizer?.cleanup();
        this.onCleanup();
    }
} 