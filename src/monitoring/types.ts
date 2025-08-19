export interface ConsistencyMetrics {
  latency: number; // milliseconds
  successRate: number; // percentage (0-100)
  nodes: number; // active node count
  lastSyncTimestamp: number;
}

export interface ResourceUsage {
  cpu: number; // percentage (0-100)
  memory: number; // percentage (0-100)
  network: number; // bytes/second
  disk: number; // percentage (0-100)
}

export interface PerformanceMetrics {
  operationLatency: number; // milliseconds
  errorRate: number; // percentage (0-100)
  throughput: number; // operations/second
  resourceUsage: ResourceUsage;
  queueLength: number;
}

export interface NodeMetrics {
  nodeId: string;
  status: 'healthy' | 'degraded' | 'failing';
  term: number; // consensus term
  lastHeartbeat: number; // timestamp
  leaderStatus: boolean;
  pendingOperations: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  consistency: ConsistencyMetrics;
  performance: PerformanceMetrics;
  nodes: NodeMetrics[];
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}
