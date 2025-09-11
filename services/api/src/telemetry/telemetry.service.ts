import { AnalyticsData } from '@dojopool/types';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TelemetryEventData {
  eventName: string;
  userId?: string;
  sessionId?: string;
  data?: Record<string, any>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Records a telemetry event asynchronously
   * This method is optimized for speed and doesn't block the main request-response cycle
   */
  async recordEvent(eventData: TelemetryEventData): Promise<void> {
    try {
      // Fire and forget - process asynchronously
      setImmediate(async () => {
        try {
          await this.prisma.telemetryEvent.create({
            data: {
              eventType: eventData.eventName,
              eventName: eventData.eventName,
              userId: eventData.userId || '',
              sessionId: eventData.sessionId,
              data: eventData.data ? JSON.stringify(eventData.data) : null,
              timestamp: eventData.timestamp || new Date(),
              ipAddress: eventData.ipAddress,
              userAgent: eventData.userAgent,
            },
          });

          this.logger.debug(`Telemetry event recorded: ${eventData.eventName}`);
        } catch (error) {
          this.logger.error(
            `Failed to record telemetry event: ${eventData.eventName}`,
            error
          );
        }
      });
    } catch (error) {
      this.logger.error('Failed to initiate telemetry event recording', error);
    }
  }

  /**
   * Batch records multiple telemetry events
   * More efficient for bulk operations
   */
  async recordEvents(events: TelemetryEventData[]): Promise<void> {
    try {
      setImmediate(async () => {
        try {
          const data = events.map((event) => ({
            eventType: event.eventName,
            eventName: event.eventName,
            userId: event.userId || '',
            sessionId: event.sessionId,
            data: event.data ? JSON.stringify(event.data) : null,
            timestamp: event.timestamp || new Date(),
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
          }));

          await this.prisma.telemetryEvent.createMany({
            data,
            skipDuplicates: true,
          });

          this.logger.debug(`Batch recorded ${events.length} telemetry events`);
        } catch (error) {
          this.logger.error(
            `Failed to batch record telemetry events: ${events.length}`,
            error
          );
        }
      });
    } catch (error) {
      this.logger.error(
        'Failed to initiate batch telemetry event recording',
        error
      );
    }
  }

  /**
   * Gets analytics data for the dashboard
   */
  async getAnalyticsData(
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      // Get basic user metrics
      const [dauResult, mauResult, totalUsers, totalEvents] = await Promise.all(
        [
          this.getDailyActiveUsers(startDate, endDate),
          this.getMonthlyActiveUsers(startDate, endDate),
          this.prisma.user.count(),
          this.prisma.telemetryEvent.count({
            where: {
              timestamp: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        ]
      );

      // Get top events
      const topEvents = await this.getTopEvents(startDate, endDate);

      // Get user engagement data
      const userEngagement = await this.getUserEngagementData(
        startDate,
        endDate
      );

      // Get feature usage
      const featureUsage = await this.getFeatureUsage(startDate, endDate);

      // Get system performance metrics
      const systemPerformance = await this.getSystemPerformance(
        startDate,
        endDate
      );

      // Get economy metrics
      const economyMetrics = await this.getEconomyMetrics(startDate, endDate);

      return {
        dau: dauResult,
        mau: mauResult,
        totalUsers,
        totalEvents,
        topEvents,
        userEngagement,
        featureUsage,
        systemPerformance,
        economyMetrics,
      };
    } catch (error) {
      this.logger.error('Failed to get analytics data', error);
      throw error;
    }
  }

  private async getDailyActiveUsers(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.prisma.telemetryEvent.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return result.filter((event) => event.userId !== null).length;
  }

  private async getMonthlyActiveUsers(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.telemetryEvent.findMany({
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
          lte: endDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return result.filter((event) => event.userId !== null).length;
  }

  private async getTopEvents(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ eventName: string; count: number }>> {
    const result = await this.prisma.telemetryEvent.groupBy({
      by: ['eventName'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        eventName: true,
      },
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
      take: 10,
    });

    return result
      .filter((item) => item.eventName !== null)
      .map((item) => ({
        eventName: item.eventName as string,
        count: item._count.eventName,
      }));
  }

  private async getUserEngagementData(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      date: string;
      activeUsers: number;
      sessions: number;
      avgSessionLength: number;
    }>
  > {
    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEvents = await this.prisma.telemetryEvent.findMany({
        where: {
          timestamp: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          userId: true,
          sessionId: true,
          eventName: true,
          timestamp: true,
          data: true,
        },
      });

      const uniqueUsers = new Set(
        dayEvents
          .filter((event) => event.userId !== null)
          .map((event) => event.userId)
      );

      const uniqueSessions = new Set(
        dayEvents
          .filter((event) => event.sessionId !== null)
          .map((event) => event.sessionId)
      );

      // Calculate average session length from session_start/end events
      const sessionLengths: number[] = [];
      const sessionMap = new Map<string, { start?: Date; end?: Date }>();

      dayEvents.forEach((event) => {
        if (!event.sessionId || !event.eventName) return;

        if (event.eventName === 'session_start') {
          sessionMap.set(event.sessionId, {
            ...sessionMap.get(event.sessionId),
            start: event.timestamp,
          });
        } else if (event.eventName === 'session_end') {
          sessionMap.set(event.sessionId, {
            ...sessionMap.get(event.sessionId),
            end: event.timestamp,
          });
        }
      });

      sessionMap.forEach((session) => {
        if (session.start && session.end) {
          const length = session.end.getTime() - session.start.getTime();
          sessionLengths.push(length);
        }
      });

      const avgSessionLength =
        sessionLengths.length > 0
          ? sessionLengths.reduce((sum, len) => sum + len, 0) /
            sessionLengths.length /
            1000 // Convert to seconds
          : 0;

      days.push({
        date: currentDate.toISOString().split('T')[0],
        activeUsers: uniqueUsers.size,
        sessions: uniqueSessions.size,
        avgSessionLength: Math.round(avgSessionLength),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private async getFeatureUsage(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{ feature: string; usageCount: number; uniqueUsers: number }>
  > {
    // Define feature mappings from event names
    const featureMappings: Record<string, string> = {
      territory_claim: 'Territory Claims',
      avatar_customization: 'Avatar Customization',
      challenge_sent: 'Challenges',
      clan_join: 'Clan System',
      tournament_join: 'Tournaments',
      marketplace_purchase: 'Marketplace',
      social_feed_view: 'Social Feed',
      match_start: 'Matches',
      achievement_unlocked: 'Achievements',
    };

    const result = await this.prisma.telemetryEvent.groupBy({
      by: ['eventName'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        eventName: {
          in: Object.keys(featureMappings),
        },
      },
      _count: {
        eventName: true,
      },
    });

    // Filter null eventNames and convert to expected format
    const filteredResult = result.filter((item) => item.eventName !== null);

    const featureUsage: Array<{
      feature: string;
      usageCount: number;
      uniqueUsers: number;
    }> = [];

    for (const item of filteredResult) {
      const feature = featureMappings[item.eventName!] || item.eventName!;

      // Get unique users for this event type
      const uniqueUsers = await this.prisma.telemetryEvent.findMany({
        where: {
          eventName: item.eventName!,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      featureUsage.push({
        feature,
        usageCount: item._count.eventName || 0,
        uniqueUsers: uniqueUsers.filter((event) => event.userId !== null)
          .length,
      });
    }

    return featureUsage.sort((a, b) => b.usageCount - a.usageCount);
  }

  private async getSystemPerformance(
    startDate: Date,
    endDate: Date
  ): Promise<{ avgResponseTime: number; errorRate: number; uptime: number }> {
    // Get API response time events
    const responseTimeEvents = await this.prisma.telemetryEvent.findMany({
      where: {
        eventName: 'api_response',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        data: true,
      },
    });

    const responseTimes = responseTimeEvents
      .map((event) => (event.data as any)?.responseTime)
      .filter((time) => typeof time === 'number');

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Get error events
    const totalRequests = await this.prisma.telemetryEvent.count({
      where: {
        eventName: 'api_request',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const errorRequests = await this.prisma.telemetryEvent.count({
      where: {
        eventName: 'api_error',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const errorRate =
      totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Calculate uptime (simplified - in real implementation would track system status)
    const uptime = 99.9; // Placeholder

    return {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      uptime,
    };
  }

  private async getEconomyMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTransactions: number;
    totalVolume: number;
    avgTransactionValue: number;
  }> {
    // Get transaction events
    const transactions = await this.prisma.telemetryEvent.findMany({
      where: {
        eventName: 'transaction',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        data: true,
      },
    });

    const transactionData = transactions.map((event) => event.data as any);

    const totalTransactions = transactionData.length;
    const totalVolume = transactionData.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );
    const avgTransactionValue =
      totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return {
      totalTransactions,
      totalVolume: Math.round(totalVolume),
      avgTransactionValue: Math.round(avgTransactionValue),
    };
  }

  /**
   * Processes pending telemetry events (for background processing)
   */
  async processPendingEvents(): Promise<void> {
    try {
      const pendingEvents = await this.prisma.telemetryEvent.findMany({
        where: {
          processed: false,
        },
        take: 100, // Process in batches
      });

      if (pendingEvents.length === 0) {
        return;
      }

      // Process events (add aggregations, update caches, etc.)
      const eventIds = pendingEvents.map((event) => event.id);

      await this.prisma.telemetryEvent.updateMany({
        where: {
          id: {
            in: eventIds,
          },
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      this.logger.debug(`Processed ${pendingEvents.length} telemetry events`);
    } catch (error) {
      this.logger.error('Failed to process pending telemetry events', error);
    }
  }

  /**
   * Cleans up old telemetry events
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.telemetryEvent.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
          processed: true, // Only delete processed events
        },
      });

      this.logger.debug(`Cleaned up ${result.count} old telemetry events`);
    } catch (error) {
      this.logger.error('Failed to cleanup old telemetry events', error);
    }
  }
}
