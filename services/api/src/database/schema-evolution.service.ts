import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePerformanceService, IndexRecommendation } from '../monitoring/database-performance.service';
import { SlowQueryLoggerService, SlowQueryLog } from '../monitoring/slow-query-logger.service';
import { TelemetryService } from '../telemetry/telemetry.service';

export interface SchemaOptimization {
  id: string;
  type: 'INDEX' | 'PARTITION' | 'ARCHIVE' | 'COMPRESSION' | 'REFACTOR';
  table: string;
  description: string;
  sql: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: {
    estimatedPerformanceGain: number; // percentage
    affectedQueries: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  reasoning: string;
  telemetryInsights: string[];
  createdAt: Date;
  implementedAt?: Date;
  status: 'PENDING' | 'IMPLEMENTED' | 'REJECTED';
}

export interface SchemaEvolutionReport {
  summary: {
    totalOptimizations: number;
    highPriority: number;
    implementedOptimizations: number;
    estimatedTotalGain: number;
  };
  optimizations: SchemaOptimization[];
  trends: {
    slowQueryTrend: number[];
    tableGrowthTrend: Record<string, number[]>;
    indexUsageTrend: Record<string, number[]>;
  };
  recommendations: string[];
  nextSteps: string[];
}

@Injectable()
export class SchemaEvolutionService {
  private readonly logger = new Logger(SchemaEvolutionService.name);
  private optimizations: Map<string, SchemaOptimization> = new Map();

  constructor(
    private prisma: PrismaService,
    private databasePerformance: DatabasePerformanceService,
    private slowQueryLogger: SlowQueryLoggerService,
    private telemetry: TelemetryService
  ) {}

  /**
   * Generate comprehensive schema evolution analysis
   */
  async generateEvolutionReport(
    daysToAnalyze: number = 30
  ): Promise<SchemaEvolutionReport> {
    this.logger.log(`Generating schema evolution report for ${daysToAnalyze} days`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToAnalyze);

    // Gather data from all sources
    const [slowQueries, telemetryData, performanceMetrics, indexRecommendations] =
      await Promise.all([
        this.analyzeSlowQueryPatterns(startDate, endDate),
        this.analyzeTelemetryPatterns(startDate, endDate),
        this.analyzePerformanceMetrics(),
        this.databasePerformance.getIndexRecommendations()
      ]);

    // Generate optimization recommendations
    const optimizations = await this.generateOptimizations(
      slowQueries,
      telemetryData,
      performanceMetrics,
      indexRecommendations
    );

    // Calculate trends
    const trends = await this.calculateTrends(daysToAnalyze);

    // Generate report
    const report: SchemaEvolutionReport = {
      summary: {
        totalOptimizations: optimizations.length,
        highPriority: optimizations.filter(o => o.priority === 'HIGH').length,
        implementedOptimizations: optimizations.filter(o => o.status === 'IMPLEMENTED').length,
        estimatedTotalGain: optimizations.reduce((sum, opt) => sum + opt.impact.estimatedPerformanceGain, 0)
      },
      optimizations,
      trends,
      recommendations: this.generateRecommendations(optimizations),
      nextSteps: this.generateNextSteps(optimizations, trends)
    };

    this.logger.log(`Generated ${optimizations.length} optimization recommendations`);
    return report;
  }

  /**
   * Analyze slow query patterns from logs
   */
  private async analyzeSlowQueryPatterns(startDate: Date, endDate: Date) {
    const slowQueries = this.slowQueryLogger.getRecentSlowQueries(1000);

    // Filter by date range
    const filteredQueries = slowQueries.filter(q =>
      q.timestamp >= startDate && q.timestamp <= endDate
    );

    // Group by table and query pattern
    const tableStats = new Map<string, {
      queryCount: number;
      avgDuration: number;
      slowestQuery: SlowQueryLog;
      patterns: Map<string, number>;
    }>();

    for (const query of filteredQueries) {
      const table = this.extractPrimaryTable(query.query);
      if (!table) continue;

      const existing = tableStats.get(table) || {
        queryCount: 0,
        avgDuration: 0,
        slowestQuery: query,
        patterns: new Map()
      };

      existing.queryCount++;
      existing.avgDuration = (existing.avgDuration * (existing.queryCount - 1) + query.duration) / existing.queryCount;

      if (query.duration > existing.slowestQuery.duration) {
        existing.slowestQuery = query;
      }

      // Extract query pattern
      const pattern = this.extractQueryPattern(query.query);
      existing.patterns.set(pattern, (existing.patterns.get(pattern) || 0) + 1);

      tableStats.set(table, existing);
    }

    return { tableStats, totalSlowQueries: filteredQueries.length };
  }

