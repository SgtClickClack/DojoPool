import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private readonly defaultTTL = 300; // 5 minutes
  private readonly keyPrefix = 'dojopool:';

  constructor(@Optional() private configService?: ConfigService) {}

  async onModuleInit() {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = unknown>(key: string) => T | undefined)
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
        this.redisClient = new Redis(redisUrl);
      } else {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          maxRetriesPerRequest: 1, // Reduced retries for faster failure
          lazyConnect: true,
          connectTimeout: 5000, // 5 second timeout
        });
      }

      this.redisClient.on('connect', () => {
        this.logger.log('Connected to Redis successfully');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      // Test connection with timeout
      const pingPromise = this.redisClient.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
      );

      await Promise.race([pingPromise, timeoutPromise]);
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

  private generateKey(key: string, prefix?: string): string {
    return `${this.keyPrefix}${prefix || ''}${key}`;
  }

  async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    if (!this.redisClient) {
      // Don't log warnings in development mode when Redis is intentionally not available
      const get = this.configService?.get.bind(this.configService) as
        | (<T = any>(key: string) => T | undefined)
        | undefined;
      const isProduction =
        (get?.<string>('NODE_ENV') as string) === 'production';
      if (isProduction) {
        this.logger.warn('Redis not available, returning null');
      }
      return null;
    }

    try {
      const fullKey = this.generateKey(key, prefix);
      const cached = await this.redisClient.get(fullKey);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if entry has expired
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(key, prefix);
        return null;
      }

      return entry.data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.redisClient) {
      // Don't log warnings in development mode when Redis is intentionally not available
      const get = this.configService?.get.bind(this.configService) as
        | (<T = any>(key: string) => T | undefined)
        | undefined;
      const isProduction =
        (get?.<string>('NODE_ENV') as string) === 'production';
      if (isProduction) {
        this.logger.warn('Redis not available, skipping set operation');
      }
      return false;
    }

    try {
      const fullKey = this.generateKey(key, options.keyPrefix);
      const ttl = options.ttl || this.defaultTTL;

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await this.redisClient.setex(fullKey, ttl, JSON.stringify(entry));
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
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
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.redisClient) {
      return 0;
    }

    try {
      const keys = await this.redisClient.keys(`${this.keyPrefix}${pattern}`);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redisClient.del(...keys);
      this.logger.log(`Deleted ${result} keys matching pattern ${pattern}`);
      return result;
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
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
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(prefix?: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const pattern = prefix ? `${prefix}*` : '*';
      await this.deleteByPattern(pattern);
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  // Health check method
  async ping(): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string | null;
  }> {
    if (!this.redisClient) {
      return { connected: false, keys: 0, memory: null };
    }

    try {
      const [keyCount, memoryInfo] = await Promise.all([
        this.redisClient.dbsize(),
        this.redisClient.info('memory'),
      ]);

      return {
        connected: true,
        keys: keyCount,
        memory: memoryInfo,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return { connected: false, keys: 0, memory: null };
    }
  }
}
