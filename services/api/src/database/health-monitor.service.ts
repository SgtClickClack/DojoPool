import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConnectionRouterService } from './connection-router.service';
import {
  DatabaseEndpoint,
  HealthStatus,
  RegionalFailoverService,
} from './regional-failover.service';

export interface HealthAlert {
  id: string;
  type:
    | 'endpoint_down'
    | 'endpoint_slow'
    | 'replication_lag'
    | 'failover_triggered'
    | 'failover_completed'
    | 'failover_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  endpoint?: DatabaseEndpoint;
  region?: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface HealthMetrics {
  timestamp: Date;
  endpoint: DatabaseEndpoint;
  responseTime: number;
  connectionCount: number;
  activeConnections: number;
  replicationLag?: number;
  errorRate: number;
  throughput: number; // queries per second
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  primaryHealthy: boolean;
  replicaHealth: number; // percentage of healthy replicas
  avgResponseTime: number;
  activeAlerts: number;
  lastFailover?: Date;
  uptime: number; // seconds
}

@Injectable()
export class DatabaseHealthMonitorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseHealthMonitorService.name);

  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alerts: HealthAlert[] = [];
  private metrics: HealthMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly MAX_ALERTS_HISTORY = 500;
  private startTime = Date.now();

  // Health thresholds
  private readonly RESPONSE_TIME_WARNING = 1000; // 1 second
  private readonly RESPONSE_TIME_CRITICAL = 5000; // 5 seconds
  private readonly REPLICATION_LAG_WARNING = 30000; // 30 seconds
  private readonly REPLICATION_LAG_CRITICAL = 300000; // 5 minutes
  private readonly ERROR_RATE_WARNING = 0.05; // 5%
  private readonly ERROR_RATE_CRITICAL = 0.2; // 20%

  constructor(
    private regionalFailover: RegionalFailoverService,
    private connectionRouter: ConnectionRouterService
  ) {}

  async onModuleInit() {
    this.startHealthMonitoring();
    this.startMetricsCollection();
    this.logger.log('Database health monitor initialized');
  }

  async onModuleDestroy() {
    this.stopHealthMonitoring();
    this.logger.log('Database health monitor destroyed');
  }

  /**
   * Start comprehensive health monitoring
   */
  private startHealthMonitoring() {
    const regionalStatus = this.regionalFailover.getRegionalStatus();

    // Monitor all endpoints
    for (const region of regionalStatus.regions) {
      // Monitor primary
      this.startEndpointMonitoring(region.primary);

      // Monitor replicas
      for (const replica of region.replicas) {
        this.startEndpointMonitoring(replica);
      }
    }

    // System-wide health checks
    setInterval(() => {
      this.performSystemHealthCheck();
    }, 60000); // Every minute

    this.logger.log('Health monitoring started for all database endpoints');
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring() {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }

  /**
   * Start monitoring a specific endpoint
   */
  private startEndpointMonitoring(endpoint: DatabaseEndpoint) {
    const intervalId = setInterval(async () => {
      await this.checkEndpointHealth(endpoint);
    }, 30000); // Every 30 seconds

    this.healthCheckIntervals.set(endpoint.id, intervalId);

    // Initial health check
    this.checkEndpointHealth(endpoint);
  }

  /**
   * Perform detailed health check on an endpoint
   */
  private async checkEndpointHealth(endpoint: DatabaseEndpoint) {
    const startTime = Date.now();
    let responseTime = 0;
    let error: string | null = null;
    let replicationLag: number | undefined;
    let connectionCount = 0;
    let activeConnections = 0;

    try {
      // Create connection for health check
      const { Client } = require('pg');
      const client = new Client({
        host: endpoint.host,
        port: endpoint.port,
        database: endpoint.database,
        user: endpoint.username,
        password: endpoint.password,
        ssl: endpoint.ssl,
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
      });

      await client.connect();

      // Get connection statistics
      const connectionStats = await client.query(`
        SELECT
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      connectionCount = parseInt(connectionStats.rows[0].total_connections);
      activeConnections = parseInt(connectionStats.rows[0].active_connections);

      // Check replication lag (for replicas)
      if (endpoint.id.includes('replica')) {
        try {
          const lagResult = await client.query(`
            SELECT extract(epoch from now() - pg_last_xact_replay_timestamp()) as lag_seconds
          `);
          replicationLag = parseFloat(lagResult.rows[0].lag_seconds) * 1000; // Convert to milliseconds
        } catch (lagError) {
          // Replication lag check might fail on primary
          replicationLag = 0;
        }
      }

      // Perform a simple query to test responsiveness
      await client.query('SELECT 1 as health_check');

      responseTime = Date.now() - startTime;

      await client.end();
    } catch (healthError) {
      responseTime = Date.now() - startTime;
      error = healthError.message;
    }

    // Create health status
    const healthStatus: HealthStatus = {
      endpoint,
      isHealthy: !error && responseTime < this.RESPONSE_TIME_CRITICAL,
      responseTime,
      lastChecked: new Date(),
      error,
      replicationLag,
    };

    // Analyze health and create alerts
    await this.analyzeHealthAndAlert(healthStatus, {
      connectionCount,
      activeConnections,
    });

    // Store metrics
    this.storeMetrics({
      timestamp: new Date(),
      endpoint,
      responseTime,
      connectionCount,
      activeConnections,
      replicationLag,
      errorRate: error ? 1 : 0,
      throughput: 0, // Would be calculated from actual query metrics
    });
  }

  /**
   * Analyze health status and create alerts
   */
  private async analyzeHealthAndAlert(
    healthStatus: HealthStatus,
    metadata: { connectionCount: number; activeConnections: number }
  ) {
    const { endpoint, isHealthy, responseTime, error, replicationLag } =
      healthStatus;

    // Critical alerts
    if (!isHealthy) {
      await this.createAlert({
        id: `endpoint_down_${endpoint.id}_${Date.now()}`,
        type: 'endpoint_down',
        severity: 'critical',
        endpoint,
        message: `Database endpoint ${endpoint.id} is unreachable: ${error}`,
        timestamp: new Date(),
        resolved: false,
        metadata,
      });
      return;
    }

    // Response time alerts
    if (responseTime > this.RESPONSE_TIME_CRITICAL) {
      await this.createAlert({
        id: `endpoint_slow_critical_${endpoint.id}_${Date.now()}`,
        type: 'endpoint_slow',
        severity: 'critical',
        endpoint,
        message: `Database endpoint ${endpoint.id} response time critically slow: ${responseTime}ms`,
        timestamp: new Date(),
        resolved: false,
        metadata: { ...metadata, responseTime },
      });
    } else if (responseTime > this.RESPONSE_TIME_WARNING) {
      await this.createAlert({
        id: `endpoint_slow_warning_${endpoint.id}_${Date.now()}`,
        type: 'endpoint_slow',
        severity: 'medium',
        endpoint,
        message: `Database endpoint ${endpoint.id} response time slow: ${responseTime}ms`,
        timestamp: new Date(),
        resolved: false,
        metadata: { ...metadata, responseTime },
      });
    }

    // Replication lag alerts (for replicas)
    if (replicationLag !== undefined) {
      if (replicationLag > this.REPLICATION_LAG_CRITICAL) {
        await this.createAlert({
          id: `replication_lag_critical_${endpoint.id}_${Date.now()}`,
          type: 'replication_lag',
          severity: 'critical',
          endpoint,
          message: `Critical replication lag on ${endpoint.id}: ${replicationLag}ms`,
          timestamp: new Date(),
          resolved: false,
          metadata: { ...metadata, replicationLag },
        });
      } else if (replicationLag > this.REPLICATION_LAG_WARNING) {
        await this.createAlert({
          id: `replication_lag_warning_${endpoint.id}_${Date.now()}`,
          type: 'replication_lag',
          severity: 'medium',
          endpoint,
          message: `High replication lag on ${endpoint.id}: ${replicationLag}ms`,
          timestamp: new Date(),
          resolved: false,
          metadata: { ...metadata, replicationLag },
        });
      }
    }

    // Connection alerts
    if (metadata.connectionCount > 100) {
      await this.createAlert({
        id: `high_connections_${endpoint.id}_${Date.now()}`,
        type: 'endpoint_slow',
        severity: 'medium',
        endpoint,
        message: `High connection count on ${endpoint.id}: ${metadata.connectionCount}`,
        timestamp: new Date(),
        resolved: false,
        metadata,
      });
    }

    // Resolve previous alerts if endpoint is now healthy
    await this.resolveEndpointAlerts(endpoint.id);
  }

  /**
   * Create a health alert
   */
  private async createAlert(
    alert: Omit<HealthAlert, 'resolved' | 'resolvedAt'>
  ) {
    const fullAlert: HealthAlert = {
      ...alert,
      resolved: false,
    };

    this.alerts.unshift(fullAlert);

    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS_HISTORY) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS_HISTORY);
    }

    // Log alert
    this.logger.warn(
      `🚨 Health Alert [${alert.severity.toUpperCase()}]: ${alert.message}`
    );

    // Send notifications (would integrate with external alerting systems)
    await this.sendAlertNotification(fullAlert);
  }

  /**
   * Resolve alerts for a specific endpoint
   */
  private async resolveEndpointAlerts(endpointId: string) {
    const unresolvedAlerts = this.alerts.filter(
      (alert) => !alert.resolved && alert.endpoint?.id === endpointId
    );

    for (const alert of unresolvedAlerts) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      this.logger.info(`✅ Health Alert Resolved: ${alert.message}`);
    }
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotification(alert: HealthAlert) {
    // In a production system, this would integrate with:
    // - Slack/Teams webhooks
    // - Email notifications
    // - SMS alerts for critical issues
    // - Dashboard updates
    // - PagerDuty/ServiceNow integration

    const notification = {
      title: `Database Health Alert - ${alert.severity.toUpperCase()}`,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp,
      endpoint: alert.endpoint?.id,
      region: alert.endpoint?.region,
      metadata: alert.metadata,
    };

    // Log notification (would be sent to external systems)
    this.logger.log(`📢 Alert Notification: ${JSON.stringify(notification)}`);

    // For critical alerts, trigger immediate actions
    if (alert.severity === 'critical') {
      await this.handleCriticalAlert(alert);
    }
  }

  /**
   * Handle critical alerts
   */
  private async handleCriticalAlert(alert: HealthAlert) {
    switch (alert.type) {
      case 'endpoint_down':
        if (alert.endpoint) {
          // Trigger failover if primary is down
          const regionalStatus = this.regionalFailover.getRegionalStatus();
          if (regionalStatus.currentPrimary?.id === alert.endpoint.id) {
            this.logger.error(
              `🚨 Primary database ${alert.endpoint.id} is down! Triggering failover...`
            );
            await this.regionalFailover.manualFailover('any');
          }
        }
        break;

      case 'replication_lag':
        // Could trigger replica rebuilding or other recovery actions
        this.logger.warn(
          `🚨 Critical replication lag detected on ${alert.endpoint?.id}`
        );
        break;

      default:
        this.logger.warn(`🚨 Unhandled critical alert type: ${alert.type}`);
    }
  }

  /**
   * Store health metrics
   */
  private storeMetrics(metrics: HealthMetrics) {
    this.metrics.unshift(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(0, this.MAX_METRICS_HISTORY);
    }
  }

  /**
   * Perform system-wide health check
   */
  private async performSystemHealthCheck() {
    const healthStatus = this.regionalFailover.getHealthStatus();
    const connectionStats = this.connectionRouter.getQueryStats();

    const systemHealth: SystemHealth = {
      overall: this.calculateOverallHealth(healthStatus),
      primaryHealthy: healthStatus.overallHealth.primaryHealthy,
      replicaHealth:
        ((healthStatus.overallHealth.healthyEndpoints - 1) /
          (healthStatus.overallHealth.totalEndpoints - 1)) *
        100,
      avgResponseTime: this.calculateAverageResponseTime(),
      activeAlerts: this.alerts.filter((a) => !a.resolved).length,
      uptime: (Date.now() - this.startTime) / 1000,
    };

    // Log system health
    this.logger.log(
      `🏥 System Health: ${systemHealth.overall.toUpperCase()} | ` +
        `Primary: ${systemHealth.primaryHealthy ? '✅' : '❌'} | ` +
        `Replicas: ${systemHealth.replicaHealth.toFixed(1)}% | ` +
        `Alerts: ${systemHealth.activeAlerts} | ` +
        `Avg Response: ${systemHealth.avgResponseTime.toFixed(0)}ms`
    );

    // Create alerts for system-level issues
    if (systemHealth.overall === 'critical') {
      await this.createAlert({
        id: `system_critical_${Date.now()}`,
        type: 'endpoint_down',
        severity: 'critical',
        message:
          'System health is critical - multiple database issues detected',
        timestamp: new Date(),
        resolved: false,
        metadata: systemHealth,
      });
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(
    healthStatus: any
  ): 'healthy' | 'warning' | 'critical' {
    const { primaryHealthy, healthyEndpoints, totalEndpoints } =
      healthStatus.overallHealth;
    const activeAlerts = this.alerts.filter((a) => !a.resolved).length;

    if (!primaryHealthy || activeAlerts > 5) {
      return 'critical';
    }

    const healthyPercentage = (healthyEndpoints / totalEndpoints) * 100;
    if (healthyPercentage < 70 || activeAlerts > 2) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Calculate average response time across all endpoints
   */
  private calculateAverageResponseTime(): number {
    const recentMetrics = this.metrics.slice(0, 50); // Last 50 measurements
    if (recentMetrics.length === 0) return 0;

    const totalResponseTime = recentMetrics.reduce(
      (sum, metric) => sum + metric.responseTime,
      0
    );
    return totalResponseTime / recentMetrics.length;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection() {
    // Collect detailed metrics every 5 minutes
    setInterval(() => {
      this.collectDetailedMetrics();
    }, 300000);
  }

  /**
   * Collect detailed performance metrics
   */
  private async collectDetailedMetrics() {
    const regionalStatus = this.regionalFailover.getRegionalStatus();

    for (const region of regionalStatus.regions) {
      // Collect metrics from primary
      await this.collectEndpointMetrics(region.primary);

      // Collect metrics from replicas
      for (const replica of region.replicas) {
        await this.collectEndpointMetrics(replica);
      }
    }
  }

  /**
   * Collect detailed metrics from a specific endpoint
   */
  private async collectEndpointMetrics(endpoint: DatabaseEndpoint) {
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: endpoint.host,
        port: endpoint.port,
        database: endpoint.database,
        user: endpoint.username,
        password: endpoint.password,
        ssl: endpoint.ssl,
        connectionTimeoutMillis: 5000,
      });

      await client.connect();

      // Get detailed database statistics
      const stats = await client.query(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 10
      `);

      // Calculate throughput (simple approximation)
      const throughput =
        stats.rows.reduce(
          (sum: number, row: any) =>
            sum + row.inserts + row.updates + row.deletes,
          0
        ) / 300; // per second

      await client.end();

      // Store detailed metrics
      this.storeMetrics({
        timestamp: new Date(),
        endpoint,
        responseTime: 0, // Would be measured separately
        connectionCount: 0,
        activeConnections: 0,
        errorRate: 0,
        throughput,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to collect detailed metrics from ${endpoint.id}: ${error.message}`
      );
    }
  }

  /**
   * Get current system health status
   */
  getSystemHealth(): SystemHealth {
    const healthStatus = this.regionalFailover.getHealthStatus();
    const failoverHistory = this.regionalFailover.getFailoverHistory(1);

    return {
      overall: this.calculateOverallHealth(healthStatus),
      primaryHealthy: healthStatus.overallHealth.primaryHealthy,
      replicaHealth:
        ((healthStatus.overallHealth.healthyEndpoints - 1) /
          (healthStatus.overallHealth.totalEndpoints - 1)) *
        100,
      avgResponseTime: this.calculateAverageResponseTime(),
      activeAlerts: this.alerts.filter((a) => !a.resolved).length,
      lastFailover:
        failoverHistory.length > 0 ? failoverHistory[0].timestamp : undefined,
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50): HealthAlert[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * Get performance metrics
   */
  getMetrics(endpointId?: string, limit = 100): HealthMetrics[] {
    let filteredMetrics = this.metrics;

    if (endpointId) {
      filteredMetrics = this.metrics.filter(
        (metric) => metric.endpoint.id === endpointId
      );
    }

    return filteredMetrics.slice(0, limit);
  }

  /**
   * Force health check for all endpoints
   */
  async forceHealthCheck(): Promise<void> {
    this.logger.log('Forcing health check for all endpoints...');

    const regionalStatus = this.regionalFailover.getRegionalStatus();

    for (const region of regionalStatus.regions) {
      await this.checkEndpointHealth(region.primary);
      for (const replica of region.replicas) {
        await this.checkEndpointHealth(replica);
      }
    }

    this.logger.log('Health check completed for all endpoints');
  }

  /**
   * Reset all alerts (for testing)
   */
  resetAlerts(): void {
    this.alerts = [];
    this.logger.log('All alerts reset');
  }
}
