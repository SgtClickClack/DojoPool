export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  details?: Record<string, any>;
}

export interface ErrorEvent {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: number;
  component?: string;
  context?: Record<string, any>;
}

export interface AlertFilter {
  type?: string;
  severity?: string;
  acknowledged?: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface AlertStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface AlertSubscription {
  id: string;
  userId: string;
  filters: AlertFilter;
  notificationChannels: string[];
}

export interface MetricData {
  timestamp: number;
  value: number;
  label: string;
}

export interface ErrorData {
  error: Error;
  context: {
    component?: string;
    timestamp: number;
  };
}

export interface Anomaly {
  timestamp: number;
  value: number;
  severity: 'warning' | 'critical';
}

export interface MetricsSnapshot {
  current: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkSent: number;
    networkReceived: number;
    memoryAvailable: number;
    processCount: number;
    threadCount: number;
  };
  historical: {
    cpuUsage: MetricData[];
    memoryUsage: MetricData[];
    diskUsage: MetricData[];
    networkTraffic: MetricData[];
  };
  alerts: Alert[];
  latencyData: MetricData[];
  errorData: ErrorEvent[];
  updateTimes: MetricData[];
  successRate: MetricData[];
  timestamp: number;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkSent: number;
  networkReceived: number;
  memoryAvailable: number;
  processCount: number;
  threadCount: number;
  timestamp: number;
}

export interface GameMetrics {
  activePlayers: number;
  activeGames: number;
  totalGamesCompleted: number;
  completionRate: number;
  averageCompletionTime: number;
  averageScore: number;
  playerRetention: number;
  errorCount: number;
  warningCount: number;
  errorRate: number;
  lastError?: {
    timestamp: number;
    type: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface MetricConfig {
  id: string;
  name: string;
  chartType: 'line' | 'bar' | 'pie';
  enabled: boolean;
  order: number;
  refreshInterval: number;
} 