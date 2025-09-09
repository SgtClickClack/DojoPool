import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheRevalidationService } from './cache-revalidation.service';
import { EdgeCacheService } from './edge-cache.service';

export interface CacheMetrics {
  timestamp: Date;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalRequests: number;
  avgResponseTime: number;
  memoryUsage: number;
  cacheSize: number;
  invalidationCount: number;
}

export interface CacheWarmupConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  payload?: any;
  frequency: 'daily' | 'hourly' | 'weekly';
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class CacheManagementService {
  private readonly logger = new Logger(CacheManagementService.name);
  private metrics: CacheMetrics[] = [];
  private warmupConfigs: CacheWarmupConfig[] = [];

  constructor(
    private readonly edgeCacheService: EdgeCacheService,
    private readonly revalidationService: CacheRevalidationService
  ) {
    this.initializeDefaultWarmupConfigs();
  }

  /**
   * Get current cache performance metrics
   */
  async getCacheMetrics(): Promise<CacheMetrics> {
    const analytics = this.edgeCacheService.getAnalytics();
    const stats = await this.edgeCacheService.getCacheStats();

    return {
      timestamp: new Date(),
      cacheHits: analytics.hits,
      cacheMisses: analytics.misses,
      hitRate: analytics.hitRate,
      totalRequests: analytics.totalRequests,
      avgResponseTime: analytics.avgResponseTime,
      memoryUsage: process.memoryUsage().heapUsed,
      cacheSize: stats.cacheSize || 0,
      invalidationCount: 0, // Would be tracked separately
    };
  }

  /**
   * Get historical cache metrics
   */
  getHistoricalMetrics(hours: number = 24): CacheMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter((metric) => metric.timestamp >= cutoffTime);
  }

  /**
   * Emergency cache purge
   */
  async emergencyPurge(): Promise<void> {
    this.logger.warn('Performing emergency cache purge');
    await this.revalidationService.emergencyPurge();
    this.logger.warn('Emergency cache purge completed');
  }

  /**
   * Warm up frequently accessed data
   */
  async warmupCache(): Promise<void> {
    this.logger.log('Starting cache warmup process');

    for (const config of this.warmupConfigs) {
      if (config.priority === 'high') {
        await this.warmupEndpoint(config);
      }
    }

    this.logger.log('Cache warmup process completed');
  }

  /**
   * Add cache warmup configuration
   */
  addWarmupConfig(config: CacheWarmupConfig): void {
    this.warmupConfigs.push(config);
    this.logger.log(`Added cache warmup config for ${config.endpoint}`);
  }

  /**
   * Remove cache warmup configuration
   */
  removeWarmupConfig(endpoint: string): void {
    this.warmupConfigs = this.warmupConfigs.filter(
      (config) => config.endpoint !== endpoint
    );
    this.logger.log(`Removed cache warmup config for ${endpoint}`);
  }

  /**
   * Get cache health status
   */
  async getCacheHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: CacheMetrics;
    issues: string[];
  }> {
    const metrics = await this.getCacheMetrics();
    const issues: string[] = [];

    // Check hit rate
    if (metrics.hitRate < 0.7) {
      issues.push(`Low cache hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
    }

    // Check response time
    if (metrics.avgResponseTime > 1000) {
      issues.push(
        `High average response time: ${metrics.avgResponseTime.toFixed(0)}ms`
      );
    }

    // Check memory usage
    const memoryMB = metrics.memoryUsage / 1024 / 1024;
    if (memoryMB > 500) {
      issues.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 2) {
      status = 'unhealthy';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      metrics,
      issues,
    };
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimizeCache(): Promise<void> {
    this.logger.log('Starting cache optimization');

    const metrics = await this.getCacheMetrics();

    // Adjust cache TTL based on hit rate
    if (metrics.hitRate > 0.9) {
      this.logger.log('High hit rate detected, could increase cache TTL');
    } else if (metrics.hitRate < 0.5) {
      this.logger.log(
        'Low hit rate detected, could decrease cache TTL or review cache keys'
      );
    }

    // Check for memory pressure
    const memoryUsage = process.memoryUsage();
    const memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (memoryPressure > 0.8) {
      this.logger.warn(
        'High memory pressure detected, consider cache size reduction'
      );
    }

    this.logger.log('Cache optimization completed');
  }

  /**
   * Scheduled cache maintenance tasks
   */
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyMaintenance(): Promise<void> {
    try {
      this.logger.debug('Running hourly cache maintenance');

      // Collect metrics
      const metrics = await this.getCacheMetrics();
      this.metrics.push(metrics);

      // Keep only last 7 days of metrics
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter((m) => m.timestamp >= sevenDaysAgo);

      // Run lightweight optimization
      if (metrics.hitRate < 0.6) {
        await this.optimizeCache();
      }
    } catch (error) {
      this.logger.error('Hourly cache maintenance failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyMaintenance(): Promise<void> {
    try {
      this.logger.log('Running daily cache maintenance');

      // Warm up high-priority endpoints
      await this.warmupCache();

      // Full optimization
      await this.optimizeCache();

      // Log cache health
      const health = await this.getCacheHealth();
      this.logger.log(`Cache health status: ${health.status}`);

      if (health.issues.length > 0) {
        this.logger.warn('Cache health issues:', health.issues);
      }
    } catch (error) {
      this.logger.error('Daily cache maintenance failed:', error);
    }
  }

  /**
   * Get cache configuration recommendations
   */
  async getRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const metrics = await this.getCacheMetrics();

    if (metrics.hitRate < 0.7) {
      recommendations.push(
        'Consider reviewing cache key generation for better hit rates'
      );
      recommendations.push(
        'Evaluate if cache TTL values are appropriate for your data'
      );
    }

    if (metrics.avgResponseTime > 500) {
      recommendations.push(
        'Consider implementing cache compression for large responses'
      );
      recommendations.push(
        'Review database query performance for cache misses'
      );
    }

    const memoryMB = metrics.memoryUsage / 1024 / 1024;
    if (memoryMB > 300) {
      recommendations.push('Consider implementing cache size limits');
      recommendations.push('Review cache cleanup policies');
    }

    return recommendations;
  }

  private async warmupEndpoint(config: CacheWarmupConfig): Promise<void> {
    try {
      // This would make actual HTTP requests to warm up the cache
      // For now, we'll just log the intent
      this.logger.debug(
        `Warming up cache for ${config.method} ${config.endpoint}`
      );
    } catch (error) {
      this.logger.error(`Failed to warmup ${config.endpoint}:`, error);
    }
  }

  private initializeDefaultWarmupConfigs(): void {
    this.warmupConfigs = [
      {
        endpoint: '/api/v1/venues',
        method: 'GET',
        frequency: 'hourly',
        priority: 'high',
      },
      {
        endpoint: '/api/v1/clans',
        method: 'GET',
        frequency: 'hourly',
        priority: 'high',
      },
      {
        endpoint: '/api/v1/territories/map',
        method: 'GET',
        frequency: 'daily',
        priority: 'medium',
      },
      {
        endpoint: '/api/v1/strategic-map/overview',
        method: 'GET',
        frequency: 'daily',
        priority: 'medium',
      },
    ];
  }
}
