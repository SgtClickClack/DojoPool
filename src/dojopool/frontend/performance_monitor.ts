import {
  PerformanceMetrics,
  MetricData,
  MetricsSnapshot,
} from "./types/monitoring";

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsHistory: PerformanceMetrics[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY_LENGTH = 3600; // 1 hour of data at 1 second intervals

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMonitoring(intervalMs: number = 1000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateInterval = setInterval(() => this.updateMetrics(), intervalMs);
  }

  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateMetrics(): void {
    // Simulate metrics collection
    const newMetrics: PerformanceMetrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 16384, // MB
      diskUsage: Math.random() * 100,
      networkSent: Math.random() * 1000,
      networkReceived: Math.random() * 1000,
      memoryAvailable: 16384 - Math.random() * 16384,
      processCount: Math.floor(Math.random() * 100) + 50,
      threadCount: Math.floor(Math.random() * 200) + 100,
      timestamp: new Date(),
    };

    this.metricsHistory.push(newMetrics);
    if (this.metricsHistory.length > this.MAX_HISTORY_LENGTH) {
      this.metricsHistory.shift();
    }
  }

  public getCurrentMetrics(): PerformanceMetrics {
    if (this.metricsHistory.length === 0) {
      this.updateMetrics();
    }
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  public getMetrics(startTime: Date, endTime: Date): MetricsSnapshot {
    const filteredMetrics = this.metricsHistory.filter(
      (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime,
    );

    const toMetricData = (values: number[], labels: string[]): MetricData[] => {
      return values.map((value, index) => ({
        timestamp: filteredMetrics[index].timestamp.getTime(),
        value,
        label: labels[index],
      }));
    };

    return {
      current: this.getCurrentMetrics(),
      historical: {
        cpuUsage: toMetricData(
          filteredMetrics.map((m) => m.cpuUsage),
          filteredMetrics.map((m) => `${m.cpuUsage.toFixed(1)}%`),
        ),
        memoryUsage: toMetricData(
          filteredMetrics.map((m) => m.memoryUsage),
          filteredMetrics.map((m) => `${(m.memoryUsage / 1024).toFixed(1)} GB`),
        ),
        diskUsage: toMetricData(
          filteredMetrics.map((m) => m.diskUsage),
          filteredMetrics.map((m) => `${m.diskUsage.toFixed(1)}%`),
        ),
        networkTraffic: toMetricData(
          filteredMetrics.map((m) => m.networkSent + m.networkReceived),
          filteredMetrics.map(
            (m) =>
              `${((m.networkSent + m.networkReceived) / 1024).toFixed(1)} MB/s`,
          ),
        ),
      },
      alerts: [], // Implement alert system if needed
      latencyData: [], // Implement latency tracking if needed
      errorData: [], // Implement error tracking if needed
      updateTimes: toMetricData(
        filteredMetrics.map(() => 1),
        filteredMetrics.map((m) => m.timestamp.toISOString()),
      ),
      successRate: toMetricData(
        filteredMetrics.map(() => 100),
        filteredMetrics.map((m) => "100%"),
      ),
      timestamp: new Date(),
    };
  }
}
