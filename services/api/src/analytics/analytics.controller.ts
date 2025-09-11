import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID for personal analytics',
  })
  async getAnalytics(
    @Query('range') range: string = '7d',
    @Query('userId') userId?: string,
    @Request() req?: any
  ) {
    const targetUserId = userId || req?.user?.id;
    const isAdmin = req?.user?.role === 'admin';

    return await this.analyticsService.getAnalyticsData(
      range,
      targetUserId,
      isAdmin
    );
  }

  @Get('user-growth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get user growth analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User growth data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  async getUserGrowth(@Query('range') range: string = '30d') {
    return await this.analyticsService.getUserGrowthData(range);
  }

  @Get('match-trends')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get match trends analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Match trends data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  async getMatchTrends(@Query('range') range: string = '30d') {
    return await this.analyticsService.getMatchTrendsData(range);
  }

  @Get('venue-performance')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get venue performance analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Venue performance data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  async getVenuePerformance(@Query('range') range: string = '30d') {
    return await this.analyticsService.getVenuePerformanceData(range);
  }

  @Get('user-retention')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get user retention analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User retention data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  async getUserRetention(@Query('range') range: string = '30d') {
    return await this.analyticsService.getUserRetentionData(range);
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get revenue analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Revenue data retrieved successfully',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range (1d, 7d, 30d, 90d)',
  })
  async getRevenueAnalytics(@Query('range') range: string = '30d') {
    return await this.analyticsService.getRevenueData(range);
  }
}
