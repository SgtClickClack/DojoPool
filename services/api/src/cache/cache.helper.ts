import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

export interface CacheHelperOptions {
  ttl?: number;
  keyPrefix?: string;
  invalidateOnWrite?: boolean;
  invalidatePatterns?: string[];
}

export interface WriteThroughOptions<T> {
  key: string;
  data: T;
  cacheOptions?: CacheHelperOptions;
  writeOperation: () => Promise<T>;
}

@Injectable()
export class CacheHelper {
  private readonly logger = new Logger(CacheHelper.name);

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Write-through cache operation: writes to both cache and database simultaneously
   */
  async writeThrough<T>(options: WriteThroughOptions<T>): Promise<T> {
    const { key, cacheOptions = {}, writeOperation } = options;
    const { ttl, keyPrefix, invalidateOnWrite = true } = cacheOptions;

    try {
      // Execute the write operation first
      const result = await writeOperation();

      // Write to cache immediately after successful database write
      await this.cacheService.set(key, result, {
        ttl,
        keyPrefix,
      });

      // Invalidate related cache patterns if specified
      if (invalidateOnWrite && cacheOptions.invalidatePatterns) {
        await this.invalidatePatterns(cacheOptions.invalidatePatterns);
      }

      this.logger.debug(
        `Write-through cache operation completed for key: ${key}`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Write-through cache operation failed for key: ${key}`,
        error
      );
      throw error;
    }
  }

  /**
   * Read operation with cache-first strategy
   */
  async readWithCache<T>(
    key: string,
    fetchOperation: () => Promise<T>,
    options: CacheHelperOptions = {}
  ): Promise<T> {
    const { ttl, keyPrefix } = options;

    try {
      // Try to get from cache first
      const cached = await this.cacheService.get<T>(key, keyPrefix);
      if (cached !== null) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // Cache miss, fetch from source
      this.logger.debug(`Cache miss for key: ${key}, fetching from source`);
      const data = await fetchOperation();

      // Cache the result
      if (data !== null && data !== undefined) {
        await this.cacheService.set(key, data, { ttl, keyPrefix });
      }

      return data;
    } catch (error) {
      this.logger.error(
        `Read with cache operation failed for key: ${key}`,
        error
      );
      throw error;
    }
  }

  /**
   * Invalidate multiple cache patterns
   */
  async invalidatePatterns(patterns: string[]): Promise<void> {
    try {
      const promises = patterns.map((pattern) =>
        this.cacheService.deleteByPattern(pattern)
      );

      const results = await Promise.all(promises);
      const totalDeleted = results.reduce((sum, count) => sum + count, 0);

      this.logger.debug(
        `Invalidated ${totalDeleted} cache entries across ${patterns.length} patterns`
      );
    } catch (error) {
      this.logger.error('Failed to invalidate cache patterns', error);
      throw error;
    }
  }

  /**
   * Batch cache operations for better performance
   */
  async batchGet<T>(
    keys: string[],
    keyPrefix?: string
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    try {
      const promises = keys.map(async (key) => {
        const value = await this.cacheService.get<T>(key, keyPrefix);
        return { key, value };
      });

      const cacheResults = await Promise.all(promises);

      cacheResults.forEach(({ key, value }) => {
        if (value !== null) {
          results.set(key, value);
        }
      });

      this.logger.debug(
        `Batch get completed: ${results.size}/${keys.length} cache hits`
      );
      return results;
    } catch (error) {
      this.logger.error('Batch get operation failed', error);
      throw error;
    }
  }

  /**
   * Batch cache set operations
   */
  async batchSet<T>(
    entries: Array<{ key: string; data: T; options?: CacheHelperOptions }>
  ): Promise<void> {
    try {
      const promises = entries.map(({ key, data, options }) =>
        this.cacheService.set(key, data, options)
      );

      await Promise.all(promises);
      this.logger.debug(`Batch set completed for ${entries.length} entries`);
    } catch (error) {
      this.logger.error('Batch set operation failed', error);
      throw error;
    }
  }

  /**
   * Generate cache key with consistent formatting
   */
  static generateKey(...parts: (string | number | boolean)[]): string {
    return parts
      .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'))
      .join(':');
  }

  /**
   * Generate cache key for API endpoints
   */
  static generateApiKey(
    controller: string,
    method: string,
    params?: Record<string, unknown>
  ): string {
    const baseKey = `${controller}:${method}`;
    if (params) {
      const paramsHash = JSON.stringify(params).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${baseKey}:${paramsHash}`;
    }
    return baseKey;
  }

  /**
   * Generate cache key for user-specific data
   */
  static generateUserKey(
    userId: string,
    resource: string,
    params?: Record<string, unknown>
  ): string {
    const baseKey = `user:${userId}:${resource}`;
    if (params) {
      const paramsHash = JSON.stringify(params).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${baseKey}:${paramsHash}`;
    }
    return baseKey;
  }

  /**
   * Generate cache key for venue-specific data
   */
  static generateVenueKey(
    venueId: string,
    resource: string,
    params?: Record<string, unknown>
  ): string {
    const baseKey = `venue:${venueId}:${resource}`;
    if (params) {
      const paramsHash = JSON.stringify(params).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${baseKey}:${paramsHash}`;
    }
    return baseKey;
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.cacheService.ping();
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Failed to get cache stats', error);
      return { connected: false, keys: 0, memory: null };
    }
  }
}
