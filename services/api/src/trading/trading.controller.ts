import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  TradeProposal,
  TradeResponse,
  TradingService,
} from './trading.service';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('propose')
  async proposeTrade(@Body() proposal: TradeProposal) {
    return this.tradingService.proposeTrade(proposal);
  }

  @Post('respond')
  async respondToTrade(@Body() response: TradeResponse) {
    return this.tradingService.respondToTrade(response);
  }

  @Get('pending/:userId')
  async getPendingTrades(@Param('userId') userId: string) {
    return this.tradingService.getPendingTrades(userId);
  }

  @Get('history/:userId')
  async getTradeHistory(@Param('userId') userId: string) {
    return this.tradingService.getTradeHistory(userId);
  }

  @Delete(':tradeId/cancel/:userId')
  async cancelTrade(
    @Param('tradeId') tradeId: string,
    @Param('userId') userId: string
  ) {
    return this.tradingService.cancelTrade(tradeId, userId);
  }
}
