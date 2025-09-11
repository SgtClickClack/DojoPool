import { MatchStatus } from '@dojopool/prisma';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface Player {
  id: string;
  skillRating: number;
  username: string;
}

interface MatchmakingQueueEntry {
  userId: string;
  skillRating: number;
  username: string;
  joinedAt: Date;
  searchRange: number;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly ELO_K_FACTOR = 32; // Standard ELO K-factor
  private readonly INITIAL_RATING = 1200; // Default skill rating for new players
  private readonly MAX_SEARCH_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly INITIAL_SEARCH_RANGE = 100; // Initial ELO difference tolerance
  private readonly SEARCH_RANGE_INCREMENT = 50; // How much to expand search range over time

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly cacheHelper: CacheHelper,
    @Optional() private readonly redisService?: RedisService
  ) {
    if (!this.redisService) {
      this.logger.warn(
        'RedisService not available - matchmaking will use fallback implementation'
      );
    }
  }

  /**
   * Join matchmaking queue
   */
  async joinQueue(
    userId: string
  ): Promise<{ success: boolean; estimatedWaitTime?: number }> {
    // Check if user is already in queue
    const existingEntry = await this.getQueueEntry(userId);
    if (existingEntry) {
      throw new Error('User is already in matchmaking queue');
    }

    // Get user profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const skillRating = this.INITIAL_RATING; // Default rating since Profile.skillRating removed
    const queueEntry: MatchmakingQueueEntry = {
      userId,
      skillRating,
      username: user.username,
      joinedAt: new Date(),
      searchRange: this.INITIAL_SEARCH_RANGE,
    };

    // Add to Redis queue
    await this.redisService.set(
      `matchmaking:queue:${userId}`,
      JSON.stringify(queueEntry),
      10 * 60 // 10 minutes TTL
    );

    // Add to sorted set for efficient matchmaking
    await this.redisService.zadd(
      'matchmaking:queue:sorted',
      skillRating,
      userId
    );

    // Try to find immediate match
    const match = await this.findMatch(userId, skillRating);
    if (match) {
      await this.createMatch(match.player1, match.player2);
      return { success: true };
    }

    // Calculate estimated wait time
    const estimatedWaitTime = this.calculateEstimatedWaitTime(skillRating);

    this.logger.log(
      `User ${userId} joined matchmaking queue with skill rating ${skillRating}`
    );
    return { success: true, estimatedWaitTime };
  }

  /**
   * Leave matchmaking queue
   */
  async leaveQueue(userId: string): Promise<{ success: boolean }> {
    const entry = await this.getQueueEntry(userId);
    if (!entry) {
      return { success: false };
    }

    // Remove from Redis
    await this.redisService.del(`matchmaking:queue:${userId}`);
    await this.redisService.zrem('matchmaking:queue:sorted', userId);

    this.logger.log(`User ${userId} left matchmaking queue`);
    return { success: true };
  }

  /**
   * Get queue status for user
   */
  async getQueueStatus(userId: string): Promise<{
    inQueue: boolean;
    estimatedWaitTime?: number;
    position?: number;
  }> {
    const entry = await this.getQueueEntry(userId);
    if (!entry) {
      return { inQueue: false };
    }

    const position = await this.getQueuePosition(userId);
    const estimatedWaitTime = this.calculateEstimatedWaitTime(
      entry.skillRating
    );

    return {
      inQueue: true,
      estimatedWaitTime,
      position,
    };
  }

  /**
   * Process matchmaking (called by cron job or background service)
   */
  async processMatchmaking(): Promise<void> {
    const queueEntries = await this.getAllQueueEntries();

    for (const entry of queueEntries) {
      const timeInQueue = Date.now() - entry.joinedAt.getTime();

      // Expand search range over time
      const expandedRange =
        this.INITIAL_SEARCH_RANGE +
        Math.floor(timeInQueue / (60 * 1000)) * this.SEARCH_RANGE_INCREMENT; // Increase every minute

      entry.searchRange = Math.min(expandedRange, 500); // Cap at 500 ELO difference

      const match = await this.findMatch(
        entry.userId,
        entry.skillRating,
        entry.searchRange
      );
      if (match) {
        await this.createMatch(match.player1, match.player2);
        break; // Process one match at a time to avoid overwhelming
      }

      // Remove from queue if max search time exceeded
      if (timeInQueue > this.MAX_SEARCH_TIME) {
        await this.leaveQueue(entry.userId);
        this.logger.log(
          `User ${entry.userId} removed from queue due to timeout`
        );
      }
    }
  }

  /**
   * Find suitable match for player
   */
  private async findMatch(
    userId: string,
    skillRating: number,
    searchRange = this.INITIAL_SEARCH_RANGE
  ): Promise<{ player1: Player; player2: Player } | null> {
    const minRating = skillRating - searchRange;
    const maxRating = skillRating + searchRange;

    // Get potential matches from Redis sorted set
    const potentialMatches = await this.redisService.zrangebyscore(
      'matchmaking:queue:sorted',
      minRating,
      maxRating,
      'WITHSCORES'
    );

    // Find best match (closest skill rating)
    let bestMatch: { userId: string; rating: number } | null = null;
    let bestDifference = searchRange;

    for (let i = 0; i < potentialMatches.length; i += 2) {
      const matchUserId = potentialMatches[i];
      const matchRating = parseFloat(potentialMatches[i + 1]);

      if (matchUserId === userId) continue; // Skip self

      const difference = Math.abs(skillRating - matchRating);
      if (difference < bestDifference) {
        bestMatch = { userId: matchUserId, rating: matchRating };
        bestDifference = difference;
      }
    }

    if (!bestMatch) return null;

    // Get player details
    const player1: Player = { id: userId, skillRating, username: '' };
    const player2: Player = {
      id: bestMatch.userId,
      skillRating: bestMatch.rating,
      username: '',
    };

    // Get usernames
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      }),
      this.prisma.user.findUnique({
        where: { id: bestMatch.userId },
        select: { username: true },
      }),
    ]);

    if (!user1 || !user2) return null;

    player1.username = user1.username;
    player2.username = user2.username;

    return { player1, player2 };
  }

  /**
   * Create a match between two players
   */
  private async createMatch(player1: Player, player2: Player): Promise<void> {
    try {
      // Remove both players from queue
      await this.leaveQueue(player1.id);
      await this.leaveQueue(player2.id);

      // Find available table (simplified - in real implementation, use venue management)
      const availableTable = await this.prisma.table.findFirst({
        where: {
          status: 'AVAILABLE',
          venue: {
            // Add venue filter if needed
          },
        },
      });

      // Create match record
      const match = await this.prisma.match.create({
        data: {
          playerAId: player1.id,
          playerBId: player2.id,
          tableId: availableTable?.id,
          isRanked: true,
          status: MatchStatus.SCHEDULED,
        },
      });

      // Update table status if assigned
      if (availableTable) {
        await this.prisma.table.update({
          where: { id: availableTable.id },
          data: { status: 'OCCUPIED' },
        });
      }

      // Notify players (this would typically use WebSocket or push notifications)
      this.logger.log(
        `Match created: ${player1.username} vs ${player2.username} (ID: ${match.id})`
      );
    } catch (error) {
      this.logger.error('Failed to create match:', error);
      // Re-queue players if match creation fails
      await this.joinQueue(player1.id);
      await this.joinQueue(player2.id);
    }
  }

  /**
   * Submit match result and update ELO ratings
   */
  @CacheInvalidate([
    'matchmaking:stats:*',
    'tournaments:list:*',
    'tournaments:detail:*',
  ])
  async submitMatchResult(
    matchId: string,
    winnerId: string,
    scoreA: number,
    scoreB: number
  ): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: {
          include: { profile: true },
        },
        playerB: {
          include: { profile: true },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new Error('Match is not in progress');
    }

    // Update match result
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        scoreA,
        scoreB,
        status: MatchStatus.COMPLETED,
        endedAt: new Date(),
      },
    });

    // Update table status
    if (match.tableId) {
      await this.prisma.table.update({
        where: { id: match.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    // Calculate ELO changes (using default rating since Profile.skillRating removed)
    const playerARating = this.INITIAL_RATING;
    const playerBRating = this.INITIAL_RATING;

    const playerAWon = winnerId === match.playerAId;
    const { eloChangeA, eloChangeB } = this.calculateEloChange(
      playerARating,
      playerBRating,
      playerAWon
    );

    // Note: Player rating updates removed since Profile.skillRating field no longer exists

    // Update match with ELO changes
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        eloChangeA,
        eloChangeB,
      },
    });

    this.logger.log(
      `Match ${matchId} completed. Winner: ${winnerId}, ELO changes: A=${eloChangeA}, B=${eloChangeB}`
    );
  }

  /**
   * Calculate ELO rating changes
   */
  private calculateEloChange(
    ratingA: number,
    ratingB: number,
    playerAWon: boolean
  ): { eloChangeA: number; eloChangeB: number } {
    const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedScoreB = 1 - expectedScoreA;

    const actualScoreA = playerAWon ? 1 : 0;
    const actualScoreB = 1 - actualScoreA;

    const eloChangeA = Math.round(
      this.ELO_K_FACTOR * (actualScoreA - expectedScoreA)
    );
    const eloChangeB = Math.round(
      this.ELO_K_FACTOR * (actualScoreB - expectedScoreB)
    );

    return { eloChangeA, eloChangeB };
  }

  /**
   * Get queue entry from Redis
   */
  private async getQueueEntry(
    userId: string
  ): Promise<MatchmakingQueueEntry | null> {
    const entryJson = await this.redisService.get(
      `matchmaking:queue:${userId}`
    );
    if (!entryJson) return null;

    const entry = JSON.parse(entryJson);
    entry.joinedAt = new Date(entry.joinedAt);
    return entry;
  }

  /**
   * Get all queue entries
   */
  private async getAllQueueEntries(): Promise<MatchmakingQueueEntry[]> {
    const queueUserIds = await this.redisService.zrange(
      'matchmaking:queue:sorted',
      0,
      -1
    );

    const entries: MatchmakingQueueEntry[] = [];
    for (const userId of queueUserIds) {
      const entry = await this.getQueueEntry(userId);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }

  /**
   * Get user's position in queue
   */
  private async getQueuePosition(userId: string): Promise<number> {
    const position = await this.redisService.zrank(
      'matchmaking:queue:sorted',
      userId
    );
    return position !== null ? position + 1 : 0; // Redis is 0-indexed
  }

  /**
   * Calculate estimated wait time based on skill rating and queue statistics
   */
  private async calculateEstimatedWaitTime(
    skillRating: number
  ): Promise<number> {
    // Get queue statistics around this skill rating
    const nearbyPlayers = await this.redisService.zcount(
      'matchmaking:queue:sorted',
      skillRating - this.INITIAL_SEARCH_RANGE,
      skillRating + this.INITIAL_SEARCH_RANGE
    );

    // Simple estimation: more players = shorter wait time
    if (nearbyPlayers >= 2) {
      return 30; // 30 seconds
    } else if (nearbyPlayers === 1) {
      return 120; // 2 minutes
    } else {
      return 300; // 5 minutes
    }
  }

  /**
   * Get matchmaking statistics
   */
  @Cacheable({
    ttl: 60, // 1 minute cache for statistics (frequently changing)
    keyPrefix: 'matchmaking:stats',
    keyGenerator: () => 'global',
  })
  async getStatistics(): Promise<{
    queueSize: number;
    averageWaitTime: number;
    matchesCreated: number;
    activeMatches: number;
  }> {
    const queueSize = await this.redisService.zcard('matchmaking:queue:sorted');

    // Get recent matches for statistics
    const recentMatches = await this.prisma.match.findMany({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        isRanked: true,
      },
    });

    const activeMatches = await this.prisma.match.count({
      where: {
        status: MatchStatus.IN_PROGRESS,
        isRanked: true,
      },
    });

    return {
      queueSize,
      averageWaitTime: 180, // Placeholder - would calculate from actual data
      matchesCreated: recentMatches.length,
      activeMatches,
    };
  }
}
