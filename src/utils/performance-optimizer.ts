import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/monitoring';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkperiod: number; // Check for expired keys every X seconds
  maxKeys: number; // Maximum number of keys to store
}

interface PerformanceConfig {
  caching: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  compression: {
    enabled: boolean;
    level: number;
    threshold: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

class PerformanceOptimizer {
  private cache: NodeCache;
  private config: PerformanceConfig;
  private memoryThreshold: number = 500 * 1024 * 1024; // 500MB
  private gcThreshold: number = 0.8; // Trigger GC when heap usage > 80%

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      caching: {
        enabled: true,
        defaultTTL: 300, // 5 minutes
        maxSize: 1000
      },
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024 // Compress responses > 1KB
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      },
      ...config
    };

    // Initialize cache
    const cacheConfig: CacheConfig = {
      ttl: this.config.caching.defaultTTL,
      checkperiod: 120, // Check every 2 minutes
      maxKeys: this.config.caching.maxSize
    };

    this.cache = new NodeCache(cacheConfig);

    // Setup cache event listeners for monitoring
    this.cache.on('set', (key, value) => {
      logger.debug('Cache SET', { key, size: JSON.stringify(value).length });
    });

    this.cache.on('del', (key, value) => {
      logger.debug('Cache DEL', { key });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Cache EXPIRED', { key });
    });

    // Setup periodic memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Cache middleware for Express routes
   */
  cacheMiddleware(ttl?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.caching.enabled || req.method !== 'GET') {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);
      const cachedResponse = this.cache.get(cacheKey);

      if (cachedResponse) {
        logger.debug('Cache HIT', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Monkey patch res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode === 200) {
          this.cache.set(cacheKey, body, ttl || this.config.caching.defaultTTL);
          logger.debug('Cache SET', { key: cacheKey });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(req: Request): string {
    const baseKey = `${req.method}:${req.path}`;
    const queryKey = Object.keys(req.query).sort().map(key => 
      `${key}=${req.query[key]}`
    ).join('&');
    
    return queryKey ? `${baseKey}?${queryKey}` : baseKey;
  }

  /**
   * Manual cache operations
   */
  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || this.config.caching.defaultTTL);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      size: this.cache.keys().length
    };
  }

  /**
   * Memory monitoring and optimization
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

      // Log memory usage
      logger.debug('Memory usage', {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsagePercent: Math.round(heapUsagePercent * 100) + '%'
      });

      // Trigger garbage collection if heap usage is high
      if (heapUsagePercent > this.gcThreshold) {
        logger.warn('High memory usage detected, triggering cleanup', {
          heapUsagePercent: Math.round(heapUsagePercent * 100) + '%'
        });
        
        this.performMemoryCleanup();
      }

      // Clear cache if memory usage is critical
      if (memUsage.heapUsed > this.memoryThreshold) {
        logger.warn('Critical memory usage, clearing cache');
        this.cache.flushAll();
      }
    }, 60000); // Check every minute
  }

  /**
   * Perform memory cleanup operations
   */
  private performMemoryCleanup(): void {
    // Clear old cache entries
    const stats = this.cache.getStats();
    if (stats.keys > this.config.caching.maxSize * 0.8) {
      // Remove 20% of cache entries
      const keysToRemove = Math.floor(stats.keys * 0.2);
      const allKeys = this.cache.keys();
      
      for (let i = 0; i < keysToRemove && i < allKeys.length; i++) {
        this.cache.del(allKeys[i]);
      }
      
      logger.info('Performed cache cleanup', { 
        removedKeys: keysToRemove,
        remainingKeys: this.cache.keys().length 
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      logger.debug('Manual garbage collection triggered');
    }
  }

  /**
   * Optimize Express.js response
   */
  optimizeResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set performance headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Optimize JSON responses
      const originalJson = res.json.bind(res);
      res.json = (obj: any) => {
        // Minify JSON in production
        if (process.env.NODE_ENV === 'production') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.send(JSON.stringify(obj));
        }
        return originalJson(obj);
      };

      // Add ETag for caching
      res.setHeader('ETag', `"${Date.now()}"`);
      
      next();
    };
  }

  /**
   * Database query optimization helper
   */
  optimizeQuery<T>(
    queryFn: () => Promise<T>, 
    cacheKey: string, 
    ttl: number = 300
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
          logger.debug('Query cache HIT', { cacheKey });
          return resolve(cached);
        }

        // Execute query
        const start = process.hrtime.bigint();
        const result = await queryFn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000;

        // Log slow queries
        if (duration > 1000) {
          logger.warn('Slow query detected', { 
            cacheKey, 
            duration: Math.round(duration) + 'ms' 
          });
        }

        // Cache result
        this.cache.set(cacheKey, result, ttl);
        logger.debug('Query cache SET', { cacheKey, duration: Math.round(duration) + 'ms' });

        resolve(result);
      } catch (error) {
        logger.error('Query optimization error', { cacheKey, error });
        reject(error);
      }
    });
  }

  /**
   * Batch operation optimizer
   */
  batchOptimizer<T, R>(
    items: T[],
    batchSize: number = 100,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const results: R[] = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await processor(batch);
          results.push(...batchResults);
          
          // Add small delay to prevent overwhelming the system
          if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        logger.debug('Batch processing completed', {
          totalItems: items.length,
          batches: Math.ceil(items.length / batchSize),
          batchSize
        });
        
        resolve(results);
      } catch (error) {
        logger.error('Batch processing error', { error });
        reject(error);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const memUsage = process.memoryUsage();
    const cacheStats = this.getStats();
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cache: cacheStats,
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      pid: process.pid
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cache.close();
    logger.info('Performance optimizer destroyed');
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export class for custom instances
export default PerformanceOptimizer;