import { NetworkTransport } from '../../core/network/NetworkTransport';
import { NetworkError, NetworkMessage, NetworkMessageType } from '../../core/network/types';
import { MetricsCollector, MetricsData } from './MetricsCollector';
import { MonitoringConfig } from '../config';

export interface NetworkMetricsData extends MetricsData {
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  activeConnections: number;
  errors: number;
  messageLatency: number;
  p95Latency: number;
  messageSuccessRate: number;
  connectionUptime: number;
  lastHeartbeat: number;
  reconnectionAttempts: number;
  pendingMessages: number;
  bandwidthUsage: number;
  connectionStability: number;
  queueSize: number;
  timestamp: number;
}

export interface NetworkMetricsState {
  metrics: NetworkMetricsData;
  lastError: NetworkError | null;
}

const INITIAL_METRICS_STATE: NetworkMetricsData = {
  messagesSent: 0,
  messagesReceived: 0,
  bytesTransferred: 0,
  activeConnections: 0,
  errors: 0,
  messageLatency: 0,
  p95Latency: 0,
  messageSuccessRate: 100,
  connectionUptime: 0,
  lastHeartbeat: Date.now(),
  reconnectionAttempts: 0,
  pendingMessages: 0,
  bandwidthUsage: 0,
  connectionStability: 100,
  queueSize: 0,
  timestamp: Date.now()
};

export class NetworkMetricsCollector extends MetricsCollector<NetworkMetricsData> {
  private readonly networkTransport: NetworkTransport;
  private metricsState: NetworkMetricsState;
  private startTime: number;
  private lastMessageTime: Map<string, number>;
  private messageLatencies: number[];
  private readonly maxLatencyHistory: number = 100;
  private lastBytesTransferred: number = 0;
  private lastBytesTimestamp: number = Date.now();
  private disconnectionCount: Map<string, number>;
  private readonly rttValues: number[] = [];
  private readonly messageTimestamps: Map<string, number> = new Map();
  private lastCollectionTime: number;
  private totalMessages: number = 0;
  private successfulMessages: number = 0;

  constructor(networkTransport: NetworkTransport, config: MonitoringConfig) {
    super();
    this.networkTransport = networkTransport;
    this.startTime = Date.now();
    this.lastMessageTime = new Map();
    this.messageLatencies = [];
    this.disconnectionCount = new Map();
    this.metricsState = {
      metrics: { ...INITIAL_METRICS_STATE },
      lastError: null
    };
    this.lastCollectionTime = this.startTime;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.networkTransport.on('message', (message: NetworkMessage<any>): void => {
      this.handleMessage(message);
    });

    this.networkTransport.on('error', (error: NetworkError): void => {
      this.handleError(error);
    });

    this.networkTransport.on('connect', (nodeId: string): void => {
      this.handleConnect(nodeId);
    });

    this.networkTransport.on('disconnect', (nodeId: string): void => {
      this.handleDisconnect(nodeId);
    });
  }

  private handleMessage(message: NetworkMessage<any>): void {
    this.totalMessages++;
    this.successfulMessages++;

    const now = Date.now();
    this.metricsState.metrics.messagesReceived++;
    const messageSize = Buffer.byteLength(JSON.stringify(message));
    this.metricsState.metrics.bytesTransferred += messageSize;
    this.metricsState.metrics.lastHeartbeat = now;

    // Update bandwidth usage
    const timeDiff = (now - this.lastBytesTimestamp) / 1000; // Convert to seconds
    if (timeDiff > 0) {
      const bytesDiff = this.metricsState.metrics.bytesTransferred - this.lastBytesTransferred;
      this.metricsState.metrics.bandwidthUsage = (bytesDiff / timeDiff) / 1024; // Convert to KB/s
      this.lastBytesTransferred = this.metricsState.metrics.bytesTransferred;
      this.lastBytesTimestamp = now;
    }

    if (this.lastMessageTime.has(message.source)) {
      const latency = now - this.lastMessageTime.get(message.source)!;
      this.messageLatencies.push(latency);
      if (this.messageLatencies.length > this.maxLatencyHistory) {
        this.messageLatencies.shift();
      }
      this.metricsState.metrics.messageLatency = this.calculateAverageLatency();
      this.metricsState.metrics.p95Latency = this.calculateP95Latency();
    }
    this.lastMessageTime.set(message.source, now);

    // Calculate RTT for responses
    if (message.type === NetworkMessageType.APPEND_ENTRIES_RESPONSE ||
        message.type === NetworkMessageType.REQUEST_VOTE_RESPONSE ||
        message.type === NetworkMessageType.STATE_SYNC_RESPONSE) {
      const requestId = message.id.replace('_RESPONSE', '');
      if (this.messageTimestamps.has(requestId)) {
        const sendTime = this.messageTimestamps.get(requestId)!;
        const rtt = now - sendTime;
        this.rttValues.push(rtt);
        this.messageTimestamps.delete(requestId);
      }
    }

    // Store timestamp for sent messages
    if (message.type === NetworkMessageType.APPEND_ENTRIES ||
        message.type === NetworkMessageType.REQUEST_VOTE ||
        message.type === NetworkMessageType.STATE_SYNC) {
      this.messageTimestamps.set(message.id, now);
    }
  }

