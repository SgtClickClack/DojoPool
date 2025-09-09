import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Trade, TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TradeProposal {
  proposerId: string;
  recipientId: string;
  proposerItems?: Array<{
    assetId: string;
    type: 'AVATAR_ASSET' | 'DOJO_COINS';
  }>;
  proposerCoins?: number;
  recipientItems?: Array<{
    assetId: string;
    type: 'AVATAR_ASSET' | 'DOJO_COINS';
  }>;
  recipientCoins?: number;
  message?: string;
  expiresInHours?: number;
}

export interface TradeResponse {
  tradeId: string;
  userId: string;
  accept: boolean;
}

@Injectable()
export class TradingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new trade proposal between two players
   */
  async proposeTrade(proposal: TradeProposal): Promise<Trade> {
    const {
      proposerId,
      recipientId,
      proposerItems = [],
      proposerCoins = 0,
      recipientItems = [],
      recipientCoins = 0,
      message,
      expiresInHours,
    } = proposal;

    // Validate users exist
    const [proposer, recipient] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: proposerId } }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
    ]);

    if (!proposer || !recipient) {
      throw new NotFoundException('One or both users not found');
    }

    // Validate proposer has the items they're offering
    await this.validateTradeItems(proposerId, proposerItems);

    // Validate recipient has the items they're offering
    await this.validateTradeItems(recipientId, recipientItems);

    // Validate DojoCoin balances
    if (proposer.dojoCoinBalance < proposerCoins) {
      throw new BadRequestException('Proposer has insufficient DojoCoins');
    }

    if (recipient.dojoCoinBalance < recipientCoins) {
      throw new BadRequestException('Recipient has insufficient DojoCoins');
    }

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    return this.prisma.trade.create({
      data: {
        proposerId,
        recipientId,
        proposerItems: JSON.stringify(proposerItems),
        proposerCoins,
        recipientItems: JSON.stringify(recipientItems),
        recipientCoins,
        message,
        expiresAt,
      },
    });
  }

  /**
   * Respond to a trade proposal (accept or reject)
   */
  async respondToTrade(response: TradeResponse): Promise<Trade> {
    const { tradeId, userId, accept } = response;

    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        proposer: true,
        recipient: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Validate user is the recipient
    if (trade.recipientId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can respond to this trade'
      );
    }

    // Check if trade is still valid
    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException('Trade is no longer pending');
    }

    if (trade.expiresAt && trade.expiresAt < new Date()) {
      // Auto-expire the trade
      await this.prisma.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.EXPIRED },
      });
      throw new BadRequestException('Trade has expired');
    }

    if (accept) {
      return this.executeTrade(trade);
    } else {
      return this.prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: TradeStatus.REJECTED,
          respondedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get pending trades for a user (as proposer or recipient)
   */
  async getPendingTrades(userId: string): Promise<Trade[]> {
    return this.prisma.trade.findMany({
      where: {
        OR: [
          { proposerId: userId, status: TradeStatus.PENDING },
          { recipientId: userId, status: TradeStatus.PENDING },
        ],
      },
      include: {
        proposer: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get trade history for a user
   */
  async getTradeHistory(userId: string): Promise<Trade[]> {
    return this.prisma.trade.findMany({
      where: {
        OR: [{ proposerId: userId }, { recipientId: userId }],
        status: {
          in: [
            TradeStatus.ACCEPTED,
            TradeStatus.REJECTED,
            TradeStatus.CANCELLED,
            TradeStatus.EXPIRED,
          ],
        },
      },
      include: {
        proposer: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Cancel a trade proposal (only by proposer)
   */
  async cancelTrade(tradeId: string, userId: string): Promise<Trade> {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.proposerId !== userId) {
      throw new ForbiddenException('Only the proposer can cancel this trade');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException('Trade cannot be cancelled');
    }

    return this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: TradeStatus.CANCELLED },
    });
  }

  /**
   * Validate that a user owns the items they're trying to trade
   */
  private async validateTradeItems(
    userId: string,
    items: Array<{ assetId: string; type: string }>
  ): Promise<void> {
    for (const item of items) {
      if (item.type === 'AVATAR_ASSET') {
        const ownedAsset = await this.prisma.userAvatarAsset.findUnique({
          where: {
            userId_assetId: {
              userId,
              assetId: item.assetId,
            },
          },
        });

        if (!ownedAsset) {
          throw new BadRequestException(
            `User does not own avatar asset ${item.assetId}`
          );
        }
      } else if (item.type === 'DOJO_COINS') {
        // DojoCoins are validated by balance check, not item ownership
        continue;
      } else {
        throw new BadRequestException(`Invalid item type: ${item.type}`);
      }
    }
  }

  /**
   * Execute a trade by transferring items and DojoCoins between users
   */
  private async executeTrade(trade: Trade): Promise<Trade> {
    const proposerItems = JSON.parse(trade.proposerItems as string);
    const recipientItems = JSON.parse(trade.recipientItems as string);

    return this.prisma.$transaction(async (tx) => {
      // Re-validate balances before execution
      const [proposer, recipient] = await Promise.all([
        tx.user.findUnique({
          where: { id: trade.proposerId },
          select: { dojoCoinBalance: true },
        }),
        tx.user.findUnique({
          where: { id: trade.recipientId },
          select: { dojoCoinBalance: true },
        }),
      ]);

      if (proposer!.dojoCoinBalance < trade.proposerCoins) {
        throw new BadRequestException('Proposer has insufficient DojoCoins');
      }

      if (recipient!.dojoCoinBalance < trade.recipientCoins) {
        throw new BadRequestException('Recipient has insufficient DojoCoins');
      }

      // Transfer DojoCoins
      await tx.user.update({
        where: { id: trade.proposerId },
        data: {
          dojoCoinBalance: { decrement: trade.proposerCoins },
        },
      });

      await tx.user.update({
        where: { id: trade.recipientId },
        data: {
          dojoCoinBalance: { decrement: trade.recipientCoins },
        },
      });

      await tx.user.update({
        where: { id: trade.proposerId },
        data: {
          dojoCoinBalance: { increment: trade.recipientCoins },
        },
      });

      await tx.user.update({
        where: { id: trade.recipientId },
        data: {
          dojoCoinBalance: { increment: trade.proposerCoins },
        },
      });

      // Transfer avatar assets
      for (const item of proposerItems) {
        if (item.type === 'AVATAR_ASSET') {
          await tx.userAvatarAsset.update({
            where: {
              userId_assetId: {
                userId: trade.proposerId,
                assetId: item.assetId,
              },
            },
            data: { userId: trade.recipientId },
          });
        }
      }

      for (const item of recipientItems) {
        if (item.type === 'AVATAR_ASSET') {
          await tx.userAvatarAsset.update({
            where: {
              userId_assetId: {
                userId: trade.recipientId,
                assetId: item.assetId,
              },
            },
            data: { userId: trade.proposerId },
          });
        }
      }

      // Update trade status
      return tx.trade.update({
        where: { id: trade.id },
        data: {
          status: TradeStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });
    });
  }
}
