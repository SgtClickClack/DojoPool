import { Controller, Get, Post } from '@nestjs/common';
import { DatabasePerformanceService } from './database-performance.service';
import { SlowQueryLoggerService } from './slow-query-logger.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private databasePerformance: DatabasePerformanceService,
    private slowQueryLogger: SlowQueryLoggerService
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
}
