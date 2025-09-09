import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  CACHE_INVALIDATION_PATTERNS,
  CACHE_PRESETS,
  CACHE_TTL,
} from './cache.constants';

export { CACHE_PRESETS };

export interface StandardizedCacheOptions {
  ttl?: number;
  keyPrefix?: string;
  tags?: string[]; // For advanced invalidation
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

@Injectable()
export class StandardizedCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StandardizedCacheService.name);
  private redisClient: Redis | null = null;
  private readonly keyPrefix = 'dojopool:';

  constructor(@Optional() private configService?: ConfigService) {}

  async onModuleInit() {
    const get = this.configService?.get.bind(this.configService);
    const isProduction = get?.('NODE_ENV') === 'production';

    // Skip Redis initialization in development
    if (!isProduction) {
      this.logger.log('Skipping Redis initialization in development mode');
      return;
    }

    const redisUrl = get?.('REDIS_URL');
    if (!redisUrl) {
      this.logger.log('No Redis URL provided, skipping Redis initialization');
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Connected to Redis successfully');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      // Test connection
      await Promise.race([
        this.redisClient.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
        ),
      ]);
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  // Generate standardized cache key
  private generateKey(key: string, prefix?: string): string {
    return `${this.keyPrefix}${prefix || ''}${key}`;
  }

  // Standard cache get with TTL validation
  async get<T = any>(
    key: string,
    options: StandardizedCacheOptions = {}
  ): Promise<T | null> {
    if (!this.redisClient) return null;

    try {
      const fullKey = this.generateKey(key, options.keyPrefix);
      const cached = await this.redisClient.get(fullKey);

      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check TTL expiration
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(key, options);
        return null;
      }

      return entry.data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Standard cache set with TTL
  async set<T = any>(
    key: string,
    data: T,
    options: StandardizedCacheOptions = {}
  ): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const fullKey = this.generateKey(key, options.keyPrefix);
      const ttl = options.ttl || CACHE_TTL.MEDIUM;

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags,
      };

      await this.redisClient.setex(fullKey, ttl, JSON.stringify(entry));
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete cache entry
  async delete(
    key: string,
    options: StandardizedCacheOptions = {}
  ): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const fullKey = this.generateKey(key, options.keyPrefix);
      const result = await this.redisClient.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Get or set pattern (cache-aside)
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: StandardizedCacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  // Pattern-based cache invalidation
  async invalidatePattern(pattern: string, prefix?: string): Promise<number> {
    if (!this.redisClient) return 0;

    try {
      const fullPattern = this.generateKey(pattern, prefix);
      const keys = await this.redisClient.keys(fullPattern);

      if (keys.length === 0) return 0;

      const result = await this.redisClient.del(...keys);
      this.logger.log(
        `Invalidated ${result} cache entries matching pattern: ${fullPattern}`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Cache invalidation error for pattern ${pattern}:`,
        error
      );
      return 0;
    }
  }

  // Tag-based cache invalidation
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.redisClient) return 0;

    let totalInvalidated = 0;

    for (const tag of tags) {
      try {
        // Find all keys with this tag
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);

        for (const key of keys) {
          const cached = await this.redisClient.get(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (entry.tags && entry.tags.includes(tag)) {
              await this.redisClient.del(key);
              totalInvalidated++;
            }
          }
        }
      } catch (error) {
        this.logger.error(`Tag invalidation error for tag ${tag}:`, error);
      }
    }

    this.logger.log(
      `Invalidated ${totalInvalidated} cache entries by tags: ${tags.join(', ')}`
    );
    return totalInvalidated;
  }

  // Standardized invalidation methods for common patterns
  async invalidateUserData(userId: string): Promise<number> {
    const patterns = CACHE_INVALIDATION_PATTERNS.USER_UPDATE.map(
      (prefix) => `${prefix}${userId}*`
    );
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  async invalidateTerritoryData(territoryId: string): Promise<number> {
    const patterns = CACHE_INVALIDATION_PATTERNS.TERRITORY_UPDATE.map(
      (prefix) => `${prefix}${territoryId}*`
    );
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  async invalidateSocialFeeds(userId: string): Promise<number> {
    const patterns = CACHE_INVALIDATION_PATTERNS.SOCIAL_ACTIVITY.map(
      (prefix) => `${prefix}${userId}*`
    );
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  async invalidateTournamentData(tournamentId: string): Promise<number> {
    const patterns = CACHE_INVALIDATION_PATTERNS.TOURNAMENT_UPDATE.map(
      (prefix) => `${prefix}${tournamentId}*`
    );
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  async invalidateMarketplaceData(): Promise<number> {
    const patterns = CACHE_INVALIDATION_PATTERNS.MARKETPLACE_UPDATE.map(
      (prefix) => `${prefix}*`
    );
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    if (!this.redisClient) {
      return { connected: false, keys: 0, memory: 0 };
    }

    try {
      const [keyCount, memoryInfo] = await Promise.all([
        this.redisClient.dbsize(),
        this.redisClient.info('memory'),
      ]);

      const memoryMatch = memoryInfo.match(/used_memory_human:(\d+(?:\.\d+)?)/);
      const memory = memoryMatch ? parseFloat(memoryMatch[1]) : 0;

      return {
        connected: true,
        keys: keyCount,
        memory,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return { connected: false, keys: 0, memory: 0 };
    }
  }
}
