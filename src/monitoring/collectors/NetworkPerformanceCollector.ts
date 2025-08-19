import { type NetworkTransport } from '../../core/network/NetworkTransport';
import {
  type NetworkError,
  type NetworkMessage,
  NetworkStats,
} from '../../core/network/types';
import { MetricsCollector, type MetricsData } from './MetricsCollector';
import { type MonitoringConfig } from '../config';
import { type NetworkPerformanceData as NetworkMetrics } from '../dashboard/types';

export interface NetworkPerformanceData extends MetricsData {
  /** Average message round-trip time in milliseconds */
  averageRTT: number;
  /** 95th percentile message round-trip time in milliseconds */
  p95RTT: number;
  /** Number of messages in flight */
  inFlightMessages: number;
  /** Message throughput per second */
  throughput: number;
  /** Error rate as percentage */
  errorRate: number;
  /** Network bandwidth usage in bytes per second */
  bandwidthUsage: number;
  /** Connection stability score (0-100) */
  connectionStability: number;
  /** Message queue size */
  queueSize: number;
  /** Number of connection retries */
  connectionRetries: number;
  /** Time since last successful message in milliseconds */
  timeSinceLastMessage: number;
}

interface RTTSample {
  messageId: string;
  sendTime: number;
  receiveTime?: number;
}

export class NetworkPerformanceCollector extends MetricsCollector<
  NetworkMetrics & MetricsData
