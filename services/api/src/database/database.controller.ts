import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ConnectionRouterService } from './connection-router.service';
import { DatabaseHealthMonitorService } from './health-monitor.service';
import { RegionalFailoverService } from './regional-failover.service';

@Controller('database')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatabaseController {
  constructor(
    private regionalFailover: RegionalFailoverService,
    private connectionRouter: ConnectionRouterService,
    private healthMonitor: DatabaseHealthMonitorService
  ) {}

  /**
   * Get overall database system status
   */
  @Get('status')
  @Roles('admin', 'moderator')
  getDatabaseStatus() {
    return {
      regionalStatus: this.regionalFailover.getRegionalStatus(),
      connectionStats: this.connectionRouter.getQueryStats(),
      systemHealth: this.healthMonitor.getSystemHealth(),
      timestamp: new Date(),
    };
  }

  /**
   * Get detailed health status
   */
  @Get('health')
  @Roles('admin', 'moderator')
  getHealthStatus() {
    return {
      systemHealth: this.healthMonitor.getSystemHealth(),
      activeAlerts: this.healthMonitor.getActiveAlerts(),
      healthStatus: this.regionalFailover.getHealthStatus(),
    };
  }

  /**
   * Get active health alerts
   */
  @Get('alerts')
  @Roles('admin', 'moderator')
  getActiveAlerts(@Query('limit') limit = 20) {
    return {
      active: this.healthMonitor.getActiveAlerts(),
      recent: this.healthMonitor.getAlertHistory(parseInt(limit)),
    };
  }

  /**
   * Get performance metrics
   */
  @Get('metrics')
  @Roles('admin', 'moderator')
  getMetrics(
    @Query('endpoint') endpointId?: string,
    @Query('limit') limit = 50
  ) {
    return this.healthMonitor.getMetrics(endpointId, parseInt(limit));
  }

  /**
   * Get failover history
   */
  @Get('failover-history')
  @Roles('admin', 'moderator')
  getFailoverHistory(@Query('limit') limit = 10) {
    return this.regionalFailover.getFailoverHistory(parseInt(limit));
  }

  /**
   * Manually trigger failover
   */
  @Post('failover/:region')
  @Roles('admin')
  async manualFailover(@Param('region') region: string) {
    try {
      await this.regionalFailover.manualFailover(region);
      await this.connectionRouter.handleRegionFailover(region);

      return {
        success: true,
        message: `Failover initiated to region: ${region}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failover failed: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Force reconnect to specific region
   */
  @Post('reconnect/:region')
  @Roles('admin')
  async forceReconnect(@Param('region') region: string) {
    try {
      await this.regionalFailover.forceReconnect(region);

      return {
        success: true,
        message: `Reconnected to region: ${region}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Reconnection failed: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Force health check
   */
  @Post('health-check')
  @Roles('admin')
  async forceHealthCheck() {
    await this.healthMonitor.forceHealthCheck();

    return {
      success: true,
      message: 'Health check completed',
      timestamp: new Date(),
    };
  }

  /**
   * Get connection pool status
   */
  @Get('connections')
  @Roles('admin', 'moderator')
  getConnectionStatus() {
    return this.connectionRouter.getConnectionPoolStatus();
  }

  /**
   * Refresh connection pools
   */
  @Post('connections/refresh')
  @Roles('admin')
  async refreshConnections() {
    await this.connectionRouter.refreshConnectionPools();

    return {
      success: true,
      message: 'Connection pools refreshed',
      timestamp: new Date(),
    };
  }

  /**
   * Get regional configuration
   */
  @Get('regions')
  @Roles('admin')
  getRegionalConfig() {
    return this.regionalFailover.getRegionalStatus();
  }

  /**
   * Analyze a database query
   */
  @Post('analyze-query')
  @Roles('admin', 'moderator')
  analyzeQuery(@Body() body: { query: string }) {
    const analysis = this.connectionRouter.analyzeQuery(body.query);

    return {
      query: body.query,
      analysis,
      recommendation: this.getQueryRecommendation(analysis),
    };
  }

  /**
   * Get query recommendation based on analysis
   */
  private getQueryRecommendation(analysis: any): string {
    if (analysis.isWrite) {
      return 'Route to primary database for write operations';
    }

    if (analysis.isRead) {
      if (analysis.estimatedComplexity === 'complex') {
        return 'Consider query optimization or routing to primary for complex reads';
      }
      return 'Route to nearest healthy replica for optimal performance';
    }

    return 'Query type undetermined - manual review recommended';
  }

  /**
   * Get system performance summary
   */
  @Get('performance')
  @Roles('admin', 'moderator')
  getPerformanceSummary() {
    const systemHealth = this.healthMonitor.getSystemHealth();
    const connectionStats = this.connectionRouter.getQueryStats();
    const activeAlerts = this.healthMonitor.getActiveAlerts();

    return {
      summary: {
        overallHealth: systemHealth.overall,
        uptime: Math.floor(systemHealth.uptime / 3600), // hours
        activeAlerts: activeAlerts.length,
        healthyReplicas: connectionStats.healthyReplicas,
        totalRegions: connectionStats.availableRegions.length,
        avgResponseTime: Math.round(systemHealth.avgResponseTime),
      },
      alerts: activeAlerts.slice(0, 5), // Top 5 alerts
      regions: connectionStats.regionalBreakdown,
      timestamp: new Date(),
    };
  }

  /**
   * Export system status report
   */
  @Get('export')
  @Roles('admin')
  exportSystemReport() {
    const status = this.getDatabaseStatus();
    const health = this.getHealthStatus();
    const performance = this.getPerformanceSummary();

    const report = {
      generatedAt: new Date(),
      version: '1.0.0',
      system: 'DojoPool Regional Database',
      status,
      health,
      performance,
      metadata: {
        regions: status.regionalStatus.regions.length,
        endpoints: status.regionalStatus.regions.reduce(
          (sum, region) => sum + region.replicas.length + 1,
          0
        ),
        monitoring: 'active',
        failover: 'enabled',
      },
    };

    return {
      filename: `dojopool-db-report-${new Date().toISOString().split('T')[0]}.json`,
      content: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    };
  }
}
