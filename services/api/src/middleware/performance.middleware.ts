import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { catchError, tap } from 'rxjs/operators';
import { PerformanceMonitoringService } from '../monitoring/performance-monitoring.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, url, ip } = req;

    // Add performance tracking to response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Record API performance metric
      this.performanceMonitoring.recordAPIMetric(
        url,
        method,
        duration,
        statusCode
      );

      // Log slow requests
      if (duration > 1000) {
        this.logger.warn(
          `Slow request: ${method} ${url} took ${duration}ms (${statusCode})`
        );
      }

      // Log errors
      if (statusCode >= 400) {
        this.logger.error(
          `Error request: ${method} ${url} returned ${statusCode} in ${duration}ms`
        );
      }
    });

    // Add performance headers
    res.setHeader('X-Response-Time', '0ms');
    res.setHeader('X-Request-ID', this.generateRequestId());

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Database performance interceptor
@Injectable()
export class DatabasePerformanceInterceptor {
  private readonly logger = new Logger(DatabasePerformanceInterceptor.name);

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService
  ) {}

  intercept(context: any, next: any): any {
    const startTime = Date.now();
    const { sql, table } = context;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // Record database performance metric
        this.performanceMonitoring.recordDatabaseMetric(
          'query',
          duration,
          table
        );

        // Log slow queries
        if (duration > 500) {
          this.logger.warn(`Slow query: ${sql} took ${duration}ms`);
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.performanceMonitoring.recordDatabaseMetric(
          'error',
          duration,
          table
        );

        this.logger.error(
          `Database error: ${sql} failed after ${duration}ms`,
          error
        );

        throw error;
      })
    );
  }
}

// Cache performance interceptor
@Injectable()
export class CachePerformanceInterceptor {
  private readonly logger = new Logger(CachePerformanceInterceptor.name);

  constructor(
    private readonly performanceMonitoring: PerformanceMonitoringService
  ) {}

  intercept(context: any, next: any): any {
    const startTime = Date.now();
    const { key, operation } = context;

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;

        // Record cache performance metric
        this.performanceMonitoring.recordCacheMetric(operation, duration, key);

        // Log slow cache operations
        if (duration > 100) {
          this.logger.warn(
            `Slow cache operation: ${operation} ${key} took ${duration}ms`
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.performanceMonitoring.recordCacheMetric('error', duration, key);

        this.logger.error(
          `Cache error: ${operation} ${key} failed after ${duration}ms`,
          error
        );

        throw error;
      })
    );
  }
}

// Memory usage monitoring
@Injectable()
export class MemoryMonitoringService {
  private readonly logger = new Logger(MemoryMonitoringService.name);
  private readonly performanceMonitoring: PerformanceMonitoringService;

  constructor(performanceMonitoring: PerformanceMonitoringService) {
    this.performanceMonitoring = performanceMonitoring;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const usagePercentage = (heapUsedMB / heapTotalMB) * 100;

      // Record memory metrics
      this.performanceMonitoring.recordMetric(
        'heap_usage_mb',
        heapUsedMB,
        'MB',
        { type: 'memory' }
      );

      this.performanceMonitoring.recordMetric(
        'heap_usage_percentage',
        usagePercentage,
        '%',
        { type: 'memory' }
      );

      // Alert on high memory usage
      if (usagePercentage > 90) {
        this.logger.error(
          `Critical memory usage: ${usagePercentage.toFixed(1)}% (${heapUsedMB.toFixed(1)}MB/${heapTotalMB.toFixed(1)}MB)`
        );
      } else if (usagePercentage > 80) {
        this.logger.warn(
          `High memory usage: ${usagePercentage.toFixed(1)}% (${heapUsedMB.toFixed(1)}MB/${heapTotalMB.toFixed(1)}MB)`
        );
      }

      // Suggest garbage collection if memory usage is high
      if (usagePercentage > 85 && global.gc) {
        global.gc();
        this.logger.log('Forced garbage collection due to high memory usage');
      }
    }, 30000); // Check every 30 seconds
  }
}
