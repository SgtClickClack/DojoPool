import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems() {
    return this.prisma.marketplaceItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

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
          itemId: item.id,
        },
      });

      return { balance: updatedUser.dojoCoinBalance, inventoryItem };
    });
  }
}
