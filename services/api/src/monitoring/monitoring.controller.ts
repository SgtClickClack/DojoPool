import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { DatabasePerformanceService } from './database-performance.service';
import { SlowQueryLoggerService } from './slow-query-logger.service';
import { SchemaEvolutionService } from '../database/schema-evolution.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private databasePerformance: DatabasePerformanceService,
    private slowQueryLogger: SlowQueryLoggerService,
    private schemaEvolution: SchemaEvolutionService
  ) {}

  @Get('health')
  async getHealthCheck() {
    return this.databasePerformance.performHealthCheck();
  }

  @Get('metrics')
  async getMetrics() {
    const dbMetrics = await this.databasePerformance.collectMetrics();
    const queryMetrics = this.slowQueryLogger.getMetrics();

    return {
      database: dbMetrics,
      queries: queryMetrics,
      timestamp: new Date(),
    };
  }

  @Get('slow-queries')
  async getSlowQueries() {
    return {
      recent: this.slowQueryLogger.getRecentSlowQueries(20),
      metrics: this.slowQueryLogger.getMetrics(),
    };
  }

  @Get('index-recommendations')
  async getIndexRecommendations() {
    return this.databasePerformance.getIndexRecommendations();
  }

  @Get('query-optimization')
  async getQueryOptimization() {
    return this.databasePerformance.getQueryOptimizationSuggestions();
  }

  @Post('reset-metrics')
  async resetMetrics() {
    await this.databasePerformance.resetMetrics();
    return { message: 'Metrics reset successfully' };
  }

  @Get('schema-evolution')
  async getSchemaEvolutionReport(@Query('days') days = '30') {
    const daysToAnalyze = parseInt(days, 10);
    return this.schemaEvolution.generateEvolutionReport(daysToAnalyze);
  }

  @Get('schema-optimizations')
  async getSchemaOptimizations() {
    return this.schemaEvolution.getOptimizations();
  }

  @Post('schema-optimization/:id/implement')
  async markOptimizationImplemented(@Param('id') optimizationId: string) {
    await this.schemaEvolution.markOptimizationImplemented(optimizationId);
    return { message: 'Optimization marked as implemented' };
  }

  @Get('schema-evolution/export')
  async exportSchemaEvolutionReport(@Query('days') days = '30') {
    const daysToAnalyze = parseInt(days, 10);
    const reportJson = await this.schemaEvolution.exportReport(daysToAnalyze);

    // Return as downloadable JSON
    return {
      filename: `schema-evolution-report-${new Date().toISOString().split('T')[0]}.json`,
      content: reportJson,
      contentType: 'application/json'
    };
  }
}
