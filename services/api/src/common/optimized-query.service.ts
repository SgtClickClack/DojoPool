import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaOptimizationService } from './prisma-optimization.service';

interface UserWithRelations {
  id: string;
  username: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  _count?: {
    matchesAsPlayerA: number;
    matchesAsPlayerB: number;
    tournaments: number;
  };
}

interface VenueWithRelations {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  _count?: {
    matches: number;
    tournaments: number;
  };
}

interface MatchWithRelations {
  id: string;
  status: string;
  createdAt: Date;
  playerA?: {
    id: string;
    username: string;
  };
  playerB?: {
    id: string;
    username: string;
  };
  venue?: {
    id: string;
    name: string;
  };
}

interface TournamentWithRelations {
  id: string;
  name: string;
  status: string;
  type: string;
  startDate: Date;
  venue?: {
    id: string;
    name: string;
    address: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      username: string;
    };
    finalRank: number | null;
  }>;
  _count: {
    participants: number;
  };
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  userId?: string;
  venueId?: string;
  clanId?: string;
  matchId?: string;
  tournamentId?: string;
}

interface UserStats {
  totalMatches: number;
  totalWins: number;
  tournaments: number;
  clans: number;
}

interface PrismaWhereClause {
  OR?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

@Injectable()
export class OptimizedQueryService {
  private readonly logger = new Logger(OptimizedQueryService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly optimizationService: PrismaOptimizationService
  ) {}

  /**
   * Optimized user queries with selective field loading
   */
  async getUsersWithStats(
    filters: {
      search?: string;
      role?: string;
      isBanned?: boolean;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ users: UserWithRelations[]; total: number; hasMore: boolean }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: PrismaWhereClause = {};

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isBanned !== undefined) {
      where.isBanned = filters.isBanned;
    }

    const result = await this.optimizationService.findManyOptimized('user', {
      where,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            matchesAsPlayerA: true,
            matchesAsPlayerB: true,
            tournaments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        keyPrefix: 'users',
      },
    });