  /**
   * Analyze telemetry patterns for schema insights
   */
  private async analyzeTelemetryPatterns(startDate: Date, endDate: Date) {
    const analytics = await this.telemetry.getAnalyticsData(startDate, endDate);

    // Extract insights from telemetry
    const insights = {
      userGrowth: analytics.totalUsers,
      dailyActiveUsers: analytics.dau,
      featureUsage: analytics.featureUsage,
      systemPerformance: analytics.systemPerformance,
      economyMetrics: analytics.economyMetrics,
      dataPatterns: {
        highReadTables: this.identifyHighReadTables(analytics),
        highWriteTables: this.identifyHighWriteTables(analytics),
        archivalCandidates: this.identifyArchivalCandidates(analytics)
      }
    };

    return insights;
  }

  /**
   * Analyze current performance metrics
   */
  private async analyzePerformanceMetrics() {
    const metrics = await this.databasePerformance.collectMetrics();
    const healthCheck = await this.databasePerformance.performHealthCheck();

    return {
      metrics,
      healthStatus: healthCheck.status,
      issues: healthCheck.issues,
      recommendations: healthCheck.recommendations
    };
  }

  /**
   * Generate optimization recommendations based on analysis
   */
  private async generateOptimizations(
    slowQueryAnalysis: any,
    telemetryInsights: any,
    performanceMetrics: any,
    indexRecommendations: IndexRecommendation[]
  ): Promise<SchemaOptimization[]> {
    const optimizations: SchemaOptimization[] = [];

    // 1. Index optimizations from existing recommendations
    for (const rec of indexRecommendations) {
      const optimization: SchemaOptimization = {
        id: `index_${rec.table}_${rec.column}_${Date.now()}`,
        type: 'INDEX',
        table: rec.table,
        description: `Add index for high-cardinality column ${rec.column}`,
        sql: rec.sql,
        priority: rec.reason.includes('High cardinality') ? 'HIGH' : 'MEDIUM',
        impact: {
          estimatedPerformanceGain: this.estimateIndexImpact(rec),
          affectedQueries: this.estimateAffectedQueries(rec, slowQueryAnalysis),
          riskLevel: 'LOW'
        },
        reasoning: rec.reason,
        telemetryInsights: this.generateTelemetryInsights(rec, telemetryInsights),
        createdAt: new Date(),
        status: 'PENDING'
      };
      optimizations.push(optimization);
    }

    // 2. Partitioning recommendations for large tables
    const largeTables = Object.entries(performanceMetrics.metrics.tableSizes)
      .filter(([, size]) => size > 500_000_000) // > 500MB
      .map(([table]) => table);

    for (const table of largeTables) {
      const optimization: SchemaOptimization = {
        id: `partition_${table}_${Date.now()}`,
        type: 'PARTITION',
        table,
        description: `Implement table partitioning for large table ${table}`,
        sql: this.generatePartitioningSQL(table),
        priority: 'HIGH',
        impact: {
          estimatedPerformanceGain: 60, // Estimated 60% improvement
          affectedQueries: slowQueryAnalysis.tableStats.get(table)?.queryCount || 0,
          riskLevel: 'MEDIUM'
        },
        reasoning: `Table size: ${(performanceMetrics.metrics.tableSizes[table] / 1_000_000_000).toFixed(2)}GB`,
        telemetryInsights: [`High read/write activity on ${table}`, 'Potential for significant performance improvement'],
        createdAt: new Date(),
        status: 'PENDING'
      };
      optimizations.push(optimization);
    }

    // 3. Archival recommendations for old data
    const archivalCandidates = telemetryInsights.dataPatterns.archivalCandidates;
    for (const table of archivalCandidates) {
      const optimization: SchemaOptimization = {
        id: `archive_${table}_${Date.now()}`,
        type: 'ARCHIVE',
        table,
        description: `Archive old data from ${table} to improve performance`,
        sql: this.generateArchivalSQL(table),
        priority: 'MEDIUM',
        impact: {
          estimatedPerformanceGain: 30,
          affectedQueries: 0, // Archival affects future queries
          riskLevel: 'LOW'
        },
        reasoning: 'Old data archival reduces table size and improves query performance',
        telemetryInsights: ['Historical data access patterns indicate archival opportunity'],
        createdAt: new Date(),
        status: 'PENDING'
      };
      optimizations.push(optimization);
    }

    // 4. Compression recommendations for read-heavy tables
    const readHeavyTables = telemetryInsights.dataPatterns.highReadTables;
    for (const table of readHeavyTables) {
      const optimization: SchemaOptimization = {
        id: `compress_${table}_${Date.now()}`,
        type: 'COMPRESSION',
        table,
        description: `Enable compression for read-heavy table ${table}`,
        sql: this.generateCompressionSQL(table),
        priority: 'MEDIUM',
        impact: {
          estimatedPerformanceGain: 20,
          affectedQueries: 0,
          riskLevel: 'LOW'
        },
        reasoning: 'Compression reduces I/O and improves read performance',
        telemetryInsights: ['High read activity with potential for compression benefits'],
        createdAt: new Date(),
        status: 'PENDING'
      };
      optimizations.push(optimization);
    }

    return optimizations.sort((a, b) => {
      // Sort by priority and impact
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact.estimatedPerformanceGain - a.impact.estimatedPerformanceGain;
    });
  }

