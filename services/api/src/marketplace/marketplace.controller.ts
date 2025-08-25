import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items')
  async listItems() {
    return this.marketplaceService.listItems();
  }

  @Post('items/:itemId/buy')
  async buyItem(
    @Param('itemId') itemId: string,
    @Body() body: { userId: string }
  ) {
    // NOTE: For simplicity, accept userId in the body. In production, extract from auth context.
    return this.marketplaceService.buyItem(body.userId, itemId);
  }
}
