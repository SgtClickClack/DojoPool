import { MetricsCollector, type MetricsData } from './MetricsCollector';

interface NodeMetrics extends MetricsData {
  uptime: number;
  connectionCount: number;
  messageRate: number;
  bytesTransferred: number;
  errorCount: number;
  lastHeartbeat: number;
  pendingMessages: number;
}

export class NodeMetricsCollector extends MetricsCollector<NodeMetrics> {
  private startTime: number = Date.now();
  private connections: number = 0;
  private messageCount: number = 0;
  private byteCount: number = 0;
  private errors: number = 0;
  private lastHeartbeatTime: number = Date.now();
  private pendingMessageCount: number = 0;
  private lastCollectionTime: number = Date.now();

  updateConnections(count: number): void {
    this.connections = count;
  }

  recordMessage(bytes: number): void {
    this.messageCount++;
    this.byteCount += bytes;
  }

  recordError(): void {
    this.errors++;
  }

  updateHeartbeat(): void {
    this.lastHeartbeatTime = Date.now();
  }

  updatePendingMessages(count: number): void {
    this.pendingMessageCount = count;
  }

  async collect(): Promise<NodeMetrics> {
    const now = Date.now();
    const timeDiff = (now - this.lastCollectionTime) / 1000; // Convert to seconds

    const metrics: NodeMetrics = {
      uptime: now - this.startTime,
      connectionCount: this.connections,
      messageRate: this.messageCount / timeDiff,
      bytesTransferred: this.byteCount,
      errorCount: this.errors,
      lastHeartbeat: now - this.lastHeartbeatTime,
      pendingMessages: this.pendingMessageCount,
    };

    // Reset counters
    this.messageCount = 0;
    this.byteCount = 0;
    this.errors = 0;
    this.lastCollectionTime = now;

    this.updateMetrics(metrics);
    return metrics;
  }

  reset(): void {
    super.reset();
    this.connections = 0;
    this.messageCount = 0;
    this.byteCount = 0;
    this.errors = 0;
    this.lastHeartbeatTime = Date.now();
    this.pendingMessageCount = 0;
    this.lastCollectionTime = Date.now();
  }
}
