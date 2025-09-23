import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller()
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService
  ) {}

  @Get('health')
  async getHealth() {
    const checks = {
      database: false,
      redis: false,
      timestamp: new Date().toISOString(),
    };

    // Check database connectivity with PostgreSQL-specific query
    try {
      // Use a PostgreSQL-specific query that works with Prisma
      await this.prismaService.$queryRaw`SELECT 1 as health_check`;
      checks.database = true;
    } catch (error) {
      console.warn('Database health check failed:', error);
      // Log additional details for debugging
      console.warn('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.warn('Error details:', error.message);
    }

    // Check Redis connectivity
    try {
      const isConnected = await this.redisService.ping();
      checks.redis = isConnected;
    } catch (error) {
      console.warn('Redis health check failed:', error);
    }

    const allHealthy = checks.database && checks.redis;

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: checks.timestamp,
      service: 'DojoPool API',
      message: allHealthy
        ? 'Backend is running successfully!'
        : 'Backend is running with some services degraded',
      environment: process.env.NODE_ENV || 'development',
      checks,
    };
  }

  @Get('metrics')
  async getMetrics() {
    const memUsage = process.memoryUsage();

    // Get database connection info
    let dbConnections = 0;
    try {
      const result = await this.prismaService.$queryRaw`
        SELECT count(*) as connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      dbConnections = Number((result as any)[0]?.connections || 0);
    } catch (error) {
      console.warn('Failed to get database connection count:', error);
    }

    // Get Redis info
    let redisInfo = {};
    try {
      const status = this.redisService.getConnectionStatus();
      redisInfo = {
        isProduction: status.isProduction,
        isConnected: status.isConnected,
        pubClientConnected: status.pubClientConnected,
        subClientConnected: status.subClientConnected,
      };
    } catch (error) {
      console.warn('Failed to get Redis info:', error);
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
        usage_user: process.cpuUsage().user,
        usage_system: process.cpuUsage().system,
      },
      database: {
        connections: dbConnections,
      },
      redis: redisInfo,
      system: {
        version: process.version,
        platform: process.platform,
        pid: process.pid,
        node_env: process.env.NODE_ENV || 'development',
      },
    };
  }
}
