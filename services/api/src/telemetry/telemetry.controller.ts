import { AnalyticsSSEEvent } from '@dojopool/types';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';
import { Observable, interval, map, startWith } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TelemetryEventData, TelemetryService } from './telemetry.service';

@ApiTags('Analytics')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Fast, non-blocking endpoint for receiving telemetry events
   * This endpoint is designed to be high-throughput and doesn't block
   * the main request-response cycle
   */
  @Post('event')
  @ApiOperation({
    summary: 'Record telemetry event',
    description:
      'Record a user interaction event for analytics and monitoring. This endpoint is optimized for high throughput and processes events asynchronously.',
  })
  @ApiResponse({
    status: 202,
    description: 'Event accepted for processing',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'accepted' },
      },
    },
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async recordEvent(
    @Body() eventData: TelemetryEventData,
    @Req() req: ExpressRequest
  ): Promise<{ status: string }> {
    // Add request metadata
    const enrichedEventData: TelemetryEventData = {
      ...eventData,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent'),
    };

    // Fire and forget - don't wait for completion
    this.telemetryService.recordEvent(enrichedEventData);

    // Return immediately
    return { status: 'accepted' };
  }

  /**
   * Batch endpoint for recording multiple telemetry events
   * More efficient for bulk operations
   */
  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async recordEvents(
    @Body() events: TelemetryEventData[],
    @Req() req: ExpressRequest
  ): Promise<{ status: string; count: number }> {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    // Enrich all events with request metadata
    const enrichedEvents = events.map((event) => ({
      ...event,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent'),
    }));

    // Fire and forget
    this.telemetryService.recordEvents(enrichedEvents);

    return { status: 'accepted', count: events.length };
  }

  private getClientIp(req: ExpressRequest): string | undefined {
    const forwarded = req.get('x-forwarded-for');
    const realIp = req.get('x-real-ip');
    const clientIp = req.get('x-client-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    if (clientIp) {
      return clientIp;
    }

    return req.ip || req.connection.remoteAddress;
  }
}

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Get comprehensive analytics data for the admin dashboard
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get analytics dashboard data',
    description:
      'Retrieve comprehensive analytics data including user metrics, engagement, and system performance for the admin dashboard.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics data (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics data (ISO format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        dau: { type: 'number', description: 'Daily active users' },
        mau: { type: 'number', description: 'Monthly active users' },
        totalUsers: { type: 'number', description: 'Total registered users' },
        totalEvents: { type: 'number', description: 'Total events recorded' },
        topEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        userEngagement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              activeUsers: { type: 'number' },
              sessions: { type: 'number' },
              avgSessionLength: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin access required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getDashboardData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    return this.telemetryService.getAnalyticsData(start, end);
  }

  /**
   * Get real-time metrics for live dashboard updates
   */
  @Get('realtime')
  @ApiOperation({
    summary: 'Get real-time analytics metrics',
    description:
      'Retrieve current real-time analytics metrics for live dashboard updates. Returns aggregated data for the specified time window.',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Number of hours to look back for metrics',
    example: 24,
  })
  @ApiResponse({
    status: 200,
    description: 'Real-time metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        dau: { type: 'number', description: 'Daily active users' },
        totalEvents: {
          type: 'number',
          description: 'Total events in time window',
        },
        topEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        systemPerformance: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            errorRate: { type: 'number' },
            uptime: { type: 'number' },
          },
        },
        economyMetrics: {
          type: 'object',
          properties: {
            totalTransactions: { type: 'number' },
            totalVolume: { type: 'number' },
            avgTransactionValue: { type: 'number' },
          },
        },
        lastUpdated: {
          type: 'string',
          description: 'ISO timestamp of last update',
        },
      },
    },
  })
  async getRealtimeMetrics(@Query('hours') hours: string = '24') {
    const hoursAgo = parseInt(hours, 10) || 24;
    const start = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const end = new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    // Return only the most recent data points for real-time updates
    return {
      dau: analytics.dau,
      totalEvents: analytics.totalEvents,
      topEvents: analytics.topEvents.slice(0, 5),
      systemPerformance: analytics.systemPerformance,
      economyMetrics: analytics.economyMetrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get user engagement data for charts
   */
  @Get('engagement')
  async getEngagementData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    return {
      userEngagement: analytics.userEngagement,
      dau: analytics.dau,
      mau: analytics.mau,
    };
  }

  /**
   * Get feature usage data
   */
  @Get('features')
  async getFeatureUsage(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    return {
      featureUsage: analytics.featureUsage,
      topEvents: analytics.topEvents,
    };
  }

  /**
   * Get system performance metrics
   */
  @Get('performance')
  async getPerformanceMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    return {
      systemPerformance: analytics.systemPerformance,
      userEngagement: analytics.userEngagement,
    };
  }

  /**
   * Get economy metrics
   */
  @Get('economy')
  async getEconomyMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    return {
      economyMetrics: analytics.economyMetrics,
      totalUsers: analytics.totalUsers,
    };
  }

  /**
   * Get event breakdown by type
   */
  @Get('events')
  async getEventsData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('eventType') eventType?: string
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await this.telemetryService.getAnalyticsData(start, end);

    return {
      totalEvents: analytics.totalEvents,
      topEvents: analytics.topEvents,
      eventBreakdown: eventType
        ? analytics.topEvents.filter((e) => e.eventName === eventType)
        : analytics.topEvents,
    };
  }

  /**
   * Server-Sent Events endpoint for real-time analytics streaming
   * Streams analytics data every 30 seconds for live dashboard updates
   */
  @Sse('stream')
  @ApiOperation({
    summary: 'Stream real-time analytics data',
    description:
      'Establish a Server-Sent Events connection to receive real-time analytics updates. Data is streamed every 30 seconds (configurable) for live dashboard updates.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics data (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics data (ISO format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'interval',
    required: false,
    type: Number,
    description: 'Update interval in seconds',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream established successfully',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['analytics_update', 'error'],
              description: 'Event type',
            },
            data: {
              oneOf: [
                { $ref: '#/components/schemas/AnalyticsData' },
                {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                  },
                },
              ],
            },
            timestamp: { type: 'string', description: 'Event timestamp' },
          },
        },
      },
    },
  })
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Headers', 'Cache-Control')
  async streamAnalyticsData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') updateInterval: string = '30'
  ): Promise<Observable<AnalyticsSSEEvent>> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    const intervalMs = parseInt(updateInterval, 10) * 1000; // Convert to milliseconds

    // Initial data fetch
    const initialData = await this.telemetryService.getAnalyticsData(
      start,
      end
    );

    return interval(intervalMs).pipe(
      startWith(0), // Emit immediately
      map(async () => {
        try {
          const analyticsData = await this.telemetryService.getAnalyticsData(
            start,
            end
          );

          const event: AnalyticsSSEEvent = {
            type: 'analytics_update',
            data: analyticsData,
            timestamp: new Date().toISOString(),
          };

          return {
            data: JSON.stringify(event),
            event: 'analytics',
          };
        } catch (error) {
          const errorEvent: AnalyticsSSEEvent = {
            type: 'error',
            data: {
              message: 'Failed to fetch analytics data',
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };

          return {
            data: JSON.stringify(errorEvent),
            event: 'error',
          };
        }
      })
    );
  }

  /**
   * Server-Sent Events endpoint for real-time metrics streaming
   * Streams only critical real-time metrics every 30 seconds
   */
  @Sse('realtime-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Headers', 'Cache-Control')
  async streamRealtimeMetrics(
    @Query('hours') hours: string = '24',
    @Query('interval') updateInterval: string = '30'
  ): Promise<Observable<AnalyticsSSEEvent>> {
    const hoursAgo = parseInt(hours, 10) || 24;
    const intervalMs = parseInt(updateInterval, 10) * 1000; // Convert to milliseconds

    return interval(intervalMs).pipe(
      startWith(0), // Emit immediately
      map(async () => {
        try {
          const start = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
          const end = new Date();
          const analytics = await this.telemetryService.getAnalyticsData(
            start,
            end
          );

          // Return only real-time critical metrics
          const realtimeData = {
            dau: analytics.dau,
            totalEvents: analytics.totalEvents,
            topEvents: analytics.topEvents.slice(0, 5),
            systemPerformance: analytics.systemPerformance,
            economyMetrics: analytics.economyMetrics,
          };

          const event: AnalyticsSSEEvent = {
            type: 'realtime_update',
            data: realtimeData,
            timestamp: new Date().toISOString(),
          };

          return {
            data: JSON.stringify(event),
            event: 'realtime',
          };
        } catch (error) {
          const errorEvent: AnalyticsSSEEvent = {
            type: 'error',
            data: {
              message: 'Failed to fetch realtime metrics',
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };

          return {
            data: JSON.stringify(errorEvent),
            event: 'error',
          };
        }
      })
    );
  }
}
