import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private prisma: PrismaService) {}

  async getFeed(query: FeedQuery) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (query.filter === 'friends') {
      if (!query.userId)
        throw new Error('userId is required for friends filter');
      // find accepted friendships involving current user
      const accepted = await this.prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: query.userId }, { addresseeId: query.userId }],
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
        tournament: { select: { id: true, name: true } },
        match: { select: { id: true } },
        clan: { select: { id: true, name: true } },
      },
    });

    // Parse metadata JSON string
    const normalized = items.map((it: any) => ({
      ...it,
      metadata: it.metadata ? JSON.parse(it.metadata) : {},
    }));

    return { page, pageSize, items: normalized };
  }
}
