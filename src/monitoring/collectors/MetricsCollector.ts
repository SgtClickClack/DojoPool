/**
 * Base interface for all metrics collectors in the system.
 * Each collector is responsible for gathering metrics from a specific component
 * and providing a standardized way to access those metrics.
 */
import { EventEmitter } from "events";

export interface MetricsData {
  [key: string]: number;
}

export interface MetricsEvents {
  metrics: (metrics: MetricsData) => void;
}

export declare interface MetricsCollector<T extends MetricsData = MetricsData> {
  on<K extends keyof MetricsEvents>(event: K, listener: MetricsEvents[K]): this;
  emit<K extends keyof MetricsEvents>(
    event: K,
    ...args: Parameters<MetricsEvents[K]>
  ): boolean;
}

export abstract class MetricsCollector<T extends MetricsData = MetricsData>
  extends EventEmitter
  implements MetricsCollector<T>
{
  protected lastCollectedMetrics: T | null = null;

  /**
   * Collects and returns the current metrics.
   * This method should be called periodically by the monitoring service.
   */
  abstract collect(): Promise<T>;

  /**
   * Resets the collector's internal state.
   * This is useful when you want to start collecting fresh metrics
   * or when recovering from an error state.
   */
  reset(): void {
    this.lastCollectedMetrics = null;
  }

  getLastMetrics(): T | null {
    return this.lastCollectedMetrics;
  }

  protected updateMetrics(metrics: T): void {
    this.lastCollectedMetrics = metrics;
    this.emit("metrics", metrics);
  }

  on<K extends keyof MetricsEvents>(
    event: K,
    listener: MetricsEvents[K],
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof MetricsEvents>(
    event: K,
    ...args: Parameters<MetricsEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
