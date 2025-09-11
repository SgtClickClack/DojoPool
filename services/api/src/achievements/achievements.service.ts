import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@dojopool/prisma';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private prisma: PrismaService) {}

  async findAllAchievements() {
    try {
      return await this.prisma.achievement.findMany({
        orderBy: { points: 'desc' },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch achievements', undefined, err)
      );
      throw err;
    }
  }

  async findUserAchievements(userId: string) {
    try {
      return await this.prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch user achievements', userId, err)
      );
      throw err;
    }
  }

  async checkAndAwardAchievements(playerId: string): Promise<string[]> {
    try {
      this.logger.log(`Checking achievements for player ${playerId}`);

      const awardedAchievements: string[] = [];

      // Get player stats
      const playerStats = await this.getPlayerStats(playerId);

      // Check for various achievement types
      const achievementsToCheck = [
        { key: 'FIRST_WIN', condition: () => playerStats.totalWins >= 1 },
        {
          key: 'WIN_STREAK_3',
          condition: () => playerStats.currentStreak >= 3,
        },
        {
          key: 'WIN_STREAK_5',
          condition: () => playerStats.currentStreak >= 5,
        },
        {
          key: 'WIN_STREAK_10',
          condition: () => playerStats.currentStreak >= 10,
        },
        { key: 'TOTAL_WINS_10', condition: () => playerStats.totalWins >= 10 },
        { key: 'TOTAL_WINS_50', condition: () => playerStats.totalWins >= 50 },
        {
          key: 'TOTAL_WINS_100',
          condition: () => playerStats.totalWins >= 100,
        },
        {
          key: 'TOURNAMENT_WINNER',
          condition: () => playerStats.tournamentWins >= 1,
        },
        {
          key: 'TOURNAMENT_CHAMPION',
          condition: () => playerStats.tournamentWins >= 5,
        },
        {
          key: 'TERRITORY_CONTROLLER',
          condition: () => playerStats.territoriesControlled >= 1,
        },
        {
          key: 'TERRITORY_MASTER',
          condition: () => playerStats.territoriesControlled >= 5,
        },
      ];

      for (const achievementCheck of achievementsToCheck) {
        if (achievementCheck.condition()) {
          const awarded = await this.awardAchievement(
            playerId,
            achievementCheck.key
          );
          if (awarded) {
            awardedAchievements.push(achievementCheck.key);
          }
        }
      }

      this.logger.log(
        `Awarded ${awardedAchievements.length} achievements to player ${playerId}`
      );
      return awardedAchievements;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'check achievements for player',
          playerId,
          err
        )
      );
      throw err;
    }
  }

  private async getPlayerStats(playerId: string) {
    // Get total wins
    const totalWins = await this.prisma.match.count({
      where: {
        OR: [
          { playerAId: playerId, winnerId: playerId },
          { playerBId: playerId, winnerId: playerId },
        ],
      },
    });

    // Get current win streak
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ playerAId: playerId }, { playerBId: playerId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    let currentStreak = 0;
    for (const match of matches) {
      if (match.winnerId === playerId) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get tournament wins
    const tournamentWins = await this.prisma.tournamentParticipant.count({
      where: {
        userId: playerId,
        finalRank: 1,
      },
    });

    // Get territories controlled
    const territoriesControlled = await this.prisma.territory.count({
      where: { ownerId: playerId },
    });

    return {
      totalWins,
      currentStreak,
      tournamentWins,
      territoriesControlled,
    };
  }

  private async awardAchievement(
    userId: string,
    achievementKey: string
  ): Promise<boolean> {
    try {
      // Check if achievement exists
      const achievement = await this.prisma.achievement.findUnique({
        where: { key: achievementKey },
      });

      if (!achievement) {
        this.logger.warn(`Achievement ${achievementKey} not found`);
        return false;
      }

      // Check if user already has this achievement
      const existingUserAchievement =
        await this.prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id,
            },
          },
        });

      if (existingUserAchievement) {
        return false; // Already awarded
      }

      // Award the achievement
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      this.logger.log(
        `Awarded achievement ${achievementKey} to user ${userId}`
      );
      return true;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'award achievement',
          `${achievementKey} to user ${userId}`,
          err
        )
      );
      return false;
    }
  }

  async createAchievement(data: Prisma.AchievementCreateInput) {
    try {
      return await this.prisma.achievement.create({ data });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('create achievement', undefined, err)
      );
      throw err;
    }
  }

  async updateAchievement(id: string, data: Prisma.AchievementUpdateInput) {
    try {
      return await this.prisma.achievement.update({
        where: { id },
        data,
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('update achievement', id, err)
      );
      throw err;
    }
  }

  async deleteAchievement(id: string): Promise<void> {
    try {
      await this.prisma.achievement.delete({
        where: { id },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('delete achievement', id, err)
      );
      throw err;
    }
  }
}
