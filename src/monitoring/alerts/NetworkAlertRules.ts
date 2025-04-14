import { AlertManager, Alert } from '../AlertManager';
import { NetworkMetricsData } from '../collectors/NetworkMetricsCollector';
import { MonitoringConfig } from '../config';

export class NetworkAlertRules {
  private readonly alertManager: AlertManager;
  private readonly config: MonitoringConfig;

  constructor(alertManager: AlertManager, config: MonitoringConfig) {
    this.alertManager = alertManager;
    this.config = config;
  }

  evaluateMetrics(metrics: NetworkMetricsData): void {
    this.evaluateLatency(metrics);
    this.evaluateBandwidth(metrics);
    this.evaluateConnectionStability(metrics);
    this.evaluateQueueSize(metrics);
    this.evaluateErrorRate(metrics);
  }

  private evaluateLatency(metrics: NetworkMetricsData): void {
    const { messageLatency, p95Latency } = metrics;
    const { warning, critical } = this.config.performanceThresholds.operationLatency;

    // Average latency check
    if (messageLatency >= critical) {
      this.createAlert('critical', 'latency', messageLatency, critical,
        `Average network latency is critically high: ${messageLatency}ms (threshold: ${critical}ms)`);
    } else if (messageLatency >= warning) {
      this.createAlert('warning', 'latency', messageLatency, warning,
        `Average network latency is high: ${messageLatency}ms (threshold: ${warning}ms)`);
    }

    // P95 latency check
    if (p95Latency >= critical * 1.5) {
      this.createAlert('critical', 'p95_latency', p95Latency, critical * 1.5,
        `95th percentile latency is critically high: ${p95Latency}ms (threshold: ${critical * 1.5}ms)`);
    } else if (p95Latency >= warning * 1.5) {
      this.createAlert('warning', 'p95_latency', p95Latency, warning * 1.5,
        `95th percentile latency is high: ${p95Latency}ms (threshold: ${warning * 1.5}ms)`);
    }
  }

  private evaluateBandwidth(metrics: NetworkMetricsData): void {
    const { bandwidthUsage } = metrics;
    const { warning, critical } = this.config.performanceThresholds.resourceUsage.network;

    if (bandwidthUsage >= critical) {
      this.createAlert('critical', 'bandwidth', bandwidthUsage, critical,
        `Network bandwidth usage is critically high: ${bandwidthUsage}KB/s (threshold: ${critical}KB/s)`);
    } else if (bandwidthUsage >= warning) {
      this.createAlert('warning', 'bandwidth', bandwidthUsage, warning,
        `Network bandwidth usage is high: ${bandwidthUsage}KB/s (threshold: ${warning}KB/s)`);
    }
  }

  private evaluateConnectionStability(metrics: NetworkMetricsData): void {
    const { connectionStability } = metrics;
    const stabilityWarning = 80; // Below 80% stability triggers warning
    const stabilityCritical = 60; // Below 60% stability triggers critical alert

    if (connectionStability <= stabilityCritical) {
      this.createAlert('critical', 'stability', connectionStability, stabilityCritical,
        `Network connection stability is critically low: ${connectionStability}% (threshold: ${stabilityCritical}%)`);
    } else if (connectionStability <= stabilityWarning) {
      this.createAlert('warning', 'stability', connectionStability, stabilityWarning,
        `Network connection stability is low: ${connectionStability}% (threshold: ${stabilityWarning}%)`);
    }
  }

  private evaluateQueueSize(metrics: NetworkMetricsData): void {
    const { queueSize } = metrics;
    const queueWarning = 100; // More than 100 messages in queue triggers warning
    const queueCritical = 500; // More than 500 messages triggers critical alert

    if (queueSize >= queueCritical) {
      this.createAlert('critical', 'queue_size', queueSize, queueCritical,
        `Message queue size is critically high: ${queueSize} messages (threshold: ${queueCritical})`);
    } else if (queueSize >= queueWarning) {
      this.createAlert('warning', 'queue_size', queueSize, queueWarning,
        `Message queue size is high: ${queueSize} messages (threshold: ${queueWarning})`);
    }
  }

  private evaluateErrorRate(metrics: NetworkMetricsData): void {
    const { messagesSent, errors } = metrics;
    if (messagesSent === 0) return;

    const errorRate = (errors / messagesSent) * 100;
    const { warning, critical } = this.config.performanceThresholds.errorRate;

    if (errorRate >= critical) {
      this.createAlert('critical', 'error_rate', errorRate, critical,
        `Network error rate is critically high: ${errorRate.toFixed(2)}% (threshold: ${critical}%)`);
    } else if (errorRate >= warning) {
      this.createAlert('warning', 'error_rate', errorRate, warning,
        `Network error rate is high: ${errorRate.toFixed(2)}% (threshold: ${warning}%)`);
    }
  }

  private createAlert(
    type: 'warning' | 'critical',
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): void {
    const alert: Alert = {
      id: `network:${metric}:${Date.now()}`,
      type: `network-${metric}`,
      severity: type,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      source: 'NetworkMonitor',
      metadata: {
        metric
      }
    };

    this.alertManager.createAlert(alert);
  }
} 