import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Define enums locally
export enum ProductCategory {
  CUE = 'CUE',
  CHALK = 'CHALK',
  TABLE_FELT = 'TABLE_FELT',
  ACCESSORY = 'ACCESSORY',
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

@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(private prismaService: PrismaService) {}

  /**
   * Get all available products for the storefront
   */
  async getStorefrontProducts(userId: string, category?: ProductCategory) {
    try {
      const where: any = {
        // Note: These fields may not exist in the current schema
        // isActive: true,
        // isAvailable: true,
      };

      if (category) {
        where.category = category;
      }

      const products = await this.prismaService.item.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
      });

      // Get user's owned products for ownership status
      const ownedProducts = await this.getUserOwnedProducts(userId);

      // Enrich products with ownership status
      const enrichedProducts = products.map((product) => ({
        ...product,
        isOwned: ownedProducts.has(product.id),
        canPurchase: !product.isUnique || !ownedProducts.has(product.id),
      }));

      this.logger.log(`Retrieved ${products.length} products for storefront`);
      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to get storefront products: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get featured products for homepage/storefront
   */
  async getFeaturedProducts(limit: number = 6) {
    try {
      const products = await this.prismaService.item.findMany({
        take: limit,
        orderBy: [
          { createdAt: 'desc' }, // Using createdAt as fallback since featuredOrder doesn't exist
        ],
      });

      this.logger.log(`Retrieved ${products.length} featured products`);
      return products;
    } catch (error) {
      this.logger.error(
        `Failed to get featured products: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get product details by ID
   */
  async getProductById(productId: string, userId: string) {
    try {
      const product = await this.prismaService.item.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check ownership
      const isOwned = await this.checkProductOwnership(userId, productId);

      return {
        ...product,
        isOwned,
        canPurchase: true, // Items are consumable by default
      };
    } catch (error) {
      this.logger.error(
        `Failed to get product ${productId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory, userId: string) {
    try {
      const products = await this.prismaService.item.findMany({
        where: {
          type: category, // Map category to type field
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      // Get ownership status
      const ownedProducts = await this.getUserOwnedProducts(userId);

      const enrichedProducts = products.map((product) => ({
        ...product,
        isOwned: ownedProducts.has(product.id),
        canPurchase: !product.isUnique || !ownedProducts.has(product.id),
      }));

      this.logger.log(
        `Retrieved ${products.length} products in category ${category}`
      );
      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to get products by category ${category}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, userId: string, limit: number = 20) {
    try {
      const products = await this.prismaService.item.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      });

      // Get ownership status
      const ownedProducts = await this.getUserOwnedProducts(userId);

      const enrichedProducts = products.map((product) => ({
        ...product,
        isOwned: ownedProducts.has(product.id),
        canPurchase: true, // Items are consumable by default
      }));

      this.logger.log(
        `Search returned ${products.length} products for query: ${query}`
      );
      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to search products: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get user's purchase history
   */
  async getUserPurchaseHistory(userId: string, limit: number = 50) {
    try {
      const transactions = await this.prismaService.transaction.findMany({
        where: {
          userId,
          type: 'PURCHASE', // Assuming purchases are marked with this type
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(
        `Retrieved ${transactions.length} transactions for user ${userId}`
      );
      return transactions;
    } catch (error) {
      this.logger.error(
        `Failed to get purchase history for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get user's inventory
   */
  async getUserInventory(userId: string) {
    try {
      const inventory = await this.prismaService.userInventoryItem.findMany({
        where: {
          userId,
          quantity: { gt: 0 },
        },
        include: {
          // Note: UserInventoryItem doesn't have a direct relation to Item in schema
        },
        orderBy: { acquiredAt: 'desc' },
      });

      this.logger.log(
        `Retrieved ${inventory.length} inventory items for user ${userId}`
      );
      return inventory;
    } catch (error) {
      this.logger.error(
        `Failed to get inventory for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Helper method to get user's owned products
   */
  private async getUserOwnedProducts(userId: string): Promise<Set<string>> {
    const ownedProducts = new Set<string>();

    try {
      // Get owned inventory items
      const inventoryItems =
        await this.prismaService.userInventoryItem.findMany({
          where: {
            userId,
            quantity: { gt: 0 },
          },
          select: { itemId: true },
        });

      inventoryItems.forEach((item) => {
        ownedProducts.add(item.itemId);
      });

      // Get items from purchase transactions
      const purchaseTransactions =
        await this.prismaService.transaction.findMany({
          where: {
            userId,
            type: 'PURCHASE',
          },
          select: { description: true }, // Assuming item ID might be in description
        });

      // Note: This is a simplified version. In a real implementation,
      // you might need to parse the description or use a different field
      // to extract item IDs from transactions
    } catch (error) {
      this.logger.error(
        `Failed to get owned products for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return ownedProducts;
  }

  /**
   * Helper method to check if user owns a specific product
   */
  private async checkProductOwnership(
    userId: string,
    productId: string
  ): Promise<boolean> {
    const ownedProducts = await this.getUserOwnedProducts(userId);
    return ownedProducts.has(productId);
  }

  /**
   * Get product analytics (for admin use)
   */
  async getProductAnalytics(
    productId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    try {
      const whereClause: any = {
        type: 'PURCHASE',
        // Note: We don't have a direct productId field in Transaction
        // This would need to be adjusted based on how purchases are tracked
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

      const analytics = {
        totalPurchases: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        avgPrice:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + t.amount, 0) /
              transactions.length
            : 0,
        uniqueBuyers: new Set(transactions.map((t) => t.userId)).size,
      };

      this.logger.log(`Retrieved analytics for product ${productId}`);
      return analytics;
    } catch (error) {
      this.logger.error(
        `Failed to get analytics for product ${productId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get overall monetization metrics
   */
  async getMonetizationMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      const whereClause: any = {
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

      const metrics = {
        totalTransactions: transactions.length,
        uniqueCustomers: new Set(transactions.map((t) => t.userId)).size,
        totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        avgTransactionValue:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + t.amount, 0) /
              transactions.length
            : 0,
      };

      this.logger.log('Retrieved overall monetization metrics');
      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get monetization metrics: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
