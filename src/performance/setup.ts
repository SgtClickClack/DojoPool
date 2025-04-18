import { measurePerformance } from "../__tests__/utils/testUtils";

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
}

export interface PerformanceTestConfig {
  name: string;
  iterations?: number;
  timeout?: number;
  warmupIterations?: number;
}

export class PerformanceTest {
  private config: Required<PerformanceTestConfig>;

  constructor(config: PerformanceTestConfig) {
    this.config = {
      iterations: 100,
      timeout: 5000,
      warmupIterations: 5,
      ...config,
    };
  }

  async run(testFn: () => Promise<void> | void): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];

    // Warmup phase
    console.log(`Running ${this.config.warmupIterations} warmup iterations...`);
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await testFn();
    }

    // Test phase
    console.log(`Running ${this.config.iterations} test iterations...`);
    for (let i = 0; i < this.config.iterations; i++) {
      const startMemory = process.memoryUsage().heapUsed;
      const executionTime = await measurePerformance(testFn);
      const endMemory = process.memoryUsage().heapUsed;

      metrics.push({
        executionTime,
        memoryUsage: endMemory - startMemory,
      });
    }

    return metrics;
  }

  async analyze(metrics: PerformanceMetrics[]): Promise<void> {
    const executionTimes = metrics.map((m) => m.executionTime);
    const memoryUsages = metrics.map((m) => m.memoryUsage);

    const avgExecutionTime =
      executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const avgMemoryUsage =
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    const p95ExecutionTime = this.calculatePercentile(executionTimes, 95);
    const p95MemoryUsage = this.calculatePercentile(memoryUsages, 95);

    console.log(`
Performance Test Results for: ${this.config.name}
----------------------------------------
Average Execution Time: ${avgExecutionTime.toFixed(2)}ms
95th Percentile Execution Time: ${p95ExecutionTime.toFixed(2)}ms
Average Memory Usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB
95th Percentile Memory Usage: ${(p95MemoryUsage / 1024 / 1024).toFixed(2)}MB
    `);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
