import { Injectable, Logger } from '@nestjs/common';
import { SHARD_CONFIG } from '../config/sockets.config';
import { RedisService } from '../redis/redis.service';

export interface ShardInfo {
  shardId: number;
  shardKey: string;
  namespace: string;
  serverUrl: string;
  connections: number;
  lastHeartbeat: Date;
}

export interface ShardRoute {
  shardId: number;
  serverUrl: string;
  namespace: string;
}

@Injectable()
export class ShardManagerService {
  private readonly logger = new Logger(ShardManagerService.name);
  private readonly shards = new Map<string, ShardInfo[]>();
  private readonly routeCache = new Map<string, ShardRoute>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Calculate shard ID based on shard key and configuration
   */
  calculateShardId(shardKey: string, shardCount: number): number {
    // Use consistent hashing for even distribution
    let hash = 0;
    for (let i = 0; i < shardKey.length; i++) {
      const char = shardKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % shardCount;
  }

  /**
   * Get shard route for a given namespace and shard key
   */
  async getShardRoute(
    namespace: string,
    shardKey: string
  ): Promise<ShardRoute | null> {
    const cacheKey = `${namespace}:${shardKey}`;

    // Check cache first
    const cached = this.routeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const config = SHARD_CONFIG[namespace as keyof typeof SHARD_CONFIG];
    if (!config) {
      this.logger.warn(
        `No shard configuration found for namespace: ${namespace}`
      );
      return null;
    }

    const shardId = this.calculateShardId(shardKey, config.shardCount);
    const shardInfo = await this.getShardInfo(namespace, shardId);

    if (!shardInfo) {
      this.logger.warn(`No shard info found for ${namespace}:${shardId}`);
      return null;
    }

    const route: ShardRoute = {
      shardId,
      serverUrl: shardInfo.serverUrl,
      namespace: `${namespace}-shard-${shardId}`,
    };

    // Cache the route for 5 minutes
    this.routeCache.set(cacheKey, route);
    setTimeout(() => this.routeCache.delete(cacheKey), 5 * 60 * 1000);

    return route;
  }

  /**
   * Register a shard server
   */
  async registerShard(
    namespace: string,
    shardId: number,
    serverUrl: string
  ): Promise<void> {
    const shardKey = `${namespace}:${shardId}`;
    const shardInfo: ShardInfo = {
      shardId,
      shardKey: shardKey,
      namespace,
      serverUrl,
      connections: 0,
      lastHeartbeat: new Date(),
    };

    if (!this.shards.has(namespace)) {
      this.shards.set(namespace, []);
    }

    const namespaceShards = this.shards.get(namespace)!;
    const existingIndex = namespaceShards.findIndex(
      (s) => s.shardId === shardId
    );

    if (existingIndex >= 0) {
      namespaceShards[existingIndex] = shardInfo;
    } else {
      namespaceShards.push(shardInfo);
    }

    // Store in Redis for cross-instance coordination
    await this.redisService.set(
      `shard:${shardKey}`,
      JSON.stringify(shardInfo),
      300 // 5 minutes TTL
    );

    this.logger.log(
      `Registered shard: ${namespace}:${shardId} at ${serverUrl}`
    );
  }

  /**
   * Update shard connection count
   */
  async updateShardConnections(
    namespace: string,
    shardId: number,
    connections: number
  ): Promise<void> {
    const shardInfo = await this.getShardInfo(namespace, shardId);
    if (shardInfo) {
      shardInfo.connections = connections;
      shardInfo.lastHeartbeat = new Date();

      const shardKey = `${namespace}:${shardId}`;
      await this.redisService.set(
        `shard:${shardKey}`,
        JSON.stringify(shardInfo),
        300
      );
    }
  }

  /**
   * Get shard information from Redis
   */
  private async getShardInfo(
    namespace: string,
    shardId: number
  ): Promise<ShardInfo | null> {
    const shardKey = `${namespace}:${shardId}`;
    const cached = await this.redisService.get(`shard:${shardKey}`);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        this.logger.error(`Failed to parse shard info: ${error}`);
      }
    }

    // Fallback to local shards
    const namespaceShards = this.shards.get(namespace);
    return namespaceShards?.find((s) => s.shardId === shardId) || null;
  }

  /**
   * Get all shards for a namespace
   */
  async getNamespaceShards(namespace: string): Promise<ShardInfo[]> {
    const namespaceShards = this.shards.get(namespace) || [];

    // Also check Redis for additional shards
    const redisShards = await this.getRedisShards(namespace);
    const allShards = [...namespaceShards];

    // Merge with Redis shards
    for (const redisShard of redisShards) {
      const exists = allShards.find((s) => s.shardId === redisShard.shardId);
      if (!exists) {
        allShards.push(redisShard);
      }
    }

    return allShards;
  }

  /**
   * Get shards from Redis
   */
  private async getRedisShards(namespace: string): Promise<ShardInfo[]> {
    const pattern = `shard:${namespace}:*`;
    const keys = await this.redisService.keys(pattern);
    const shards: ShardInfo[] = [];

    for (const key of keys) {
      const cached = await this.redisService.get(key);
      if (cached) {
        try {
          shards.push(JSON.parse(cached));
        } catch (error) {
          this.logger.error(`Failed to parse Redis shard info: ${error}`);
        }
      }
    }

    return shards;
  }

  /**
   * Get shard load statistics
   */
  async getShardStats(namespace: string): Promise<{
    totalShards: number;
    totalConnections: number;
    averageConnections: number;
    shardDistribution: Array<{ shardId: number; connections: number }>;
  }> {
    const shards = await this.getNamespaceShards(namespace);

    const totalConnections = shards.reduce(
      (sum, shard) => sum + shard.connections,
      0
    );
    const averageConnections =
      shards.length > 0 ? totalConnections / shards.length : 0;

    const shardDistribution = shards.map((shard) => ({
      shardId: shard.shardId,
      connections: shard.connections,
    }));

    return {
      totalShards: shards.length,
      totalConnections,
      averageConnections,
      shardDistribution,
    };
  }

  /**
   * Clean up stale shards
   */
  async cleanupStaleShards(): Promise<void> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [namespace, shards] of this.shards.entries()) {
      const activeShards = shards.filter(
        (shard) =>
          now.getTime() - shard.lastHeartbeat.getTime() < staleThreshold
      );

      if (activeShards.length !== shards.length) {
        this.shards.set(namespace, activeShards);
        this.logger.log(
          `Cleaned up ${shards.length - activeShards.length} stale shards in ${namespace}`
        );
      }
    }
  }
}
