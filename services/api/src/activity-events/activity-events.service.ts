import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityEventsService {
  private readonly logger = new Logger(ActivityEventsService.name);

  constructor(private prisma: PrismaService) {}

  async createActivityEvent(data: {
    type: string;
    message: string;
    userId?: string;
    venueId?: string;
    matchId?: string;
    tournamentId?: string;
    clanId?: string;
    metadata?: string;
  }) {
    try {
      const created = await this.prisma.activityEvent.create({
        data: {
          type: data.type,
          message: data.message,
          userId: data.userId,
          venueId: data.venueId,
          matchId: data.matchId,
          tournamentId: data.tournamentId,
          clanId: data.clanId,
          metadata: data.metadata || '{}',
        },
        include: {
          user: true,
          venue: true,
          match: true,
          tournament: true,
          clan: true,
        },
      });

      return {
        id: created.id,
        type: created.type,
        message: created.message,
        userId: created.userId,
        venueId: created.venueId,
        matchId: created.matchId,
        tournamentId: created.tournamentId,
        clanId: created.clanId,
        metadata: created.metadata,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        user: created.user,
        venue: created.venue,
        match: created.match,
        tournament: created.tournament,
        clan: created.clan,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create activity event: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  async getActivityFeed(userId: string, limit = 20) {
    try {
      const events = await this.prisma.activityEvent.findMany({
        where: {
          OR: [
            { userId },
            { venueId: { in: await this.getUserVenueIds(userId) } },
            { clanId: { in: await this.getUserClanIds(userId) } },
          ],
        },
        include: {
          user: { select: { id: true, username: true } },
          venue: { select: { id: true, name: true } },
          clan: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return events;
    } catch (error) {
      this.logger.error(
        `Failed to get activity feed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  private async getUserVenueIds(userId: string): Promise<string[]> {
    const venues = await this.prisma.venue.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return venues.map((v) => v.id);
  }

  private async getUserClanIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.clanMember.findMany({
      where: { userId },
      select: { clanId: true },
    });
    return memberships.map((m) => m.clanId);
  }
}
