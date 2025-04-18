import { GameEvent, GameState } from "../types/game";

export class RealTimeAnalysisService {
  private eventQueue: GameEvent[];
  private processingInterval: NodeJS.Timeout | null;
  private eventHandlers: Map<string, ((event: GameEvent) => void)[]>;
  private performanceMetrics: {
    processingTime: number[];
    queueSize: number[];
    eventCount: number;
    errorCount: number;
  };

  constructor() {
    this.eventQueue = [];
    this.processingInterval = null;
    this.eventHandlers = new Map();
    this.performanceMetrics = {
      processingTime: [],
      queueSize: [],
      eventCount: 0,
      errorCount: 0,
    };
  }

  public startProcessing(intervalMs: number = 100): void {
    if (this.processingInterval) {
      this.stopProcessing();
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  public enqueueEvent(event: GameEvent): void {
    this.eventQueue.push(event);
    this.performanceMetrics.queueSize.push(this.eventQueue.length);
  }

  public registerEventHandler(
    eventType: string,
    handler: (event: GameEvent) => void,
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)?.push(handler);
  }

  public unregisterEventHandler(
    eventType: string,
    handler: (event: GameEvent) => void,
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return {
      ...this.performanceMetrics,
      processingTime: [...this.performanceMetrics.processingTime],
      queueSize: [...this.performanceMetrics.queueSize],
    };
  }

  public clearMetrics(): void {
    this.performanceMetrics = {
      processingTime: [],
      queueSize: [],
      eventCount: 0,
      errorCount: 0,
    };
  }

  private processQueue(): void {
    const startTime = performance.now();
    const events = this.eventQueue.splice(0, this.eventQueue.length);

    events.forEach((event) => {
      try {
        this.processEvent(event);
        this.performanceMetrics.eventCount++;
      } catch (error) {
        this.performanceMetrics.errorCount++;
        console.error("Error processing event:", error);
      }
    });

    const processingTime = performance.now() - startTime;
    this.performanceMetrics.processingTime.push(processingTime);
  }

  private processEvent(event: GameEvent): void {
    const handlers = this.eventHandlers.get(event.shotType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          this.performanceMetrics.errorCount++;
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  public isProcessing(): boolean {
    return this.processingInterval !== null;
  }
}
