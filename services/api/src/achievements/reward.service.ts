import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AchievementStatus, Reward, RewardType } from '@dojopool/prisma';
import { PrismaService } from '../prisma/prisma.service';

export interface RewardClaimResult {
  success: boolean;
  rewardType: RewardType;
  rewardDetails: {
    dojoCoins?: number;
    avatarAssetId?: string;
    title?: string;
    clanPoints?: number;
    badgeData?: any;
  };
  message: string;
}

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Claim a reward for an unlocked achievement
   */
  async claimReward(
    userId: string,
    achievementId: string
  ): Promise<RewardClaimResult> {
    // Get the user's achievement status
    const userAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      include: {
        achievement: {
          include: {
            reward: true,
          },
        },
        reward: true,
      },
    });

    if (!userAchievement) {
      throw new NotFoundException('Achievement not found for user');
    }

    // Check if achievement is unlocked and reward not already claimed
    if (userAchievement.status !== AchievementStatus.UNLOCKED) {
      throw new BadRequestException(
        userAchievement.status === AchievementStatus.CLAIMED
          ? 'Reward already claimed'
          : 'Achievement not unlocked'
      );
    }

    if (userAchievement.rewardClaimed) {
      throw new BadRequestException('Reward already claimed');
    }

    // Get the reward details
    const reward = userAchievement.achievement.reward;
    if (!reward) {
      throw new NotFoundException('No reward associated with this achievement');
    }

    // Process the reward based on type
    const result = await this.processReward(userId, reward);

    // Mark reward as claimed
    await this.prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        status: AchievementStatus.CLAIMED,
        rewardClaimed: true,
        rewardId: reward.id,
        claimedAt: new Date(),
      },
    });

    this.logger.log(
      `Reward claimed: ${reward.name} (${reward.type}) for user ${userId}`
    );

    return result;
  }

  /**
   * Process the reward based on its type
   */
  private async processReward(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    switch (reward.type) {
      case RewardType.DOJO_COINS:
        return this.grantDojoCoins(userId, reward);

      case RewardType.AVATAR_ASSET:
        return this.grantAvatarAsset(userId, reward);

      case RewardType.EXCLUSIVE_TITLE:
        return this.grantExclusiveTitle(userId, reward);

      case RewardType.CLAN_POINTS:
        return this.grantClanPoints(userId, reward);

      case RewardType.SPECIAL_BADGE:
        return this.grantSpecialBadge(userId, reward);

      default:
        throw new BadRequestException(
          `Unsupported reward type: ${reward.type}`
        );
    }
  }

  /**
   * Grant DojoCoins reward
   */
  private async grantDojoCoins(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    if (!reward.dojoCoinAmount) {
      throw new BadRequestException('DojoCoin amount not specified for reward');
    }

    // Update user's balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dojoCoinBalance: {
          increment: reward.dojoCoinAmount,
        },
      },
    });

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        userId,
        amount: reward.dojoCoinAmount,
        currency: 'DOJO',
        type: 'PRIZE',
        metadata: {
          type: 'ACHIEVEMENT_REWARD',
          rewardId: reward.id,
          rewardName: reward.name,
        },
      },
    });

    return {
      success: true,
      rewardType: RewardType.DOJO_COINS,
      rewardDetails: {
        dojoCoins: reward.dojoCoinAmount,
      },
      message: `Received ${reward.dojoCoinAmount} DojoCoins!`,
    };
  }

  /**
   * Grant Avatar Asset reward
   */
  private async grantAvatarAsset(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    if (!reward.avatarAssetId) {
      throw new BadRequestException('Avatar asset ID not specified for reward');
    }

    // Check if user already owns this asset
    const existingOwnership = await this.prisma.userAvatarAsset.findUnique({
      where: {
        userId_assetId: {
          userId,
          assetId: reward.avatarAssetId,
        },
      },
    });

    if (existingOwnership) {
      throw new BadRequestException('User already owns this avatar asset');
    }

    // Grant the avatar asset
    await this.prisma.userAvatarAsset.create({
      data: {
        userId,
        assetId: reward.avatarAssetId,
        acquiredVia: 'achievement',
      },
    });

    // Get asset details
    const asset = await this.prisma.avatarAsset.findUnique({
      where: { id: reward.avatarAssetId },
      select: { name: true, type: true },
    });

    if (!asset) {
      throw new NotFoundException('Avatar asset not found');
    }

    return {
      success: true,
      rewardType: RewardType.AVATAR_ASSET,
      rewardDetails: {
        avatarAssetId: reward.avatarAssetId,
      },
      message: `Unlocked ${asset.name} (${asset.type}) avatar asset!`,
    };
  }

  /**
   * Grant Exclusive Title reward
   */
  private async grantExclusiveTitle(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    if (!reward.title) {
      throw new BadRequestException('Title not specified for reward');
    }

    // Update user's profile with the title
    await this.prisma.profile.upsert({
      where: { userId },
      update: {
        clanTitle: reward.title,
      },
      create: {
        userId,
        clanTitle: reward.title,
      },
    });

    return {
      success: true,
      rewardType: RewardType.EXCLUSIVE_TITLE,
      rewardDetails: {
        title: reward.title,
      },
      message: `Earned the "${reward.title}" title!`,
    };
  }

  /**
   * Grant Clan Points reward
   */
  private async grantClanPoints(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    if (!reward.clanPoints) {
      throw new BadRequestException(
        'Clan points amount not specified for reward'
      );
    }

    // Get user's clan membership
    const clanMember = await this.prisma.clanMember.findFirst({
      where: { userId },
      include: { clan: true },
    });

    if (!clanMember) {
      throw new BadRequestException('User is not a member of any clan');
    }

    // Update clan experience (which contributes to level)
    await this.prisma.clan.update({
      where: { id: clanMember.clanId },
      data: {
        experience: {
          increment: reward.clanPoints,
        },
      },
    });

    return {
      success: true,
      rewardType: RewardType.CLAN_POINTS,
      rewardDetails: {
        clanPoints: reward.clanPoints,
      },
      message: `Granted ${reward.clanPoints} clan points to ${clanMember.clan.name}!`,
    };
  }

  /**
   * Grant Special Badge reward
   */
  private async grantSpecialBadge(
    userId: string,
    reward: Reward
  ): Promise<RewardClaimResult> {
    // Store badge data in user's profile or create a special achievement record
    // For now, we'll store it in the user metadata
    const badgeData = {
      badgeId: `achievement_${reward.id}`,
      badgeName: reward.name,
      earnedAt: new Date().toISOString(),
      ...reward.badgeData,
    };

    // You could store this in a user metadata field or create a separate badges table
    // For now, we'll log it and return success

    this.logger.log(`Special badge granted to user ${userId}: ${reward.name}`);

    return {
      success: true,
      rewardType: RewardType.SPECIAL_BADGE,
      rewardDetails: {
        badgeData,
      },
      message: `Earned the "${reward.name}" special badge!`,
    };
  }

  /**
   * Create a new reward
   */
  async createReward(data: {
    name: string;
    description?: string;
    type: RewardType;
    iconUrl?: string;
    dojoCoinAmount?: number;
    avatarAssetId?: string;
    title?: string;
    clanPoints?: number;
    badgeData?: Record<string, any>;
  }): Promise<Reward> {
    return this.prisma.reward.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        iconUrl: data.iconUrl,
        dojoCoinAmount: data.dojoCoinAmount,
        avatarAssetId: data.avatarAssetId,
        title: data.title,
        clanPoints: data.clanPoints,
        badgeData: data.badgeData ? JSON.stringify(data.badgeData) : null,
      },
    });
  }

  /**
   * Get all available rewards
   */
  async getRewards(): Promise<Reward[]> {
    return this.prisma.reward.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get user's claimed rewards
   */
  async getUserClaimedRewards(userId: string): Promise<Reward[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: {
        userId,
        rewardClaimed: true,
      },
      include: {
        reward: true,
      },
    });

    return userAchievements
      .filter((ua) => ua.reward !== null)
      .map((ua) => ua.reward!);
  }

  /**
   * Get reward statistics
   */
  async getRewardStats(): Promise<{
    totalRewards: number;
    rewardsByType: Record<RewardType, number>;
    mostClaimedRewards: Array<{
      rewardId: string;
      name: string;
      claimCount: number;
    }>;
  }> {
    const [totalRewards, rewardsByType, mostClaimed] = await Promise.all([
      this.prisma.reward.count(),
      this.prisma.reward.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
      }),
      this.prisma.userAchievement.groupBy({
        by: ['rewardId'],
        where: {
          rewardId: {
            not: null,
          },
          rewardClaimed: true,
        },
        _count: {
          rewardId: true,
        },
        orderBy: {
          _count: {
            rewardId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Format rewards by type
    const rewardsByTypeMap: Record<RewardType, number> = {
      [RewardType.DOJO_COINS]: 0,
      [RewardType.AVATAR_ASSET]: 0,
      [RewardType.EXCLUSIVE_TITLE]: 0,
      [RewardType.CLAN_POINTS]: 0,
      [RewardType.SPECIAL_BADGE]: 0,
    };

    rewardsByType.forEach((item) => {
      rewardsByTypeMap[item.type] = item._count.type;
    });

    // Get most claimed rewards with names
    const mostClaimedRewards = [];
    for (const item of mostClaimed) {
      if (item.rewardId) {
        const reward = await this.prisma.reward.findUnique({
          where: { id: item.rewardId },
          select: { name: true },
        });

        if (reward) {
          mostClaimedRewards.push({
            rewardId: item.rewardId,
            name: reward.name,
            claimCount: item._count.rewardId,
          });
        }
      }
    }

    return {
      totalRewards,
      rewardsByType: rewardsByTypeMap,
      mostClaimedRewards,
    };
  }
}
