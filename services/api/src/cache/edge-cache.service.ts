import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

export interface EdgeCacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate time
  cacheControl?: string; // Custom cache-control header
  etag?: boolean; // Enable ETag generation
  vary?: string[]; // Vary headers
  surrogateControl?: string; // CDN surrogate control
  edgeMaxAge?: number; // CDN edge cache time
  browserMaxAge?: number; // Browser cache time
  revalidateOnUpdate?: boolean; // Revalidate on data updates
  purgePatterns?: string[]; // Patterns to purge on invalidation
}

export interface CacheAnalytics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgResponseTime: number;
  cacheSize: number;
  lastUpdated: Date;
}

@Injectable()
export class EdgeCacheService {
  private readonly logger = new Logger(EdgeCacheService.name);
  private analytics: CacheAnalytics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    cacheSize: 0,
    lastUpdated: new Date(),
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Generate HTTP cache headers for edge/CDN caching
   */
  generateCacheHeaders(options: EdgeCacheOptions = {}): Record<string, string> {
    const headers: Record<string, string> = {};

    // Default cache options
    const ttl = options.ttl || 300; // 5 minutes default
    const browserMaxAge = options.browserMaxAge || ttl;
    const edgeMaxAge = options.edgeMaxAge || ttl * 2; // CDN caches longer
    const staleWhileRevalidate = options.staleWhileRevalidate || ttl / 2;

    // Cache-Control header for browser and CDN
    if (options.cacheControl) {
      headers['Cache-Control'] = options.cacheControl;
    } else {
      const directives = [
        `max-age=${browserMaxAge}`,
        `s-maxage=${edgeMaxAge}`,
        `stale-while-revalidate=${staleWhileRevalidate}`,
        'public',
      ];
      headers['Cache-Control'] = directives.join(', ');
    }

    // CDN surrogate control (for CDNs like Fastly, Cloudflare)
    if (options.surrogateControl) {
      headers['Surrogate-Control'] = options.surrogateControl;
    } else {
      headers['Surrogate-Control'] = `max-age=${edgeMaxAge}`;
    }

    // Vary header for proper caching of different representations
    if (options.vary && options.vary.length > 0) {
      headers['Vary'] = options.vary.join(', ');
    }

    // Add common vary headers for API responses
    if (!headers['Vary']) {
      headers['Vary'] = 'Accept, Accept-Encoding, Authorization';
    }

    return headers;
  }

  /**
   * Generate cache key for edge caching
   */
  generateEdgeCacheKey(
    resource: string,
    params: Record<string, any> = {},
    userId?: string
  ): string {
    const keyParts = [resource];

    // Add user-specific key for personalized content
    if (userId) {
      keyParts.push(`user:${userId}`);
    }

    // Add query parameters (sorted for consistency)
    const sortedParams = Object.keys(params)
      .sort()
      .filter((key) => params[key] !== undefined && params[key] !== null)
      .map((key) => `${key}:${String(params[key])}`);

    if (sortedParams.length > 0) {
      keyParts.push(sortedParams.join('|'));
    }

    return keyParts.join(':');
  }

  /**
   * Get cached response with edge headers
   */
  async getWithEdgeCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: EdgeCacheOptions = {}
  ): Promise<{ data: T; headers: Record<string, string>; cached: boolean }> {
    const startTime = Date.now();

    try {
      // Try to get from cache first
      const cachedData = await this.cacheService.get<T>(key);

      if (cachedData !== null) {
        this.updateAnalytics(true, Date.now() - startTime);
        const headers = this.generateCacheHeaders(options);
        headers['X-Cache-Status'] = 'HIT';
        return { data: cachedData, headers, cached: true };
      }

      // Cache miss - fetch fresh data
      const freshData = await fetcher();

      // Cache the result
      if (freshData !== undefined && freshData !== null) {
        await this.cacheService.set(key, freshData, {
          ttl: options.ttl || 300,
        });
      }

      this.updateAnalytics(false, Date.now() - startTime);
      const headers = this.generateCacheHeaders(options);
      headers['X-Cache-Status'] = 'MISS';
      return { data: freshData, headers, cached: false };
    } catch (error) {
      this.logger.error(`Edge cache error for key ${key}:`, error);
      // Fallback to fresh data without caching
      const freshData = await fetcher();
      const headers = this.generateCacheHeaders({ ...options, ttl: 0 });
      headers['X-Cache-Status'] = 'ERROR';
      return { data: freshData, headers, cached: false };
    }
  }

  /**
   * Invalidate edge cache for specific patterns
   */
  async invalidateEdgeCache(patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await this.cacheService.deleteByPattern(pattern);
        this.logger.log(`Invalidated edge cache pattern: ${pattern}`);
      }

      // Generate cache purge headers for CDN (would be sent to CDN API)
      const purgeHeaders = {
        'Cache-Purge': 'true',
        'Purge-Patterns': patterns.join(','),
        'X-Purge-Time': new Date().toISOString(),
      };

      this.logger.log('Generated cache purge headers:', purgeHeaders);
    } catch (error) {
      this.logger.error('Failed to invalidate edge cache:', error);
    }
  }

  /**
   * Set up revalidation hooks for data changes
   */
  async setupRevalidationHooks(
    entityType: string,
    patterns: string[]
  ): Promise<void> {
    // This would typically be called when data changes
    // For example, when a venue is updated, invalidate venue-related cache
    await this.invalidateEdgeCache(patterns);
  }

  /**
   * Update cache analytics
   */
  private updateAnalytics(hit: boolean, responseTime: number): void {
    this.analytics.totalRequests++;
    if (hit) {
      this.analytics.hits++;
    } else {
      this.analytics.misses++;
    }

    this.analytics.hitRate = this.analytics.hits / this.analytics.totalRequests;
    this.analytics.avgResponseTime =
      (this.analytics.avgResponseTime * (this.analytics.totalRequests - 1) +
        responseTime) /
      this.analytics.totalRequests;

    this.analytics.lastUpdated = new Date();
  }

  /**
   * Get cache analytics
   */
  getAnalytics(): CacheAnalytics {
    return { ...this.analytics };
  }

  /**
   * Reset cache analytics
   */
  resetAnalytics(): void {
    this.analytics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      cacheSize: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    const stats = await this.cacheService.getStats();
    return {
      ...stats,
      analytics: this.getAnalytics(),
      edgeCacheEnabled: true,
      cdnConfigured: this.isCDNConfigured(),
    };
  }

  /**
   * Check if CDN is configured
   */
  private isCDNConfigured(): boolean {
    const cdnUrl = this.configService.get<string>('CDN_URL');
    const cdnProvider = this.configService.get<string>('CDN_PROVIDER');
    return !!(cdnUrl && cdnProvider);
  }

  /**
   * Warm up cache for frequently accessed data
   */
  async warmupCache<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    options: EdgeCacheOptions = {}
  ): Promise<void> {
    this.logger.log(`Warming up cache for ${keys.length} keys`);

    for (const key of keys) {
      try {
        const data = await fetcher(key);
        await this.cacheService.set(key, data, {
          ttl: options.ttl || 3600, // 1 hour default for warmup
        });
      } catch (error) {
        this.logger.error(`Failed to warmup cache for key ${key}:`, error);
      }
    }

    this.logger.log('Cache warmup completed');
  }
}
