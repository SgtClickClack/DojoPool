import { EventEmitter } from 'events';
import {
  type ConsistencyMetrics,
  type PerformanceMetrics,
  type NodeMetrics,
} from './types';
import { type MonitoringConfig, type AlertThreshold } from './config';

export type AlertSeverity = 'warning' | 'critical' | 'resolved';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertManagerEvents {
  alert: (alert: Alert) => void;
}

export declare interface AlertManager {
  on<K extends keyof AlertManagerEvents>(
    event: K,
    listener: AlertManagerEvents[K]
  ): this;
  emit<K extends keyof AlertManagerEvents>(
    event: K,
    ...args: Parameters<AlertManagerEvents[K]>
  ): boolean;
}

export class AlertManager extends EventEmitter {
  private config: MonitoringConfig;
  private activeAlerts: Map<string, Alert>;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.activeAlerts = new Map();
  }

  public checkConsistencyMetrics(metrics: ConsistencyMetrics): void {
    this.checkThreshold(
      'consistency-latency',
      'Consistency latency',
      metrics.latency,
      this.config.consistencyThresholds.latency
    );

    this.checkThreshold(
      'consistency-success-rate',
      'Consistency success rate',
      metrics.successRate,
      this.config.consistencyThresholds.successRate
    );

    if (metrics.nodes < this.config.consistencyThresholds.minNodes) {
      this.createAlert({
        id: 'consistency-node-count',
        type: 'Active node count',
        severity: 'critical',
        message: `Active node count (${metrics.nodes}) is below minimum required (${this.config.consistencyThresholds.minNodes})`,
        value: metrics.nodes,
        threshold: this.config.consistencyThresholds.minNodes,
        timestamp: Date.now(),
      });
    } else {
      this.resolveAlert('consistency-node-count');
    }
  }

  public checkPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.checkThreshold(
      'performance-latency',
      'Operation latency',
      metrics.operationLatency,
      this.config.performanceThresholds.operationLatency
    );

    this.checkThreshold(
      'performance-error-rate',
      'Error rate',
      metrics.errorRate,
      this.config.performanceThresholds.errorRate
    );

    // Resource usage checks
    this.checkThreshold(
      'resource-cpu',
      'CPU usage',
      metrics.resourceUsage.cpu,
      this.config.performanceThresholds.resourceUsage.cpu
    );

    this.checkThreshold(
      'resource-memory',
      'Memory usage',
      metrics.resourceUsage.memory,
      this.config.performanceThresholds.resourceUsage.memory
    );

    this.checkThreshold(
      'resource-network',
      'Network usage',
      metrics.resourceUsage.network,
      this.config.performanceThresholds.resourceUsage.network
    );

    if (
      metrics.queueLength > this.config.performanceThresholds.maxQueueLength
    ) {
      this.createAlert({
        id: 'queue-length',
        type: 'Queue length',
        severity: 'warning',
        message: `Operation queue length (${metrics.queueLength}) exceeds maximum (${this.config.performanceThresholds.maxQueueLength})`,
        value: metrics.queueLength,
        threshold: this.config.performanceThresholds.maxQueueLength,
        timestamp: Date.now(),
      });
    } else {
      this.resolveAlert('queue-length');
    }
  }

  public checkNodeMetrics(metrics: NodeMetrics): void {
    if (metrics.status === 'failing') {
      this.createAlert({
        id: `node-status-${metrics.nodeId}`,
        type: 'node-status',
        severity: 'critical',
        message: `Node ${metrics.nodeId} is failing`,
        value: 0,
        threshold: 0,
        timestamp: Date.now(),
      });
    } else {
      this.resolveAlert(`node-status-${metrics.nodeId}`);
    }

    if (
      metrics.pendingOperations >
      this.config.nodeThresholds.maxPendingOperations
    ) {
      this.createAlert({
        id: `node-pending-ops-${metrics.nodeId}`,
        type: 'pending-operations',
        severity: 'warning',
        message: `Node ${metrics.nodeId} has too many pending operations: ${metrics.pendingOperations}`,
        value: metrics.pendingOperations,
        threshold: this.config.nodeThresholds.maxPendingOperations,
        timestamp: Date.now(),
      });
    } else {
      this.resolveAlert(`node-pending-ops-${metrics.nodeId}`);
    }
  }

  private checkThreshold(
    id: string,
    metricName: string,
    value: number,
    threshold: AlertThreshold,
    reverse: boolean = false
  ): void {
    const compare = reverse
      ? (a: number, b: number) => a < b
      : (a: number, b: number) => a > b;

    if (compare(value, threshold.critical)) {
      this.createAlert({
        id,
        type: metricName,
        severity: 'critical',
        message: `${metricName} is at critical level: ${value}`,
        value,
        threshold: threshold.critical,
        timestamp: Date.now(),
      });
    } else if (compare(value, threshold.warning)) {
      this.createAlert({
        id,
        type: metricName,
        severity: 'warning',
        message: `${metricName} is at warning level: ${value}`,
        value,
        threshold: threshold.warning,
        timestamp: Date.now(),
      });
    } else {
      this.resolveAlert(id);
    }
  }

  public createAlert(alert: Alert): void {
    const existingAlert = this.activeAlerts.get(alert.id);
    if (!existingAlert || existingAlert.severity !== alert.severity) {
      const alertWithTimestamp = {
        ...alert,
        timestamp: alert.timestamp || Date.now(),
      };
      this.activeAlerts.set(alert.id, alertWithTimestamp);
      this.emit('alert', alertWithTimestamp);
    }
  }

  private resolveAlert(id: string): void {
    const existingAlert = this.activeAlerts.get(id);
    if (existingAlert) {
      const resolvedAlert: Alert = {
        ...existingAlert,
        severity: 'resolved',
        timestamp: Date.now(),
      };
      this.activeAlerts.delete(id);
      this.emit('alert', resolvedAlert);
    }
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}
