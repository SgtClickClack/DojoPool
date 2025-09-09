import { Injectable, Logger } from '@nestjs/common';
import * as v8 from 'v8';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceThreshold {
  name: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface PerformanceAlert {
  level: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetrics = 1000;
  private readonly maxAlerts = 100;
  private readonly alertCooldownMs = 60_000; // 1 minute debounce per metric/level
  private readonly minAlertDelta = 1; // require at least 1 unit delta to repeat within cooldown
  private lastAlertByMetric: Record<
    string,
    { level: 'warning' | 'critical'; timestamp: number; lastValue: number }
  > = {};

  constructor() {
    this.setupDefaultThresholds();
    this.startMonitoring();
  }

  private setupDefaultThresholds(): void {
    this.thresholds = [
      {
        name: 'response_time',
        warning: 500,
        critical: 1000,
        unit: 'ms',
      },
      {
        name: 'memory_usage',
        warning: 80,
        critical: 90,
        unit: '%',
      },
      {
        name: 'cpu_usage',
        warning: 70,
        critical: 85,
        unit: '%',
      },
      {
        name: 'cache_hit_rate',
        warning: 60,
        critical: 40,
        unit: '%',
      },
      {
        name: 'database_connections',
        warning: 80,
        critical: 95,
        unit: 'connections',
      },
    ];
  }

  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Enforce size limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check thresholds
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find((t) => t.name === metric.name);
    if (!threshold) return;

    let alert: PerformanceAlert | null = null;

    if (metric.value >= threshold.critical) {
      alert = {
        level: 'critical',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.critical,
        timestamp: Date.now(),
        message: `Critical: ${metric.name} is ${metric.value}${metric.unit} (threshold: ${threshold.critical}${threshold.unit})`,
      };
    } else if (metric.value >= threshold.warning) {
      alert = {
        level: 'warning',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.warning,
        timestamp: Date.now(),
        message: `Warning: ${metric.name} is ${metric.value}${metric.unit} (threshold: ${threshold.warning}${threshold.unit})`,
      };
    }

    if (alert) {
      // Debounce repeated alerts for the same metric and level
      const key = `${alert.metric}:${alert.level}`;
      const last = this.lastAlertByMetric[key];
      if (last) {
        const withinCooldown =
          alert.timestamp - last.timestamp < this.alertCooldownMs;
        const smallDelta =
          Math.abs(alert.value - last.lastValue) < this.minAlertDelta;
        if (withinCooldown && smallDelta) {
          // Skip noisy duplicate
          return;
        }
      }

      this.alerts.push(alert);

      // Enforce size limit
      if (this.alerts.length > this.maxAlerts) {
        this.alerts = this.alerts.slice(-this.maxAlerts);
      }

      // Log alert
      if (alert.level === 'critical') {
        this.logger.error(alert.message);
      } else {
        this.logger.warn(alert.message);
      }

      this.lastAlertByMetric[key] = {
        level: alert.level,
        timestamp: alert.timestamp,
        lastValue: alert.value,
      };
    }
  }

  getMetrics(
    name?: string,
    timeRange?: { start: number; end: number }
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (timeRange) {
      filtered = filtered.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filtered;
  }

  getAlerts(
    level?: 'warning' | 'critical',
    timeRange?: { start: number; end: number }
  ): PerformanceAlert[] {
    let filtered = this.alerts;

    if (level) {
      filtered = filtered.filter((a) => a.level === level);
    }

    if (timeRange) {
      filtered = filtered.filter(
        (a) => a.timestamp >= timeRange.start && a.timestamp <= timeRange.end
      );
    }

    return filtered;
  }

  getStats(): {
    totalMetrics: number;
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    averageMetricsPerMinute: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp >= oneMinuteAgo
    );
    const criticalAlerts = this.alerts.filter(
      (a) => a.level === 'critical'
    ).length;
    const warningAlerts = this.alerts.filter(
      (a) => a.level === 'warning'
    ).length;

    return {
      totalMetrics: this.metrics.length,
      totalAlerts: this.alerts.length,
      criticalAlerts,
      warningAlerts,
      averageMetricsPerMinute: recentMetrics.length,
    };
  }

  private startMonitoring(): void {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.monitorSystemMetrics();
    }, 30000);

    // Monitor memory usage every 10 seconds
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 10000);
  }

  private monitorSystemMetrics(): void {
    const usage = process.cpuUsage();
    const totalUsage = usage.user + usage.system;

    this.recordMetric('cpu_usage', totalUsage / 1000000, 'ms', {
      type: 'system',
    });
  }

  private monitorMemoryUsage(): void {
    const memUsage = process.memoryUsage();

    // Prefer V8 heap size limit as denominator for a stable percentage
    let usagePercentage: number;
    try {
      const heapStats = v8.getHeapStatistics();
      const heapLimit = heapStats.heap_size_limit || memUsage.heapTotal;
      usagePercentage = (memUsage.heapUsed / heapLimit) * 100;
    } catch {
      // Fallback to previous method if v8 stats unavailable
      const totalMemory = memUsage.heapTotal + memUsage.external;
      const usedMemory = memUsage.heapUsed + memUsage.external;
      usagePercentage = (usedMemory / totalMemory) * 100;
    }

    this.recordMetric('memory_usage', usagePercentage, '%', {
      type: 'system',
    });

    this.recordMetric('heap_used', memUsage.heapUsed / 1024 / 1024, 'MB', {
      type: 'system',
    });

    this.recordMetric(
      'external_memory',
      memUsage.external / 1024 / 1024,
      'MB',
      {
        type: 'system',
      }
    );
  }

  // Utility methods for common performance measurements
  measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    return asyncFn().finally(() => {
      const duration = Date.now() - startTime;
      this.recordMetric(name, duration, 'ms', { type: 'async' });
    });
  }

  measureSync<T>(name: string, syncFn: () => T): T {
    const startTime = Date.now();
    const result = syncFn();
    const duration = Date.now() - startTime;

    this.recordMetric(name, duration, 'ms', { type: 'sync' });
    return result;
  }

  // Database performance monitoring
  recordDatabaseMetric(
    operation: string,
    duration: number,
    table?: string
  ): void {
    this.recordMetric('database_operation', duration, 'ms', {
      operation,
      table: table || 'unknown',
    });
  }

  // Cache performance monitoring
  recordCacheMetric(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    duration: number,
    key?: string
  ): void {
    this.recordMetric('cache_operation', duration, 'ms', {
      operation,
      key: key || 'unknown',
    });
  }

  // API performance monitoring
  recordAPIMetric(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ): void {
    this.recordMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      statusCode: statusCode.toString(),
    });
  }
}
