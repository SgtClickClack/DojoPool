import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from './achievement.service';

@Injectable()
export class AchievementEventsService implements OnModuleInit {
  private readonly logger = new Logger(AchievementEventsService.name);

  constructor(
    private readonly achievementService: AchievementService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit() {
    this.logger.log('Achievement Events Service initialized');
  }

  /**
   * Handle venue check-in events
   */
  async handleVenueCheckIn(userId: string, venueId: string) {
    try {
      // Update venue visit achievements
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'VENUE_CHECK_INS',
        1,
        { venueId }
      );

      // Update unique venues visited
      await this.updateUniqueVenuesAchievement(userId);

      // Update consecutive daily visits
      await this.updateConsecutiveVisitsAchievement(userId);

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `Achievements unlocked for user ${userId} on venue check-in: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle venue check-in achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle match completion events
   */
  async handleMatchCompleted(
    userId: string,
    matchData: {
      matchId: string;
      winnerId: string;
      playerAId: string;
      playerBId: string;
      venueId?: string;
    }
  ) {
    try {
      const isWinner = matchData.winnerId === userId;
      const isDraw = !matchData.winnerId;

      // Update match played achievements
      await this.achievementService.updateProgress(
        userId,
        'MATCHES_PLAYED',
        1,
        { venueId: matchData.venueId }
      );

      // Update match won achievements if user won
      if (isWinner) {
        const unlockedAchievements =
          await this.achievementService.updateProgress(
            userId,
            'MATCHES_WON',
            1,
            { venueId: matchData.venueId }
          );

        if (unlockedAchievements.length > 0) {
          this.logger.log(
            `Win achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
          );
        }
      }

      // Update win streak achievements
      if (isWinner) {
        await this.updateWinStreakAchievement(userId);
      } else if (!isDraw) {
        await this.resetWinStreak(userId);
      }

      // Update venue-specific achievements
      if (matchData.venueId) {
        await this.updateVenueMatchAchievements(
          userId,
          matchData.venueId,
          isWinner
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle match completion achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle territory claim events
   */
  async handleTerritoryClaimed(
    userId: string,
    territoryData: {
      territoryId: string;
      venueId: string;
      clanId?: string;
    }
  ) {
    try {
      // Update territory control achievements
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'TERRITORIES_CLAIMED',
        1,
        { venueId: territoryData.venueId, clanId: territoryData.clanId }
      );

      // Update unique territories controlled
      await this.updateUniqueTerritoriesAchievement(userId);

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `Territory achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle territory claim achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle trade completion events
   */
  async handleTradeCompleted(
    userId: string,
    tradeData: {
      tradeId: string;
      traderId: string;
      tradeValue: number;
    }
  ) {
    try {
      // Update trading achievements
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'TRADES_COMPLETED',
        1,
        { tradeValue: tradeData.tradeValue }
      );

      // Update total trade value achievements
      await this.achievementService.updateProgress(
        userId,
        'TOTAL_TRADE_VALUE',
        tradeData.tradeValue
      );

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `Trading achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle trade completion achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle clan join events
   */
  async handleClanJoined(
    userId: string,
    clanData: {
      clanId: string;
      clanName: string;
    }
  ) {
    try {
      // Update clan membership achievements
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'CLANS_JOINED',
        1,
        { clanId: clanData.clanId }
      );

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `Clan achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle clan join achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle tournament participation events
   */
  async handleTournamentParticipation(
    userId: string,
    tournamentData: {
      tournamentId: string;
      placement: number;
      totalParticipants: number;
    }
  ) {
    try {
      // Update tournament participation achievements
      await this.achievementService.updateProgress(
        userId,
        'TOURNAMENTS_PARTICIPATED',
        1
      );

      // Update tournament win achievements
      if (tournamentData.placement === 1) {
        const unlockedAchievements =
          await this.achievementService.updateProgress(
            userId,
            'TOURNAMENTS_WON',
            1
          );

        if (unlockedAchievements.length > 0) {
          this.logger.log(
            `Tournament achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
          );
        }
      }

      // Update top placements
      if (tournamentData.placement <= 3) {
        await this.achievementService.updateProgress(
          userId,
          'TOURNAMENT_TOP_3',
          1
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle tournament achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Update unique venues visited achievement
   */
  private async updateUniqueVenuesAchievement(userId: string) {
    try {
      // Count unique venues visited
      const uniqueVenuesCount = await this.prisma.checkIn.findMany({
        where: { userId },
        select: { venueId: true },
      });

      const uniqueVenueIds = [
        ...new Set(uniqueVenuesCount.map((c) => c.venueId)),
      ];

      await this.achievementService.updateProgress(
        userId,
        'UNIQUE_VENUES_VISITED',
        uniqueVenueIds.length,
        { uniqueCount: uniqueVenueIds.length }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update unique venues achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Update consecutive visits achievement
   */
  private async updateConsecutiveVisitsAchievement(userId: string) {
    try {
      // This would require more complex logic to track consecutive days
      // For now, we'll use a simplified approach
      const recentCheckIns = await this.prisma.checkIn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30, // Last 30 days
      });

      // Simple consecutive day calculation
      const consecutiveDays = this.calculateConsecutiveDays(recentCheckIns);

      await this.achievementService.updateProgress(
        userId,
        'CONSECUTIVE_DAILY_VISITS',
        consecutiveDays,
        { consecutiveDays }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update consecutive visits achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Update win streak achievement
   */
  private async updateWinStreakAchievement(userId: string) {
    try {
      // Get recent matches to calculate win streak
      const recentMatches = await this.prisma.match.findMany({
        where: {
          OR: [{ playerAId: userId }, { playerBId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Check last 20 matches
      });

      let currentStreak = 0;
      for (const match of recentMatches) {
        if (match.winnerId === userId) {
          currentStreak++;
        } else if (match.winnerId && match.winnerId !== userId) {
          break; // Streak ended
        }
      }

      await this.achievementService.updateProgress(
        userId,
        'WIN_STREAK',
        currentStreak,
        { currentStreak }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update win streak achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Reset win streak when user loses
   */
  private async resetWinStreak(userId: string) {
    try {
      // Reset the win streak progress
      await this.prisma.userAchievement.updateMany({
        where: {
          userId,
          achievement: {
            criteriaType: 'WIN_STREAK',
          },
        },
        data: {
          progress: 0,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to reset win streak for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Update venue-specific match achievements
   */
  private async updateVenueMatchAchievements(
    userId: string,
    venueId: string,
    isWinner: boolean
  ) {
    try {
      // Update venue-specific achievements
      if (isWinner) {
        await this.achievementService.updateProgress(
          userId,
          'VENUE_MATCHES_WON',
          1,
          { venueId }
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update venue match achievements for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Update unique territories controlled achievement
   */
  private async updateUniqueTerritoriesAchievement(userId: string) {
    try {
      // Count unique territories controlled
      const controlledTerritories = await this.prisma.territory.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      await this.achievementService.updateProgress(
        userId,
        'UNIQUE_TERRITORIES_CONTROLLED',
        controlledTerritories.length,
        { uniqueCount: controlledTerritories.length }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update unique territories achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Calculate consecutive days from check-ins
   */
  private calculateConsecutiveDays(checkIns: any[]): number {
    if (checkIns.length === 0) return 0;

    // Sort by date
    const sortedCheckIns = checkIns.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let consecutiveDays = 1;
    let currentDate = new Date(sortedCheckIns[0].createdAt);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const checkInDate = new Date(sortedCheckIns[i].createdAt);
      checkInDate.setHours(0, 0, 0, 0);

      const dayDifference = Math.floor(
        (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDifference === 1) {
        consecutiveDays++;
        currentDate = checkInDate;
      } else if (dayDifference > 1) {
        break; // Gap in consecutive days
      }
    }

    return consecutiveDays;
  }

  /**
   * Handle first game played event
   */
  async handleFirstGamePlayed(userId: string) {
    try {
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'FIRST_GAME_PLAYED',
        1
      );

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `First game achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle first game achievement for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Handle social interaction events
   */
  async handleSocialInteraction(userId: string, interactionType: string) {
    try {
      const unlockedAchievements = await this.achievementService.updateProgress(
        userId,
        'SOCIAL_INTERACTION',
        1,
        { interactionType }
      );

      if (unlockedAchievements.length > 0) {
        this.logger.log(
          `Social achievements unlocked for user ${userId}: ${unlockedAchievements.map((a) => a.name).join(', ')}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle social interaction achievement for user ${userId}:`,
        error
      );
    }
  }
}
