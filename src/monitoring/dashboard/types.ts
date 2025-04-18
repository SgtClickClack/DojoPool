export interface NetworkPerformanceData {
  /** Timestamp when the metrics were collected */
  timestamp: number;
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

export interface NetworkThresholds {
  rtt: ThresholdLevels;
  errorRate: ThresholdLevels;
  throughput: ThresholdLevels;
  stability: ThresholdLevels;
  queueSize: ThresholdLevels;
}

export interface ThresholdLevels {
  warning: number;
  critical: number;
}
