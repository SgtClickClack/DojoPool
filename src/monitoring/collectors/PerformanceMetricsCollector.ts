import { MetricsCollector, MetricsData } from './MetricsCollector';
import os from 'os';

interface PerformanceMetrics extends MetricsData {
  operationLatency: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  diskUsage: number;
  queueLength: number;
}

export class PerformanceMetricsCollector extends MetricsCollector<PerformanceMetrics> {
  private operationTimes: number[] = [];
  private errorCount: number = 0;
  private operationCount: number = 0;
  private queueSize: number = 0;
  private lastCollectionTime: number = Date.now();
  private lastCpuUsage: NodeJS.CpuUsage = process.cpuUsage();
  private lastNetworkStats = { bytesIn: 0, bytesOut: 0 };

  recordOperationTime(timeMs: number): void {
    this.operationTimes.push(timeMs);
    this.operationCount++;
    // Keep only last 1000 operation times
    if (this.operationTimes.length > 1000) {
      this.operationTimes.shift();
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  updateQueueLength(size: number): void {
    this.queueSize = size;
  }

  async collect(): Promise<PerformanceMetrics> {
    const now = Date.now();
    const timeDiff = (now - this.lastCollectionTime) / 1000; // Convert to seconds

    // Calculate operation latency
    const avgLatency = this.operationTimes.length > 0
      ? this.operationTimes.reduce((sum, time) => sum + time, 0) / this.operationTimes.length
      : 0;

    // Calculate error rate
    const errorRate = this.operationCount > 0
      ? (this.errorCount / this.operationCount) * 100
      : 0;

    // Calculate throughput (operations per second)
    const throughput = this.operationCount / timeDiff;

    // Get CPU usage
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    const cpuPercent = (totalCpuTime / timeDiff) * 100;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Get disk usage (simplified)
    const diskUsage = 0; // Implement actual disk usage monitoring if needed

    const metrics: PerformanceMetrics = {
      operationLatency: avgLatency,
      errorRate,
      throughput,
      cpuUsage: Math.min(cpuPercent, 100),
      memoryUsage: memPercent,
      networkUsage: 0, // Implement actual network usage monitoring if needed
      diskUsage,
      queueLength: this.queueSize
    };

    // Update last collection time and CPU usage
    this.lastCollectionTime = now;
    this.lastCpuUsage = process.cpuUsage();

    // Reset counters
    this.operationCount = 0;
    this.errorCount = 0;

    this.updateMetrics(metrics);
    return metrics;
  }

  reset(): void {
    super.reset();
    this.operationTimes = [];
    this.errorCount = 0;
    this.operationCount = 0;
    this.queueSize = 0;
    this.lastCollectionTime = Date.now();
    this.lastCpuUsage = process.cpuUsage();
  }
} 