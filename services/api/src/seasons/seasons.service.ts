import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CacheInvalidate,
  CacheKey,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheHelper: CacheHelper
  ) {}

  async getActiveSeason() {
    const season = await this.prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
    return season ?? null;
  }

  async getAllSeasons() {
    return this.prisma.season.findMany({ orderBy: { startDate: 'desc' } });
  }

  async getSeasonById(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException('Season not found');
    return season;
  }

  /**
   * Read-heavy endpoint with caching
   */
  @Cacheable({
    ttl: 60, // 1 minute - leaderboards change frequently
    keyPrefix: 'seasons:leaderboard',
    keyGenerator: (limit: number) => CacheKey('seasons', 'leaderboard', limit),
  })
  async getSeasonalLeaderboard(limit = 10) {
    const activeSeason = await this.getActiveSeason();

    // Fetch top clans by seasonalPoints
    const clans = await this.prisma.clan.findMany({
      orderBy: { seasonalPoints: 'desc' },
      take: Math.max(1, Math.min(limit, 100)),
      include: {
        _count: {
          select: { members: true, territories: true },
        },
      },
    });

    let rank = 1;
    const leaderboardClans = clans.map((c) => ({
      clanId: c.id,
      clanName: c.name,
      clanTag: this.deriveClanTag(c.name),
      seasonalPoints: c.seasonalPoints ?? 0,
      rank: rank++,
      totalMatches: 0, // Not tracked in schema yet
      wonMatches: 0, // Not tracked in schema yet
      territoriesControlled: c._count.territories,
      members: c._count.members,
      avatarUrl: undefined as string | undefined,
    }));

    return {
      seasonId: activeSeason?.id ?? 'off-season',
      seasonName: activeSeason?.name ?? 'Off-season',
      clans: leaderboardClans,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Update operation with cache invalidation
   */
  @CacheInvalidate(['seasons:leaderboard:*'])
  async awardPointsToClan(clanId: string, points: number, reason?: string) {
    if (!clanId) throw new BadRequestException('clanId is required');
    if (!Number.isFinite(points) || points <= 0)
      throw new BadRequestException('points must be a positive number');

    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');

    const updated = await this.prisma.clan.update({
      where: { id: clanId },
      data: { seasonalPoints: { increment: Math.floor(points) } },
    });

    // Optionally, record an activity event
    try {
      await this.prisma.activityEvent.create({
        data: {
          type: 'SEASON_POINTS_AWARDED',
          message: `Awarded ${Math.floor(points)} seasonal points to clan ${updated.name}${reason ? `: ${reason}` : ''}`,
          userId: updated.leaderId,
          clanId: updated.id,
          data: JSON.stringify({ points: Math.floor(points), reason }),
          metadata: JSON.stringify({ points: Math.floor(points), reason }),
        },
      });
    } catch {
      // Non-fatal; ignore logging errors
    }

    return updated;
  }

  private deriveClanTag(name: string): string {
    const cleaned = (name || '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    if (!cleaned) return 'CLN';
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleaned.slice(0, 3).toUpperCase();
  }
}
