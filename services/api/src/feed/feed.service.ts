import { Injectable, Logger } from '@nestjs/common';
import {
  CACHE_PRESETS,
  StandardizedCacheService,
} from '../cache/standardized-cache.service';
import { PrismaService } from '../prisma/prisma.service';

export interface FeedQuery {
  page?: number;
  pageSize?: number;
  filter?: 'all' | 'friends';
  userId?: string; // current user, required when filter=friends
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private prisma: PrismaService,
    private cache: StandardizedCacheService
  ) {}

  async getFeed(query: FeedQuery) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;

    // Create cache key based on query parameters
    const cacheKey = `feed:${query.filter || 'all'}:${query.userId || 'all'}:${page}:${pageSize}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        if (query.filter === 'friends') {
          if (!query.userId)
            throw new Error('userId is required for friends filter');
          // find accepted friendships involving current user
          const accepted = await this.prisma.friendship.findMany({
            where: {
              status: 'ACCEPTED',
              OR: [
                { requesterId: query.userId },
                { addresseeId: query.userId },
              ],
            },
            select: { requesterId: true, addresseeId: true },
          });
          const friendIds = accepted.map((f) =>
            f.requesterId === query.userId ? f.addresseeId : f.requesterId
          );
          if (friendIds.length === 0) {
            return { page, pageSize, items: [] };
          }
          where.userId = { in: friendIds };
        }

        const items = await this.prisma.activityEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          include: {
            user: { select: { id: true, username: true } },
            venue: { select: { id: true, name: true } },
          },
        });

        // Parse metadata JSON string
        const normalized = items.map((it: any) => ({
          ...it,
          metadata: it.metadata ? JSON.parse(it.metadata) : {},
        }));

        return { page, pageSize, items: normalized };
      },
      CACHE_PRESETS.SOCIAL_FEEDS
    );
  }

  // Create new activity event and invalidate related caches
  async createActivityEvent(data: {
    userId: string;
    type: string;
    metadata?: any;
    venueId?: string;
  }) {
    const event = await this.prisma.activityEvent.create({
      data: {
        userId: data.userId,
        type: data.type,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        venueId: data.venueId,
      },
      include: {
        user: { select: { id: true, username: true } },
        venue: { select: { id: true, name: true } },
      },
    });

    // Invalidate related caches
    await this.invalidateUserFeedCaches(data.userId);

    return event;
  }

  // Invalidate all feed caches related to a user
  private async invalidateUserFeedCaches(userId: string) {
    // Invalidate general feed caches
    await this.cache.invalidatePattern('feed:all:all:*');
    await this.cache.invalidatePattern(`feed:friends:${userId}:*`);

    // Invalidate user's friends' feed caches
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    for (const friendship of friendships) {
      const friendId =
        friendship.requesterId === userId
          ? friendship.addresseeId
          : friendship.requesterId;

      await this.cache.invalidatePattern(`feed:friends:${friendId}:*`);
    }
  }
}
