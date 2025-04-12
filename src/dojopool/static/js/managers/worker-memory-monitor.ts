import { BaseManager } from './base-manager';

// Types
export interface WorkerMemoryStats {
    readonly heapUsed: number;
    readonly heapTotal: number;
    readonly externalMemory: number;
    readonly timestamp: number;
}

export type AlertType = 'warning' | 'critical';

export interface WorkerMemoryAlert {
    readonly workerId: string;
    readonly type: AlertType;
    readonly heapUsage: number;
    readonly threshold: number;
    readonly timestamp: number;
}

export interface WorkerMemoryThresholds {
    readonly warning: number;
    readonly critical: number;
    readonly gcTrigger: number;
}

interface RegisteredWorker {
    readonly worker: Worker;
    readonly id: string;
    lastStats: WorkerMemoryStats | null;
    readonly alerts: WorkerMemoryAlert[];
}

export class WorkerMemoryMonitor extends BaseManager<WorkerMemoryMonitor> {
    private readonly workers: Map<string, RegisteredWorker> = new Map();
    private readonly thresholds: WorkerMemoryThresholds = {
        warning: 70,
        critical: 85,
        gcTrigger: 80
    };
    private worker: Worker;
    private memoryThreshold: number;
    private checkInterval: number;

    constructor(worker: Worker, memoryThreshold: number = 100, checkInterval: number = 5000) {
        super();
        this.worker = worker;
        this.memoryThreshold = memoryThreshold;
        this.checkInterval = checkInterval;
    }

    public registerWorker(workerId: string, worker: Worker): void {
        if (this.workers.has(workerId)) {
            throw new Error(`Worker with ID ${workerId} is already registered`);
        }

        this.workers.set(workerId, {
            worker,
            id: workerId,
            lastStats: null,
            alerts: []
        });

        worker.addEventListener('message', this.handleWorkerMessage.bind(this, workerId));
    }

    public unregisterWorker(workerId: string): void {
        const registeredWorker = this.workers.get(workerId);
        if (registeredWorker) {
            registeredWorker.worker.removeEventListener('message', this.handleWorkerMessage.bind(this, workerId));
            this.workers.delete(workerId);
        }
    }

    private handleWorkerMessage(workerId: string, event: MessageEvent): void {
        if (event.data.type === 'memoryStats') {
            const stats: WorkerMemoryStats = event.data.stats;
            const registeredWorker = this.workers.get(workerId);

            if (registeredWorker) {
                registeredWorker.lastStats = stats;
                this.processMemoryStats(workerId, stats);
            }
        }
    }

    private processMemoryStats(workerId: string, stats: WorkerMemoryStats): void {
        const heapUsagePercent = (stats.heapUsed / stats.heapTotal) * 100;

        if (heapUsagePercent >= this.thresholds.critical) {
            this.generateAlert(workerId, stats, 'critical');
            const worker = this.workers.get(workerId)?.worker;
            if (worker) {
                worker.postMessage({ type: 'requestGC' });
            }
        } else if (heapUsagePercent >= this.thresholds.warning) {
            this.generateAlert(workerId, stats, 'warning');
            if (heapUsagePercent >= this.thresholds.gcTrigger) {
                const worker = this.workers.get(workerId)?.worker;
                if (worker) {
                    worker.postMessage({ type: 'requestGC' });
                }
            }
        }
    }

    private generateAlert(workerId: string, stats: WorkerMemoryStats, severity: 'warning' | 'critical'): void {
        const alert: WorkerMemoryAlert = {
            workerId,
            type: severity,
            heapUsage: (stats.heapUsed / stats.heapTotal) * 100,
            threshold: this.thresholds[severity],
            timestamp: Date.now()
        };

        const registeredWorker = this.workers.get(workerId);
        if (registeredWorker) {
            registeredWorker.alerts.push(alert);
            if (registeredWorker.alerts.length > 10) {
                registeredWorker.alerts.shift();
            }
        }

        const event = new CustomEvent('workerMemoryAlert', {
            detail: alert,
            bubbles: true,
            composed: true
        });
        window.dispatchEvent(event);
    }

    public getWorkerStats(workerId: string): WorkerMemoryStats | null {
        return this.workers.get(workerId)?.lastStats || null;
    }

    public getAllWorkerStats(): Map<string, WorkerMemoryStats | null> {
        const stats = new Map<string, WorkerMemoryStats | null>();
        for (const [workerId, registeredWorker] of this.workers) {
            stats.set(workerId, registeredWorker.lastStats);
        }
        return stats;
    }

    public override cleanup(): void {
        for (const [workerId] of this.workers) {
            this.unregisterWorker(workerId);
        }
        this.workers.clear();
        this.onCleanup();
    }

    startMonitoring(): void {
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            if (memoryUsage.heapUsed > this.memoryThreshold) {
                this.worker.postMessage({ type: 'MEMORY_WARNING', data: memoryUsage });
            }
        }, this.checkInterval);
    }
}

export default WorkerMemoryMonitor; 