    return { ...result, users: result.data as UserWithRelations[] };
  }

  /**
   * Optimized venue queries with location-based filtering
   */
  async getVenuesWithStats(
    filters: {
      search?: string;
      status?: string;
      location?: {
        lat: number;
        lng: number;
        radius: number; // in kilometers
      };
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    venues: VenueWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: PrismaWhereClause = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Location-based filtering using raw SQL for better performance
    if (filters.location) {
      const { lat, lng, radius } = filters.location;
      const _earthRadius = 6371; // Earth's radius in kilometers

      where.sql = `
        (6371 * acos(cos(radians(${lat})) * cos(radians(lat)) *
         cos(radians(lng) - radians(${lng})) + sin(radians(${lat})) *
         sin(radians(lat)))) <= ${radius}
      `;
    }

    const result = await this.optimizationService.findManyOptimized('venue', {
      where,
      include: {
        _count: {
          select: {
            matches: true,
            tournaments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      cache: {
        ttl: 10 * 60 * 1000, // 10 minutes
        maxSize: 200,
        keyPrefix: 'venues',
      },
    });

    return { ...result, venues: result.data as VenueWithRelations[] };
  }

  /**
   * Optimized match queries with player and venue relations
   */
  async getMatchesWithRelations(
    filters: {
      status?: string;
      playerId?: string;
      venueId?: string;
      dateRange?: {
        start: Date;
        end: Date;
      };
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    matches: MatchWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: PrismaWhereClause = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.playerId) {
      where.OR = [
        { playerAId: filters.playerId },
        { playerBId: filters.playerId },
      ];
    }

    if (filters.venueId) {
      where.venueId = filters.venueId;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const result = await this.optimizationService.findManyOptimized('match', {
      where,
      include: {
        playerA: {
          select: {
            id: true,
            username: true,
          },
        },
        playerB: {
          select: {
            id: true,
            username: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      cache: {
        ttl: 2 * 60 * 1000, // 2 minutes
        maxSize: 500,
        keyPrefix: 'matches',
      },
    });

    return { ...result, matches: result.data as MatchWithRelations[] };
  }

  /**
   * Batch load user statistics for multiple users
   */
  async batchLoadUserStats(userIds: string[]): Promise<Map<string, UserStats>> {
    const queries: Array<{ key: string; query: () => Promise<number> }> = [];

    for (const userId of userIds) {
      // Total matches
      queries.push({
        key: `${userId}:totalMatches`,
        query: () =>
          this._prisma.match.count({
            where: {
              OR: [{ playerAId: userId }, { playerBId: userId }],
            },
          }),
      });

      // Total wins
      queries.push({
        key: `${userId}:totalWins`,
        query: () =>
          this._prisma.match.count({
            where: {
              OR: [
                { playerAId: userId, winnerId: userId },
                { playerBId: userId, winnerId: userId },
              ],
            },
          }),
      });

      // Tournament participations
      queries.push({
        key: `${userId}:tournaments`,
        query: () =>
          this._prisma.tournamentParticipant.count({
            where: { userId },
          }),
      });

      // Clan memberships
      queries.push({
        key: `${userId}:clans`,
        query: () =>
          this._prisma.clanMember.count({
            where: { userId },
          }),
      });
    }

    return this.optimizationService.executeBatch(queries);
  }

  /**
   * Optimized tournament queries with participant data
   */
  async getTournamentsWithParticipants(
    filters: {
      status?: string;
      type?: string;
      dateRange?: {
        start: Date;
        end: Date;
      };
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    tournaments: TournamentWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: PrismaWhereClause = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.dateRange) {
      where.startDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const result = await this.optimizationService.findManyOptimized(
      'tournament',
      {
        where,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              finalRank: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
        cache: {
          ttl: 5 * 60 * 1000, // 5 minutes
          maxSize: 100,
          keyPrefix: 'tournaments',
        },
      }
    );

    return { ...result, tournaments: result.data as TournamentWithRelations[] };
  }

  /**
   * Optimized activity feed with batched user/venue lookups
   */
  async getActivityFeedOptimized(
    userId: string,
    limit = 20
  ): Promise<ActivityEvent[]> {
    // First, get activity events
    const events = await this._prisma.activityEvent.findMany({
      where: {
        OR: [
          { userId },
          { venueId: { in: await this.getUserVenueIds(userId) } },
          { clanId: { in: await this.getUserClanIds(userId) } },
        ],
      },
      select: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        userId: true,
        venueId: true,
        clanId: true,
        matchId: true,
        tournamentId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Extract unique IDs for batch loading
    const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean))];
    const venueIds = [...new Set(events.map((e) => e.venueId).filter(Boolean))];
    const clanIds = [...new Set(events.map((e) => e.clanId).filter(Boolean))];

    // Batch load related data
    const [users, venues, clans] = await Promise.all([
      userIds.length > 0
        ? this._prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, avatarUrl: true },
          })
        : [],
      venueIds.length > 0
        ? this._prisma.venue.findMany({
            where: { id: { in: venueIds } },
            select: { id: true, name: true },
          })
        : [],
      clanIds.length > 0
        ? this._prisma.clan.findMany({
            where: { id: { in: clanIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    // Create lookup maps
    const userMap = new Map(
      users.map(
        (u) =>
          [u.id, u] as [
            string,
            { id: string; username: string; avatarUrl?: string },
          ]
      )
    );
    const venueMap = new Map(
      venues.map((v) => [v.id, v] as [string, { id: string; name: string }])
    );
    const clanMap = new Map(
      clans.map((c) => [c.id, c] as [string, { id: string; name: string }])
    );

    // Enrich events with related data
    return events.map((event) => ({
      ...event,
      user: event.userId ? userMap.get(event.userId) : null,
      venue: event.venueId ? venueMap.get(event.venueId) : null,
      clan: event.clanId ? clanMap.get(event.clanId) : null,
    }));
  }

  private async getUserVenueIds(userId: string): Promise<string[]> {
    const venues = await this._prisma.venue.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return venues.map((v) => v.id);
  }

  private async getUserClanIds(userId: string): Promise<string[]> {
    const memberships = await this._prisma.clanMember.findMany({
      where: { userId },
      select: { clanId: true },
    });
    return memberships.map((m) => m.clanId);
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    cache: Record<string, unknown>;
    database: Record<string, unknown>;
    timestamp: string;
  }> {
    const cacheStats = this.optimizationService.getCacheStats();

    // Get database connection info
    const dbInfo = await this._prisma.$queryRaw`
      SELECT
        current_database() as database_name,
        version() as version,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
    `;

    return {
      cache: cacheStats,
      database: dbInfo[0],
      timestamp: new Date().toISOString(),
    };
  }
}
