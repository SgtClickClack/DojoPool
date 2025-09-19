import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  DashboardService,
  type DashboardStats,
  type CdnCostResponse,
} from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(
    @Req()
    req: ExpressRequest & {
      user: { userId?: string; sub?: string; id?: string };
    }
  ): Promise<DashboardStats> {
    const userId = (req.user.userId || req.user.sub || req.user.id) as string;
    return this.dashboardService.getStats(userId);
  }

  @Get('cdn-cost')
  @UseGuards(JwtAuthGuard)
  async getCdnCost(): Promise<CdnCostResponse> {
    return this.dashboardService.getCdnCost();
  }
}
