import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Achievement,
  AchievementCategory,
  UserAchievement,
} from '@dojopool/prisma';
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
  status: string;
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
    // Get all active achievements with user's progress
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
      include: {
        userAchievements: {
          where: { userId },
        },
      },
    });

    const achievementProgress: AchievementProgress[] = [];

    for (const achievement of achievements) {
      const userAchievement = achievement.userAchievements[0];

      if (userAchievement) {
        // User has progress on this achievement
        achievementProgress.push({
          achievementId: achievement.id,
          userId,
          currentProgress: userAchievement.progress,
          maxProgress: achievement.criteriaValue,
          status:
            userAchievement.progress >= achievement.criteriaValue
              ? 'unlocked'
              : 'in_progress',
          unlockedAt: userAchievement.unlockedAt || undefined,
          claimedAt: userAchievement.rewardClaimed
            ? userAchievement.unlockedAt
            : undefined,
        });
      } else {
        // User hasn't started this achievement
        achievementProgress.push({
          achievementId: achievement.id,
          userId,
          currentProgress: 0,
          maxProgress: achievement.criteriaValue,
          status: 'locked',
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
    // Get achievement with user's progress
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      include: {
        userAchievements: {
          where: { userId },
        },
      },
    });

    if (!achievement) {
      return null; // Achievement doesn't exist
    }

    const userAchievement = achievement.userAchievements[0];

    if (!userAchievement) {
      // User hasn't started this achievement
      return {
        achievementId,
        userId,
        currentProgress: 0,
        maxProgress: achievement.criteriaValue,
        status: 'locked',
      };
    }

    return {
      achievementId,
      userId,
      currentProgress: userAchievement.progress,
      maxProgress: achievement.criteriaValue,
      status:
        userAchievement.progress >= achievement.criteriaValue
          ? 'unlocked'
          : 'in_progress',
      unlockedAt: userAchievement.unlockedAt || undefined,
      claimedAt: userAchievement.rewardClaimed
        ? userAchievement.unlockedAt
        : undefined,
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
  ): Promise<UserAchievement[]> {
    // Find achievements that match the criteria type
    const achievements = await this.prisma.achievement.findMany({
      where: {
        criteriaType,
        isActive: true,
      },
    });

    const unlockedAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      // Check if metadata matches (if provided)
      if (metadata && achievement.criteriaMetadata) {
        const achievementMetadata =
          typeof achievement.criteriaMetadata === 'object'
            ? achievement.criteriaMetadata
            : JSON.parse(achievement.criteriaMetadata as string);

        if (!this.checkAdditionalCriteria(metadata, achievementMetadata)) {
          continue; // Skip this achievement if metadata doesn't match
        }
      }

      // Update or create user achievement progress
      const updatedAchievement = await this.updateSingleAchievementProgress(
        userId,
        achievement.id,
        value,
        metadata
      );

      // Check if achievement was unlocked
      if (
        updatedAchievement &&
        updatedAchievement.progress >= achievement.criteriaValue
      ) {
        unlockedAchievements.push(updatedAchievement);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Update progress for a single achievement
   */
  private async updateSingleAchievementProgress(
    userId: string,
    achievementId: string,
    incrementValue: number,
    metadata?: Record<string, any>
  ): Promise<UserAchievement | null> {
    // Get the achievement to check criteria value
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      this.logger.warn(`Achievement ${achievementId} not found`);
      return null;
    }

    // Find existing user achievement or create new one
    const existingAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    let updatedAchievement: UserAchievement;
    let newProgress: number;

    if (existingAchievement) {
      // Update existing achievement
      newProgress = existingAchievement.progress + incrementValue;
      updatedAchievement = await this.prisma.userAchievement.update({
        where: { id: existingAchievement.id },
        data: {
          progress: newProgress,
          unlockedAt:
            newProgress >= achievement.criteriaValue &&
            !existingAchievement.unlockedAt
              ? new Date()
              : existingAchievement.unlockedAt,
        },
      });
    } else {
      // Create new achievement
      newProgress = incrementValue;
      updatedAchievement = await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress: newProgress,
          unlockedAt:
            newProgress >= achievement.criteriaValue ? new Date() : null,
        },
      });
    }

    // Log achievement unlock
    if (
      newProgress >= achievement.criteriaValue &&
      (!existingAchievement || !existingAchievement.unlockedAt)
    ) {
      this.logger.log(
        `Achievement unlocked: ${achievement.key} for user ${userId}`
      );
    }

    return updatedAchievement;
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement> {
    // Find the achievement first
    const userAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (!userAchievement) {
      throw new NotFoundException('User achievement not found');
    }

    // Update the achievement
    const unlockedAchievement = await this.prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        unlockedAt: new Date(),
      },
    });

    this.logger.log(
      `Achievement unlocked: ${achievementId} for user ${userId}`
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
        criteriaMetadata: data.criteriaMetadata || {},
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
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all achievements
   */
  async getAllAchievements(
    includeHidden: boolean = false
  ): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: {
        isActive: true,
        ...(includeHidden ? {} : { isHidden: false }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update an achievement
   */
  async updateAchievement(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: AchievementCategory;
      iconUrl: string;
      criteriaType: string;
      criteriaValue: number;
      criteriaMetadata: Record<string, any>;
      rewardId: string;
      isHidden: boolean;
      isActive: boolean;
    }>
  ): Promise<Achievement> {
    return this.prisma.achievement.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete an achievement (soft delete by setting isActive to false)
   */
  async deleteAchievement(id: string): Promise<Achievement> {
    return this.prisma.achievement.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
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
        include: {
          achievement: true,
        },
      }),
    ]);

    const unlockedAchievements = userAchievements.filter(
      (ua) => ua.unlockedAt !== null // Check if achievement is unlocked
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
    // Find the achievement first
    const userAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (!userAchievement) {
      throw new NotFoundException('User achievement not found');
    }

    return this.prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        progress: 0,
        unlockedAt: null,
        rewardClaimed: false,
      },
    });
  }
}
