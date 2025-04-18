import { MetricsCollector, MetricsData } from "./MetricsCollector";
import { ConsensusProtocol } from "../../core/consensus/ConsensusProtocol";

interface ConsistencyMetrics extends MetricsData {
  latency: number;
  successRate: number;
  activeNodes: number;
  syncDelay: number;
  termGap: number;
  pendingOperations: number;
}

export class ConsistencyMetricsCollector extends MetricsCollector<ConsistencyMetrics> {
  private consensusProtocol: ConsensusProtocol;
  private lastSyncTime: number = Date.now();
  private operationSuccesses: number = 0;
  private operationAttempts: number = 0;
  private lastLatency: number = 0;
  private activeNodeCount: number = 0;
  private currentTermGap: number = 0;
  private pendingOpsCount: number = 0;

  constructor(consensusProtocol: ConsensusProtocol) {
    super();
    this.consensusProtocol = consensusProtocol;

    // Subscribe to consensus events
    this.consensusProtocol.on(
      "operationComplete",
      (success: boolean, latency: number) => {
        this.operationAttempts++;
        if (success) {
          this.operationSuccesses++;
          this.lastLatency = latency;
        }
      },
    );

    this.consensusProtocol.on("sync", () => {
      this.lastSyncTime = Date.now();
    });

    this.consensusProtocol.on("nodeCountChange", (count: number) => {
      this.activeNodeCount = count;
    });

    this.consensusProtocol.on("termChange", (gap: number) => {
      this.currentTermGap = gap;
    });

    this.consensusProtocol.on("pendingOperationsChange", (count: number) => {
      this.pendingOpsCount = count;
    });
  }

  async collect(): Promise<ConsistencyMetrics> {
    const now = Date.now();
    const metrics: ConsistencyMetrics = {
      latency: this.lastLatency,
      successRate:
        this.operationAttempts > 0
          ? (this.operationSuccesses / this.operationAttempts) * 100
          : 100,
      activeNodes: this.activeNodeCount,
      syncDelay: now - this.lastSyncTime,
      termGap: this.currentTermGap,
      pendingOperations: this.pendingOpsCount,
    };

    this.updateMetrics(metrics);
    return metrics;
  }

  reset(): void {
    super.reset();
    this.operationSuccesses = 0;
    this.operationAttempts = 0;
    this.lastSyncTime = Date.now();
    this.lastLatency = 0;
    this.activeNodeCount = 0;
    this.currentTermGap = 0;
    this.pendingOpsCount = 0;
  }
}
