import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SlowQueryLog {
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
  stackTrace?: string;
}

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  slowestQuery: SlowQueryLog | null;
  queriesByTable: Record<string, number>;
  slowQueriesByTable: Record<string, number>;
}

@Injectable()
export class SlowQueryLoggerService implements OnModuleInit {
  private readonly logger = new Logger(SlowQueryLoggerService.name);
  private readonly slowQueryThreshold = 1000; // 1 second in milliseconds
  private queryMetrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageDuration: 0,
    slowestQuery: null,
    queriesByTable: {},
    slowQueriesByTable: {},
  };
  private recentSlowQueries: SlowQueryLog[] = [];
  private readonly maxRecentQueries = 100;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Enable Prisma query logging
    this.setupPrismaLogging();

    // Log metrics periodically
    setInterval(
      () => {
        this.logMetrics();
      },
      5 * 60 * 1000
    ); // Every 5 minutes

    this.logger.log(
      `Slow query logger initialized with threshold: ${this.slowQueryThreshold}ms`
    );
  }

  private setupPrismaLogging() {
    // Extend Prisma client to log queries
    const originalExecuteRaw = this.prisma.$executeRaw;
    const originalExecuteRawUnsafe = this.prisma.$executeRawUnsafe;
    const originalQueryRaw = this.prisma.$queryRaw;
    const originalQueryRawUnsafe = this.prisma.$queryRawUnsafe;

    // Wrap executeRaw
    this.prisma.$executeRaw = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalExecuteRaw.apply(this.prisma, args);
        this.logQuery(
          'EXECUTE_RAW',
          args[0],
          Date.now() - startTime,
          args.slice(1)
        );
        return result;
      } catch (error) {
        this.logQuery(
          'EXECUTE_RAW',
          args[0],
          Date.now() - startTime,
          args.slice(1),
          error
        );
        throw error;
      }
    };

    // Wrap executeRawUnsafe
    this.prisma.$executeRawUnsafe = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalExecuteRawUnsafe.apply(this.prisma, args);
        this.logQuery(
          'EXECUTE_RAW_UNSAFE',
          args[0],
          Date.now() - startTime,
          args.slice(1)
        );
        return result;
      } catch (error) {
        this.logQuery(
          'EXECUTE_RAW_UNSAFE',
          args[0],
          Date.now() - startTime,
          args.slice(1),
          error
        );
        throw error;
      }
    };

    // Wrap queryRaw
    this.prisma.$queryRaw = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalQueryRaw.apply(this.prisma, args);
        this.logQuery(
          'QUERY_RAW',
          args[0],
          Date.now() - startTime,
          args.slice(1)
        );
        return result;
      } catch (error) {
        this.logQuery(
          'QUERY_RAW',
          args[0],
          Date.now() - startTime,
          args.slice(1),
          error
        );
        throw error;
      }
    };

    // Wrap queryRawUnsafe
    this.prisma.$queryRawUnsafe = async (...args: any[]) => {
      const startTime = Date.now();
      try {
        const result = await originalQueryRawUnsafe.apply(this.prisma, args);
        this.logQuery(
          'QUERY_RAW_UNSAFE',
          args[0],
          Date.now() - startTime,
          args.slice(1)
        );
        return result;
      } catch (error) {
        this.logQuery(
          'QUERY_RAW_UNSAFE',
          args[0],
          Date.now() - startTime,
          args.slice(1),
          error
        );
        throw error;
      }
    };

    this.logger.log('Prisma query logging enabled');
  }

  private logQuery(
    type: string,
    query: string | any,
    duration: number,
    parameters: any[] = [],
    error?: any
  ) {
    const queryString =
      typeof query === 'string' ? query : JSON.stringify(query);
    const table = this.extractTableName(queryString);

    // Update metrics
    this.queryMetrics.totalQueries++;
    this.queryMetrics.queriesByTable[table] =
      (this.queryMetrics.queriesByTable[table] || 0) + 1;

    // Update average duration
    const totalDuration =
      this.queryMetrics.averageDuration * (this.queryMetrics.totalQueries - 1) +
      duration;
    this.queryMetrics.averageDuration =
      totalDuration / this.queryMetrics.totalQueries;

    // Check for slow query
    if (duration > this.slowQueryThreshold) {
      this.queryMetrics.slowQueries++;
      this.queryMetrics.slowQueriesByTable[table] =
        (this.queryMetrics.slowQueriesByTable[table] || 0) + 1;

      // Update slowest query
      if (
        !this.queryMetrics.slowestQuery ||
        duration > this.queryMetrics.slowestQuery.duration
      ) {
        this.queryMetrics.slowestQuery = {
          query: queryString,
          duration,
          timestamp: new Date(),
          parameters,
        };
      }

      // Log slow query
      const slowQuery: SlowQueryLog = {
        query: queryString,
        duration,
        timestamp: new Date(),
        parameters,
      };

      this.recentSlowQueries.unshift(slowQuery);
      if (this.recentSlowQueries.length > this.maxRecentQueries) {
        this.recentSlowQueries.pop();
      }

      this.logger.warn(
        `SLOW QUERY (${duration}ms) [${table}]: ${queryString.substring(0, 200)}${queryString.length > 200 ? '...' : ''}`
      );

      if (error) {
        this.logger.error(`Query failed:`, error);
      }
    }
  }

  private extractTableName(query: string): string {
    // Extract table name from SQL query
    const patterns = [
      /FROM\s+(\w+)/i,
      /INSERT\s+INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i,
      /SELECT.*FROM\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    return 'unknown';
  }

  private logMetrics() {
    const metrics = this.getMetrics();

    this.logger.log(`Query Performance Metrics:`);
    this.logger.log(`- Total Queries: ${metrics.totalQueries}`);
    this.logger.log(
      `- Slow Queries: ${metrics.slowQueries} (${((metrics.slowQueries / metrics.totalQueries) * 100).toFixed(2)}%)`
    );
    this.logger.log(
      `- Average Duration: ${metrics.averageDuration.toFixed(2)}ms`
    );
    this.logger.log(
      `- Slowest Query: ${metrics.slowestQuery?.duration || 0}ms`
    );

    // Log top slow query tables
    const topSlowTables = Object.entries(metrics.slowQueriesByTable)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (topSlowTables.length > 0) {
      this.logger.log(`Top tables with slow queries:`);
      topSlowTables.forEach(([table, count]) => {
        this.logger.log(`  - ${table}: ${count} slow queries`);
      });
    }
  }

  // Public API methods
  getMetrics(): QueryMetrics {
    return { ...this.queryMetrics };
  }

  getRecentSlowQueries(limit: number = 10): SlowQueryLog[] {
    return this.recentSlowQueries.slice(0, limit);
  }

  resetMetrics() {
    this.queryMetrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
      slowestQuery: null,
      queriesByTable: {},
      slowQueriesByTable: {},
    };
    this.recentSlowQueries = [];
    this.logger.log('Query metrics reset');
  }

  setSlowQueryThreshold(threshold: number) {
    this.slowQueryThreshold = threshold;
    this.logger.log(`Slow query threshold updated to: ${threshold}ms`);
  }

  getSlowQueryThreshold(): number {
    return this.slowQueryThreshold;
  }
}
