import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ErrorLoggerService, ErrorMetrics } from './error-logger.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly errorLogger: ErrorLoggerService) {}

  @Get('health')
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }

  @Get('errors/metrics')
  getErrorMetrics(): ErrorMetrics {
    return this.errorLogger.getMetrics();
  }

  @Get('errors/recent')
  getRecentErrors(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.errorLogger.getRecentErrors(limitNum);
  }

  @Get('errors/level/:level')
  getErrorsByLevel(@Param('level') level: string) {
    return this.errorLogger.getErrorsByLevel(level);
  }

  @Get('errors/path/:path')
  getErrorsByPath(@Param('path') path: string) {
    return this.errorLogger.getErrorsByPath(path);
  }

  @Get('errors/summary')
  getErrorSummary(@Query('hours') hours?: string) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.errorLogger.getErrorSummary(hoursNum);
  }

  @Post('errors/reset')
  resetErrorMetrics() {
    this.errorLogger.resetMetrics();
    return {
      success: true,
      message: 'Error metrics have been reset',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('performance')
  getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('logs/errors')
  getErrorLogs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.errorLogger.getRecentErrors(limitNum);
  }

  @Get('system/info')
  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
      cwd: process.cwd(),
      versions: process.versions,
    };
  }
}
