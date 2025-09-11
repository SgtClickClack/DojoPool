import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalRevenue: number;
  userRetention: number;
  avgSessionDuration: number;
  conversionRate: number;
  topVenues: Array<{
    id: string;
    name: string;
    matches: number;
    revenue: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  matchTrends: Array<{
    date: string;
    matches: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async getAnalyticsData(
    range: string,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<AnalyticsData> {
    const dateRange = this.getDateRange(range);

    // Get cached data if available
    const cacheKey = `analytics:${range}:${userId || 'all'}:${isAdmin}`;
    const cachedData = await this.redis.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const [
      totalUsers,
      activeUsers,
      totalMatches,
      totalRevenue,
      userRetention,
      avgSessionDuration,
      conversionRate,
      topVenues,
      userGrowth,
      matchTrends,
    ] = await Promise.all([
      this.getTotalUsers(dateRange),
      this.getActiveUsers(dateRange),
      this.getTotalMatches(dateRange),
      this.getTotalRevenue(dateRange),
      this.getUserRetention(dateRange),
      this.getAvgSessionDuration(dateRange),
      this.getConversionRate(dateRange),
      this.getTopVenues(dateRange),
      this.getUserGrowthData(dateRange),
      this.getMatchTrendsData(dateRange),
    ]);

    const analyticsData: AnalyticsData = {
      totalUsers,
      activeUsers,
      totalMatches,
      totalRevenue,
      userRetention,
      avgSessionDuration,
      conversionRate,
      topVenues,
      userGrowth,
      matchTrends,
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(analyticsData));

    return analyticsData;
  }

  async getUserGrowthData(range: string) {
    const dateRange = this.getDateRange(range);

    const userGrowth = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return userGrowth.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0],
      users: item._count.id,
    }));
  }

  async getMatchTrendsData(range: string) {
    const dateRange = this.getDateRange(range);

    const matchTrends = await this.prisma.match.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return matchTrends.map((item) => ({
      date: item.createdAt.toISOString().split('T')[0],
      matches: item._count.id,
    }));
  }

  async getVenuePerformanceData(range: string) {
    const dateRange = this.getDateRange(range);

    const venuePerformance = await this.prisma.venue.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        matches: {
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        matches: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return venuePerformance.map((venue) => ({
      id: venue.id,
      name: venue.name,
      matches: venue._count.matches,
      revenue: venue.matches.reduce(
        (sum, match) => sum + (match.entryFee || 0),
        0
      ),
    }));
  }

  async getUserRetentionData(range: string) {
    const dateRange = this.getDateRange(range);

    // Calculate user retention based on login activity
    const totalUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const activeUsers = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    return totalUsers > 0 ? activeUsers / totalUsers : 0;
  }

  async getRevenueData(range: string) {
    const dateRange = this.getDateRange(range);

    const revenue = await this.prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
    });

    return revenue._sum.amount || 0;
  }

  private async getTotalUsers(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    return await this.prisma.user.count({
      where: {
        createdAt: {
          lte: dateRange.end,
        },
      },
    });
  }

  private async getActiveUsers(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    return await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });
  }

  private async getTotalMatches(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    return await this.prisma.match.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });
  }

  private async getTotalRevenue(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const revenue = await this.prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
    });

    return revenue._sum.amount || 0;
  }

  private async getUserRetention(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const totalUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          lte: dateRange.end,
        },
      },
    });

    const activeUsers = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    return totalUsers > 0 ? activeUsers / totalUsers : 0;
  }

  private async getAvgSessionDuration(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        endedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        endedAt: true,
      },
    });

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.endedAt.getTime() - session.createdAt.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / sessions.length / 1000; // Convert to seconds
  }

  private async getConversionRate(dateRange: {
    start: Date;
    end: Date;
  }): Promise<number> {
    const totalUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const convertedUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        walletAddress: {
          not: null,
        },
      },
    });

    return totalUsers > 0 ? convertedUsers / totalUsers : 0;
  }

  private async getTopVenues(dateRange: { start: Date; end: Date }) {
    const venues = await this.prisma.venue.findMany({
      include: {
        matches: {
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        matches: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      matches: venue._count.matches,
      revenue: venue.matches.reduce(
        (sum, match) => sum + (match.entryFee || 0),
        0
      ),
    }));
  }

  private getDateRange(range: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }

    return { start, end };
  }
}
