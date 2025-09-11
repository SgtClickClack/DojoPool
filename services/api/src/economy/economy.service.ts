import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Transaction, TxType } from '@dojopool/prisma';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

export interface DojoCoinBalance {
  userId: string;
  balance: number;
  lastUpdated: Date;
}

export interface PurchaseRequest {
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentToken?: string;
}

export interface PurchaseResponse {
  transactionId: string;
  amount: number;
  newBalance: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

@Injectable()
export class EconomyService {
  private readonly logger = new Logger(EconomyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's DojoCoin balance
   */
  async getBalance(userId: string): Promise<DojoCoinBalance> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          dojoCoinBalance: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return {
        userId: user.id,
        balance: user.dojoCoinBalance,
        lastUpdated: user.updatedAt,
      };
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('get DojoCoin balance', userId, err)
      );
      throw err;
    }
  }

  /**
   * Process DojoCoin purchase
   */
  async processPurchase(request: PurchaseRequest): Promise<PurchaseResponse> {
    const { userId, amount, paymentMethod, paymentToken } = request;

    try {
      // Validate amount
      if (amount <= 0) {
        throw new BadRequestException('Purchase amount must be positive');
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Process purchase in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            amount,
            currency: 'DOJO',
            type: TxType.PURCHASE,
            metadata: {
              paymentMethod,
              paymentToken,
              status: 'COMPLETED',
            },
          },
        });

        // Update user balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            dojoCoinBalance: {
              increment: amount,
            },
          },
        });

        return {
          transaction,
          newBalance: updatedUser.dojoCoinBalance,
        };
      });

      this.logger.log(
        `Purchase completed for user ${userId}: ${amount} DojoCoins`
      );

      return {
        transactionId: result.transaction.id,
        amount,
        newBalance: result.newBalance,
        status: 'COMPLETED',
      };
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('process DojoCoin purchase', userId, err)
      );

      // Create failed transaction record
      try {
        await this.prisma.transaction.create({
          data: {
            userId,
            amount,
            currency: 'DOJO',
            type: TxType.PURCHASE,
            metadata: {
              paymentMethod,
              paymentToken,
              status: 'FAILED',
              error: ErrorUtils.getErrorMessage(err),
            },
          },
        });
      } catch (logErr) {
        this.logger.error('Failed to log failed transaction:', logErr);
      }

      throw err;
    }
  }

  /**
   * Debit DojoCoins from user account
   */
  async debitCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{ transaction: Transaction; newBalance: number }> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('Debit amount must be positive');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Check balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { dojoCoinBalance: true },
        });

        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (user.dojoCoinBalance < amount) {
          throw new BadRequestException('Insufficient DojoCoin balance');
        }

        // Create debit transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            amount: -amount, // Negative for debits
            currency: 'DOJO',
            type: TxType.DEBIT,
            metadata: {
              reason,
              ...metadata,
            },
          },
        });

        // Update balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            dojoCoinBalance: {
              decrement: amount,
            },
          },
        });

        return {
          transaction,
          newBalance: updatedUser.dojoCoinBalance,
        };
      });

      this.logger.log(
        `Debit completed for user ${userId}: -${amount} DojoCoins (${reason})`
      );

      return result;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('debit DojoCoins', userId, err)
      );
      throw err;
    }
  }

  /**
   * Credit DojoCoins to user account
   */
  async creditCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{ transaction: Transaction; newBalance: number }> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('Credit amount must be positive');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Verify user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { dojoCoinBalance: true },
        });

        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Create credit transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            amount,
            currency: 'DOJO',
            type: TxType.CREDIT,
            metadata: {
              reason,
              ...metadata,
            },
          },
        });

        // Update balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            dojoCoinBalance: {
              increment: amount,
            },
          },
        });

        return {
          transaction,
          newBalance: updatedUser.dojoCoinBalance,
        };
      });

      this.logger.log(
        `Credit completed for user ${userId}: +${amount} DojoCoins (${reason})`
      );

      return result;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('credit DojoCoins', userId, err)
      );
      throw err;
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Transaction[]> {
    try {
      return await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('get transaction history', userId, err)
      );
      throw err;
    }
  }

  /**
   * Transfer DojoCoins between users
   */
  async transferCoins(
    fromUserId: string,
    toUserId: string,
    amount: number,
    reason: string
  ): Promise<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('Transfer amount must be positive');
      }

      if (fromUserId === toUserId) {
        throw new BadRequestException('Cannot transfer to self');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // Check sender balance
        const sender = await tx.user.findUnique({
          where: { id: fromUserId },
          select: { dojoCoinBalance: true },
        });

        if (!sender) {
          throw new NotFoundException(
            `Sender user with ID ${fromUserId} not found`
          );
        }

        if (sender.dojoCoinBalance < amount) {
          throw new BadRequestException('Insufficient DojoCoin balance');
        }

        // Verify receiver exists
        const receiver = await tx.user.findUnique({
          where: { id: toUserId },
          select: { id: true },
        });

        if (!receiver) {
          throw new NotFoundException(
            `Receiver user with ID ${toUserId} not found`
          );
        }

        // Create debit transaction for sender
        const fromTransaction = await tx.transaction.create({
          data: {
            userId: fromUserId,
            amount: -amount,
            currency: 'DOJO',
            type: TxType.DEBIT,
            metadata: {
              reason,
              transferTo: toUserId,
              type: 'transfer_out',
            },
          },
        });

        // Create credit transaction for receiver
        const toTransaction = await tx.transaction.create({
          data: {
            userId: toUserId,
            amount,
            currency: 'DOJO',
            type: TxType.CREDIT,
            metadata: {
              reason,
              transferFrom: fromUserId,
              type: 'transfer_in',
            },
          },
        });

        // Update balances
        await tx.user.update({
          where: { id: fromUserId },
          data: {
            dojoCoinBalance: {
              decrement: amount,
            },
          },
        });

        await tx.user.update({
          where: { id: toUserId },
          data: {
            dojoCoinBalance: {
              increment: amount,
            },
          },
        });

        return {
          fromTransaction,
          toTransaction,
        };
      });

      this.logger.log(
        `Transfer completed: ${fromUserId} -> ${toUserId}: ${amount} DojoCoins (${reason})`
      );

      return result;
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage(
          'transfer DojoCoins',
          `${fromUserId} -> ${toUserId}`,
          err
        )
      );
      throw err;
    }
  }
}
