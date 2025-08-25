import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Notification, NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway
  ) {}

  async createNotification(params: {
    recipientId: string;
    type: NotificationType;
    message: string;
    payload?: any;
  }): Promise<Notification> {
    const { recipientId, type, message, payload } = params;
    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        type,
        message,
        payload: payload !== undefined ? JSON.stringify(payload) : undefined,
      },
    });

    // Emit real-time event to the recipient's private room
    try {
      this.gateway.emitToUser(recipientId, notification);
    } catch (e) {
      this.logger.warn(`Failed to emit notification realtime event: ${e}`);
    }

    return notification;
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<{ updated: boolean }> {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    if (result.count === 0) {
      // Either not found or not authorized
      const exists = await this.prisma.notification.findUnique({
        where: { id },
      });
      if (exists && exists.recipientId !== userId) {
        throw new ForbiddenException(
          'Not authorized to modify this notification'
        );
      }
      return { updated: false };
    }
    return { updated: true };
  }
}