> {
  private readonly networkTransport: NetworkTransport;
  private readonly config: MonitoringConfig;
  private readonly rttSamples: RTTSample[] = [];
  private readonly maxSampleSize = 1000;
  protected readonly interval: number = 10000; // 10 seconds default interval
  private lastCollectionTime: number = Date.now();
  private messagesSentSinceLastCollection = 0;
  private messagesReceivedSinceLastCollection = 0;
  private bytesSentSinceLastCollection = 0;
  private bytesReceivedSinceLastCollection = 0;
  private errorsSinceLastCollection = 0;
  private connectionRetriesSinceLastCollection = 0;
  private rttValues: number[] = [];
  private errorCount: number = 0;
  private messageCount: number = 0;
  private inFlightCount: number = 0;
  private bytesTransferred: number = 0;
  private lastMessageTime: number = Date.now();
  private retryCount: number = 0;
  private queuedMessages: number = 0;

  constructor(networkTransport: NetworkTransport, config: MonitoringConfig) {
    super();
    this.networkTransport = networkTransport;
    this.config = config;
    this.setupEventHandlers();
    this.reset();
  }

  private setupEventHandlers(): void {
    this.networkTransport.on('message', (message: NetworkMessage): void => {
      this.handleNetworkMessage(message);
    });

    this.networkTransport.on('error', (error: NetworkError): void => {
      this.handleNetworkError(error);
    });

    this.networkTransport.on('connect', (): void => {
      this.handleConnect();
    });

    this.networkTransport.on('disconnect', (): void => {
      this.handleDisconnect();
    });
  }

  private handleNetworkMessage(message: NetworkMessage): void {
    this.messagesReceivedSinceLastCollection++;
    this.bytesReceivedSinceLastCollection += Buffer.byteLength(
      JSON.stringify(message)
    );

    // Update RTT if this is a response to a message we sent
    const rttSample = this.rttSamples.find(
      (sample) => sample.messageId === message.id
    );
    if (rttSample) {
      rttSample.receiveTime = Date.now();
    }

    // Cleanup old samples
    while (this.rttSamples.length > this.maxSampleSize) {
      this.rttSamples.shift();
    }
  }

  private handleNetworkError(error: NetworkError): void {
    this.errorsSinceLastCollection++;
  }

  private handleConnect(): void {
    // Reset connection retries on successful connection
    this.connectionRetriesSinceLastCollection = 0;
  }

  private handleDisconnect(): void {
    this.connectionRetriesSinceLastCollection++;
  }

  private calculateRTTStats(): { averageRTT: number; p95RTT: number } {
    const completedSamples = this.rttSamples
      .filter((sample) => sample.receiveTime)
      .map((sample) => sample.receiveTime! - sample.sendTime);

    if (completedSamples.length === 0) {
      return { averageRTT: 0, p95RTT: 0 };
    }

    const average =
      completedSamples.reduce((sum, rtt) => sum + rtt, 0) /
      completedSamples.length;
    const sorted = [...completedSamples].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];

    return { averageRTT: average, p95RTT: p95 };
  }

  private calculateThroughput(elapsedMs: number): number {
    return (this.messagesReceivedSinceLastCollection / elapsedMs) * 1000;
  }

  private calculateBandwidthUsage(elapsedMs: number): number {
    const totalBytes =
      this.bytesSentSinceLastCollection + this.bytesReceivedSinceLastCollection;
    return (totalBytes / elapsedMs) * 1000;
  }

  private calculateConnectionStability(): number {
    const maxRetries =
      this.config.networkThresholds?.maxReconnectionAttempts || 10;
    const retryRatio = this.connectionRetriesSinceLastCollection / maxRetries;
    return Math.max(0, 100 * (1 - retryRatio));
  }

  /**
   * Collects current network performance metrics.
   * @returns Promise resolving to the current network performance data.
   */
  public async collect(): Promise<NetworkMetrics & MetricsData> {
    const now = Date.now();
    const elapsedMs = now - this.lastCollectionTime;
    const stats = this.networkTransport.getStats();
    const { averageRTT, p95RTT } = this.calculateRTTStats();

    const data: NetworkMetrics & MetricsData = {
      timestamp: now,
      averageRTT,
      p95RTT,
      inFlightMessages: stats.pendingMessages,
      throughput: this.calculateThroughput(elapsedMs),
      errorRate:
        (this.errorsSinceLastCollection /
          this.messagesReceivedSinceLastCollection) *
          100 || 0,
      bandwidthUsage: this.calculateBandwidthUsage(elapsedMs),
      connectionStability: this.calculateConnectionStability(),
      queueSize: stats.queueSize,
      connectionRetries: this.connectionRetriesSinceLastCollection,
      timeSinceLastMessage: now - stats.lastMessageTimestamp,
    };

    // Reset counters
    this.messagesSentSinceLastCollection = 0;
    this.messagesReceivedSinceLastCollection = 0;
    this.bytesSentSinceLastCollection = 0;
    this.bytesReceivedSinceLastCollection = 0;
    this.errorsSinceLastCollection = 0;
    this.lastCollectionTime = now;

    return data;
  }

  /**
   * Resets all performance metrics and counters.
   */
  public reset(): void {
    this.rttSamples.length = 0;
    this.messagesSentSinceLastCollection = 0;
    this.messagesReceivedSinceLastCollection = 0;
    this.bytesSentSinceLastCollection = 0;
    this.bytesReceivedSinceLastCollection = 0;
    this.errorsSinceLastCollection = 0;
    this.connectionRetriesSinceLastCollection = 0;
    this.lastCollectionTime = Date.now();
    this.rttValues = [];
    this.errorCount = 0;
    this.messageCount = 0;
    this.inFlightCount = 0;
    this.bytesTransferred = 0;
    this.lastMessageTime = Date.now();
    this.retryCount = 0;
    this.queuedMessages = 0;
  }

  public handleMessage(size: number): void {
    this.messageCount++;
    this.bytesTransferred += size;
    this.lastMessageTime = Date.now();
  }

  public handleError(): void {
    this.errorCount++;
  }

  public handleQueueUpdate(size: number): void {
    this.queuedMessages = size;
  }

  public handleRTT(rtt: number): void {
    this.rttValues.push(rtt);
  }

  public handleConnectionRetry(): void {
    this.retryCount++;
  }

  public handleInFlightUpdate(count: number): void {
    this.inFlightCount = count;
  }

  protected collectMetrics(): NetworkMetrics & MetricsData {
    const now = Date.now();
    const sortedRTT = [...this.rttValues].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedRTT.length * 0.95);

    return {
      timestamp: now,
      averageRTT:
        this.rttValues.length > 0
          ? this.rttValues.reduce((a, b) => a + b, 0) / this.rttValues.length
          : 0,
      p95RTT: sortedRTT[p95Index] || 0,
      inFlightMessages: this.inFlightCount,
      throughput: this.messageCount / (this.interval / 1000),
      errorRate:
        this.messageCount > 0 ? (this.errorCount / this.messageCount) * 100 : 0,
      bandwidthUsage: this.bytesTransferred / (this.interval / 1000),
      connectionStability: Math.max(0, 100 - this.retryCount * 10),
      queueSize: this.queuedMessages,
      connectionRetries: this.retryCount,
      timeSinceLastMessage: now - this.lastMessageTime,
    };
  }
}
