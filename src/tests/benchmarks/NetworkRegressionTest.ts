import {
  BenchmarkResult,
  BenchmarkConfig,
  NetworkBenchmark,
} from "./NetworkTransport.bench";
import { AlertManager } from "../../monitoring/AlertManager";
import { MonitoringService } from "../../monitoring/MonitoringService";
import { promises as fs } from "fs";
import path from "path";

interface HistoricalResult extends BenchmarkResult {
  timestamp: number;
}

interface RegressionTestConfig extends BenchmarkConfig {
  historyFile: string;
  maxHistorySize: number;
  regressionThresholds: {
    opsPerSecond: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    memoryUsage: number;
  };
}

const DEFAULT_REGRESSION_CONFIG: RegressionTestConfig = {
  duration: 60000,
  messageSize: 1024,
  concurrentConnections: 10,
  messageRate: 100,
  failureRate: 0.01,
  networkLatency: 50,
  historyFile: path.join(__dirname, "benchmark_history.json"),
  maxHistorySize: 100,
  regressionThresholds: {
    opsPerSecond: -10, // 10% decrease
    averageLatency: 20, // 20% increase
    p95Latency: 25, // 25% increase
    p99Latency: 30, // 30% increase
    errorRate: 50, // 50% increase
    memoryUsage: 15, // 15% increase
  },
};

export class NetworkRegressionTest {
  private history: HistoricalResult[] = [];
  private alertManager: AlertManager;
  private monitoringService: MonitoringService;
  private readonly config: RegressionTestConfig;
  private readonly benchmark: NetworkBenchmark;

  constructor(
    config: Partial<RegressionTestConfig> = {},
    alertManager: AlertManager,
    monitoringService: MonitoringService,
  ) {
    this.config = { ...DEFAULT_REGRESSION_CONFIG, ...config };
    this.alertManager = alertManager;
    this.monitoringService = monitoringService;
    this.benchmark = new NetworkBenchmark(this.config);
  }

  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.historyFile, "utf-8");
      this.history = JSON.parse(data);
    } catch (error) {
      this.history = [];
    }
  }

  private async saveHistory(): Promise<void> {
    // Trim history if it exceeds maxHistorySize
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }
    await fs.writeFile(
      this.config.historyFile,
      JSON.stringify(this.history, null, 2),
    );
  }

  private calculateBaseline(): BenchmarkResult | null {
    if (this.history.length === 0) return null;

    // Use last 5 results or all available if less than 5
    const recentResults = this.history.slice(-5);
    const baseline: BenchmarkResult = {
      name: "baseline",
      operations: 0,
      duration: 0,
      opsPerSecond: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      memoryUsage: 0,
    };

    for (const result of recentResults) {
      baseline.operations += result.operations / recentResults.length;
      baseline.duration += result.duration / recentResults.length;
      baseline.opsPerSecond += result.opsPerSecond / recentResults.length;
      baseline.averageLatency += result.averageLatency / recentResults.length;
      baseline.p95Latency += result.p95Latency / recentResults.length;
      baseline.p99Latency += result.p99Latency / recentResults.length;
      baseline.errorRate += result.errorRate / recentResults.length;
      baseline.memoryUsage += result.memoryUsage / recentResults.length;
    }

    return baseline;
  }

  private checkRegression(
    current: BenchmarkResult,
    baseline: BenchmarkResult,
  ): string[] {
    const regressions: string[] = [];
    const thresholds = this.config.regressionThresholds;

    // Calculate percentage changes
    const changes = {
      opsPerSecond:
        ((current.opsPerSecond - baseline.opsPerSecond) /
          baseline.opsPerSecond) *
        100,
      averageLatency:
        ((current.averageLatency - baseline.averageLatency) /
          baseline.averageLatency) *
        100,
      p95Latency:
        ((current.p95Latency - baseline.p95Latency) / baseline.p95Latency) *
        100,
      p99Latency:
        ((current.p99Latency - baseline.p99Latency) / baseline.p99Latency) *
        100,
      errorRate:
        ((current.errorRate - baseline.errorRate) / baseline.errorRate) * 100,
      memoryUsage:
        ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) *
        100,
    };

    // Check each metric against its threshold
    if (changes.opsPerSecond < thresholds.opsPerSecond) {
      regressions.push(
        `Operations per second decreased by ${Math.abs(changes.opsPerSecond).toFixed(2)}%`,
      );
    }
    if (changes.averageLatency > thresholds.averageLatency) {
      regressions.push(
        `Average latency increased by ${changes.averageLatency.toFixed(2)}%`,
      );
    }
    if (changes.p95Latency > thresholds.p95Latency) {
      regressions.push(
        `P95 latency increased by ${changes.p95Latency.toFixed(2)}%`,
      );
    }
    if (changes.p99Latency > thresholds.p99Latency) {
      regressions.push(
        `P99 latency increased by ${changes.p99Latency.toFixed(2)}%`,
      );
    }
    if (changes.errorRate > thresholds.errorRate) {
      regressions.push(
        `Error rate increased by ${changes.errorRate.toFixed(2)}%`,
      );
    }
    if (changes.memoryUsage > thresholds.memoryUsage) {
      regressions.push(
        `Memory usage increased by ${changes.memoryUsage.toFixed(2)}%`,
      );
    }

    return regressions;
  }

  public async runRegressionTest(): Promise<string[]> {
    await this.loadHistory();

    // Run benchmark
    const result = await this.benchmark.runBenchmark();
    const historicalResult: HistoricalResult = {
      ...result,
      timestamp: Date.now(),
    };

    // Get baseline metrics
    const baseline = this.calculateBaseline();

    // Add current result to history and save
    this.history.push(historicalResult);
    await this.saveHistory();

    // If no baseline exists, we can't check for regressions
    if (!baseline) {
      return [];
    }

    // Check for regressions
    return this.checkRegression(result, baseline);
  }
}
