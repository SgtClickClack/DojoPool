import { Injectable, Logger } from '@nestjs/common';
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { RedisService } from '../redis/redis.service';
import { RedisShardRouterService } from './redis-shard-router.service';
import { ShardManagerService } from './shard-manager.service';

export interface ShardPerformanceMetrics {
  shardId: number;
  namespace: string;
  timestamp: Date;
  connectionCount: number;
  messageRate: number; // messages per second
  latency: number; // milliseconds
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  errorRate: number; // errors per minute
  throughput: number; // bytes per second
  uptime: number; // seconds
}

export interface ShardHealthStatus {
  shardId: number;
  namespace: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  issues: string[];
  lastChecked: Date;
  responseTime: number;
}

export interface SystemLoadMetrics {
  totalConnections: number;
  totalShards: number;
  averageLoad: number;
  hotShards: number[];
  coldShards: number[];
  loadDistribution: number[];
  timestamp: Date;
}

@Injectable()
export class ShardMonitoringService {
  private readonly logger = new Logger(ShardMonitoringService.name);
  private readonly METRICS_RETENTION = 3600; // 1 hour in seconds
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly PERFORMANCE_CHECK_INTERVAL = 60000; // 1 minute

  private healthCheckTimer: NodeJS.Timeout | null = null;
  private performanceTimer: NodeJS.Timeout | null = null;
  private metricsBuffer: ShardPerformanceMetrics[] = [];

  constructor(
    private readonly redisService: RedisService,
    private readonly shardManager: ShardManagerService,
    private readonly shardRouter: RedisShardRouterService
  ) {}

  async onModuleInit() {
    // Start monitoring routines
    this.startHealthChecks();
    this.startPerformanceMonitoring();

    this.logger.log('Shard monitoring service initialized');
  }

  async onModuleDestroy() {
    // Clean up timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }

    this.logger.log('Shard monitoring service destroyed');
  }

  /**
   * Get real-time performance metrics for all shards
   */
  async getRealTimeMetrics(
    namespace?: string
  ): Promise<ShardPerformanceMetrics[]> {
    const namespaces = namespace
      ? [namespace]
      : Object.values(SOCKET_NAMESPACES);

    const allMetrics: ShardPerformanceMetrics[] = [];

    for (const ns of namespaces) {
      if (
        ns === SOCKET_NAMESPACES.TOURNAMENTS ||
        ns === SOCKET_NAMESPACES.ACTIVITY ||
        ns === SOCKET_NAMESPACES.CHAT ||
        ns === SOCKET_NAMESPACES.NOTIFICATIONS
      ) {
        continue; // Skip non-sharded namespaces
      }

      try {
        const metrics = await this.getNamespaceMetrics(ns);
        allMetrics.push(...metrics);
      } catch (error) {
        this.logger.error(`Failed to get metrics for namespace ${ns}:`, error);
      }
    }

    return allMetrics;
  }

  /**
   * Get health status for all shards
   */
  async getHealthStatus(namespace?: string): Promise<ShardHealthStatus[]> {
    const namespaces = namespace
      ? [namespace]
      : [SOCKET_NAMESPACES.WORLD_MAP, SOCKET_NAMESPACES.MATCHES];

    const allHealth: ShardHealthStatus[] = [];

    for (const ns of namespaces) {
      try {
        const health = await this.getNamespaceHealth(ns);
        allHealth.push(...health);
      } catch (error) {
        this.logger.error(
          `Failed to get health status for namespace ${ns}:`,
          error
        );
      }
    }

    return allHealth;
  }

  /**
   * Get system-wide load metrics
   */
  async getSystemLoadMetrics(): Promise<SystemLoadMetrics> {
    const allMetrics = await this.getRealTimeMetrics();

    const totalConnections = allMetrics.reduce(
      (sum, metric) => sum + metric.connectionCount,
      0
    );
    const totalShards = allMetrics.length;
    const averageLoad = totalShards > 0 ? totalConnections / totalShards : 0;

    // Identify hot and cold shards
    const sortedMetrics = allMetrics.sort(
      (a, b) => b.connectionCount - a.connectionCount
    );
    const hotThreshold = averageLoad * 1.5;
    const coldThreshold = averageLoad * 0.5;

    const hotShards = sortedMetrics
      .filter((m) => m.connectionCount > hotThreshold)
      .map((m) => m.shardId);

    const coldShards = sortedMetrics
      .filter((m) => m.connectionCount < coldThreshold)
      .map((m) => m.shardId);

    const loadDistribution = sortedMetrics.map((m) => m.connectionCount);

    return {
      totalConnections,
      totalShards,
      averageLoad,
      hotShards,
      coldShards,
      loadDistribution,
      timestamp: new Date(),
    };
  }

