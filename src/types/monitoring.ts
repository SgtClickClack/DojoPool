export interface PerformanceMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkSent: number;
    networkReceived: number;
    memoryAvailable: number;
    processCount: number;
    threadCount: number;
    timestamp: Date;
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
        severity: 'warning' | 'error';
        timestamp: Date;
    }>;
    latencyData: MetricData[];
    errorData: MetricData[];
    updateTimes: MetricData[];
} 