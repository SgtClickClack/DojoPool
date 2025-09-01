import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items')
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'marketplace:items:',
  })
  async listItems() {
    return this.marketplaceService.listItems();
  }

  @Post('items/:itemId/buy')
  @CacheInvalidate(['marketplace:items:*'])
  async buyItem(
    @Param('itemId') itemId: string,
    @Body() body: { userId: string }
  ) {
    // NOTE: For simplicity, accept userId in the body. In production, extract from auth context.
    return this.marketplaceService.buyItem(body.userId, itemId);
  }
}
