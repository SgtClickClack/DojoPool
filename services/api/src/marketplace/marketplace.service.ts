import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CACHE_PRESETS,
  StandardizedCacheService,
} from '../cache/standardized-cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StandardizedCacheService
  ) {}

  /**
   * Read-heavy endpoint with standardized caching
   */
  async listItems() {
    const cacheKey = 'list';

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.marketplaceItem.findMany({
          include: {
            communityItem: {
              include: {
                creator: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      CACHE_PRESETS.MARKETPLACE_ITEMS
    );
  }

  /**
   * Purchase marketplace item with cache invalidation
   */
  async buyItem(userId: string, itemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
      });
      if (!item) throw new NotFoundException('Item not found');

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { dojoCoinBalance: true },
      });
      if (!user) throw new NotFoundException('User not found');

      if (user.dojoCoinBalance < item.price) {
        throw new BadRequestException('Insufficient DojoCoins');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { dojoCoinBalance: { decrement: item.price } },
        select: { id: true, dojoCoinBalance: true },
      });

      const inventoryItem = await tx.userInventoryItem.create({
        data: {
          userId,
          itemId: item.id,
        },
      });

      // Invalidate related caches
      await this.cache.invalidateMarketplaceData();
      await this.cache.invalidateUserData(userId);

      return { balance: updatedUser.dojoCoinBalance, inventoryItem };
    });
  }

  /**
   * Create a clan marketplace listing
   */
  async createClanListing(data: {
    sellerId: string;
    clanId: string;
    assetId: string;
    assetType: 'AVATAR_ASSET' | 'MARKETPLACE_ITEM';
    price: number;
  }) {
    // Validate user is clan member
    const membership = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId: data.clanId,
          userId: data.sellerId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this clan');
    }

    // Validate asset ownership
    if (data.assetType === 'AVATAR_ASSET') {
      const ownedAsset = await this.prisma.userAvatarAsset.findUnique({
        where: {
          userId_assetId: {
            userId: data.sellerId,
            assetId: data.assetId,
          },
        },
      });

      if (!ownedAsset) {
        throw new BadRequestException('User does not own this asset');
      }
    }

    return this.prisma.listing.create({
      data: {
        sellerId: data.sellerId,
        clanId: data.clanId,
        listingType: 'CLAN_MARKETPLACE',
        assetId: data.assetId,
        assetType: data.assetType,
        price: data.price,
      },
    });
  }

  /**
   * Get clan marketplace listings with standardized caching
   */
  async getClanListings(clanId: string) {
    const cacheKey = `clan:${clanId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.listing.findMany({
          where: {
            clanId,
            listingType: 'CLAN_MARKETPLACE',
            isActive: true,
          },
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      CACHE_PRESETS.MARKETPLACE_ITEMS
    );
  }

  /**
   * Buy from clan marketplace using clan wallet
   */
  async buyFromClanMarketplace(data: {
    buyerId: string;
    listingId: string;
    clanId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Get listing
      const listing = await tx.listing.findUnique({
        where: { id: data.listingId },
      });

      if (!listing || !listing.isActive || listing.clanId !== data.clanId) {
        throw new NotFoundException('Listing not found or inactive');
      }

      // Validate buyer is clan member
      const membership = await tx.clanMember.findUnique({
        where: {
          clanId_userId: {
            clanId: data.clanId,
            userId: data.buyerId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('Buyer is not a member of this clan');
      }

      // Check clan balance (using clan.dojoCoinBalance)
      const clan = await tx.clan.findUnique({
        where: { id: data.clanId },
        select: { dojoCoinBalance: true },
      });

      if (!clan || clan.dojoCoinBalance < listing.price) {
        throw new BadRequestException('Clan has insufficient DojoCoins');
      }

      // Transfer asset ownership
      if (listing.assetType === 'AVATAR_ASSET') {
        await tx.userAvatarAsset.update({
          where: {
            userId_assetId: {
              userId: listing.sellerId,
              assetId: listing.assetId,
            },
          },
          data: { userId: data.buyerId },
        });
      }

      // Update clan balance
      const newBalance = clan.dojoCoinBalance - listing.price;
      await tx.clan.update({
        where: { id: data.clanId },
        data: {
          dojoCoinBalance: newBalance,
        },
      });

      // Record transaction
      await tx.clanTransaction.create({
        data: {
          clanId: data.clanId,
          userId: data.buyerId,
          type: 'MARKETPLACE_PURCHASE',
          amount: -listing.price,
          sellerId: listing.sellerId,
        },
      });

      // Deactivate listing
      await tx.listing.update({
        where: { id: data.listingId },
        data: { status: 'sold' },
      });

      return {
        success: true,
        newBalance,
        assetTransferred: true,
      };
    });
  }

  /**
   * Deposit DojoCoins to clan wallet
   */
  async depositToClanWallet(data: {
    userId: string;
    clanId: string;
    amount: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Validate user membership
      const membership = await tx.clanMember.findUnique({
        where: {
          clanId_userId: {
            clanId: data.clanId,
            userId: data.userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('User is not a member of this clan');
      }

      // Check user balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { dojoCoinBalance: true },
      });

      if (!user || user.dojoCoinBalance < data.amount) {
        throw new BadRequestException('Insufficient DojoCoins');
      }

      // Get clan balance
      const clan = await tx.clan.findUnique({
        where: { id: data.clanId },
        select: { dojoCoinBalance: true },
      });

      if (!clan) {
        throw new NotFoundException('Clan not found');
      }

      // Update balances
      const newUserBalance = user.dojoCoinBalance - data.amount;
      const newClanBalance = clan.dojoCoinBalance + data.amount;

      await tx.user.update({
        where: { id: data.userId },
        data: { dojoCoinBalance: newUserBalance },
      });

      await tx.clan.update({
        where: { id: data.clanId },
        data: {
          dojoCoinBalance: newClanBalance,
        },
      });

      // Record transaction
      await tx.clanTransaction.create({
        data: {
          clanId: data.clanId,
          userId: data.userId,
          type: 'DEPOSIT',
          amount: data.amount,
          targetUserId: null,
        },
      });

      return {
        success: true,
        newUserBalance,
        newClanBalance,
      };
    });
  }

  /**
   * Withdraw DojoCoins from clan wallet
   */
  async withdrawFromClanWallet(data: {
    userId: string;
    clanId: string;
    amount: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Validate user membership and permissions
      const membership = await tx.clanMember.findUnique({
        where: {
          clanId_userId: {
            clanId: data.clanId,
            userId: data.userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('User is not a member of this clan');
      }

      // Only officers and leaders can withdraw
      if (!['OFFICER', 'COLEADER', 'LEADER'].includes(membership.role)) {
        throw new ForbiddenException(
          'Insufficient permissions to withdraw from clan wallet'
        );
      }

      // Get clan balance
      const clan = await tx.clan.findUnique({
        where: { id: data.clanId },
        select: { dojoCoinBalance: true },
      });

      if (!clan || clan.dojoCoinBalance < data.amount) {
        throw new BadRequestException('Clan has insufficient DojoCoins');
      }

      // Update balances
      const newClanBalance = clan.dojoCoinBalance - data.amount;

      await tx.user.update({
        where: { id: data.userId },
        data: { dojoCoinBalance: { increment: data.amount } },
      });

      await tx.clan.update({
        where: { id: data.clanId },
        data: {
          dojoCoinBalance: newClanBalance,
        },
      });

      // Record transaction
      await tx.clanTransaction.create({
        data: {
          clanId: data.clanId,
          userId: data.userId,
          type: 'WITHDRAWAL',
          amount: -data.amount,
          targetUserId: data.userId,
        },
      });

      return {
        success: true,
        newClanBalance,
      };
    });
  }

  /**
   * Get clan wallet details
   */
  async getClanWallet(clanId: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      select: {
        id: true,
        name: true,
        tag: true,
        dojoCoinBalance: true,
        leader: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!clan) {
      throw new NotFoundException('Clan not found');
    }

    const transactions = await this.prisma.clanTransaction.findMany({
      where: { clanId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 transactions
    });

    return {
      clanId: clan.id,
      balance: clan.dojoCoinBalance,
      totalDeposits: 0, // Would need to be calculated from transactions
      totalWithdrawals: 0, // Would need to be calculated from transactions
      clan,
      transactions,
    };
  }
}
