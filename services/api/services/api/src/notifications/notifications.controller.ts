import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(@Req() req: ExpressRequest & { user: { userId: string } }) {
    const userId = req.user.userId;
    return this.notificationsService.findAllForUser(userId);
    }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(
    @Param('id') id: string,
    @Req() req: ExpressRequest & { user: { userId: string } }
  ) {
    const userId = req.user.userId;
    return this.notificationsService.markAsRead(id, userId);
  }
}
