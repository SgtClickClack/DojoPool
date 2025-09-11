import { Controller, Get, Param, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('products')
  async getProducts(
    @Query('userId') userId: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number
  ) {
    if (category) {
      return this.storefrontService.getProductsByCategory(
        category as any,
        userId
      );
    }
    return this.storefrontService.getStorefrontProducts(userId);
  }

  @Get('products/featured')
  async getFeaturedProducts(@Query('limit') limit?: number) {
    return this.storefrontService.getFeaturedProducts(limit);
  }

  @Get('products/:id')
  async getProduct(
    @Param('id') productId: string,
    @Query('userId') userId: string
  ) {
    return this.storefrontService.getProductById(productId, userId);
  }

  @Get('search')
  async searchProducts(
    @Query('q') query: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.storefrontService.searchProducts(query, userId, limit);
  }
}
