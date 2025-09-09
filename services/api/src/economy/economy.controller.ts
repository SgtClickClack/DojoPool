import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EconomyService, PurchaseRequest } from './economy.service';

@Controller('api/v1/economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    const userId = req.user.userId;
    return await this.economyService.getBalance(userId);
  }

  @Post('purchase')
  async purchaseDojoCoins(
    @Request() req,
    @Body() purchaseData: PurchaseRequest
  ) {
    const userId = req.user.userId;

    // Validate request data
    if (!purchaseData.amount || !purchaseData.paymentMethod) {
      throw new BadRequestException('Amount and payment method are required');
    }

    const purchaseRequest: PurchaseRequest = {
      userId,
      amount: purchaseData.amount,
      paymentMethod: purchaseData.paymentMethod,
      paymentToken: purchaseData.paymentToken,
    };

    return await this.economyService.processPurchase(purchaseRequest);
  }

  @Get('transactions')
  async getTransactionHistory(@Request() req) {
    const userId = req.user.userId;
    return await this.economyService.getTransactionHistory(userId);
  }

  @Post('transfer/:toUserId')
  async transferCoins(
    @Request() req,
    @Param('toUserId') toUserId: string,
    @Body() body: { amount: number; reason: string }
  ) {
    const fromUserId = req.user.userId;

    if (!body.amount || !body.reason) {
      throw new BadRequestException('Amount and reason are required');
    }

    return await this.economyService.transferCoins(
      fromUserId,
      toUserId,
      body.amount,
      body.reason
    );
  }
}
