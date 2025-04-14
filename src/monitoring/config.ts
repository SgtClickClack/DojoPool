export interface AlertThreshold {
  warning: number;
  critical: number;
}

export interface ConsistencyThresholds {
  latency: AlertThreshold;
  successRate: AlertThreshold;
  minNodes: number;
  maxSyncDelay: number;  // milliseconds
}

export interface PerformanceThresholds {
  operationLatency: AlertThreshold;
  errorRate: AlertThreshold;
  minThroughput: number;
  resourceUsage: {
    cpu: AlertThreshold;
    memory: AlertThreshold;
    network: AlertThreshold;
    disk: AlertThreshold;
  };
  maxQueueLength: number;
}

export interface NodeThresholds {
  heartbeatInterval: number;  // milliseconds
  maxTermGap: number;
  maxPendingOperations: number;
}

export interface NetworkThresholds {
  /** Maximum round-trip time before warning/critical alerts */
  rtt: AlertThreshold;
  /** Maximum error rate before warning/critical alerts */
  errorRate: AlertThreshold;
  /** Minimum throughput (messages/sec) before warning/critical alerts */
  minThroughput: AlertThreshold;
  /** Maximum queue size before warning/critical alerts */
  queueSize: AlertThreshold;
  /** Maximum number of reconnection attempts before warning/critical alerts */
  maxReconnectionAttempts: number;
  /** Maximum time without messages before warning/critical alerts */
  messageTimeout: AlertThreshold;
  /** Minimum connection stability score before warning/critical alerts */
  minStability: AlertThreshold;
}

export interface MonitoringConfig {
  collectionInterval: number;
  retentionPeriod: number;
  maxDataPoints: number;
  consistencyThresholds: ConsistencyThresholds;
  performanceThresholds: PerformanceThresholds;
  nodeThresholds: NodeThresholds;
  networkThresholds: NetworkThresholds;
}

// Default configuration
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  collectionInterval: 5000, // 5 seconds
  retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  maxDataPoints: 1000,
  consistencyThresholds: {
    latency: { warning: 1000, critical: 5000 },
    successRate: { warning: 95, critical: 90 },
    minNodes: 3,
    maxSyncDelay: 10000
  },
  performanceThresholds: {
    operationLatency: { warning: 500, critical: 2000 },
    errorRate: { warning: 5, critical: 10 },
    minThroughput: 100,
    resourceUsage: {
      cpu: { warning: 80, critical: 90 },
      memory: { warning: 80, critical: 90 },
      network: { warning: 80, critical: 90 },
      disk: { warning: 80, critical: 90 }
    },
    maxQueueLength: 1000
  },
  nodeThresholds: {
    heartbeatInterval: 5000,
    maxTermGap: 100,
    maxPendingOperations: 1000
  },
  networkThresholds: {
    rtt: { warning: 200, critical: 1000 },
    errorRate: { warning: 5, critical: 10 },
    minThroughput: { warning: 50, critical: 10 },
    queueSize: { warning: 100, critical: 500 },
    maxReconnectionAttempts: 5,
    messageTimeout: { warning: 10000, critical: 30000 },
    minStability: { warning: 80, critical: 60 }
  }
};