  /**
   * Get historical metrics for trend analysis
   */
  async getHistoricalMetrics(
    namespace: string,
    shardId: number,
    hours: number = 24
  ): Promise<ShardPerformanceMetrics[]> {
    const key = `metrics:history:${namespace}:${shardId}`;
    const data = await this.redisService.get(key);

    if (!data) return [];

    try {
      const metrics: ShardPerformanceMetrics[] = JSON.parse(data);
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

      return metrics.filter((m) => m.timestamp.getTime() > cutoffTime);
    } catch (error) {
      this.logger.error(
        `Failed to parse historical metrics for ${namespace}:${shardId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get performance alerts and recommendations
   */
  async getPerformanceAlerts(): Promise<
    Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      shardId: number;
      namespace: string;
      timestamp: Date;
    }>
  > {
    const alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      shardId: number;
      namespace: string;
      timestamp: Date;
    }> = [];

    const healthStatus = await this.getHealthStatus();
    const systemLoad = await this.getSystemLoadMetrics();

    // Check for unhealthy shards
    for (const health of healthStatus) {
      if (health.status === 'unhealthy') {
        alerts.push({
          type: 'error',
          message: `Shard ${health.shardId} in ${health.namespace} is unhealthy: ${health.issues.join(', ')}`,
          shardId: health.shardId,
          namespace: health.namespace,
          timestamp: new Date(),
        });
      } else if (health.status === 'degraded') {
        alerts.push({
          type: 'warning',
          message: `Shard ${health.shardId} in ${health.namespace} is degraded: ${health.issues.join(', ')}`,
          shardId: health.shardId,
          namespace: health.namespace,
          timestamp: new Date(),
        });
      }
    }

    // Check for load imbalance
    if (systemLoad.hotShards.length > 0) {
      alerts.push({
        type: 'warning',
        message: `Load imbalance detected. Hot shards: ${systemLoad.hotShards.join(', ')}`,
        shardId: -1,
        namespace: 'system',
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  // Private methods

  private async getNamespaceMetrics(
    namespace: string
  ): Promise<ShardPerformanceMetrics[]> {
    const metrics: ShardPerformanceMetrics[] = [];
    const config = await this.shardManager.getNamespaceShards(namespace);

    for (const shard of config) {
      try {
        const metric = await this.collectShardMetrics(shard.shardId, namespace);
        if (metric) {
          metrics.push(metric);
        }
      } catch (error) {
        this.logger.error(
          `Failed to collect metrics for shard ${shard.shardId} in ${namespace}:`,
          error
        );
      }
    }

    return metrics;
  }

  private async getNamespaceHealth(
    namespace: string
  ): Promise<ShardHealthStatus[]> {
    const health: ShardHealthStatus[] = [];
    const config = await this.shardManager.getNamespaceShards(namespace);

    for (const shard of config) {
      try {
        const shardHealth = await this.checkShardHealth(
          shard.shardId,
          namespace
        );
        health.push(shardHealth);
      } catch (error) {
        this.logger.error(
          `Failed to check health for shard ${shard.shardId} in ${namespace}:`,
          error
        );
      }
    }

    return health;
  }

  private async collectShardMetrics(
    shardId: number,
    namespace: string
  ): Promise<ShardPerformanceMetrics | null> {
    const baseMetrics = await this.shardRouter.getShardMetrics(namespace);

    if (!baseMetrics || baseMetrics.length === 0) {
      return null;
    }

    const shardMetrics = baseMetrics.find((m) => m.shardId === shardId);
    if (!shardMetrics) {
      return null;
    }

    const metrics: ShardPerformanceMetrics = {
      shardId,
      namespace,
      timestamp: new Date(),
      connectionCount: shardMetrics.connectionCount,
      messageRate: await this.calculateMessageRate(shardId, namespace),
      latency: shardMetrics.latency,
      memoryUsage: shardMetrics.memoryUsage,
      cpuUsage: await this.calculateCpuUsage(shardId, namespace),
      errorRate: await this.calculateErrorRate(shardId, namespace),
      throughput: await this.calculateThroughput(shardId, namespace),
      uptime: await this.calculateUptime(shardId, namespace),
    };

    // Store in buffer for batch processing
    this.metricsBuffer.push(metrics);

    // Store in Redis for historical data
    await this.storeHistoricalMetrics(metrics);

    return metrics;
  }

  private async checkShardHealth(
    shardId: number,
    namespace: string
  ): Promise<ShardHealthStatus> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      // Check if shard is responding
      const metrics = await this.collectShardMetrics(shardId, namespace);
      const responseTime = Date.now() - startTime;

      if (!metrics) {
        return {
          shardId,
          namespace,
          status: 'offline',
          issues: ['No metrics available'],
          lastChecked: new Date(),
          responseTime,
        };
      }

      // Evaluate health based on metrics
      if (metrics.latency > 1000) {
        issues.push('High latency');
      }

      if (metrics.memoryUsage > 0.9) {
        issues.push('High memory usage');
      }

      if (metrics.errorRate > 10) {
        issues.push('High error rate');
      }

      if (responseTime > 5000) {
        issues.push('Slow response time');
      }

      let status: ShardHealthStatus['status'] = 'healthy';
      if (issues.length > 2) {
        status = 'unhealthy';
      } else if (issues.length > 0) {
        status = 'degraded';
      }

      return {
        shardId,
        namespace,
        status,
        issues,
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        shardId,
        namespace,
        status: 'offline',
        issues: [`Health check failed: ${error}`],
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async calculateMessageRate(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // Implementation would track message counts over time periods
    // For now, return a placeholder based on connection count
    const metrics = await this.shardRouter.getShardMetrics(namespace);
    const shardMetrics = metrics?.find((m) => m.shardId === shardId);

    return shardMetrics ? shardMetrics.connectionCount * 2 : 0; // Rough estimate
  }

  private async calculateCpuUsage(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // This would integrate with system monitoring
    // For now, return a placeholder
    return Math.random() * 0.8; // 0-80% CPU usage
  }

  private async calculateErrorRate(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // This would track error counts over time
    // For now, return a placeholder
    return Math.random() * 5; // 0-5 errors per minute
  }

  private async calculateThroughput(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // This would measure data throughput
    // For now, return a placeholder
    const metrics = await this.shardRouter.getShardMetrics(namespace);
    const shardMetrics = metrics?.find((m) => m.shardId === shardId);

    return shardMetrics ? shardMetrics.connectionCount * 1024 : 0; // Rough estimate in bytes/sec
  }

  private async calculateUptime(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // This would track shard uptime
    // For now, return a placeholder
    return Math.random() * 86400; // Up to 24 hours
  }

  private async storeHistoricalMetrics(
    metrics: ShardPerformanceMetrics
  ): Promise<void> {
    const key = `metrics:history:${metrics.namespace}:${metrics.shardId}`;

    try {
      const existingData = await this.redisService.get(key);
      let historicalMetrics: ShardPerformanceMetrics[] = [];

      if (existingData) {
        historicalMetrics = JSON.parse(existingData);
      }

      // Add new metrics and keep only recent ones
      historicalMetrics.push(metrics);
      const cutoffTime = Date.now() - this.METRICS_RETENTION * 1000;
      historicalMetrics = historicalMetrics.filter(
        (m) => m.timestamp.getTime() > cutoffTime
      );

      // Limit to last 1000 entries to prevent memory issues
      if (historicalMetrics.length > 1000) {
        historicalMetrics = historicalMetrics.slice(-1000);
      }

      await this.redisService.set(
        key,
        JSON.stringify(historicalMetrics),
        this.METRICS_RETENTION
      );
    } catch (error) {
      this.logger.error(
        `Failed to store historical metrics for ${metrics.namespace}:${metrics.shardId}:`,
        error
      );
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Health check routine failed:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private startPerformanceMonitoring(): void {
    this.performanceTimer = setInterval(async () => {
      try {
        await this.performPerformanceMonitoring();
      } catch (error) {
        this.logger.error('Performance monitoring routine failed:', error);
      }
    }, this.PERFORMANCE_CHECK_INTERVAL);
  }

  private async performHealthChecks(): Promise<void> {
    const healthStatus = await this.getHealthStatus();

    for (const health of healthStatus) {
      if (health.status === 'unhealthy') {
        this.logger.warn(
          `Unhealthy shard detected: ${health.namespace}:${health.shardId} - ${health.issues.join(', ')}`
        );
      }
    }

    // Store health status in Redis
    const key = 'shard_health_status';
    await this.redisService.set(key, JSON.stringify(healthStatus), 300); // 5 minutes
  }

  private async performPerformanceMonitoring(): Promise<void> {
    // Process buffered metrics
    if (this.metricsBuffer.length > 0) {
      // Here you could send metrics to monitoring systems like Prometheus, DataDog, etc.
      this.logger.debug(
        `Processed ${this.metricsBuffer.length} performance metrics`
      );

      // Clear buffer
      this.metricsBuffer = [];
    }

    // Check for performance alerts
    const alerts = await this.getPerformanceAlerts();
    if (alerts.length > 0) {
      for (const alert of alerts) {
        this.logger.warn(`Performance alert: ${alert.message}`);
      }
    }
  }
}
