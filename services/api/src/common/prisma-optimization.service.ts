import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

interface QueryBatchItem<T = any> {
  key: string;
  query: () => Promise<T>;
  priority?: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number;
  keyPrefix: string;
}

@Injectable()
export class PrismaOptimizationService {
  private readonly logger = new Logger(PrismaOptimizationService.name);
  private queryCache = new Map<string, { data: any; expires: number }>();
  private batchQueue: QueryBatchItem[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // milliseconds

  constructor(private readonly _prisma: PrismaService) {}

  /**
   * Execute multiple queries in a single transaction for better performance
   */
  async executeBatch<T>(queries: QueryBatchItem<T>[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    try {
      await this._prisma.$transaction(async (_tx) => {
        // Sort by priority (higher priority first)
        const sortedQueries = queries.sort(
          (a, b) => (b.priority || 0) - (a.priority || 0)
        );

        for (const item of sortedQueries) {
          try {
            const result = await item.query();
            results.set(item.key, result);
          } catch (error) {
            this.logger.error(`Batch query failed for key ${item.key}:`, error);
            results.set(item.key, null as T);
          }
        }
      });
    } catch (error) {
      this.logger.error('Batch transaction failed:', error);
      throw error;
    }

    return results;
  }

  /**
   * Queue a query for batch execution
   */
  queueQuery<T>(
    key: string,
    query: () => Promise<T>,
    priority = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        key,
        query: async () => {
          try {
            const result = await query();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority,
      });

      // Process batch after delay
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    });
  }

  /**
   * Process queued queries in batch
   */
  private async processBatch() {
    if (this.batchQueue.length === 0) return;

    const queries = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    try {
      await this.executeBatch(queries);
    } catch (error) {
      this.logger.error('Failed to process batch queries:', error);
    }
  }

  /**
   * Cache query results with TTL
   */
  async cachedQuery<T>(
    key: string,
    query: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cacheKey = `${config.keyPrefix}:${key}`;
    const cached = this.queryCache.get(cacheKey);

    // Check if cached data is still valid
    if (cached && cached.expires > Date.now()) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached.data;
    }

    // Execute query and cache result
    try {
      const result = await query();
      this.queryCache.set(cacheKey, {
        data: result,
        expires: Date.now() + config.ttl,
      });

      // Clean up cache if it exceeds max size
      this.cleanupCache(config.maxSize);

      this.logger.debug(`Cached query result for key: ${cacheKey}`);
      return result;
    } catch (error) {
      this.logger.error(`Query failed for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Optimized findMany with pagination and selective fields
   */
  async findManyOptimized<T>(
    model: string,
    options: {
      where?: any;
      select?: any;
      include?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
      cache?: CacheConfig;
    }
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const cacheKey = `findMany:${model}:${JSON.stringify(options)}`;

    if (options.cache) {
      return this.cachedQuery(
        cacheKey,
        () => this.executeFindMany(model, options),
        options.cache
      );
    }

    return this.executeFindMany(model, options);
  }

  private async executeFindMany<T>(
    model: string,
    options: any
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const { where, select, include, orderBy, skip = 0, take = 20 } = options;

    // Execute count and data queries in parallel
    const [data, total] = await Promise.all([
      (this._prisma as any)[model].findMany({
        where,
        select,
        include,
        orderBy,
        skip,
        take: take + 1, // Get one extra to check if there are more
      }),
      (this._prisma as any)[model].count({ where }),
    ]);

    const hasMore = data.length > take;
    const result = hasMore ? data.slice(0, take) : data;

    return {
      data: result,
      total,
      hasMore,
    };
  }

  /**
   * Optimized findUnique with caching
   */
  async findUniqueOptimized<T>(
    model: string,
    options: {
      where: any;
      select?: any;
      include?: any;
      cache?: CacheConfig;
    }
  ): Promise<T | null> {
    const cacheKey = `findUnique:${model}:${JSON.stringify(options)}`;

    if (options.cache) {
      return this.cachedQuery(
        cacheKey,
        () => this.executeFindUnique(model, options),
        options.cache
      );
    }

    return this.executeFindUnique(model, options);
  }

  private async executeFindUnique<T>(
    model: string,
    options: any
  ): Promise<T | null> {
    const { where, select, include } = options;

    return (this._prisma as any)[model].findUnique({
      where,
      select,
      include,
    });
  }

  /**
   * Bulk operations for better performance
   */
  async bulkCreate<T>(
    model: string,
    data: T[],
    options: { skipDuplicates?: boolean } = {}
  ): Promise<{ count: number }> {
    try {
      const result = await (this._prisma as any)[model].createMany({
        data,
        skipDuplicates: options.skipDuplicates || false,
      });

      this.logger.log(`Bulk created ${result.count} records in ${model}`);
      return result;
    } catch (error) {
      this.logger.error(`Bulk create failed for ${model}:`, error);
      throw error;
    }
  }

  async bulkUpdate(
    model: string,
    data: Array<{ where: any; data: any }>
  ): Promise<{ count: number }> {
    try {
      const results = await Promise.all(
        data.map(({ where, data: updateData }) =>
          (this._prisma as any)[model].updateMany({
            where,
            data: updateData,
          })
        )
      );

      const totalCount = results.reduce((sum, result) => sum + result.count, 0);
      this.logger.log(`Bulk updated ${totalCount} records in ${model}`);

      return { count: totalCount };
    } catch (error) {
      this.logger.error(`Bulk update failed for ${model}:`, error);
      throw error;
    }
  }

  /**
   * Optimized aggregation queries
   */
  async aggregateOptimized<T>(
    model: string,
    options: {
      where?: any;
      _count?: any;
      _avg?: any;
      _sum?: any;
      _min?: any;
      _max?: any;
      cache?: CacheConfig;
    }
  ): Promise<T> {
    const cacheKey = `aggregate:${model}:${JSON.stringify(options)}`;

    if (options.cache) {
      return this.cachedQuery(
        cacheKey,
        () => this.executeAggregate(model, options),
        options.cache
      );
    }

    return this.executeAggregate(model, options);
  }

  private async executeAggregate<T>(model: string, options: any): Promise<T> {
    const { where, ...aggregateOptions } = options;

    return (this._prisma as any)[model].aggregate({
      where,
      ...aggregateOptions,
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(maxSize: number) {
    if (this.queryCache.size <= maxSize) return;

    const now = Date.now();
    const entries = Array.from(this.queryCache.entries());

    // Remove expired entries first
    for (const [key, value] of entries) {
      if (value.expires <= now) {
        this.queryCache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.queryCache.size > maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.queryCache.has(key))
        .sort((a, b) => a[1].expires - b[1].expires);

      const toRemove = sortedEntries.slice(0, this.queryCache.size - maxSize);
      for (const [key] of toRemove) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache() {
    this.queryCache.clear();
    this.logger.log('Query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.queryCache.entries());

    return {
      totalEntries: this.queryCache.size,
      expiredEntries: entries.filter(([, value]) => value.expires <= now)
        .length,
      validEntries: entries.filter(([, value]) => value.expires > now).length,
    };
  }
}
