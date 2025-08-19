import { type AlertThreshold, type MonitoringConfig } from '../config';
import {
  type MetricsCollector,
  type MetricsData,
} from '../collectors/MetricsCollector';
import { EventEmitter } from 'events';

export interface Alert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
}

export interface AlertEvents {
  alert: (alert: Alert) => void;
  resolved: (alert: Alert) => void;
}

export declare interface AlertManager {
  on<K extends keyof AlertEvents>(event: K, listener: AlertEvents[K]): this;
  emit<K extends keyof AlertEvents>(
    event: K,
    ...args: Parameters<AlertEvents[K]>
  ): boolean;
}

export class AlertManager extends EventEmitter implements AlertManager {
  private readonly config: MonitoringConfig;
  private readonly collectors: Map<string, MetricsCollector<MetricsData>>;
  private readonly activeAlerts: Map<string, Alert>;
  private checkInterval: NodeJS.Timeout | null;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.collectors = new Map();
    this.activeAlerts = new Map();
    this.checkInterval = null;
  }

  addCollector(name: string, collector: MetricsCollector<MetricsData>): void {
    this.collectors.set(name, collector);
    collector.on('metrics', (metrics: MetricsData) => {
      this.evaluateMetrics(name, metrics);
    });
  }

  removeCollector(name: string): void {
    const collector = this.collectors.get(name);
    if (collector) {
      collector.removeAllListeners('metrics');
      this.collectors.delete(name);
    }
  }

  start(): void {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(
      () => this.checkThresholds(),
      this.config.collectionInterval
    );
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkThresholds(): Promise<void> {
    for (const [name, collector] of this.collectors) {
      try {
        const metrics = await collector.collect();
        this.evaluateMetrics(name, metrics);
      } catch (error) {
        console.error(`Error collecting metrics from ${name}:`, error);
      }
    }
  }

  private evaluateMetrics(collectorName: string, metrics: MetricsData): void {
    for (const [metricName, value] of Object.entries(metrics)) {
      const thresholds = this.getThresholdsForMetric(metricName);
      if (!thresholds) continue;

      if (value >= thresholds.critical) {
        this.createAlert(
          'critical',
          collectorName,
          metricName,
          value,
          thresholds.critical
        );
      } else if (value >= thresholds.warning) {
        this.createAlert(
          'warning',
          collectorName,
          metricName,
          value,
          thresholds.warning
        );
      } else {
        this.resolveAlert(`${collectorName}:${metricName}`);
      }
    }
  }

  private createAlert(
    type: 'warning' | 'critical',
    collector: string,
    metric: string,
    value: number,
    threshold: number
  ): void {
    const id = `${collector}:${metric}`;
    const alert: Alert = {
      id,
      type,
      message: `${type.toUpperCase()}: ${metric} in ${collector} is ${value} (threshold: ${threshold})`,
      timestamp: Date.now(),
      metric,
      value,
      threshold,
    };

    this.activeAlerts.set(id, alert);
    this.emit('alert', alert);
  }

  private resolveAlert(id: string): void {
    if (this.activeAlerts.has(id)) {
      const alert = this.activeAlerts.get(id)!;
      this.activeAlerts.delete(id);
      this.emit('resolved', alert);
    }
  }

  private getThresholdsForMetric(metric: string): AlertThreshold | undefined {
    const thresholds = {
      ...this.config.consistencyThresholds,
      ...this.config.performanceThresholds,
      ...this.config.nodeThresholds,
    } as Record<string, AlertThreshold>;
    return thresholds[metric];
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}
