import { Injectable, Logger } from '@nestjs/common';
import { SHARD_CONFIG } from '../config/sockets.config';
import { RedisService } from '../redis/redis.service';
import { ShardManagerService, ShardRoute } from './shard-manager.service';

export interface ShardConnection {
  connectionId: string;
  userId: string;
  namespace: string;
  shardId: number;
  connectedAt: Date;
  lastActivity: Date;
}

export interface LoadBalancingMetrics {
  shardId: number;
  connectionCount: number;
  messageRate: number;
  latency: number;
  memoryUsage: number;
  lastUpdated: Date;
}

@Injectable()
export class RedisShardRouterService {
  private readonly logger = new Logger(RedisShardRouterService.name);
  private readonly CONNECTION_TTL = 3600; // 1 hour
  private readonly METRICS_TTL = 300; // 5 minutes

  constructor(
    private readonly redisService: RedisService,
    private readonly shardManager: ShardManagerService
  ) {}

  /**
   * Route a client to the appropriate shard based on their connection parameters
   */
  async routeConnection(
    connectionId: string,
    userId: string,
    namespace: string,
    shardKey: string
  ): Promise<ShardRoute | null> {
    try {
      // Get shard route from shard manager
      const shardRoute = await this.shardManager.getShardRoute(
        namespace,
        shardKey
      );

      if (!shardRoute) {
        this.logger.warn(`No shard route found for ${namespace}:${shardKey}`);
        return null;
      }

      // Record the connection in Redis for load balancing
      await this.recordConnection(
        connectionId,
        userId,
        namespace,
        shardRoute.shardId
      );

      // Update load balancing metrics
      await this.updateLoadMetrics(shardRoute.shardId, namespace);

      this.logger.log(
        `Routed connection ${connectionId} for user ${userId} to ${namespace} shard ${shardRoute.shardId}`
      );

      return shardRoute;
    } catch (error) {
      this.logger.error(`Failed to route connection ${connectionId}:`, error);
      return null;
    }
  }

  /**
   * Handle shard failover by redirecting connections to healthy shards
   */
  async handleShardFailover(
    failedShardId: number,
    namespace: string
  ): Promise<Map<string, ShardRoute>> {
    const redirections = new Map<string, ShardRoute>();

    try {
      // Get all connections on the failed shard
      const connections = await this.getShardConnections(
        failedShardId,
        namespace
      );

      for (const connection of connections) {
        // Find alternative shard for this connection
        const alternativeRoute = await this.findAlternativeShard(
          connection.userId,
          namespace,
          failedShardId
        );

        if (alternativeRoute) {
          redirections.set(connection.connectionId, alternativeRoute);

          // Update connection record with new shard
          await this.updateConnectionShard(
            connection.connectionId,
            alternativeRoute.shardId
          );
        }
      }

      this.logger.log(
        `Handled failover for ${namespace} shard ${failedShardId}: ${redirections.size} connections redirected`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle shard failover for ${namespace}:${failedShardId}:`,
        error
      );
    }

    return redirections;
  }

  /**
   * Load balance connections by redistributing them across shards
   */
  async rebalanceShards(namespace: string): Promise<void> {
    try {
      const metrics = await this.getShardMetrics(namespace);
      const config = SHARD_CONFIG[namespace as keyof typeof SHARD_CONFIG];

      if (!config) return;

      // Identify overloaded shards (top 20% by connection count)
      const sortedMetrics = metrics.sort(
        (a, b) => b.connectionCount - a.connectionCount
      );
      const overloadThreshold = Math.floor(sortedMetrics.length * 0.2);
      const overloadedShards = sortedMetrics.slice(0, overloadThreshold);

      for (const overloadedShard of overloadedShards) {
        await this.rebalanceShard(overloadedShard.shardId, namespace);
      }

      this.logger.log(
        `Rebalanced shards for ${namespace}: ${overloadedShards.length} overloaded shards processed`
      );
    } catch (error) {
      this.logger.error(`Failed to rebalance shards for ${namespace}:`, error);
    }
  }

  /**
   * Get real-time metrics for all shards in a namespace
   */
  async getShardMetrics(namespace: string): Promise<LoadBalancingMetrics[]> {
    const metrics: LoadBalancingMetrics[] = [];
    const config = SHARD_CONFIG[namespace as keyof typeof SHARD_CONFIG];

    if (!config) return metrics;

    for (let shardId = 0; shardId < config.shardCount; shardId++) {
      const metric = await this.getShardMetric(shardId, namespace);
      if (metric) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  /**
   * Monitor shard health and trigger failovers if needed
   */
  async monitorShardHealth(namespace: string): Promise<void> {
    try {
      const metrics = await this.getShardMetrics(namespace);
      const unhealthyShards: number[] = [];

      for (const metric of metrics) {
        // Check if shard is unhealthy based on various criteria
        if (await this.isShardUnhealthy(metric)) {
          unhealthyShards.push(metric.shardId);
        }
      }

      for (const shardId of unhealthyShards) {
        await this.handleShardFailover(shardId, namespace);
      }

      if (unhealthyShards.length > 0) {
        this.logger.warn(
          `Detected ${unhealthyShards.length} unhealthy shards in ${namespace}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to monitor shard health for ${namespace}:`,
        error
      );
    }
  }

  // Private helper methods

  private async recordConnection(
    connectionId: string,
    userId: string,
    namespace: string,
    shardId: number
  ): Promise<void> {
    const connection: ShardConnection = {
      connectionId,
      userId,
      namespace,
      shardId,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    const key = `connection:${namespace}:${connectionId}`;
    await this.redisService.set(
      key,
      JSON.stringify(connection),
      this.CONNECTION_TTL
    );

    // Add to shard connection set
    const shardConnectionsKey = `shard_connections:${namespace}:${shardId}`;
    await this.redisService.sadd(shardConnectionsKey, connectionId);

    // Set expiration on the set
    await this.redisService.expire(shardConnectionsKey, this.CONNECTION_TTL);
  }

  private async updateLoadMetrics(
    shardId: number,
    namespace: string
  ): Promise<void> {
    const connections = await this.getShardConnections(shardId, namespace);
    const connectionCount = connections.length;

    // Calculate message rate (messages per minute)
    const messageRate = await this.calculateMessageRate(shardId, namespace);

    // Get latency from Redis ping
    const latency = await this.measureShardLatency(shardId, namespace);

    // Estimate memory usage
    const memoryUsage = await this.estimateShardMemoryUsage(shardId, namespace);

    const metrics: LoadBalancingMetrics = {
      shardId,
      connectionCount,
      messageRate,
      latency,
      memoryUsage,
      lastUpdated: new Date(),
    };

    const key = `shard_metrics:${namespace}:${shardId}`;
    await this.redisService.set(key, JSON.stringify(metrics), this.METRICS_TTL);
  }

  private async getShardConnections(
    shardId: number,
    namespace: string
  ): Promise<ShardConnection[]> {
    const connections: ShardConnection[] = [];
    const shardConnectionsKey = `shard_connections:${namespace}:${shardId}`;

    try {
      const connectionIds =
        await this.redisService.smembers(shardConnectionsKey);

      for (const connectionId of connectionIds) {
        const key = `connection:${namespace}:${connectionId}`;
        const connectionData = await this.redisService.get(key);

        if (connectionData) {
          connections.push(JSON.parse(connectionData));
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to get shard connections for ${namespace}:${shardId}:`,
        error
      );
    }

    return connections;
  }

