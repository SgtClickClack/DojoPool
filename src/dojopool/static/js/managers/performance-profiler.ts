import { MemoryStats, PerformanceMarks, PerformanceMetrics, PerformanceSnapshot } from '../types';
import { BaseManager } from './base-manager';

export interface PerformanceMetrics {
    readonly timestamp: number;
    readonly frameProcessingTime: number;
    readonly memoryUsage: {
        readonly heapUsed: number;
        readonly heapTotal: number;
        readonly externalMemory: number;
    };
    readonly fps: number;
    readonly shotDetectionTime?: number;
    readonly shotConfidence?: number;
}

export interface ProfilerOptions {
    readonly maxSamples: number;
    readonly samplingInterval: number;
    readonly warningThresholds: {
        readonly frameTime: number;
        readonly memoryUsage: number;
        readonly fps: number;
    };
}

export interface PerformanceTrend {
    averageFps: number;
    fpsStdDev: number;
    averageFrameTime: number;
    frameTimeStdDev: number;
    memoryTrend: {
        averageUsage: number;
        peakUsage: number;
        growthRate: number; // Bytes per second
    };
    anomalies: {
        timestamp: number;
        metric: string;
        value: number;
        average: number;
        deviation: number;
    }[];
}

export class PerformanceProfiler extends BaseManager<PerformanceProfiler> {
    private static readonly DEFAULT_OPTIONS: ProfilerOptions = {
        maxSamples: 100,
        samplingInterval: 1000,
        warningThresholds: {
            frameTime: 33, // 30 FPS target
            memoryUsage: 0.8, // 80% heap usage
            fps: 25
        }
    };

    private readonly metrics: PerformanceMetrics[] = [];
    private readonly options: ProfilerOptions;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private samplingInterval: NodeJS.Timeout | null = null;
    private readonly snapshots: PerformanceSnapshot[];
    private readonly maxSnapshots: number;
    private lastSnapshotTime: number;
    private readonly snapshotInterval: number;
    private readonly performanceMarks: Map<string, number>;
    private readonly measurementStats: Map<string, { count: number; total: number; min: number; max: number }>;
    private autoSnapshotEnabled: boolean;
    private autoSnapshotInterval?: number;
    private readonly anomalyThreshold: number;

    protected constructor(options: Partial<ProfilerOptions> = {}) {
        super();
        this.options = { ...PerformanceProfiler.DEFAULT_OPTIONS, ...options };
        this.maxSnapshots = options.maxSnapshots || 100;
        this.snapshotInterval = options.snapshotIntervalMs || 1000;
        this.autoSnapshotEnabled = options.autoSnapshot || false;
        this.anomalyThreshold = options.anomalyThreshold || 2.0;
        this.snapshots = [];
        this.lastSnapshotTime = performance.now();
        this.performanceMarks = new Map();
        this.measurementStats = new Map();

        if (this.autoSnapshotEnabled) {
            this.startAutoSnapshot();
        }
        this.startSampling();
    }

    public static override getInstance(): PerformanceProfiler {
        return BaseManager.getInstance.call(PerformanceProfiler);
    }

    private startSampling(): void {
        this.samplingInterval = setInterval(() => {
            this.takeSample();
        }, this.options.samplingInterval);
    }

    private takeSample(): void {
        const now = performance.now();
        const timeSinceLastFrame = now - this.lastFrameTime;
        const currentFps = this.frameCount / (timeSinceLastFrame / 1000);

        const metrics: PerformanceMetrics = {
            timestamp: now,
            frameProcessingTime: timeSinceLastFrame / this.frameCount,
            memoryUsage: this.getMemoryUsage(),
            fps: currentFps
        };

        this.metrics.push(metrics);
        if (this.metrics.length > this.options.maxSamples) {
            this.metrics.shift();
        }

        this.checkWarningThresholds(metrics);

        // Reset counters
        this.frameCount = 0;
        this.lastFrameTime = now;
    }

