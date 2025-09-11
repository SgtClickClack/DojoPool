import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface RegionalConfig {
  region: string;
  primary: DatabaseEndpoint;
  replicas: DatabaseEndpoint[];
  priority: number; // Higher number = higher priority for failover
  healthCheckInterval: number;
  failoverTimeout: number;
}

export interface DatabaseEndpoint {
  id: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  region: string;
  url: string;
}

export interface HealthStatus {
  endpoint: DatabaseEndpoint;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
  replicationLag?: number; // For replicas
}

export interface FailoverEvent {
  timestamp: Date;
  fromRegion: string;
  toRegion: string;
  reason: string;
  duration: number;
  success: boolean;
}

@Injectable()
export class RegionalFailoverService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RegionalFailoverService.name);

  private regions: Map<string, RegionalConfig> = new Map();
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private currentPrimary: DatabaseEndpoint | null = null;
  private failoverInProgress = false;
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private failoverHistory: FailoverEvent[] = [];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.initializeRegionalConfig();
    this.startHealthMonitoring();
    this.logger.log('Regional failover service initialized');
  }

  async onModuleDestroy() {
    this.stopHealthMonitoring();
    this.logger.log('Regional failover service destroyed');
  }

  /**
   * Initialize regional database configuration
   */
  private async initializeRegionalConfig() {
    const regionsConfig =
      this.configService.get('REGIONAL_DATABASES') ||
      this.getDefaultRegionalConfig();

    for (const [regionName, config] of Object.entries(regionsConfig)) {
      const regionalConfig: RegionalConfig = {
        region: regionName,
        primary: config.primary,
        replicas: config.replicas || [],
        priority: config.priority || 1,
        healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
        failoverTimeout: config.failoverTimeout || 300000, // 5 minutes
      };

      this.regions.set(regionName, regionalConfig);
    }

    // Set initial primary (highest priority region)
    const primaryRegion = Array.from(this.regions.values()).sort(
      (a, b) => b.priority - a.priority
    )[0];

    this.currentPrimary = primaryRegion.primary;
    this.logger.log(`Initial primary region: ${primaryRegion.region}`);
  }

  /**
   * Default regional configuration for development
   */
  private getDefaultRegionalConfig(): Record<string, any> {
    return {
      'us-east': {
        priority: 10,
        primary: {
          id: 'us-east-primary',
          host: 'db-us-east.dojo-pool.internal',
          port: 5432,
          database: 'dojopool',
          username: 'dojopool_user',
          password: process.env.DB_PASSWORD || 'password',
          ssl: true,
          region: 'us-east',
          url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-us-east.dojo-pool.internal:5432/dojopool?sslmode=require`,
        },
        replicas: [
          {
            id: 'us-east-replica-1',
            host: 'db-us-east-replica-1.dojo-pool.internal',
            port: 5432,
            database: 'dojopool',
            username: 'dojopool_user',
            password: process.env.DB_PASSWORD || 'password',
            ssl: true,
            region: 'us-east',
            url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-us-east-replica-1.dojo-pool.internal:5432/dojopool?sslmode=require`,
          },
        ],
        healthCheckInterval: 30000,
        failoverTimeout: 300000,
      },
      'eu-west': {
        priority: 8,
        primary: {
          id: 'eu-west-primary',
          host: 'db-eu-west.dojo-pool.internal',
          port: 5432,
          database: 'dojopool',
          username: 'dojopool_user',
          password: process.env.DB_PASSWORD || 'password',
          ssl: true,
          region: 'eu-west',
          url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-eu-west.dojo-pool.internal:5432/dojopool?sslmode=require`,
        },
        replicas: [
          {
            id: 'eu-west-replica-1',
            host: 'db-eu-west-replica-1.dojo-pool.internal',
            port: 5432,
            database: 'dojopool',
            username: 'dojopool_user',
            password: process.env.DB_PASSWORD || 'password',
            ssl: true,
            region: 'eu-west',
            url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-eu-west.dojo-pool.internal:5432/dojopool?sslmode=require`,
          },
        ],
        healthCheckInterval: 30000,
        failoverTimeout: 300000,
      },
      'asia-pacific': {
        priority: 6,
        primary: {
          id: 'asia-pacific-primary',
          host: 'db-asia-pacific.dojo-pool.internal',
          port: 5432,
          database: 'dojopool',
          username: 'dojopool_user',
          password: process.env.DB_PASSWORD || 'password',
          ssl: true,
          region: 'asia-pacific',
          url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-asia-pacific.dojo-pool.internal:5432/dojopool?sslmode=require`,
        },
        replicas: [
          {
            id: 'asia-pacific-replica-1',
            host: 'db-asia-pacific-replica-1.dojo-pool.internal',
            port: 5432,
            database: 'dojopool',
            username: 'dojopool_user',
            password: process.env.DB_PASSWORD || 'password',
            ssl: true,
            region: 'asia-pacific',
            url: `postgresql://dojopool_user:${process.env.DB_PASSWORD || 'password'}@db-asia-pacific.dojo-pool.internal:5432/dojopool?sslmode=require`,
          },
        ],
        healthCheckInterval: 30000,
        failoverTimeout: 300000,
      },
    };
  }

  /**
   * Start health monitoring for all database endpoints
   */
  private startHealthMonitoring() {
    for (const [regionName, region] of this.regions) {
      // Monitor primary
      this.startEndpointMonitoring(region.primary, region.healthCheckInterval);

      // Monitor replicas
      for (const replica of region.replicas) {
        this.startEndpointMonitoring(replica, region.healthCheckInterval);
      }
    }

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
    this.logger.log('Health monitoring stopped');
  }

  /**
   * Start monitoring a specific database endpoint
   */
  private startEndpointMonitoring(
    endpoint: DatabaseEndpoint,
    interval: number
  ) {
    const intervalId = setInterval(async () => {
      await this.checkEndpointHealth(endpoint);
    }, interval);

    this.healthCheckIntervals.set(endpoint.id, intervalId);

    // Initial health check
    this.checkEndpointHealth(endpoint);
  }

  /**
   * Check health of a database endpoint
   */
  private async checkEndpointHealth(endpoint: DatabaseEndpoint) {
    const startTime = Date.now();

    try {
      // Create a temporary connection to check health
      const { Client } = require('pg');
      const client = new Client({
        host: endpoint.host,
        port: endpoint.port,
        database: endpoint.database,
        user: endpoint.username,
        password: endpoint.password,
        ssl: endpoint.ssl,
        connectionTimeoutMillis: 5000, // 5 second timeout
        query_timeout: 5000,
      });

      await client.connect();

      // Simple health check query
      const result = await client.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      await client.end();

      const healthStatus: HealthStatus = {
        endpoint,
        isHealthy: true,
        responseTime,
        lastChecked: new Date(),
      };

      this.healthStatuses.set(endpoint.id, healthStatus);

      // If this is the current primary and it's unhealthy, trigger failover
      if (endpoint.id === this.currentPrimary?.id && !healthStatus.isHealthy) {
        this.logger.warn(`Primary database ${endpoint.id} became unhealthy`);
        await this.triggerFailover('Primary database health check failed');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const healthStatus: HealthStatus = {
        endpoint,
        isHealthy: false,
        responseTime,
        lastChecked: new Date(),
        error: error.message,
      };

      this.healthStatuses.set(endpoint.id, healthStatus);

      // If this is the current primary, trigger failover
      if (endpoint.id === this.currentPrimary?.id) {
        this.logger.error(
          `Primary database ${endpoint.id} is unhealthy: ${error.message}`
        );
        await this.triggerFailover(
          `Primary database health check failed: ${error.message}`
        );
      }
    }
  }

  /**
   * Trigger automatic failover
   */
  private async triggerFailover(reason: string) {
    if (this.failoverInProgress) {
      this.logger.warn('Failover already in progress, skipping');
      return;
    }

    this.failoverInProgress = true;
    const startTime = Date.now();

    try {
      this.logger.log(`🚨 Starting failover process: ${reason}`);

      // Find the best available replica to promote
      const newPrimary = await this.selectFailoverTarget();

      if (!newPrimary) {
        this.logger.error('No suitable failover target found');
        return;
      }

      // Promote the replica to primary
      await this.promoteReplicaToPrimary(newPrimary);

      // Update DNS/routing (would integrate with actual DNS service)
      await this.updateTrafficRouting(newPrimary);

      // Update current primary reference
      const oldPrimary = this.currentPrimary;
      this.currentPrimary = newPrimary;

      // Reconnect Prisma to new primary
      await this.reconnectPrismaToPrimary(newPrimary);

      // Log successful failover
      const duration = Date.now() - startTime;
      const failoverEvent: FailoverEvent = {
        timestamp: new Date(),
        fromRegion: oldPrimary?.region || 'unknown',
        toRegion: newPrimary.region,
        reason,
        duration,
        success: true,
      };

      this.failoverHistory.push(failoverEvent);

      this.logger.log(
        `✅ Failover completed in ${duration}ms: ${oldPrimary?.region} -> ${newPrimary.region}`
      );

      // Send notifications (would integrate with alerting system)
      await this.sendFailoverNotifications(failoverEvent);
    } catch (error) {
      const duration = Date.now() - startTime;

      const failoverEvent: FailoverEvent = {
        timestamp: new Date(),
        fromRegion: this.currentPrimary?.region || 'unknown',
        toRegion: 'failed',
        reason,
        duration,
        success: false,
      };

      this.failoverHistory.push(failoverEvent);

      this.logger.error(
        `❌ Failover failed after ${duration}ms: ${error.message}`
      );
    } finally {
      this.failoverInProgress = false;
    }
  }

  /**
   * Select the best replica to promote to primary
   */
  private async selectFailoverTarget(): Promise<DatabaseEndpoint | null> {
    const candidates: Array<{ endpoint: DatabaseEndpoint; priority: number }> =
      [];

    // Collect all healthy replicas from other regions
    for (const [regionName, region] of this.regions) {
      if (region.primary.id === this.currentPrimary?.id) {
        continue; // Skip current region
      }

      // Check primary of other regions
      const primaryHealth = this.healthStatuses.get(region.primary.id);
      if (primaryHealth?.isHealthy) {
        candidates.push({
          endpoint: region.primary,
          priority: region.priority,
        });
      }

      // Check replicas of other regions
      for (const replica of region.replicas) {
        const replicaHealth = this.healthStatuses.get(replica.id);
        if (replicaHealth?.isHealthy) {
          candidates.push({
            endpoint: replica,
            priority: region.priority - 0.5, // Slightly lower priority than primary
          });
        }
      }
    }

    // Sort by priority and health
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      const aHealth = this.healthStatuses.get(a.endpoint.id);
      const bHealth = this.healthStatuses.get(b.endpoint.id);

      return (aHealth?.responseTime || 9999) - (bHealth?.responseTime || 9999);
    });

    return candidates.length > 0 ? candidates[0].endpoint : null;
  }

  /**
   * Promote a replica to primary (simplified - would integrate with actual DB management)
   */
  private async promoteReplicaToPrimary(
    replica: DatabaseEndpoint
  ): Promise<void> {
    // In a real implementation, this would:
    // 1. Stop replication on the replica
    // 2. Promote it to primary
    // 3. Update other replicas to follow the new primary
    // 4. Update DNS records

    this.logger.log(`Promoting replica ${replica.id} to primary`);

    // Simulate promotion delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update region configuration
    const region = Array.from(this.regions.values()).find((r) =>
      r.replicas.some((rep) => rep.id === replica.id)
    );

    if (region) {
      // Move current primary to replicas
      if (this.currentPrimary) {
        region.replicas.push(this.currentPrimary);
      }

      // Set new primary
      region.primary = replica;

      // Remove replica from replicas list
      region.replicas = region.replicas.filter((rep) => rep.id !== replica.id);
    }
  }

  /**
   * Update traffic routing (DNS, load balancers, etc.)
   */
  private async updateTrafficRouting(
    newPrimary: DatabaseEndpoint
  ): Promise<void> {
    // In a real implementation, this would:
    // 1. Update DNS records
    // 2. Update load balancer configurations
    // 3. Update application configuration
    // 4. Wait for propagation

    this.logger.log(`Updating traffic routing to ${newPrimary.region}`);

    // Simulate routing update delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Reconnect Prisma to new primary database
   */
  private async reconnectPrismaToPrimary(
    newPrimary: DatabaseEndpoint
  ): Promise<void> {
    try {
      // Disconnect current connection
      await this.prisma.$disconnect();

      // Update environment variable (in production, this would be more sophisticated)
      process.env.DATABASE_URL = newPrimary.url;

      // Reconnect with new primary
      await this.prisma.$connect();

      this.logger.log(`Prisma reconnected to new primary: ${newPrimary.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to reconnect Prisma to new primary: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Send failover notifications
   */
  private async sendFailoverNotifications(event: FailoverEvent): Promise<void> {
    // In a real implementation, this would integrate with:
    // - Email notifications
    // - Slack/Teams alerts
    // - SMS alerts for critical issues
    // - Dashboard updates

    this.logger.log(
      `📢 Failover notification: ${event.fromRegion} -> ${event.toRegion} (${event.reason})`
    );
  }

  /**
   * Get current regional status
   */
  getRegionalStatus() {
    return {
      currentPrimary: this.currentPrimary,
      regions: Array.from(this.regions.values()).map((region) => ({
        region: region.region,
        primary: region.primary,
        replicas: region.replicas,
        priority: region.priority,
        primaryHealth: this.healthStatuses.get(region.primary.id),
        replicaHealth: region.replicas.map((rep) =>
          this.healthStatuses.get(rep.id)
        ),
      })),
      failoverInProgress: this.failoverInProgress,
      lastFailover: this.failoverHistory[this.failoverHistory.length - 1],
    };
  }

  /**
   * Get health status for all endpoints
   */
  getHealthStatus() {
    return {
      statuses: Array.from(this.healthStatuses.values()),
      overallHealth: this.calculateOverallHealth(),
    };
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth() {
    const allStatuses = Array.from(this.healthStatuses.values());
    const healthyCount = allStatuses.filter(
      (status) => status.isHealthy
    ).length;
    const totalCount = allStatuses.length;

    return {
      healthyEndpoints: healthyCount,
      totalEndpoints: totalCount,
      healthPercentage: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0,
      primaryHealthy: this.currentPrimary
        ? this.healthStatuses.get(this.currentPrimary.id)?.isHealthy || false
        : false,
    };
  }

  /**
   * Get failover history
   */
  getFailoverHistory(limit = 10) {
    return this.failoverHistory.slice(-limit);
  }

  /**
   * Manually trigger failover (for testing)
   */
  async manualFailover(targetRegion: string): Promise<void> {
    const targetRegionConfig = this.regions.get(targetRegion);
    if (!targetRegionConfig) {
      throw new Error(`Region ${targetRegion} not found`);
    }

    this.logger.log(`Manual failover triggered to region: ${targetRegion}`);
    await this.triggerFailover(`Manual failover to ${targetRegion}`);
  }

  /**
   * Force reconnection to a specific region
   */
  async forceReconnect(region: string): Promise<void> {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    this.logger.log(`Forcing reconnection to region: ${region}`);
    await this.reconnectPrismaToPrimary(regionConfig.primary);
    this.currentPrimary = regionConfig.primary;
  }
}