  private async getShardMetric(
    shardId: number,
    namespace: string
  ): Promise<LoadBalancingMetrics | null> {
    const key = `shard_metrics:${namespace}:${shardId}`;
    const data = await this.redisService.get(key);

    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        this.logger.error(
          `Failed to parse shard metrics for ${namespace}:${shardId}:`,
          error
        );
      }
    }

    return null;
  }

  private async findAlternativeShard(
    userId: string,
    namespace: string,
    excludeShardId: number
  ): Promise<ShardRoute | null> {
    const metrics = await this.getShardMetrics(namespace);
    const availableShards = metrics
      .filter((m) => m.shardId !== excludeShardId)
      .sort((a, b) => a.connectionCount - b.connectionCount); // Sort by connection count ascending

    if (availableShards.length === 0) return null;

    // Choose the least loaded shard
    const targetShard = availableShards[0];
    const config = SHARD_CONFIG[namespace as keyof typeof SHARD_CONFIG];

    if (!config) return null;

    return {
      shardId: targetShard.shardId,
      serverUrl: await this.getShardServerUrl(targetShard.shardId, namespace),
      namespace: `${namespace}-shard-${targetShard.shardId}`,
    };
  }

  private async rebalanceShard(
    shardId: number,
    namespace: string
  ): Promise<void> {
    const connections = await this.getShardConnections(shardId, namespace);

    // Move 20% of connections to less loaded shards
    const connectionsToMove = Math.floor(connections.length * 0.2);

    for (let i = 0; i < connectionsToMove; i++) {
      const connection = connections[i];
      const alternativeRoute = await this.findAlternativeShard(
        connection.userId,
        namespace,
        shardId
      );

      if (alternativeRoute) {
        // Redirect connection
        await this.updateConnectionShard(
          connection.connectionId,
          alternativeRoute.shardId
        );

        this.logger.log(
          `Rebalanced connection ${connection.connectionId} from shard ${shardId} to ${alternativeRoute.shardId}`
        );
      }
    }
  }

  private async isShardUnhealthy(
    metric: LoadBalancingMetrics
  ): Promise<boolean> {
    // Check various health criteria
    const maxConnections = 10000; // Configurable threshold
    const maxLatency = 5000; // 5 seconds
    const maxMemoryUsage = 0.9; // 90% memory usage

    return (
      metric.connectionCount > maxConnections ||
      metric.latency > maxLatency ||
      metric.memoryUsage > maxMemoryUsage
    );
  }

  private async updateConnectionShard(
    connectionId: string,
    newShardId: number
  ): Promise<void> {
    const connectionKey = `connection:${connectionId}`;
    const connectionData = await this.redisService.get(connectionKey);

    if (connectionData) {
      const connection: ShardConnection = JSON.parse(connectionData);
      connection.shardId = newShardId;

      await this.redisService.set(
        connectionKey,
        JSON.stringify(connection),
        this.CONNECTION_TTL
      );
    }
  }

  private async calculateMessageRate(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // This would track message counts over time periods
    // For now, return a placeholder
    return 0;
  }

  private async measureShardLatency(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // Measure round-trip time to shard
    // For now, return a placeholder
    return 100; // 100ms
  }

  private async estimateShardMemoryUsage(
    shardId: number,
    namespace: string
  ): Promise<number> {
    // Estimate memory usage based on connections and data
    // For now, return a placeholder
    return 0.5; // 50% memory usage
  }

  private async getShardServerUrl(
    shardId: number,
    namespace: string
  ): Promise<string> {
    // This would look up the server URL for a specific shard
    // For now, return a placeholder based on shard ID
    return `ws://shard-${shardId}.dojopool.com:3002`;
  }

  /**
   * Clean up expired connections and metrics
   */
  async cleanupExpiredData(): Promise<void> {
    // Redis TTL will automatically clean up expired keys
    // This method can be used for additional cleanup logic
    this.logger.log('Cleaned up expired shard routing data');
  }
}
