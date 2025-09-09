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

  // Clan Marketplace Endpoints
  @Post('clan/listing')
  @CacheInvalidate(['clan:marketplace:*'])
  async createClanListing(
    @Body()
    body: {
      sellerId: string;
      clanId: string;
      assetId: string;
      assetType: 'AVATAR_ASSET' | 'MARKETPLACE_ITEM';
      price: number;
    }
  ) {
    return this.marketplaceService.createClanListing(body);
  }

  @Get('clan/:clanId/listings')
  @Cacheable({
    ttl: 300,
    keyPrefix: 'clan:marketplace:',
  })
  async getClanListings(@Param('clanId') clanId: string) {
    return this.marketplaceService.getClanListings(clanId);
  }

  @Post('clan/buy')
  @CacheInvalidate(['clan:marketplace:*'])
  async buyFromClanMarketplace(
    @Body() body: { buyerId: string; listingId: string; clanId: string }
  ) {
    return this.marketplaceService.buyFromClanMarketplace(body);
  }

  // Clan Wallet Endpoints
  @Post('clan/wallet/deposit')
  @CacheInvalidate(['clan:wallet:*'])
  async depositToClanWallet(
    @Body() body: { userId: string; clanId: string; amount: number }
  ) {
    return this.marketplaceService.depositToClanWallet(body);
  }

  @Post('clan/wallet/withdraw')
  @CacheInvalidate(['clan:wallet:*'])
  async withdrawFromClanWallet(
    @Body() body: { userId: string; clanId: string; amount: number }
  ) {
    return this.marketplaceService.withdrawFromClanWallet(body);
  }

  @Get('clan/:clanId/wallet')
  @Cacheable({
    ttl: 300,
    keyPrefix: 'clan:wallet:',
  })
  async getClanWallet(@Param('clanId') clanId: string) {
    return this.marketplaceService.getClanWallet(clanId);
  }
}
