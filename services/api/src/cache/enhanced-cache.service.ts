import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  enableCompression?: boolean;
  maxRetries?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  version?: string;
  metadata?: {
    hits: number;
    lastAccessed: number;
    size: number;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
  hitRate: number;
  averageTTL: number;
}

@Injectable()
export class EnhancedCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EnhancedCacheService.name);
  private redisClient: Redis | null = null;
  private readonly defaultTTL = 300; // 5 minutes
  private readonly keyPrefix = 'dojopool:';
  private readonly stats = {
    hits: 0,
    misses: 0,
  };

  constructor(@Optional() private configService?: ConfigService) {}

  async onModuleInit() {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';

    // Skip Redis initialization completely in development mode
    if (!isProduction) {
      this.logger.log('Skipping Redis initialization in development mode');
      return;
    }

    const redisUrl = get?.<string>('REDIS_URL') as string | undefined;
    if (!redisUrl) {
      this.logger.log('No Redis URL provided, skipping Redis initialization');
      return;
    }

    const redisHost = (get?.<string>('REDIS_HOST') as string) || 'localhost';
    const redisPort = (get?.<number>('REDIS_PORT') as number) ?? 6379;
    const redisPassword = get?.<string>('REDIS_PASSWORD') as string | undefined;

    try {
      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxLoadingTimeout: 10000,
        });
      } else {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxLoadingTimeout: 10000,
        });
      }

      this.redisClient.on('connect', () => {
        this.logger.log('Connected to Redis successfully');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      this.redisClient.on('ready', () => {
        this.logger.log('Redis is ready to accept commands');
      });

      // Test connection with timeout
      const pingPromise = this.redisClient.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
      );

      await Promise.race([pingPromise, timeoutPromise]);

      // Configure Redis for optimal performance
      await this.configureRedis();
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

  private async configureRedis(): Promise<void> {
    if (!this.redisClient) return;

    try {
      // Set memory policy
      await this.redisClient.config('SET', 'maxmemory', '2gb');
      await this.redisClient.config('SET', 'maxmemory-policy', 'allkeys-lru');
      await this.redisClient.config('SET', 'maxmemory-samples', '10');

      // Enable key space notifications for cache invalidation
      await this.redisClient.config('SET', 'notify-keyspace-events', 'KEA');

      // Optimize for performance
      await this.redisClient.config('SET', 'tcp-keepalive', '300');
      await this.redisClient.config('SET', 'timeout', '300');

      this.logger.log('Redis configured for optimal performance');
    } catch (error) {
      this.logger.warn('Failed to configure Redis:', error);
    }
  }

  private generateKey(key: string, prefix?: string): string {
    return `${this.keyPrefix}${prefix || ''}${key}`;
  }

  async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const fullKey = this.generateKey(key, prefix);
      const result = await this.redisClient.get(fullKey);

      if (result === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      const entry: CacheEntry<T> = JSON.parse(result);

      // Check if expired
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(key, prefix);
        this.stats.misses++;
        return null;
      }

      // Update access metadata
      if (entry.metadata) {
        entry.metadata.hits++;
        entry.metadata.lastAccessed = Date.now();
        await this.set(key, entry.data, { prefix, ttl: entry.ttl });
      }

      return entry.data;
    } catch (error) {
      this.logger.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T = any>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const fullKey = this.generateKey(key, options.keyPrefix);
      const ttl = options.ttl || this.defaultTTL;

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        metadata: {
          hits: 0,
          lastAccessed: Date.now(),
          size: JSON.stringify(data).length,
        },
      };

      const serialized = JSON.stringify(entry);
      await this.redisClient.setex(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string, prefix?: string): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const fullKey = this.generateKey(key, prefix);
      const result = await this.redisClient.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error('Cache delete error:', error);
      return false;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.redisClient) {
      return 0;
    }

    try {
      const fullPattern = this.generateKey(pattern);
      const keys = await this.redisClient.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redisClient.del(...keys);
      return result;
    } catch (error) {
      this.logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const fullKey = this.generateKey(key, prefix);
      const result = await this.redisClient.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error('Cache exists error:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      return false;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Cache ping error:', error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    if (!this.redisClient) {
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 0,
        hitRate: 0,
        averageTTL: 0,
      };
    }

    try {
      const info = await this.redisClient.info('memory');
      const keys = await this.redisClient.dbsize();

      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys,
        memory,
        hitRate,
        averageTTL: this.defaultTTL,
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 0,
        hitRate: 0,
        averageTTL: 0,
      };
    }
  }

  // Advanced caching patterns
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options.keyPrefix);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    return this.deleteByPattern(pattern);
  }

  async setWithVersion<T>(
    key: string,
    data: T,
    version: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.defaultTTL,
      version,
    };

    return this.set(key, entry, options);
  }
}
