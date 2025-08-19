import { NodeManager } from '../NodeManager';

export interface NetworkMetrics {
  nodeId: string;
  timestamp: number;
  latency: number;
  bandwidth: number;
  packetLoss: number;
  connectedPeers: number;
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  errorRate: number;
}

export class NetworkMetricsCollector {
  private static instance: NetworkMetricsCollector;
  private nodeManager: NodeManager;
  private metricsHistory: Map<string, NetworkMetrics[]> = new Map();
  private readonly historyLimit = 100; // Keep last 100 metrics entries per node

  private constructor() {
    this.nodeManager = NodeManager.getInstance();
    this.setupNodeListeners();
  }

  public static getInstance(): NetworkMetricsCollector {
    if (!NetworkMetricsCollector.instance) {
      NetworkMetricsCollector.instance = new NetworkMetricsCollector();
    }
    return NetworkMetricsCollector.instance;
  }

  private setupNodeListeners(): void {
    this.nodeManager.on('nodeRegistered', (nodeId: string) => {
      this.metricsHistory.set(nodeId, []);
    });

    this.nodeManager.on('nodeUnregistered', (nodeId: string) => {
      this.metricsHistory.delete(nodeId);
    });
  }

  public collectMetrics(): Map<string, NetworkMetrics> {
    const currentMetrics = new Map<string, NetworkMetrics>();

    for (const nodeId of this.nodeManager.getAllNodeIds()) {
      try {
        const metrics = this.nodeManager.getNodeMetrics(nodeId);
        currentMetrics.set(nodeId, metrics);

        // Update history
        const history = this.metricsHistory.get(nodeId) || [];
        history.push(metrics);

        // Trim history if needed
        if (history.length > this.historyLimit) {
          history.shift();
        }

        this.metricsHistory.set(nodeId, history);
      } catch (error) {
        console.error(`Failed to collect metrics for node ${nodeId}:`, error);
      }
    }

    return currentMetrics;
  }

  public getMetricsHistory(nodeId: string): NetworkMetrics[] {
    return this.metricsHistory.get(nodeId) || [];
  }

  public getAggregatedMetrics(): NetworkMetrics {
    const nodes = this.nodeManager.getAllNodeIds();
    const metrics = this.collectMetrics();

    const aggregated: NetworkMetrics = {
      nodeId: 'aggregate',
      timestamp: Date.now(),
      latency: 0,
      bandwidth: 0,
      packetLoss: 0,
      connectedPeers: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      errorRate: 0,
    };

    if (nodes.length === 0) return aggregated;

    for (const nodeMetrics of metrics.values()) {
      aggregated.latency += nodeMetrics.latency;
      aggregated.bandwidth += nodeMetrics.bandwidth;
      aggregated.packetLoss += nodeMetrics.packetLoss;
      aggregated.connectedPeers += nodeMetrics.connectedPeers;
      aggregated.messagesSent += nodeMetrics.messagesSent;
      aggregated.messagesReceived += nodeMetrics.messagesReceived;
      aggregated.bytesTransferred += nodeMetrics.bytesTransferred;
      aggregated.errorRate += nodeMetrics.errorRate;
    }

    // Calculate averages for relevant metrics
    aggregated.latency /= nodes.length;
    aggregated.packetLoss /= nodes.length;
    aggregated.errorRate /= nodes.length;

    return aggregated;
  }

  public clearHistory(nodeId?: string): void {
    if (nodeId) {
      this.metricsHistory.delete(nodeId);
    } else {
      this.metricsHistory.clear();
    }
  }
}
