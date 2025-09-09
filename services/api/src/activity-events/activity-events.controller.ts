import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Cacheable } from '../cache/cache.decorator';
import { ActivityEventsService } from './activity-events.service';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityEventsController {
  constructor(private readonly activityEvents: ActivityEventsService) {}

  @Get()
  @Cacheable({
    ttl: 60, // 1 minute
    keyPrefix: 'activity:feed:',
    condition: (args) => {
      // Only cache for reasonable page sizes and first few pages
      const limit = parseInt(args[1]?.limit || '20', 10);
      const page = parseInt(args[1]?.page || '1', 10);
      return limit <= 50 && page <= 10;
    },
  })
  async getActivityFeed(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Query('filter') filter: 'global' | 'friends' = 'global',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const userId = req.user.userId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    // For now, we'll return all activity events for the user
    // In the future, we can implement filtering logic based on the filter parameter
    const events = await this.activityEvents.getActivityFeed(userId, limitNum);

    // Simple pagination logic (in a real implementation, we'd have proper pagination in the service)
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return {
      entries: paginatedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: events.length,
        hasNext: endIndex < events.length,
        hasPrev: pageNum > 1,
      },
    };
  }
}
