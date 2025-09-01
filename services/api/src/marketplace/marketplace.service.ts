import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheHelper: CacheHelper
  ) {}

  /**
   * Read-heavy endpoint with caching
   */
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'marketplace:items',
    keyGenerator: () => CacheKey('marketplace', 'items', 'list'),
  })
  async listItems() {
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
  }

  /**
   * Write operation with cache invalidation
   */
  @CacheWriteThrough({
    ttl: 300,
    keyPrefix: 'marketplace:items',
    invalidatePatterns: ['marketplace:items:*', 'user:balance:*'],
    keyGenerator: (userId: string, itemId: string) =>
      CacheKey('marketplace', 'transaction', userId, itemId),
  })
  async buyItem(userId: string, itemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.marketplaceItem.findUnique({
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
          marketplaceItemId: item.id,
        },
      });

      return { balance: updatedUser.dojoCoinBalance, inventoryItem };
    });
  }
}
