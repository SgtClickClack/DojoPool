export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkSent: number;
  networkReceived: number;
  memoryAvailable: number;
  processCount: number;
  threadCount: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[];
  private readonly updateInterval: number = 1000; // Update every second
  private intervalId?: number;

  private constructor() {
    this.metrics = this.getDefaultMetrics();
    this.metricsHistory = [];
    this.startMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startMonitoring(): void {
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(() => {
        this.updateMetrics();
      }, this.updateInterval);
    }
  }

  private stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateMetrics(): void {
    // Get memory usage if available
    const memory = (performance as any).memory;
    const memoryUsage = memory
      ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      : 0;
    const memoryAvailable = memory
      ? (memory.jsHeapSizeLimit - memory.usedJSHeapSize) / (1024 * 1024 * 1024)
      : 0;

    // Update metrics with simulated values for demo purposes
    const metrics: PerformanceMetrics = {
      cpuUsage: Math.random() * 30 + 10, // 10-40%
      memoryUsage,
      diskUsage: Math.random() * 20 + 60, // 60-80%
      networkSent: Math.random() * 5, // 0-5 MB
      networkReceived: Math.random() * 8, // 0-8 MB
      memoryAvailable,
      processCount: Math.floor(Math.random() * 50 + 100), // 100-150 processes
      threadCount: Math.floor(Math.random() * 200 + 300), // 300-500 threads
      timestamp: new Date(),
    };

    this.metrics = metrics;
    this.metricsHistory.push(metrics);

    // Keep only the last hour of metrics
    const oneHourAgo = new Date().getTime() - 60 * 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter(
      (m) => m.timestamp.getTime() > oneHourAgo
    );
  }

  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getMetrics(startTime: Date, endTime: Date): PerformanceMetrics[] {
    return this.metricsHistory.filter(
      (m) => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkSent: 0,
      networkReceived: 0,
      memoryAvailable: 0,
      processCount: 0,
      threadCount: 0,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const performance_monitor = PerformanceMonitor.getInstance();