    private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                heapUsed: memory.usedJSHeapSize,
                heapTotal: memory.totalJSHeapSize,
                externalMemory: memory.totalJSHeapSize - memory.usedJSHeapSize
            };
        }
        return {
            heapUsed: 0,
            heapTotal: 0,
            externalMemory: 0
        };
    }

    private checkWarningThresholds(metrics: PerformanceMetrics): void {
        const { warningThresholds } = this.options;
        const warnings: string[] = [];

        if (metrics.frameProcessingTime > warningThresholds.frameTime) {
            warnings.push(`High frame processing time: ${metrics.frameProcessingTime.toFixed(2)}ms`);
        }

        const memoryUsageRatio = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
        if (memoryUsageRatio > warningThresholds.memoryUsage) {
            warnings.push(`High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`);
        }

        if (metrics.fps < warningThresholds.fps) {
            warnings.push(`Low FPS: ${metrics.fps.toFixed(1)}`);
        }

        if (warnings.length > 0) {
            this.dispatchWarning(warnings);
        }
    }

    private dispatchWarning(warnings: string[]): void {
        const event = new CustomEvent('performanceWarning', {
            detail: {
                timestamp: Date.now(),
                warnings
            },
            bubbles: true,
            composed: true
        });
        window.dispatchEvent(event);
    }

    public recordFrame(processingTime: number, shotDetectionTime?: number, shotConfidence?: number): void {
        this.frameCount++;
        if (this.frameCount === 1) {
            this.lastFrameTime = performance.now();
        }

        const currentMetrics = this.metrics[this.metrics.length - 1];
        if (currentMetrics) {
            Object.assign(currentMetrics, {
                shotDetectionTime,
                shotConfidence
            });
        }
    }

    public getMetrics(): readonly PerformanceMetrics[] {
        return [...this.metrics];
    }

    public getAverageMetrics(): Partial<PerformanceMetrics> {
        if (this.metrics.length === 0) {
            return {};
        }

        const sum = this.metrics.reduce((acc, metrics) => ({
            frameProcessingTime: acc.frameProcessingTime + metrics.frameProcessingTime,
            fps: acc.fps + metrics.fps,
            memoryUsage: {
                heapUsed: acc.memoryUsage.heapUsed + metrics.memoryUsage.heapUsed,
                heapTotal: acc.memoryUsage.heapTotal + metrics.memoryUsage.heapTotal,
                externalMemory: acc.memoryUsage.externalMemory + metrics.memoryUsage.externalMemory
            },
            shotDetectionTime: (acc.shotDetectionTime || 0) + (metrics.shotDetectionTime || 0),
            shotConfidence: (acc.shotConfidence || 0) + (metrics.shotConfidence || 0)
        }));

        const count = this.metrics.length;
        const shotMetricsCount = this.metrics.filter(m => m.shotDetectionTime !== undefined).length;

        return {
            frameProcessingTime: sum.frameProcessingTime / count,
            fps: sum.fps / count,
            memoryUsage: {
                heapUsed: sum.memoryUsage.heapUsed / count,
                heapTotal: sum.memoryUsage.heapTotal / count,
                externalMemory: sum.memoryUsage.externalMemory / count
            },
            ...(shotMetricsCount > 0 && {
                shotDetectionTime: sum.shotDetectionTime / shotMetricsCount,
                shotConfidence: sum.shotConfidence / shotMetricsCount
            })
        };
    }

    public override cleanup(): void {
        if (this.samplingInterval) {
            clearInterval(this.samplingInterval);
            this.samplingInterval = null;
        }
        this.metrics.length = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.snapshots.length = 0;
        this.performanceMarks.clear();
        this.measurementStats.clear();
        this.autoSnapshotEnabled = false;
        this.autoSnapshotInterval = undefined;
        this.onCleanup();
    }

    public startMark(markName: keyof PerformanceMarks): void {
        this.performanceMarks.set(markName, performance.now());
    }

    public endMark(markName: keyof PerformanceMarks, measureName: string): number {
        const startTime = this.performanceMarks.get(markName);
        if (startTime === undefined) {
            throw new Error(`No mark found with name: ${markName}`);
        }

        const duration = performance.now() - startTime;
        this.performanceMarks.delete(markName);
        this.updateMeasurementStats(measureName, duration);
        return duration;
    }

    private updateMeasurementStats(measureName: string, duration: number): void {
        const stats = this.measurementStats.get(measureName) || {
            count: 0,
            total: 0,
            min: Infinity,
            max: -Infinity
        };

        stats.count++;
        stats.total += duration;
        stats.min = Math.min(stats.min, duration);
        stats.max = Math.max(stats.max, duration);

        this.measurementStats.set(measureName, stats);
    }

    public getMeasurementStats(measureName: string): {
        count: number;
        total: number;
        min: number;
        max: number;
        average: number;
    } | undefined {
        const stats = this.measurementStats.get(measureName);
        if (!stats) return undefined;

        return {
            ...stats,
            average: stats.total / stats.count
        };
    }

    public takeSnapshot(metrics: PerformanceMetrics): void {
        const now = performance.now();
        if (now - this.lastSnapshotTime < this.snapshotInterval) {
            return;
        }

        const frameTime = metrics.totalTime;
        const fps = 1000 / frameTime;

        const snapshot: PerformanceSnapshot = {
            timestamp: now,
            fps,
            frameTime,
            gpuTime: metrics.processingTime,
            memoryStats: metrics.memoryUsage || this.getMemoryStats(),
            workerUtilization: 0 // TODO: Implement worker utilization tracking
        };

        this.snapshots.push(snapshot);
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }

        this.lastSnapshotTime = now;
    }

    private getMemoryStats(): MemoryStats {
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

    public getSnapshots(): ReadonlyArray<PerformanceSnapshot> {
        return [...this.snapshots];
    }

    public setAutoSnapshot(enabled: boolean, intervalMs?: number): void {
        this.autoSnapshotEnabled = enabled;
        if (intervalMs !== undefined) {
            this.snapshotInterval = intervalMs;
        }

        if (enabled) {
            this.startAutoSnapshot();
        } else {
            this.stopAutoSnapshot();
        }
    }

    private startAutoSnapshot(): void {
        if (this.autoSnapshotInterval) return;

        this.autoSnapshotInterval = window.setInterval(() => {
            const frameTime = performance.now() - this.lastSnapshotTime;
            this.takeSnapshot({
                captureTime: frameTime * 0.3, // Estimated capture time
                processingTime: frameTime * 0.7, // Estimated processing time
                totalTime: frameTime,
                fps: 1000 / frameTime,
                memoryUsage: this.getMemoryStats()
            });
        }, this.snapshotInterval);
    }

    private stopAutoSnapshot(): void {
        if (this.autoSnapshotInterval) {
            clearInterval(this.autoSnapshotInterval);
            this.autoSnapshotInterval = undefined;
        }
    }

    public analyzeTrends(windowSize: number = 30): PerformanceTrend {
        const window = this.snapshots.slice(-windowSize);
        if (window.length < 2) {
            throw new Error('Insufficient data for trend analysis');
        }

        const fps = window.map(s => s.fps);
        const frameTimes = window.map(s => s.frameTime);
        const memoryUsage = window.map(s => s.memoryStats.usedJSHeapSize);

        const trend: PerformanceTrend = {
            averageFps: this.calculateMean(fps),
            fpsStdDev: this.calculateStdDev(fps),
            averageFrameTime: this.calculateMean(frameTimes),
            frameTimeStdDev: this.calculateStdDev(frameTimes),
            memoryTrend: {
                averageUsage: this.calculateMean(memoryUsage),
                peakUsage: Math.max(...memoryUsage),
                growthRate: this.calculateGrowthRate(window.map(s => ({
                    time: s.timestamp,
                    value: s.memoryStats.usedJSHeapSize
                })))
            },
            anomalies: []
        };

        // Detect anomalies
        window.forEach((snapshot, i) => {
            this.detectAnomalies(snapshot, trend, i).forEach(anomaly =>
                trend.anomalies.push(anomaly)
            );
        });

        return trend;
    }

    private detectAnomalies(
        snapshot: PerformanceSnapshot,
        trend: PerformanceTrend,
        index: number
    ): Array<{ timestamp: number; metric: string; value: number; average: number; deviation: number }> {
        const anomalies: Array<{ timestamp: number; metric: string; value: number; average: number; deviation: number }> = [];

        // Check FPS anomalies
        const fpsDeviation = Math.abs(snapshot.fps - trend.averageFps) / trend.fpsStdDev;
        if (fpsDeviation > this.anomalyThreshold) {
            anomalies.push({
                timestamp: snapshot.timestamp,
                metric: 'fps',
                value: snapshot.fps,
                average: trend.averageFps,
                deviation: fpsDeviation
            });
        }

        // Check frame time anomalies
        const frameTimeDeviation = Math.abs(snapshot.frameTime - trend.averageFrameTime) / trend.frameTimeStdDev;
        if (frameTimeDeviation > this.anomalyThreshold) {
            anomalies.push({
                timestamp: snapshot.timestamp,
                metric: 'frameTime',
                value: snapshot.frameTime,
                average: trend.averageFrameTime,
                deviation: frameTimeDeviation
            });
        }

        return anomalies;
    }

    private calculateMean(values: number[]): number {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private calculateStdDev(values: number[]): number {
        const mean = this.calculateMean(values);
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        return Math.sqrt(this.calculateMean(squareDiffs));
    }

    private calculateGrowthRate(samples: Array<{ time: number; value: number }>): number {
        if (samples.length < 2) return 0;

        const firstSample = samples[0];
        const lastSample = samples[samples.length - 1];
        const timeSpan = (lastSample.time - firstSample.time) / 1000; // Convert to seconds

        if (timeSpan === 0) return 0;

        return (lastSample.value - firstSample.value) / timeSpan;
    }
} 