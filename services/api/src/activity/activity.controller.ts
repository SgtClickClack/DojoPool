import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  async getFeed(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.activityService.getFeed(
      parseInt(page, 10),
      parseInt(limit, 10)
    );
  }
}
