import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheInvalidate, Cacheable } from '../cache/cache.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Cacheable({
    ttl: 60, // 1 minute
    keyPrefix: 'notifications:user:',
    condition: (args) => {
      // Only cache for reasonable page sizes
      const limit = parseInt(args[1]?.limit || '50', 10);
      return limit <= 100;
    },
  })
  async getMyNotifications(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    const userId = req.user.userId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.notifications.findForUser(userId, pageNum, limitNum);
  }

  @Patch(':id/read')
  @CacheInvalidate(['notifications:unread:*'])
  async markRead(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Param('id') id: string
  ) {
    const userId = req.user.userId;
    return this.notifications.markRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(200)
  async markAllRead(@Req() req: ExpressRequest & { user: { userId: string } }) {
    const userId = req.user.userId;
    return this.notifications.markAllRead(userId);
  }

  @Get('unread-count')
  @Cacheable({
    ttl: 30, // 30 seconds
    keyPrefix: 'notifications:unread:',
  })
  async getUnreadCount(
    @Req() req: ExpressRequest & { user: { userId: string } }
  ) {
    const userId = req.user.userId;
    const count = await this.notifications.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Delete(':id')
  async deleteNotification(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Param('id') id: string
  ) {
    const userId = req.user.userId;
    await this.notifications.deleteNotification(id, userId);
    return { success: true };
  }
}
