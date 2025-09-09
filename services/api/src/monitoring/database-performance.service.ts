import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlowQueryLoggerService } from './slow-query-logger.service';

export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  connectionPoolSize: number;
  queryLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  tableSizes: Record<string, number>;
  indexUsage: Record<string, number>;
  cacheHitRatio: number;
  deadlockCount: number;
  slowQueriesCount: number;
  timestamp: Date;
}

export interface IndexRecommendation {
  table: string;
  column: string;
  reason: string;
  potentialImprovement: string;
  sql: string;
}

export interface DatabaseHealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  metrics: DatabaseMetrics;
}

@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);
  private metrics: DatabaseMetrics | null = null;
  private lastHealthCheck: Date | null = null;

  constructor(
    private prisma: PrismaService,
    private slowQueryLogger: SlowQueryLoggerService
  ) {}

  async collectMetrics(): Promise<DatabaseMetrics> {
    try {
      const metrics: DatabaseMetrics = {
        connectionCount: 0,
        activeConnections: 0,
        connectionPoolSize: 0,
        queryLatency: { p50: 0, p95: 0, p99: 0 },
        tableSizes: {},
        indexUsage: {},
        cacheHitRatio: 0,
        deadlockCount: 0,
        slowQueriesCount: 0,
        timestamp: new Date(),
      };

      // Collect connection metrics
      await this.collectConnectionMetrics(metrics);

      // Collect table sizes
      await this.collectTableSizes(metrics);

      // Collect index usage
      await this.collectIndexUsage(metrics);

      // Get slow query metrics
      const slowQueryMetrics = this.slowQueryLogger.getMetrics();
      metrics.slowQueriesCount = slowQueryMetrics.slowQueries;

      this.metrics = metrics;
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect database metrics:', error);
      throw error;
    }
  }

  private async collectConnectionMetrics(metrics: DatabaseMetrics) {
    try {
      // Get connection statistics from PostgreSQL
      const connectionStats = await this.prisma.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      if (connectionStats.length > 0) {
        metrics.connectionCount = Number(connectionStats[0].count);
      }

      // Get active connections
      const activeConnections = await this.prisma.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        AND state = 'active'
      `;

      if (activeConnections.length > 0) {
        metrics.activeConnections = Number(activeConnections[0].count);
      }

      // Get connection pool size (this is application-specific)
      metrics.connectionPoolSize = 10; // Default Prisma pool size
    } catch (error) {
      this.logger.warn('Failed to collect connection metrics:', error);
    }
  }

  private async collectTableSizes(metrics: DatabaseMetrics) {
    try {
      const tableSizes = await this.prisma.$queryRaw<
        Array<{ tablename: string; size_bytes: bigint }>
      >`
        SELECT
          schemaname || '.' || tablename as tablename,
          pg_total_relation_size(schemaname || '.' || tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
        LIMIT 20
      `;

      for (const row of tableSizes) {
        metrics.tableSizes[row.tablename] = Number(row.size_bytes);
      }
    } catch (error) {
      this.logger.warn('Failed to collect table sizes:', error);
    }
  }

  private async collectIndexUsage(metrics: DatabaseMetrics) {
    try {
      const indexUsage = await this.prisma.$queryRaw<
        Array<{ tablename: string; indexname: string; idx_scan: bigint }>
      >`
        SELECT
          schemaname || '.' || tablename as tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20
      `;

      for (const row of indexUsage) {
        metrics.indexUsage[row.indexname] = Number(row.idx_scan);
      }
    } catch (error) {
      this.logger.warn('Failed to collect index usage:', error);
    }
  }

  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const metrics = await this.collectMetrics();
      this.lastHealthCheck = new Date();

      // Check connection health
      if (metrics.connectionCount > 50) {
        issues.push(`High connection count: ${metrics.connectionCount}`);
        recommendations.push(
          'Consider increasing connection pool size or optimizing queries'
        );
      }

      // Check for slow queries
      if (metrics.slowQueriesCount > 10) {
        issues.push(`High slow query count: ${metrics.slowQueriesCount}`);
        recommendations.push('Review and optimize slow queries');
      }

      // Check table sizes
      const largeTables = Object.entries(metrics.tableSizes)
        .filter(([, size]) => size > 1_000_000_000) // > 1GB
        .map(([table]) => table);

      if (largeTables.length > 0) {
        issues.push(`Large tables detected: ${largeTables.join(', ')}`);
        recommendations.push(
          'Consider table partitioning or archiving old data'
        );
      }

      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 2) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      return {
        status,
        issues,
        recommendations,
        metrics,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'critical',
        issues: ['Failed to perform health check'],
        recommendations: ['Check database connectivity and logs'],
        metrics: this.metrics || {
          connectionCount: 0,
          activeConnections: 0,
          connectionPoolSize: 0,
          queryLatency: { p50: 0, p95: 0, p99: 0 },
          tableSizes: {},
          indexUsage: {},
          cacheHitRatio: 0,
          deadlockCount: 0,
          slowQueriesCount: 0,
          timestamp: new Date(),
        },
      };
    }
  }

  async getIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    try {
      // Find tables with frequent queries but missing indexes
      const queryPatterns = await this.prisma.$queryRaw<
        Array<{ table: string; column: string; query_count: bigint }>
      >`
        SELECT
          schemaname || '.' || tablename as table,
          attname as column,
          n_distinct as distinct_values
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 1000
        AND attname NOT IN (
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = (schemaname || '.' || tablename)::regclass
        )
        ORDER BY n_distinct DESC
        LIMIT 10
      `;

      for (const pattern of queryPatterns) {
        recommendations.push({
          table: pattern.table,
          column: pattern.column,
          reason: 'High cardinality column without index',
          potentialImprovement: 'Faster queries on this column',
          sql: `CREATE INDEX idx_${pattern.table.replace('.', '_')}_${pattern.column} ON ${pattern.table}(${pattern.column});`,
        });
      }

      // Find unused indexes
      const unusedIndexes = await this.prisma.$queryRaw<
        Array<{ indexname: string; tablename: string }>
      >`
        SELECT
          indexname,
          tablename
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        AND schemaname = 'public'
        LIMIT 5
      `;

      for (const index of unusedIndexes) {
        recommendations.push({
          table: index.tablename,
          column: index.indexname,
          reason: 'Unused index detected',
          potentialImprovement: 'Reduce storage and maintenance overhead',
          sql: `DROP INDEX ${index.indexname};`,
        });
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to generate index recommendations:', error);
      return [];
    }
  }

  async getQueryOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const slowQueries = this.slowQueryLogger.getRecentSlowQueries(5);

    for (const query of slowQueries) {
      const table = this.extractTableFromQuery(query.query);

      if (table && query.duration > 5000) {
        // Very slow queries
        suggestions.push(
          `Consider optimizing query on ${table}: ${query.query.substring(0, 100)}...`
        );
      }
    }

    return suggestions;
  }

  private extractTableFromQuery(query: string): string | null {
    const patterns = [
      /FROM\s+(\w+)/i,
      /INSERT\s+INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  getLastHealthCheck(): Date | null {
    return this.lastHealthCheck;
  }

  getCurrentMetrics(): DatabaseMetrics | null {
    return this.metrics;
  }

  async resetMetrics() {
    this.metrics = null;
    await this.slowQueryLogger.resetMetrics();
    this.logger.log('Database metrics reset');
  }
}
