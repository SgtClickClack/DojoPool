export interface ErrorEvent {
  id: string;
  timestamp: number;
  type: 'validation' | 'connection' | 'system' | 'boundary';
  severity: 'error' | 'warning' | 'info';
  message: string;
  playerId?: string;
  details?: Record<string, any>;
}

export interface MetricData {
  timestamp: number;
  value: number;
  label?: string;
}

export interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  details?: {
    source?: string;
    code?: string;
    data?: any;
    acknowledgeNote?: string;
    acknowledgeTime?: number;
  };
}

export interface GameMetrics {
  timestamp: number;
  count: number;
  type: string;
  severity: string;
  message?: string;
}

export interface MetricsSnapshot {
  current: GameMetrics;
  historical: {
    weeklyTrend: GameMetrics[];
  };
}

export interface SystemHealth {
  service: string;
  status: boolean;
  lastCheck: number;
  details?: {
    responseTime?: number;
    errorCount?: number;
    lastError?: string;
  };
}

export interface MonitoringConfig {
  refreshInterval: number;
  maxDataPoints: number;
  alertThresholds: {
    updateTimes: number;
    latency: number;
    successRate: number;
    memoryUsage: number;
    playerSpeed: number;
  };
  retentionPeriod: {
    metrics: number;
    errors: number;
    alerts: number;
  };
}

export interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentRate: number;
}

export interface MonitoringDashboardProps {
  gameId?: string;
  config?: Partial<MonitoringConfig>;
  onErrorClick?: (error: ErrorEvent) => void;
  onAlertAcknowledge?: (alert: Alert) => void;
  onMetricThresholdChange?: (metric: string, value: number) => void;
}

export interface ErrorData {
  timestamp: number;
  count: number;
  type: string;
  severity: string;
  message?: string;
}
