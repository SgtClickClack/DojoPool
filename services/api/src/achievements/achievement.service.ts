import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Achievement,
  AchievementCategory,
  AchievementStatus,
  UserAchievement,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AchievementCriteria {
  type: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface AchievementProgress {
  achievementId: string;
  userId: string;
  currentProgress: number;
  maxProgress: number;
  status: AchievementStatus;
  unlockedAt?: Date;
  claimedAt?: Date;
}

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all achievements with user's progress
   */
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
        reward: true,
      },
    });

    // Get all achievements to include locked ones
    const allAchievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
    });

    // Combine user achievements with all achievements
    const achievementProgress: AchievementProgress[] = [];

    for (const achievement of allAchievements) {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievementId === achievement.id
      );

      if (userAchievement) {
        achievementProgress.push({
          achievementId: achievement.id,
          userId,
          currentProgress: userAchievement.progress,
          maxProgress: userAchievement.progressMax,
          status: userAchievement.status,
          unlockedAt: userAchievement.unlockedAt || undefined,
          claimedAt: userAchievement.claimedAt || undefined,
        });
      } else {
        // Achievement not started yet
        achievementProgress.push({
          achievementId: achievement.id,
          userId,
          currentProgress: 0,
          maxProgress: achievement.criteriaValue,
          status: AchievementStatus.LOCKED,
        });
      }
    }

    return achievementProgress;
  }

  /**
   * Get a specific achievement with user's progress
   */
  async getUserAchievement(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress | null> {
    const userAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      include: {
        achievement: true,
        reward: true,
      },
    });

    if (!userAchievement) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        throw new NotFoundException('Achievement not found');
      }

      return {
        achievementId,
        userId,
        currentProgress: 0,
        maxProgress: achievement.criteriaValue,
        status: AchievementStatus.LOCKED,
      };
    }

    return {
      achievementId,
      userId,
      currentProgress: userAchievement.progress,
      maxProgress: userAchievement.progressMax,
      status: userAchievement.status,
      unlockedAt: userAchievement.unlockedAt || undefined,
      claimedAt: userAchievement.claimedAt || undefined,
    };
  }

  /**
   * Update achievement progress for a user
   */
  async updateProgress(
    userId: string,
    criteriaType: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<Achievement[]> {
    // Find all achievements that match this criteria type
    const relevantAchievements = await this.prisma.achievement.findMany({
      where: {
        criteriaType,
        isActive: true,
      },
    });

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of relevantAchievements) {
      try {
        const wasUnlocked = await this.updateSingleAchievementProgress(
          userId,
          achievement,
          value,
          metadata
        );

        if (wasUnlocked) {
          unlockedAchievements.push(achievement);
        }
      } catch (error) {
        this.logger.error(
          `Failed to update progress for achievement ${achievement.id}:`,
          error
        );
      }
    }

    return unlockedAchievements;
  }

  /**
   * Update progress for a single achievement
   */
  private async updateSingleAchievementProgress(
    userId: string,
    achievement: Achievement,
    incrementValue: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    // Check if additional criteria are met (from metadata)
    if (metadata && achievement.criteriaMetadata) {
      const criteriaMetadata = JSON.parse(
        achievement.criteriaMetadata as string
      );
      if (!this.checkAdditionalCriteria(metadata, criteriaMetadata)) {
        return false;
      }
    }

    const userAchievement = await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {
        progress: {
          increment: incrementValue,
        },
      },
      create: {
        userId,
        achievementId: achievement.id,
        progressMax: achievement.criteriaValue,
        progress: incrementValue,
      },
      include: {
        achievement: true,
      },
    });

    // Check if achievement should be unlocked
    const shouldUnlock =
      userAchievement.progress >= userAchievement.progressMax &&
      userAchievement.status === AchievementStatus.LOCKED;

    if (shouldUnlock) {
      await this.unlockAchievement(userId, achievement.id);
      return true;
    }

    return false;
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement> {
    const unlockedAchievement = await this.prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        status: AchievementStatus.UNLOCKED,
        unlockedAt: new Date(),
      },
      include: {
        achievement: true,
        reward: true,
      },
    });

    this.logger.log(
      `Achievement unlocked: ${unlockedAchievement.achievement.name} for user ${userId}`
    );

    return unlockedAchievement;
  }

  /**
   * Check additional criteria based on metadata
   */
  private checkAdditionalCriteria(
    eventMetadata: Record<string, any>,
    criteriaMetadata: Record<string, any>
  ): boolean {
    // Check specific conditions based on criteria type
    for (const [key, value] of Object.entries(criteriaMetadata)) {
      if (eventMetadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create a new achievement
   */
  async createAchievement(data: {
    key: string;
    name: string;
    description?: string;
    category: AchievementCategory;
    iconUrl?: string;
    criteriaType: string;
    criteriaValue: number;
    criteriaMetadata?: Record<string, any>;
    rewardId?: string;
    isHidden?: boolean;
  }): Promise<Achievement> {
    return this.prisma.achievement.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        category: data.category,
        iconUrl: data.iconUrl,
        criteriaType: data.criteriaType,
        criteriaValue: data.criteriaValue,
        criteriaMetadata: data.criteriaMetadata
          ? JSON.stringify(data.criteriaMetadata)
          : '{}',
        rewardId: data.rewardId,
        isHidden: data.isHidden || false,
      },
    });
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(
    category: AchievementCategory,
    includeHidden: boolean = false
  ): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: {
        category,
        isActive: true,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get user's unlocked achievements count
   */
  async getUserStats(userId: string): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    claimedRewards: number;
  }> {
    const [totalAchievements, userAchievements] = await Promise.all([
      this.prisma.achievement.count({ where: { isActive: true } }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: {
          status: true,
          rewardClaimed: true,
        },
      }),
    ]);

    const unlockedAchievements = userAchievements.filter(
      (ua) =>
        ua.status === AchievementStatus.UNLOCKED ||
        ua.status === AchievementStatus.CLAIMED
    ).length;

    const claimedRewards = userAchievements.filter(
      (ua) => ua.rewardClaimed
    ).length;

    return {
      totalAchievements,
      unlockedAchievements,
      claimedRewards,
    };
  }

  /**
   * Reset achievement progress (for testing or admin purposes)
   */
  async resetAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement> {
    return this.prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        progress: 0,
        status: AchievementStatus.LOCKED,
        unlockedAt: null,
        claimedAt: null,
        rewardClaimed: false,
      },
    });
  }
}
