import { PerformanceSnapshot } from '../types';
import { BaseManager } from './base-manager';

export interface PerformanceBudget {
    maxFrameTime?: number;
    minFps?: number;
    maxGpuTime?: number;
    maxMemoryUsage?: number;
    maxWorkerUtilization?: number;
    maxDrawCalls?: number;
}

export interface BudgetViolation {
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    severity: 'warning' | 'critical';
}

export interface BudgetStatus {
    violations: BudgetViolation[];
    isWithinBudget: boolean;
    utilizationPercentages: {
        [key: string]: number;
    };
}

export class PerformanceBudgetManager extends BaseManager<PerformanceBudgetManager> {
    private budget: PerformanceBudget;
    private warningThreshold: number = 0.8; // 80% of budget
    private violations: BudgetViolation[] = [];
    private readonly maxViolationHistory: number = 100;
    private listeners: Set<(violation: BudgetViolation) => void> = new Set();

    protected constructor(initialBudget: PerformanceBudget = {}) {
        super();
        this.budget = {
            maxFrameTime: 16.67, // 60 FPS
            minFps: 55,
            maxGpuTime: 12, // ~70% of frame time
            maxMemoryUsage: 512 * 1024 * 1024, // 512MB
            maxWorkerUtilization: 0.8, // 80%
            maxDrawCalls: 1000,
            ...initialBudget
        };
    }

    public static override getInstance(initialBudget?: PerformanceBudget): PerformanceBudgetManager {
        return BaseManager.getInstance.call(PerformanceBudgetManager) || new PerformanceBudgetManager(initialBudget);
    }

    public setBudget(newBudget: Partial<PerformanceBudget>): void {
        this.budget = { ...this.budget, ...newBudget };
    }

    public setWarningThreshold(threshold: number): void {
        if (threshold <= 0 || threshold >= 1) {
            throw new Error('Warning threshold must be between 0 and 1');
        }
        this.warningThreshold = threshold;
    }

    public checkPerformance(snapshot: PerformanceSnapshot & { drawCalls?: number }): BudgetStatus {
        const violations: BudgetViolation[] = [];
        const utilizationPercentages: { [key: string]: number } = {};

        // Check frame time
        if (this.budget.maxFrameTime) {
            const frameTimeUtil = snapshot.frameTime / this.budget.maxFrameTime;
            utilizationPercentages.frameTime = frameTimeUtil;
            if (frameTimeUtil > 1) {
                violations.push(this.createViolation('frameTime', snapshot.frameTime, this.budget.maxFrameTime, snapshot.timestamp));
            } else if (frameTimeUtil > this.warningThreshold) {
                violations.push(this.createViolation('frameTime', snapshot.frameTime, this.budget.maxFrameTime, snapshot.timestamp, 'warning'));
            }
        }

        // Check FPS
        if (this.budget.minFps) {
            const fpsUtil = this.budget.minFps / snapshot.fps;
            utilizationPercentages.fps = fpsUtil;
            if (snapshot.fps < this.budget.minFps) {
                violations.push(this.createViolation('fps', snapshot.fps, this.budget.minFps, snapshot.timestamp));
            } else if (snapshot.fps < this.budget.minFps / this.warningThreshold) {
                violations.push(this.createViolation('fps', snapshot.fps, this.budget.minFps, snapshot.timestamp, 'warning'));
            }
        }

        // Check GPU time
        if (this.budget.maxGpuTime) {
            const gpuTimeUtil = snapshot.gpuTime / this.budget.maxGpuTime;
            utilizationPercentages.gpuTime = gpuTimeUtil;
            if (gpuTimeUtil > 1) {
                violations.push(this.createViolation('gpuTime', snapshot.gpuTime, this.budget.maxGpuTime, snapshot.timestamp));
            } else if (gpuTimeUtil > this.warningThreshold) {
                violations.push(this.createViolation('gpuTime', snapshot.gpuTime, this.budget.maxGpuTime, snapshot.timestamp, 'warning'));
            }
        }

        // Check memory usage
        if (this.budget.maxMemoryUsage) {
            const memoryUtil = snapshot.memoryStats.usedJSHeapSize / this.budget.maxMemoryUsage;
            utilizationPercentages.memoryUsage = memoryUtil;
            if (memoryUtil > 1) {
                violations.push(this.createViolation('memoryUsage', snapshot.memoryStats.usedJSHeapSize, this.budget.maxMemoryUsage, snapshot.timestamp));
            } else if (memoryUtil > this.warningThreshold) {
                violations.push(this.createViolation('memoryUsage', snapshot.memoryStats.usedJSHeapSize, this.budget.maxMemoryUsage, snapshot.timestamp, 'warning'));
            }
        }

        // Check worker utilization
        if (this.budget.maxWorkerUtilization) {
            const workerUtil = snapshot.workerUtilization / this.budget.maxWorkerUtilization;
            utilizationPercentages.workerUtilization = workerUtil;
            if (workerUtil > 1) {
                violations.push(this.createViolation('workerUtilization', snapshot.workerUtilization, this.budget.maxWorkerUtilization, snapshot.timestamp));
            } else if (workerUtil > this.warningThreshold) {
                violations.push(this.createViolation('workerUtilization', snapshot.workerUtilization, this.budget.maxWorkerUtilization, snapshot.timestamp, 'warning'));
            }
        }

        // Check draw calls if available
        if (this.budget.maxDrawCalls && snapshot.drawCalls !== undefined) {
            const drawCallsUtil = snapshot.drawCalls / this.budget.maxDrawCalls;
            utilizationPercentages.drawCalls = drawCallsUtil;
            if (drawCallsUtil > 1) {
                violations.push(this.createViolation('drawCalls', snapshot.drawCalls, this.budget.maxDrawCalls, snapshot.timestamp));
            } else if (drawCallsUtil > this.warningThreshold) {
                violations.push(this.createViolation('drawCalls', snapshot.drawCalls, this.budget.maxDrawCalls, snapshot.timestamp, 'warning'));
            }
        }

        // Store and notify about violations
        violations.forEach(violation => {
            this.violations.push(violation);
            if (this.violations.length > this.maxViolationHistory) {
                this.violations.shift();
            }
            this.notifyListeners(violation);
        });

        return {
            violations,
            isWithinBudget: violations.every(v => v.severity === 'warning'),
            utilizationPercentages
        };
    }

    private createViolation(
        metric: string,
        value: number,
        threshold: number,
        timestamp: number,
        severity: 'warning' | 'critical' = 'critical'
    ): BudgetViolation {
        return {
            metric,
            value,
            threshold,
            timestamp,
            severity
        };
    }

    public onViolation(callback: (violation: BudgetViolation) => void): void {
        this.listeners.add(callback);
    }

    public removeViolationListener(callback: (violation: BudgetViolation) => void): void {
        this.listeners.delete(callback);
    }

    private notifyListeners(violation: BudgetViolation): void {
        this.listeners.forEach(listener => listener(violation));
    }

    public getViolationHistory(): ReadonlyArray<BudgetViolation> {
        return [...this.violations];
    }

    public override cleanup(): void {
        this.violations = [];
        this.listeners.clear();
        this.onCleanup();
    }
} 