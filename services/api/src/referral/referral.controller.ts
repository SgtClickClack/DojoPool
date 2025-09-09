import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReferralService } from './referral.service';

@Controller('api/v1/referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('code')
  @UseGuards(JwtAuthGuard)
  async getReferralCode(@Request() req) {
    const userId = req.user.userId;
    return await this.referralService.getOrCreateReferralCode(userId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getReferralStatus(@Request() req) {
    const userId = req.user.userId;

    const [stats, details] = await Promise.all([
      this.referralService.getReferralStats(userId),
      this.referralService.getReferralDetails(userId),
    ]);

    return {
      stats,
      details,
    };
  }

  @Post('validate')
  async validateReferralCode(@Body() body: { referralCode: string }) {
    if (!body.referralCode) {
      throw new BadRequestException('Referral code is required');
    }

    const isValid = await this.referralService.validateReferralCode(
      body.referralCode
    );

    return {
      valid: isValid,
      referralCode: body.referralCode,
    };
  }

  @Post('process-signup')
  @UseGuards(JwtAuthGuard)
  async processReferralSignup(
    @Request() req,
    @Body() body: { referralCode: string }
  ) {
    const userId = req.user.userId;

    if (!body.referralCode) {
      throw new BadRequestException('Referral code is required');
    }

    await this.referralService.processReferralSignup(userId, body.referralCode);

    return {
      success: true,
      message: 'Referral processed successfully',
    };
  }
}