  private handleError(error: NetworkError): void {
    this.totalMessages++;
    this.metricsState.metrics.errors++;
    this.metricsState.lastError = error;
    this.metricsState.metrics.messageSuccessRate = this.calculateSuccessRate();
  }

  private handleConnect(nodeId: string): void {
    this.metricsState.metrics.activeConnections++;
    this.lastMessageTime.set(nodeId, Date.now());
    this.updateConnectionStability(nodeId);
    this.startTime = Date.now();
  }

  private handleDisconnect(nodeId: string): void {
    this.metricsState.metrics.activeConnections--;
    this.lastMessageTime.delete(nodeId);
    const disconnections = (this.disconnectionCount.get(nodeId) || 0) + 1;
    this.disconnectionCount.set(nodeId, disconnections);
    this.updateConnectionStability(nodeId);
    this.messageTimestamps.clear();
  }

  private updateConnectionStability(nodeId: string): void {
    const totalNodes = this.networkTransport.getPeerCount();
    if (totalNodes === 0) {
      this.metricsState.metrics.connectionStability = 100;
      return;
    }

    const disconnections = Array.from(this.disconnectionCount.values())
      .reduce((sum, count) => sum + count, 0);
    const uptime = Date.now() - this.startTime;
    const disconnectionsPerHour = (disconnections * 3600000) / uptime;
    
    // Calculate stability score (100 - disconnections per hour, minimum 0)
    this.metricsState.metrics.connectionStability = Math.max(0, 100 - disconnectionsPerHour);
  }

  private calculateAverageLatency(): number {
    if (this.messageLatencies.length === 0) return 0;
    const sum = this.messageLatencies.reduce((acc, val) => acc + val, 0);
    return sum / this.messageLatencies.length;
  }

  private calculateSuccessRate(): number {
    const total = this.metricsState.metrics.messagesSent + this.metricsState.metrics.messagesReceived;
    if (total === 0) return 100;
    return ((total - this.metricsState.metrics.errors) / total) * 100;
  }

  private calculateP95Latency(): number {
    if (this.rttValues.length === 0) return 0;
    const sortedRtts = [...this.rttValues].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedRtts.length * 0.95);
    return sortedRtts[p95Index];
  }

  private calculateBandwidthUsage(): number {
    const currentBytes = this.networkTransport['stats'].bytesTransferred;
    const bytesDelta = currentBytes - this.lastBytesTransferred;
    const timeDelta = (Date.now() - this.lastBytesTimestamp) / 1000; // Convert to seconds
    this.lastBytesTransferred = currentBytes;
    this.lastBytesTimestamp = Date.now();
    return bytesDelta / timeDelta; // Bytes per second
  }

  private calculateConnectionStability(): number {
    const uptime = Date.now() - this.startTime;
    const reconnects = this.networkTransport['connectionRetries'].size;
    // Higher stability score for longer uptime and fewer reconnects
    return Math.max(0, Math.min(100, 100 - (reconnects * 10000) / uptime));
  }

  public updateQueueSize(size: number): void {
    this.metricsState.metrics.queueSize = size;
  }

  /**
   * Collects the current network metrics data.
   * @returns A promise that resolves to the current network metrics.
   */
  public async collect(): Promise<NetworkMetricsData> {
    const now = Date.now();
    const transportStats = this.networkTransport['stats'];
    const metrics: NetworkMetricsData = {
      messagesSent: transportStats.messagesSent,
      messagesReceived: transportStats.messagesReceived,
      bytesTransferred: transportStats.bytesTransferred,
      activeConnections: transportStats.activeConnections,
      errors: transportStats.errors,
      messageLatency: this.messageLatencies.length > 0 ? 
        this.messageLatencies.reduce((a, b) => a + b, 0) / this.messageLatencies.length : 0,
      p95Latency: this.calculateP95Latency(),
      messageSuccessRate: this.totalMessages > 0 ? 
        (this.successfulMessages / this.totalMessages) * 100 : 100,
      connectionUptime: now - this.startTime,
      lastHeartbeat: transportStats.lastMessageTimestamp,
      reconnectionAttempts: this.networkTransport['connectionRetries'].size,
      pendingMessages: transportStats.pendingMessages,
      bandwidthUsage: this.calculateBandwidthUsage(),
      connectionStability: this.calculateConnectionStability(),
      queueSize: transportStats.queueSize,
      timestamp: now
    };

    this.metricsState.metrics.connectionUptime = metrics.connectionUptime;
    this.updateConnectionStability('');
    this.updateMetrics(metrics);
    this.lastCollectionTime = now;
    return metrics;
  }

  /**
   * Gets the last network error that occurred.
   * @returns The last network error or null if no error has occurred.
   */
  public getLastError(): NetworkError | null {
    return this.metricsState.lastError;
  }

  /**
   * Resets all metrics to their initial state.
   */
  public reset(): void {
    this.startTime = Date.now();
    this.lastMessageTime.clear();
    this.messageLatencies = [];
    this.metricsState = {
      metrics: { ...INITIAL_METRICS_STATE },
      lastError: null
    };
    this.rttValues.length = 0;
    this.messageTimestamps.clear();
    this.lastCollectionTime = this.startTime;
    this.totalMessages = 0;
    this.successfulMessages = 0;
    this.lastBytesTransferred = 0;
  }
} 