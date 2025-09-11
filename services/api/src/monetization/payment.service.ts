import type { Transaction } from '@dojopool/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Define payment-related enums since they're not imported
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
  STRIPE = 'STRIPE',
}

export enum ProductType {
  CONSUMABLE = 'CONSUMABLE',
  NON_CONSUMABLE = 'NON_CONSUMABLE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Simple interfaces for payment provider
export interface PaymentProvider {
  processPayment(
    amount: number,
    currency: string,
    paymentData: any
  ): Promise<any>;
  refundPayment(transactionId: string): Promise<any>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private paymentProviders: Map<PaymentMethod, PaymentProvider> = new Map();

  constructor(private prismaService: PrismaService) {}

  /**
   * Register a payment provider
   */
  registerPaymentProvider(method: PaymentMethod, provider: PaymentProvider) {
    this.paymentProviders.set(method, provider);
    this.logger.log(`Registered payment provider for ${method}`);
  }

  /**
   * Initialize a purchase transaction
   */
  async initiatePurchase(
    userId: string,
    productId: string,
    paymentMethod: PaymentMethod,
    metadata?: Record<string, any>
  ) {
    try {
      // Validate user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate product exists
      const product = await this.prismaService.item.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if user already owns non-consumable product
      if (product.type === ProductType.NON_CONSUMABLE) {
        const existingInventory =
          await this.prismaService.userInventoryItem.findFirst({
            where: {
              userId,
              itemId: productId,
              quantity: { gt: 0 },
            },
          });
        if (existingInventory) {
          throw new Error('User already owns this product');
        }
      }

      // Create transaction record using existing Transaction model
      const transaction = await this.prismaService.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: product.price,
          description: JSON.stringify({
            productId,
            productName: product.name,
            productType: product.type,
            userEmail: user.email,
            paymentMethod,
            status: PurchaseStatus.PENDING,
            ...metadata,
          }),
        },
      });

      // Get payment provider
      const provider = this.paymentProviders.get(paymentMethod);
      if (!provider) {
        throw new Error(`Payment provider not available for ${paymentMethod}`);
      }

      // Initiate payment with provider
      const paymentData = await provider.processPayment(product.price, 'USD', {
        transactionId: transaction.id,
        userId,
        productId,
      });

