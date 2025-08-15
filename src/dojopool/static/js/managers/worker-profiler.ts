import { BaseManager } from "./base-manager";

export interface WorkerMetrics {
  messageCount: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  utilization: number;
  queueLength: number;
  errors: number;
}

export interface WorkerTaskTiming {
  taskId: string;
  startTime: number;
  endTime?: number;
  type: string;
}

export class WorkerProfiler extends BaseManager<WorkerProfiler> {
  private workers: Map<
    Worker,
    {
      activeTasks: Map<string, WorkerTaskTiming>;
      metrics: WorkerMetrics;
    }
  > = new Map();

  private measurementWindow: number = 5000; // 5 second window for utilization calculation
  private taskHistory: WorkerTaskTiming[] = [];

  protected constructor() {
    super();
  }

  public static override getInstance(): WorkerProfiler {
    return BaseManager.getInstance.call(WorkerProfiler);
  }

  public registerWorker(worker: Worker): void {
    if (this.workers.has(worker)) return;

    this.workers.set(worker, {
      activeTasks: new Map(),
      metrics: {
        messageCount: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        utilization: 0,
        queueLength: 0,
        errors: 0,
      },
    });

    this.setupWorkerListeners(worker);
  }

  private setupWorkerListeners(worker: Worker): void {
    const workerData = this.workers.get(worker)!;

    // Intercept messages sent to worker
    const originalPostMessage = worker.postMessage.bind(worker);
    worker.postMessage = (message: any, transfer?: Transferable[]) => {
      const taskId = crypto.randomUUID();
      const timing: WorkerTaskTiming = {
        taskId,
        startTime: performance.now(),
        type: message.type || "unknown",
      };

      workerData.activeTasks.set(taskId, timing);
      workerData.metrics.messageCount++;
      workerData.metrics.queueLength++;

      // Add task ID to message
      const augmentedMessage = { ...message, taskId };
      originalPostMessage(augmentedMessage, transfer);
    };

    // Listen for worker responses
    worker.addEventListener("message", (event) => {
      const taskId = event.data.taskId;
      if (!taskId || !workerData.activeTasks.has(taskId)) return;

      const timing = workerData.activeTasks.get(taskId)!;
      timing.endTime = performance.now();

      const processingTime = timing.endTime - timing.startTime;
      workerData.metrics.totalProcessingTime += processingTime;
      workerData.metrics.averageProcessingTime =
        workerData.metrics.totalProcessingTime /
        workerData.metrics.messageCount;
      workerData.metrics.queueLength--;

      this.taskHistory.push(timing);
      this.pruneTaskHistory();
      this.updateUtilization(worker);

      workerData.activeTasks.delete(taskId);
    });

    worker.addEventListener("error", () => {
      workerData.metrics.errors++;
    });
  }

  private pruneTaskHistory(): void {
    const cutoffTime = performance.now() - this.measurementWindow;
    while (
      this.taskHistory.length > 0 &&
      this.taskHistory[0].endTime &&
      this.taskHistory[0].endTime < cutoffTime
    ) {
      this.taskHistory.shift();
    }
  }

  private updateUtilization(worker: Worker): void {
    const workerData = this.workers.get(worker)!;
    const now = performance.now();
    const windowStart = now - this.measurementWindow;

    // Calculate total busy time in the window
    let busyTime = 0;
    for (const task of this.taskHistory) {
      if (!task.endTime) continue;

      const start = Math.max(task.startTime, windowStart);
      const end = Math.min(task.endTime, now);
      if (end > start) {
        busyTime += end - start;
      }
    }

    workerData.metrics.utilization = busyTime / this.measurementWindow;
  }

  public getWorkerMetrics(worker: Worker): WorkerMetrics | undefined {
    return this.workers.get(worker)?.metrics;
  }

  public getAllMetrics(): Map<Worker, WorkerMetrics> {
    const metrics = new Map<Worker, WorkerMetrics>();
    for (const [worker, data] of this.workers) {
      metrics.set(worker, { ...data.metrics });
    }
    return metrics;
  }

  public setMeasurementWindow(milliseconds: number): void {
    this.measurementWindow = milliseconds;
    // Recalculate utilization for all workers
    for (const worker of this.workers.keys()) {
      this.updateUtilization(worker);
    }
  }

  public override cleanup(): void {
    for (const [worker, data] of this.workers) {
      data.activeTasks.clear();
      data.metrics = {
        messageCount: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        utilization: 0,
        queueLength: 0,
        errors: 0,
      };
    }
    this.taskHistory = [];
    this.onCleanup();
  }
}
