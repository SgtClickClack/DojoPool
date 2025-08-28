import { Controller, Get, Headers, Query } from '@nestjs/common';
import { FeedService } from './feed.service';

function getCurrentUserId(headers: Record<string, any>): string | undefined {
  const fromHeader = (headers['x-user-id'] || headers['X-User-Id']) as
    | string
    | undefined;
  return fromHeader && fromHeader.length > 0 ? fromHeader : undefined;
}

@Controller('api/v1/feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @Headers() headers: Record<string, any>,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('filter') filter?: 'all' | 'friends'
  ) {
    const currentUserId = getCurrentUserId(headers);
    const parsedPage = page ? Number(page) : undefined;
    const parsedPageSize = pageSize ? Number(pageSize) : undefined;
    return this.feedService.getFeed({
      page: parsedPage,
      pageSize: parsedPageSize,
      filter: filter ?? 'all',
      userId: currentUserId,
    });
  }
}