  /**
   * Calculate performance and usage trends
   */
  private async calculateTrends(daysToAnalyze: number) {
    const trends = {
      slowQueryTrend: [] as number[],
      tableGrowthTrend: {} as Record<string, number[]>,
      indexUsageTrend: {} as Record<string, number[]>
    };

    // Calculate daily slow query trends
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // This would need historical data storage to implement fully
      // For now, we'll use current metrics as placeholder
      trends.slowQueryTrend.push(this.slowQueryLogger.getMetrics().slowQueries);
    }

    return trends;
  }

  /**
   * Helper methods for analysis
   */
  private extractPrimaryTable(query: string): string | null {
    const patterns = [
      /FROM\s+(\w+)/i,
      /INSERT\s+INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
    return null;
  }

  private extractQueryPattern(query: string): string {
    // Simplify query to pattern
    return query
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .trim();
  }

  private identifyHighReadTables(analytics: any): string[] {
    // Based on feature usage, identify tables likely to have high read activity
    const highReadFeatures = ['social_feed_view', 'tournament_join', 'match_start'];
    const highReadTables = ['Content', 'Tournament', 'Match'];

    return highReadTables;
  }

  private identifyHighWriteTables(analytics: any): string[] {
    const highWriteFeatures = ['territory_claim', 'match_start', 'challenge_sent'];
    const highWriteTables = ['Territory', 'Match', 'Challenge'];

    return highWriteTables;
  }

  private identifyArchivalCandidates(analytics: any): string[] {
    // Tables with old data that could be archived
    return ['Match', 'Content', 'TelemetryEvent'];
  }

  private estimateIndexImpact(rec: IndexRecommendation): number {
    if (rec.reason.includes('High cardinality')) return 70;
    if (rec.reason.includes('Unused index')) return 5;
    return 40;
  }

  private estimateAffectedQueries(rec: IndexRecommendation, slowQueryAnalysis: any): number {
    const tableStats = slowQueryAnalysis.tableStats.get(rec.table);
    return tableStats?.queryCount || 0;
  }

  private generateTelemetryInsights(rec: IndexRecommendation, telemetry: any): string[] {
    const insights = [];
    if (telemetry.featureUsage.some((f: any) => f.feature.toLowerCase().includes(rec.table.toLowerCase()))) {
      insights.push(`${rec.table} has high feature usage activity`);
    }
    return insights;
  }

  private generatePartitioningSQL(table: string): string {
    // Generate partitioning SQL based on table characteristics
    const partitionKey = this.getPartitionKey(table);
    return `
-- Partitioning SQL for ${table}
-- This is a template - adjust based on specific table structure
ALTER TABLE "${table}" DETACH PARTITION IF EXISTS "${table}_default";

-- Create partitioned table
CREATE TABLE IF NOT EXISTS "${table}_partitioned" (
  -- Copy table structure here
) PARTITION BY HASH (${partitionKey});

-- Create partitions
-- Add partition creation statements here
`;
  }

  private generateArchivalSQL(table: string): string {
    return `
-- Archival SQL for ${table}
-- Move old data to archive table
CREATE TABLE IF NOT EXISTS "${table}_archive" AS
SELECT * FROM "${table}"
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Remove archived data from main table
DELETE FROM "${table}"
WHERE "createdAt" < NOW() - INTERVAL '90 days';
`;
  }

  private generateCompressionSQL(table: string): string {
    return `
-- Compression SQL for ${table}
ALTER TABLE "${table}" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_limit = 1000
);

-- Enable compression on specific columns if needed
-- ALTER TABLE "${table}" ALTER COLUMN "largeColumn" SET COMPRESSION lz4;
`;
  }

  private getPartitionKey(table: string): string {
    const partitionKeys = {
      'Match': 'playerAId',
      'Territory': 'venueId',
      'Content': 'userId',
      'TelemetryEvent': 'userId'
    };
    return partitionKeys[table] || 'id';
  }

  private generateRecommendations(optimizations: SchemaOptimization[]): string[] {
    const recommendations = [];

    const highPriorityCount = optimizations.filter(o => o.priority === 'HIGH').length;
    if (highPriorityCount > 0) {
      recommendations.push(`Implement ${highPriorityCount} high-priority optimizations immediately`);
    }

    const indexOpts = optimizations.filter(o => o.type === 'INDEX').length;
    if (indexOpts > 0) {
      recommendations.push(`Add ${indexOpts} strategic indexes to improve query performance`);
    }

    const partitionOpts = optimizations.filter(o => o.type === 'PARTITION').length;
    if (partitionOpts > 0) {
      recommendations.push(`Consider partitioning ${partitionOpts} large tables`);
    }

    return recommendations;
  }

  private generateNextSteps(optimizations: SchemaOptimization[], trends: any): string[] {
    const nextSteps = [];

    nextSteps.push('1. Review high-priority optimizations in staging environment');
    nextSteps.push('2. Create migration scripts for approved optimizations');
    nextSteps.push('3. Set up performance monitoring for before/after metrics');
    nextSteps.push('4. Schedule maintenance window for implementation');
    nextSteps.push('5. Monitor performance impact post-implementation');

    return nextSteps;
  }

  /**
   * Mark optimization as implemented
   */
  async markOptimizationImplemented(optimizationId: string): Promise<void> {
    const optimization = this.optimizations.get(optimizationId);
    if (optimization) {
      optimization.status = 'IMPLEMENTED';
      optimization.implementedAt = new Date();
      this.logger.log(`Marked optimization ${optimizationId} as implemented`);
    }
  }

  /**
   * Get all optimizations
   */
  getOptimizations(): SchemaOptimization[] {
    return Array.from(this.optimizations.values());
  }

  /**
   * Export optimization report as JSON
   */
  async exportReport(daysToAnalyze: number = 30): Promise<string> {
    const report = await this.generateEvolutionReport(daysToAnalyze);
    return JSON.stringify(report, null, 2);
  }
}

