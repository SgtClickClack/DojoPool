import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history/:friendId')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: ExpressRequest & { user: { userId: string } },
    @Param('friendId') friendId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const currentUserId = req.user.userId;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.chatService.getHistory(
      currentUserId,
      friendId,
      isNaN(p) ? 1 : p,
      isNaN(l) ? 20 : l
    );
  }
}