      this.logger.log(
        `Initiated purchase for user ${userId}, product ${productId}`
      );
      return {
        transactionId: transaction.id,
        paymentData,
        amount: product.price,
        currency: 'USD', // Default currency
      };
    } catch (error) {
      this.logger.error(
        `Failed to initiate purchase: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Complete a purchase transaction
   */
  async completePurchase(
    transactionId: string,
    paymentData: any,
    paymentMethod: PaymentMethod
  ) {
    try {
      const transaction = await this.prismaService.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Parse transaction metadata to get status and product info
      const metadata = JSON.parse(transaction.description || '{}');
      if (metadata.status !== PurchaseStatus.PENDING) {
        throw new Error('Transaction is not in pending state');
      }

      // Get payment provider
      const provider = this.paymentProviders.get(paymentMethod);
      if (!provider) {
        throw new Error(`Payment provider not available for ${paymentMethod}`);
      }

      // Validate payment with provider
      const validationResult = await provider.processPayment(
        transaction.amount,
        'USD',
        paymentData
      );

      if (!validationResult) {
        // Update transaction as failed
        await this.prismaService.transaction.update({
          where: { id: transactionId },
          data: {
            description: JSON.stringify({
              ...metadata,
              status: PurchaseStatus.FAILED,
              failureReason: 'Payment validation failed',
              updatedAt: new Date(),
            }),
          },
        });

        throw new Error('Payment validation failed');
      }

      // Update transaction as completed
      await this.prismaService.transaction.update({
        where: { id: transactionId },
        data: {
          description: JSON.stringify({
            ...metadata,
            status: PurchaseStatus.COMPLETED,
            paymentId: validationResult.id || transactionId,
            completedAt: new Date(),
          }),
        },
      });

      // Grant product to user
      await this.grantProductToUser(
        transaction.userId,
        metadata.productId,
        metadata.productType
      );

      // Send success notifications
      await this.sendPurchaseNotifications(transaction);

      this.logger.log(`Completed purchase for transaction ${transactionId}`);
      return {
        success: true,
        transactionId,
        productGranted: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to complete purchase ${transactionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(transactionId: string, reason: string) {
    try {
      const transaction = await this.prismaService.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const metadata = JSON.parse(transaction.description || '{}');
      await this.prismaService.transaction.update({
        where: { id: transactionId },
        data: {
          description: JSON.stringify({
            ...metadata,
            status: PurchaseStatus.FAILED,
            failureReason: reason,
            failedAt: new Date(),
          }),
        },
      });

      this.logger.log(
        `Marked transaction ${transactionId} as failed: ${reason}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle failed payment ${transactionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Refund a purchase
   */
  async refundPurchase(transactionId: string, reason: string, amount?: number) {
    try {
      const transaction = await this.prismaService.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const metadata = JSON.parse(transaction.description || '{}');
      if (metadata.status !== PurchaseStatus.COMPLETED) {
        throw new Error('Only completed transactions can be refunded');
      }

      // Get payment provider
      const provider = this.paymentProviders.get(metadata.paymentMethod);
      if (!provider) {
        throw new Error(
          `Payment provider not available for ${metadata.paymentMethod}`
        );
      }

      // Process refund
      const refundAmount = amount || transaction.amount;
      const refundResult = await provider.refundPayment(transactionId);

      // Update transaction
      await this.prismaService.transaction.update({
        where: { id: transactionId },
        data: {
          description: JSON.stringify({
            ...metadata,
            status: PurchaseStatus.REFUNDED,
            refundReason: reason,
            refundAmount,
            refundId: refundResult?.id || `refund_${transactionId}`,
            refundedAt: new Date(),
          }),
        },
      });

      // Revoke product from user
      await this.revokeProductFromUser(
        transaction.userId,
        metadata.productId,
        metadata.productType
      );

      this.logger.log(`Processed refund for transaction ${transactionId}`);
      return {
        success: true,
        refundId: refundResult?.id || `refund_${transactionId}`,
        amount: refundAmount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to refund transaction ${transactionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionId: string, userId: string) {
    try {
      const transaction = await this.prismaService.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const metadata = JSON.parse(transaction.description || '{}');

      return {
        id: transaction.id,
        productName: metadata.productName,
        amount: transaction.amount,
        currency: 'USD', // Default currency
        status: metadata.status,
        paymentMethod: metadata.paymentMethod,
        createdAt: transaction.createdAt,
        completedAt: metadata.completedAt || null,
        metadata,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get transaction details ${transactionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Grant product to user after successful purchase
   */
  private async grantProductToUser(
    userId: string,
    productId: string,
    productType: string
  ) {
    try {
      if (productType === ProductType.CONSUMABLE) {
        // Add to inventory with quantity
        const existingInventory =
          await this.prismaService.userInventoryItem.findFirst({
            where: { userId, itemId: productId },
          });

        if (existingInventory) {
          await this.prismaService.userInventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              quantity: existingInventory.quantity + 1,
              acquiredAt: new Date(),
            },
          });
        } else {
          await this.prismaService.userInventoryItem.create({
            data: {
              userId,
              itemId: productId,
              quantity: 1,
              acquiredAt: new Date(),
            },
          });
        }
      } else if (productType === ProductType.NON_CONSUMABLE) {
        // Add to inventory with quantity 1 (permanent)
        await this.prismaService.userInventoryItem.create({
          data: {
            userId,
            itemId: productId,
            quantity: 1,
            acquiredAt: new Date(),
          },
        });
      } else if (productType === ProductType.SUBSCRIPTION) {
        // Handle subscription logic here if needed
        this.logger.log(
          `Subscription granted for product ${productId} to user ${userId}`
        );
      }

      this.logger.log(`Granted product ${productId} to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to grant product ${productId} to user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Revoke product from user (for refunds)
   */
  private async revokeProductFromUser(
    userId: string,
    productId: string,
    productType: string
  ) {
    try {
      if (productType === ProductType.CONSUMABLE) {
        // Reduce inventory quantity
        const inventory = await this.prismaService.userInventoryItem.findFirst({
          where: { userId, itemId: productId },
        });

        if (inventory && inventory.quantity > 0) {
          const newQuantity = inventory.quantity - 1;

          if (newQuantity <= 0) {
            await this.prismaService.userInventoryItem.delete({
              where: { id: inventory.id },
            });
          } else {
            await this.prismaService.userInventoryItem.update({
              where: { id: inventory.id },
              data: {
                quantity: newQuantity,
                acquiredAt: new Date(),
              },
            });
          }
        }
      } else if (productType === ProductType.NON_CONSUMABLE) {
        // Remove from inventory
        const inventory = await this.prismaService.userInventoryItem.findFirst({
          where: { userId, itemId: productId },
        });
        if (inventory) {
          await this.prismaService.userInventoryItem.delete({
            where: { id: inventory.id },
          });
        }
      } else if (productType === ProductType.SUBSCRIPTION) {
        // Handle subscription revocation here if needed
        this.logger.log(
          `Subscription revoked for product ${productId} from user ${userId}`
        );
      }

      this.logger.log(`Revoked product ${productId} from user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to revoke product ${productId} from user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Send purchase notifications
   */
  private async sendPurchaseNotifications(transaction: Transaction) {
    try {
      // In a real implementation, this would send email notifications,
      // push notifications, and update analytics systems
      this.logger.log(
        `Sent purchase notifications for transaction ${transaction.id}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notifications for transaction ${transaction.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(dateRange?: { start: Date; end: Date }) {
    try {
      let whereClause: any = {
        type: 'PURCHASE',
      };

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const transactions = await this.prismaService.transaction.findMany({
        where: whereClause,
      });

      const metadataList = transactions.map((t) =>
        JSON.parse(t.description || '{}')
      );

      const analytics = {
        totalTransactions: transactions.length,
        successfulTransactions: metadataList.filter(
          (m) => m.status === PurchaseStatus.COMPLETED
        ).length,
        failedTransactions: metadataList.filter(
          (m) => m.status === PurchaseStatus.FAILED
        ).length,
        totalRevenue: transactions
          .filter(
            (t) =>
              JSON.parse(t.description || '{}').status ===
              PurchaseStatus.COMPLETED
          )
          .reduce((sum, t) => sum + t.amount, 0),
        avgTransactionValue: (() => {
          const completed = transactions.filter(
            (t) =>
              JSON.parse(t.description || '{}').status ===
              PurchaseStatus.COMPLETED
          );
          return completed.length > 0
            ? completed.reduce((sum, t) => sum + t.amount, 0) / completed.length
            : 0;
        })(),
        paymentMethods: (() => {
          const methodCounts: Record<string, number> = {};
          metadataList.forEach((m) => {
            const method = m.paymentMethod || 'UNKNOWN';
            methodCounts[method] = (methodCounts[method] || 0) + 1;
          });
          return methodCounts;
        })(),
      };

      this.logger.log('Retrieved payment analytics');
      return analytics;
    } catch (error) {
      this.logger.error(
        `Failed to get payment analytics: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
