// Types
export interface MemoryStats {
    readonly heapUsed: number;
    readonly heapTotal: number;
    readonly externalMemory: number;
    readonly timestamp: number;
    readonly peakHeapUsed?: number;
    readonly gcCount?: number;
}

interface PerformanceMemory {
    readonly usedJSHeapSize: number;
    readonly totalJSHeapSize: number;
    readonly jsHeapSizeLimit: number;
}

interface MemoryTrend {
    readonly growthRate: number;
    readonly usageRatio: number;
    readonly isStable: boolean;
}

type GCCallback = () => void;

export class MemoryReporter {
    private static readonly GC_COOLDOWN_MS = 2000;
    private static readonly PRESSURE_THRESHOLD = 0.8;
    private static readonly CRITICAL_THRESHOLD = 0.9;
    private static readonly HISTORY_SIZE = 10;
    private static readonly STABLE_GROWTH_RATE = 0.05; // 5% growth rate is considered stable
    private static readonly SAMPLING_INTERVAL = 100; // 100ms sampling interval

    private lastGCTime: number = 0;
    private memoryHistory: MemoryStats[] = [];
    private pressureCallbacks: Set<() => void> = new Set();
    private gcCount: number = 0;
    private peakHeapUsed: number = 0;
    private samplingTimeout: number | null = null;
    private isMonitoring: boolean = false;

    constructor() {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        const sample = () => {
            if (!this.isMonitoring) return;

            const stats = this.collectMemoryStats();
            this.updateMemoryHistory(stats);

            this.samplingTimeout = self.setTimeout(sample, MemoryReporter.SAMPLING_INTERVAL);
        };

        sample();
    }

    private stopMonitoring(): void {
        this.isMonitoring = false;
        if (this.samplingTimeout !== null) {
            self.clearTimeout(this.samplingTimeout);
            this.samplingTimeout = null;
        }
    }

    public getMemoryStats(): MemoryStats {
        const stats = this.collectMemoryStats();
        return {
            ...stats,
            peakHeapUsed: this.peakHeapUsed,
            gcCount: this.gcCount
        };
    }

    private collectMemoryStats(): MemoryStats {
        const stats: MemoryStats = {
            heapUsed: 0,
            heapTotal: 0,
            externalMemory: 0,
            timestamp: Date.now()
        };

        if ('memory' in performance) {
            const memory = (performance as any).memory as PerformanceMemory;
            stats.heapUsed = memory.usedJSHeapSize;
            stats.heapTotal = memory.totalJSHeapSize;
            stats.externalMemory = memory.jsHeapSizeLimit - memory.totalJSHeapSize;

            // Update peak heap usage
            this.peakHeapUsed = Math.max(this.peakHeapUsed, stats.heapUsed);
        }

        return stats;
    }

    private updateMemoryHistory(stats: MemoryStats): void {
        // Use typed array for efficient storage
        const newHistory = new Float64Array(this.memoryHistory.length + 1);
        newHistory.set(this.memoryHistory.map(s => s.heapUsed));
        newHistory[this.memoryHistory.length] = stats.heapUsed;

        if (newHistory.length > MemoryReporter.HISTORY_SIZE) {
            newHistory.copyWithin(0, 1);
            newHistory.length--;
        }

        this.memoryHistory = Array.from(newHistory).map((heapUsed, i) => ({
            heapUsed,
            heapTotal: stats.heapTotal,
            externalMemory: stats.externalMemory,
            timestamp: stats.timestamp - (newHistory.length - 1 - i) * MemoryReporter.SAMPLING_INTERVAL
        }));

        this.checkMemoryTrend();
    }

    private checkMemoryTrend(): MemoryTrend {
        if (this.memoryHistory.length < 2) {
            return { growthRate: 0, usageRatio: 0, isStable: true };
        }

        const current = this.memoryHistory[this.memoryHistory.length - 1];
        const previous = this.memoryHistory[this.memoryHistory.length - 2];

        // Calculate moving average of growth rate
        const growthRates = this.memoryHistory.slice(1).map((stats, i) =>
            (stats.heapUsed - this.memoryHistory[i].heapUsed) / this.memoryHistory[i].heapUsed
        );

        const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
        const usageRatio = current.heapUsed / current.heapTotal;
        const isStable = Math.abs(avgGrowthRate) <= MemoryReporter.STABLE_GROWTH_RATE;

        const trend = { growthRate: avgGrowthRate, usageRatio, isStable };

        if (
            !isStable ||
            usageRatio > MemoryReporter.CRITICAL_THRESHOLD ||
            current.heapUsed - previous.heapUsed > 1024 * 1024 * 10 // 10MB sudden increase
        ) {
            this.requestGarbageCollection(true);
            this.notifyPressureCallbacks();
        }

        return trend;
    }

    public checkMemoryPressure(): boolean {
        const stats = this.getMemoryStats();
        return stats.heapUsed / stats.heapTotal > MemoryReporter.PRESSURE_THRESHOLD;
    }

    public onMemoryPressure(callback: () => void): () => void {
        this.pressureCallbacks.add(callback);
        return () => {
            this.pressureCallbacks.delete(callback);
            if (this.pressureCallbacks.size === 0) {
                this.stopMonitoring();
            }
        };
    }

    private notifyPressureCallbacks(): void {
        this.pressureCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Memory pressure callback failed:', error instanceof Error ? error.message : 'Unknown error');
            }
        });
    }

    public requestGarbageCollection(force: boolean = false): void {
        const now = Date.now();
        if (force || now - this.lastGCTime >= MemoryReporter.GC_COOLDOWN_MS) {
            this.lastGCTime = now;
            this.gcCount++;

            // Schedule cleanup in next tick
            setTimeout(() => {
                // Clear references and use typed arrays
                this.memoryHistory = this.memoryHistory.slice(-2);

                // Create temporary pressure with incremental cleanup
                const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
                const cleanup = (remainingSize: number) => {
                    if (remainingSize <= 0) {
                        if (global.gc) {
                            global.gc();
                        }
                        return;
                    }

                    const chunk = new ArrayBuffer(Math.min(CHUNK_SIZE, remainingSize));
                    setTimeout(() => {
                        (chunk as any) = null;
                        cleanup(remainingSize - CHUNK_SIZE);
                    }, 0);
                };

                cleanup(50 * 1024 * 1024); // 50MB total in chunks
            }, 0);
        }
    }

    public cleanup(): void {
        this.stopMonitoring();
        this.memoryHistory = [];
        this.pressureCallbacks.clear();
        this.gcCount = 0;
        this.peakHeapUsed = 0;
    }
}

// Worker message types
interface WorkerIncomingMessage {
    readonly type: 'getMemoryStats' | 'requestGC';
}

interface WorkerOutgoingMessage {
    readonly type: 'memoryStats';
    readonly stats: MemoryStats;
}

// Initialize reporter
const reporter = new MemoryReporter();

// Listen for memory stats requests
self.addEventListener('message', (event: MessageEvent<WorkerIncomingMessage>) => {
    if (event.data.type === 'getMemoryStats') {
        const stats = reporter.getMemoryStats();
        self.postMessage({ type: 'memoryStats', stats });
    } else if (event.data.type === 'requestGC') {
        reporter.requestGarbageCollection();
    }
}); 