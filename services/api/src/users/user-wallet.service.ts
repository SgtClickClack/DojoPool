import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { CacheInvalidate } from '../cache/cache.decorator';
import { CacheService } from '../cache/cache.service';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

export interface WalletTransaction {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference?: string;
}

@Injectable()
export class UserWalletService {
  private readonly logger = new Logger(UserWalletService.name);

  constructor(
    private _prisma: PrismaService,
    @Optional() private cacheService?: CacheService
  ) {}

  /**
   * Get user's current Dojo Coin balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const user = await this._prisma.user.findUnique({
        where: { id: userId },
        select: { dojoCoinBalance: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return user.dojoCoinBalance;
    } catch (err) {
      this.logger.error(
        `Failed to get balance for user ${userId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Add Dojo Coins to user's balance
   */
  @CacheInvalidate(['users:*'])
  async addToBalance(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    try {
      const user = await this._prisma.user.update({
        where: { id: userId },
        data: {
          dojoCoinBalance: {
            increment: amount,
          },
        },
      });

      // Log transaction
      await this.logTransaction({
        userId,
        amount,
        type: 'credit',
        description,
        reference,
      });

      this.logger.log(
        `Added ${amount} Dojo Coins to user ${userId}. New balance: ${user.dojoCoinBalance}`
      );

      return user;
    } catch (err) {
      this.logger.error(
        `Failed to add ${amount} Dojo Coins to user ${userId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Deduct Dojo Coins from user's balance
   */
  @CacheInvalidate(['users:*'])
  async deductFromBalance(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    try {
      // Check if user has sufficient balance
      const currentBalance = await this.getBalance(userId);
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Current: ${currentBalance}, Required: ${amount}`);
      }

      const user = await this._prisma.user.update({
        where: { id: userId },
        data: {
          dojoCoinBalance: {
            decrement: amount,
          },
        },
      });

      // Log transaction
      await this.logTransaction({
        userId,
        amount,
        type: 'debit',
        description,
        reference,
      });

      this.logger.log(
        `Deducted ${amount} Dojo Coins from user ${userId}. New balance: ${user.dojoCoinBalance}`
      );

      return user;
    } catch (err) {
      this.logger.error(
        `Failed to deduct ${amount} Dojo Coins from user ${userId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Transfer Dojo Coins between users
   */
  @CacheInvalidate(['users:*'])
  async transferBalance(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<{ fromUser: User; toUser: User }> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    try {
      // Use transaction to ensure atomicity
      const result = await this._prisma.$transaction(async (tx) => {
        // Check if sender has sufficient balance
        const fromUser = await tx.user.findUnique({
          where: { id: fromUserId },
          select: { dojoCoinBalance: true },
        });

        if (!fromUser) {
          throw new NotFoundException(`Sender user with ID ${fromUserId} not found`);
        }

        if (fromUser.dojoCoinBalance < amount) {
          throw new Error(`Insufficient balance. Current: ${fromUser.dojoCoinBalance}, Required: ${amount}`);
        }

        // Check if recipient exists
        const toUserExists = await tx.user.findUnique({
          where: { id: toUserId },
          select: { id: true },
        });

        if (!toUserExists) {
          throw new NotFoundException(`Recipient user with ID ${toUserId} not found`);
        }

        // Perform the transfer
        const [updatedFromUser, updatedToUser] = await Promise.all([
          tx.user.update({
            where: { id: fromUserId },
            data: { dojoCoinBalance: { decrement: amount } },
          }),
          tx.user.update({
            where: { id: toUserId },
            data: { dojoCoinBalance: { increment: amount } },
          }),
        ]);

        return { fromUser: updatedFromUser, toUser: updatedToUser };
      });

      // Log transactions for both users
      await Promise.all([
        this.logTransaction({
          userId: fromUserId,
          amount,
          type: 'debit',
          description: `${description} (Transfer to ${toUserId})`,
          reference,
        }),
        this.logTransaction({
          userId: toUserId,
          amount,
          type: 'credit',
          description: `${description} (Transfer from ${fromUserId})`,
          reference,
        }),
      ]);

      this.logger.log(
        `Transferred ${amount} Dojo Coins from user ${fromUserId} to user ${toUserId}`
      );

      return result;
    } catch (err) {
      this.logger.error(
        `Failed to transfer ${amount} Dojo Coins from user ${fromUserId} to user ${toUserId}: ${ErrorUtils.getErrorMessage(err)}`
      );
      throw err;
    }
  }

  /**
   * Log wallet transaction for audit purposes
   */
  private async logTransaction(transaction: WalletTransaction): Promise<void> {
    try {
      // This could be extended to use a dedicated transactions table
      // For now, we'll just log it
      this.logger.log(
        `Wallet Transaction: ${transaction.type} ${transaction.amount} for user ${transaction.userId} - ${transaction.description}`
      );
    } catch (err) {
      this.logger.error(
        `Failed to log transaction: ${ErrorUtils.getErrorMessage(err)}`
      );
    }
  }
}
