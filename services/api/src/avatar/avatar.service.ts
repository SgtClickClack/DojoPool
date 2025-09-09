import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

export interface AvatarCustomizationData {
  hair?: string; // AvatarAsset ID
  face?: string; // AvatarAsset ID
  clothesTop?: string; // AvatarAsset ID
  clothesBottom?: string; // AvatarAsset ID
  shoes?: string; // AvatarAsset ID
  accessoryHead?: string; // AvatarAsset ID
  accessoryNeck?: string; // AvatarAsset ID
  accessoryBack?: string; // AvatarAsset ID
  weapon?: string; // AvatarAsset ID
  pet?: string; // AvatarAsset ID
  effect?: string; // AvatarAsset ID
  skinTone?: string;
  bodyType?: string;
  height?: number;
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all available avatar assets
   */
  async getAllAssets() {
    try {
      return await this.prisma.avatarAsset.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { rarity: 'desc' }, { name: 'asc' }],
      });
    } catch (err) {
      this.logger.error(
        `Failed to get avatar assets: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Get assets by type
   */
  async getAssetsByType(type: string) {
    try {
      return await this.prisma.avatarAsset.findMany({
        where: {
          type: type as any,
          isActive: true,
        },
        orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
      });
    } catch (err) {
      this.logger.error(
        `Failed to get avatar assets by type: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Get user's current avatar configuration
   */
  async getUserAvatar(userId: string) {
    try {
      const avatar = await this.prisma.avatar.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      if (!avatar) {
        // Create default avatar for user
        return await this.createDefaultAvatar(userId);
      }

      return avatar;
    } catch (err) {
      this.logger.error(
        `Failed to get user avatar: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Create default avatar for new user
   */
  private async createDefaultAvatar(userId: string) {
    try {
      return await this.prisma.avatar.create({
        data: {
          userId,
          configuration: {},
          skinTone: '#F5DEB3',
          bodyType: 'athletic',
          height: 1.0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to create default avatar: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Customize user's avatar
   */
  async customizeAvatar(
    userId: string,
    customizationData: AvatarCustomizationData
  ) {
    try {
      // Validate that user owns all the assets they're trying to equip
      await this.validateAssetOwnership(userId, customizationData);

      // Get or create avatar
      let avatar = await this.prisma.avatar.findUnique({
        where: { userId },
      });

      if (!avatar) {
        avatar = await this.createDefaultAvatar(userId);
      }

      // Update avatar configuration
      const updatedAvatar = await this.prisma.avatar.update({
        where: { userId },
        data: {
          configuration: customizationData,
          skinTone: customizationData.skinTone || avatar.skinTone,
          bodyType: customizationData.bodyType || avatar.bodyType,
          height: customizationData.height || avatar.height,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      // Update equipped status for assets
      await this.updateEquippedAssets(userId, customizationData);

      return updatedAvatar;
    } catch (err) {
      this.logger.error(
        `Failed to customize avatar: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Validate that user owns all assets they're trying to equip
   */
  private async validateAssetOwnership(
    userId: string,
    customizationData: AvatarCustomizationData
  ) {
    const assetIds = Object.values(customizationData).filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    if (assetIds.length === 0) return; // No assets to validate

    // Check if user owns all these assets
    const ownedAssets = await this.prisma.userAvatarAsset.findMany({
      where: {
        userId,
        assetId: { in: assetIds },
      },
      select: { assetId: true },
    });

    const ownedAssetIds = ownedAssets.map((asset) => asset.assetId);
    const missingAssets = assetIds.filter((id) => !ownedAssetIds.includes(id));

    if (missingAssets.length > 0) {
      throw new ForbiddenException(
        `User does not own the following assets: ${missingAssets.join(', ')}`
      );
    }
  }

  /**
   * Update equipped status for assets
   */
  private async updateEquippedAssets(
    userId: string,
    customizationData: AvatarCustomizationData
  ) {
    const equippedAssetIds = Object.values(customizationData).filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    // First, unequip all currently equipped assets
    await this.prisma.userAvatarAsset.updateMany({
      where: { userId, isEquipped: true },
      data: { isEquipped: false },
    });

    // Then equip the new assets
    if (equippedAssetIds.length > 0) {
      await this.prisma.userAvatarAsset.updateMany({
        where: {
          userId,
          assetId: { in: equippedAssetIds },
        },
        data: { isEquipped: true },
      });
    }
  }

  /**
   * Get user's owned avatar assets
   */
  async getUserAssets(userId: string) {
    try {
      return await this.prisma.userAvatarAsset.findMany({
        where: { userId },
        include: {
          asset: true,
        },
        orderBy: [{ isEquipped: 'desc' }, { acquiredAt: 'desc' }],
      });
    } catch (err) {
      this.logger.error(
        `Failed to get user avatar assets: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Purchase an avatar asset
   */
  async purchaseAsset(userId: string, assetId: string) {
    try {
      // Check if asset exists and is available
      const asset = await this.prisma.avatarAsset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new NotFoundException('Avatar asset not found');
      }

      if (!asset.isActive) {
        throw new BadRequestException('Avatar asset is not available');
      }

      // Check if user already owns this asset
      const existingOwnership = await this.prisma.userAvatarAsset.findUnique({
        where: {
          userId_assetId: {
            userId,
            assetId,
          },
        },
      });

      if (existingOwnership) {
        throw new BadRequestException('User already owns this asset');
      }

      // Check user's DojoCoin balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { dojoCoinBalance: true },
      });

      if (!user || user.dojoCoinBalance < asset.price) {
        throw new BadRequestException('Insufficient DojoCoins');
      }

      // Perform purchase in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Deduct DojoCoins
        await tx.user.update({
          where: { id: userId },
          data: {
            dojoCoinBalance: { decrement: asset.price },
          },
        });

        // Create ownership record
        const ownership = await tx.userAvatarAsset.create({
          data: {
            userId,
            assetId,
            acquiredVia: 'purchase',
          },
          include: {
            asset: true,
          },
        });

        return ownership;
      });

      return result;
    } catch (err) {
      this.logger.error(
        `Failed to purchase avatar asset: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Award avatar asset to user (for achievements, events, etc.)
   */
  async awardAsset(userId: string, assetId: string, reason: string = 'reward') {
    try {
      // Check if asset exists
      const asset = await this.prisma.avatarAsset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new NotFoundException('Avatar asset not found');
      }

      // Check if user already owns this asset
      const existingOwnership = await this.prisma.userAvatarAsset.findUnique({
        where: {
          userId_assetId: {
            userId,
            assetId,
          },
        },
      });

      if (existingOwnership) {
        // Already owns it, just return existing ownership
        return existingOwnership;
      }

      // Create ownership record
      return await this.prisma.userAvatarAsset.create({
        data: {
          userId,
          assetId,
          acquiredVia: reason,
        },
        include: {
          asset: true,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to award avatar asset: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Reset avatar to default configuration
   */
  async resetAvatar(userId: string) {
    try {
      const avatar = await this.prisma.avatar.findUnique({
        where: { userId },
      });

      if (!avatar) {
        throw new NotFoundException('Avatar not found');
      }

      // Unequip all assets
      await this.prisma.userAvatarAsset.updateMany({
        where: { userId, isEquipped: true },
        data: { isEquipped: false },
      });

      // Reset avatar configuration
      return await this.prisma.avatar.update({
        where: { userId },
        data: {
          configuration: {},
          skinTone: '#F5DEB3',
          bodyType: 'athletic',
          height: 1.0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to reset avatar: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Unlock avatar feature for user
   */
  async unlockFeature(userId: string, feature: string) {
    try {
      const avatar = await this.prisma.avatar.findUnique({
        where: { userId },
      });

      if (!avatar) {
        throw new NotFoundException('Avatar not found');
      }

      const unlockedFeatures = avatar.unlockedFeatures || [];
      if (unlockedFeatures.includes(feature)) {
        return avatar; // Already unlocked
      }

      return await this.prisma.avatar.update({
        where: { userId },
        data: {
          unlockedFeatures: [...unlockedFeatures, feature],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to unlock avatar feature: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }
}
