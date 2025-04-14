import { NetworkTransport } from '../../core/network/NetworkTransport';
import { NetworkErrorRecovery } from '../../core/network/NetworkErrorRecovery';
import { NetworkMessage, NetworkMessageType, NetworkTransportConfig } from '../../core/network/types';
import { performance } from 'perf_hooks';

export interface BenchmarkResult {
  name: string;
  operations: number;
  duration: number;
  opsPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  memoryUsage: number;
}

export interface BenchmarkConfig {
  duration: number;
  messageSize: number;
  concurrentConnections: number;
  messageRate: number;
  failureRate: number;
  networkLatency: number;
}

interface BenchmarkMessagePayload {
  timestamp?: number;
  data?: string;
  nodeId?: string;
}

export class NetworkBenchmark {
  private readonly nodes: NetworkTransport[] = [];
  private readonly errorRecovery: NetworkErrorRecovery[] = [];
  private readonly results: BenchmarkResult[] = [];
  private readonly latencies: number[] = [];
  private readonly errors: number[] = [];
  private startTime: number = 0;
  private messageCount: number = 0;

  constructor(private readonly config: BenchmarkConfig) {}

  async setup(): Promise<void> {
    // Create peer configurations first
    const peerConfigs = Array.from({ length: this.config.concurrentConnections }, (_, i) => ({
      nodeId: `node${i}`,
      host: '127.0.0.1',
      port: 3000 + i
    }));

    // Create nodes with complete peer lists
    for (let i = 0; i < this.config.concurrentConnections; i++) {
      const nodeConfig: NetworkTransportConfig = {
        nodeId: `node${i}`,
        port: 3000 + i,
        peers: peerConfigs.filter(p => p.nodeId !== `node${i}`) // All peers except self
      };

      const node = new NetworkTransport(nodeConfig);
      const recovery = new NetworkErrorRecovery(node);
      this.nodes.push(node);
      this.errorRecovery.push(recovery);

      // Setup message handlers with type assertion
      node.on('message', ((message: NetworkMessage<unknown>) => {
        this.handleMessage(message as NetworkMessage<BenchmarkMessagePayload>);
      }));
      node.on('error', this.handleError.bind(this));
    }

    // Start nodes sequentially to avoid port conflicts
    for (const node of this.nodes) {
      await node.start();
      // Small delay between node starts
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async teardown(): Promise<void> {
    // Stop nodes in reverse order
    for (const node of [...this.nodes].reverse()) {
      await node.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.errorRecovery.forEach(recovery => recovery.stop());
  }

  private handleMessage(message: NetworkMessage<BenchmarkMessagePayload>): void {
    if (message.type === NetworkMessageType.CONNECT || 
        message.type === NetworkMessageType.HEARTBEAT) {
      return; // Skip connection and heartbeat messages
    }
    
    if (message.payload?.timestamp) {
      const latency = performance.now() - message.payload.timestamp;
      if (latency > 0) {
        this.latencies.push(latency);
      }
    }
    this.messageCount++;
  }

  private handleError(): void {
    this.errors.push(performance.now());
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
  }

  private createResult(name: string, duration: number): BenchmarkResult {
    const opsPerSecond = this.messageCount / (duration / 1000);
    const errorRate = this.errors.length / this.messageCount;
    const memoryUsage = process.memoryUsage().heapUsed;

    return {
      name,
      operations: this.messageCount,
      duration,
      opsPerSecond,
      averageLatency: this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length,
      p95Latency: this.calculatePercentile(this.latencies, 95),
      p99Latency: this.calculatePercentile(this.latencies, 99),
      errorRate,
      memoryUsage
    };
  }

  async runThroughputTest(): Promise<BenchmarkResult> {
    this.startTime = performance.now();
    const endTime = this.startTime + this.config.duration;
    const messageInterval = 1000 / this.config.messageRate;

    // Reset counters
    this.messageCount = 0;
    this.latencies.length = 0;
    this.errors.length = 0;

    console.log('Starting throughput test...');
    
    // Generate messages at specified rate
    while (performance.now() < endTime) {
      const startSend = performance.now();
      
      // Send messages from each node to random peers
      await Promise.all(this.nodes.map(async (node, i) => {
        const targetIndex = Math.floor(Math.random() * this.nodes.length);
        if (targetIndex !== i) {
          try {
            const payload: BenchmarkMessagePayload = {
              data: Buffer.alloc(this.config.messageSize).fill('x').toString(),
              timestamp: performance.now()
            };
            await this.errorRecovery[i].send(
              `node${targetIndex}`,
              NetworkMessageType.MESSAGE,
              payload
            );
          } catch (error) {
            console.error(`Error sending from node${i} to node${targetIndex}:`, error);
            this.handleError();
          }
        }
      }));

      // Wait for next message interval
      const elapsed = performance.now() - startSend;
      if (elapsed < messageInterval) {
        await new Promise(resolve => setTimeout(resolve, messageInterval - elapsed));
      }
    }

    console.log('Waiting for in-flight messages...');
    // Allow time for in-flight messages to arrive
    await new Promise(resolve => setTimeout(resolve, 2000));

    const duration = performance.now() - this.startTime;
    const result = this.createResult('Throughput Test', duration);
    console.log('Throughput test completed:', result);
    return result;
  }

  async runLatencyTest(): Promise<BenchmarkResult> {
    this.startTime = performance.now();
    const endTime = this.startTime + this.config.duration;

    while (performance.now() < endTime) {
      // Send ping messages between random node pairs
      const sourceIndex = Math.floor(Math.random() * this.nodes.length);
      const targetIndex = (sourceIndex + 1) % this.nodes.length;

      try {
        await this.errorRecovery[sourceIndex].send(
          `node${targetIndex}`,
          NetworkMessageType.MESSAGE,
          { timestamp: performance.now() }
        );
      } catch (error) {
        this.handleError();
      }

      // Add simulated network latency
      await new Promise(resolve => setTimeout(resolve, this.config.networkLatency));
    }

    const duration = performance.now() - this.startTime;
    return this.createResult('Latency Test', duration);
  }

  async runFailureTest(): Promise<BenchmarkResult> {
    this.startTime = performance.now();
    const endTime = this.startTime + this.config.duration;

    while (performance.now() < endTime) {
      // Randomly fail some percentage of nodes
      this.nodes.forEach((node, i) => {
        if (Math.random() < this.config.failureRate) {
          node.emit('error', {
            code: 'SIMULATED_ERROR',
            message: 'Simulated network failure',
            timestamp: Date.now(),
            details: `node${i}`
          });
        }
      });

      // Send messages between remaining nodes
      const sourceIndex = Math.floor(Math.random() * this.nodes.length);
      const targetIndex = (sourceIndex + 1) % this.nodes.length;

      try {
        await this.errorRecovery[sourceIndex].send(
          `node${targetIndex}`,
          NetworkMessageType.MESSAGE,
          { data: Buffer.alloc(this.config.messageSize).fill('x').toString() }
        );
      } catch (error) {
        this.handleError();
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = performance.now() - this.startTime;
    return this.createResult('Failure Test', duration);
  }

  async runStressTest(): Promise<BenchmarkResult> {
    this.startTime = performance.now();
    const endTime = this.startTime + this.config.duration;

    while (performance.now() < endTime) {
      // Send messages at maximum rate
      await Promise.all(this.nodes.map(async (node, i) => {
        for (let j = 0; j < this.nodes.length; j++) {
          if (i !== j) {
            try {
              await this.errorRecovery[i].send(
                `node${j}`,
                NetworkMessageType.MESSAGE,
                { data: Buffer.alloc(this.config.messageSize).fill('x').toString() }
              );
            } catch (error) {
              this.handleError();
            }
          }
        }
      }));
    }

    const duration = performance.now() - this.startTime;
    return this.createResult('Stress Test', duration);
  }

  async runAll(): Promise<BenchmarkResult[]> {
    await this.setup();

    try {
      this.results.push(await this.runThroughputTest());
      this.results.push(await this.runLatencyTest());
      this.results.push(await this.runFailureTest());
      this.results.push(await this.runStressTest());
    } finally {
      await this.teardown();
    }

    return this.results;
  }
}

// Run benchmarks
async function runBenchmarks() {
  const config: BenchmarkConfig = {
    duration: 30000, // 30 seconds
    messageSize: 1024, // 1KB
    concurrentConnections: 10,
    messageRate: 100, // messages per second
    failureRate: 0.1, // 10% failure rate
    networkLatency: 50 // 50ms network latency
  };

  const benchmark = new NetworkBenchmark(config);
  const results = await benchmark.runAll();

  console.log('Network Transport Benchmark Results:');
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`Operations: ${result.operations}`);
    console.log(`Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`Operations/sec: ${result.opsPerSecond.toFixed(2)}`);
    console.log(`Average Latency: ${result.averageLatency.toFixed(2)}ms`);
    console.log(`P95 Latency: ${result.p95Latency.toFixed(2)}ms`);
    console.log(`P99 Latency: ${result.p99Latency.toFixed(2)}ms`);
    console.log(`Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
    console.log(`Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  });
}

if (require.main === module) {
  runBenchmarks().catch(console.error);
} 