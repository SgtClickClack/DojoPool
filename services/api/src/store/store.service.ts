import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog() {
    return this.prisma.item.findMany();
  }

  async purchaseItem(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.dojoCoinBalance < item.price) {
      throw new BadRequestException('Insufficient Dojo Coins');
    }

    // This is a simplified implementation. In a real app, you would
    // want to handle this transactionally to ensure data consistency.
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dojoCoinBalance: {
          decrement: item.price,
        },
      },
    });

    // Add the item to the user's inventory
    await this.prisma.userInventoryItem.create({
      data: {
        userId,
        itemId,
      },
    });

    return { success: true, message: 'Purchase successful' };
  }
}
