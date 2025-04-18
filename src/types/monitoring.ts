export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  responseTime: number;
  loadTime: number;
  networkLatency: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
  };
  errorCount: number;
  timestamp: Date;
}

export interface DependencyMetrics {
  name: string;
  version: string;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  timestamp: Date;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  timestamp: Date;
}

export interface PerformanceIssue {
  component: string;
  issues: string[];
  severity: "warning" | "error";
  timestamp: Date;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface PerformanceThresholds {
  minFps: number;
  maxResponseTime: number;
  maxLoadTime: number;
  maxNetworkLatency: number;
  maxMemoryUsage: number;
}

export interface MetricData {
  timestamp: number;
  value: number;
  label: string;
}

export interface MetricsSnapshot {
  current: PerformanceMetrics;
  historical: {
    cpuUsage: MetricData[];
    memoryUsage: MetricData[];
    diskUsage: MetricData[];
    networkTraffic: MetricData[];
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: "warning" | "error";
    timestamp: Date;
  }>;
  latencyData: MetricData[];
  errorData: MetricData[];
  updateTimes: MetricData[];
}
