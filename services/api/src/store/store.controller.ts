import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('catalog')
  async getCatalog() {
    return this.storeService.getCatalog();
  }

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  async purchaseItem(@Req() req, @Body() body: { itemId: string }) {
    return this.storeService.purchaseItem(req.user.id, body.itemId);
  }
}
