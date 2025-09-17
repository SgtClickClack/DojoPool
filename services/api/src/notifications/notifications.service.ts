import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Notification } from '@prisma/client';
import {
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly cacheHelper: CacheHelper
  ) {}

  async createNotification(
    recipientId: string,
    type: string,
    message: string,
    payload?: Record<string, any>
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        userId: recipientId, // recipientId is actually the userId
        title: type,
        type,
        message,
        payload: payload ? JSON.stringify(payload) : 'null',
      },
    });

    // Emit real-time event to the user's private room
    try {
      this.gateway.emitToUser(recipientId, 'new_notification', notification);
    } catch (err: any) {
      this.logger.warn(
        `Failed to emit new_notification: ${err?.message ?? String(err)}`
      );
    }

    return notification;
  }

  /**
   * Read-heavy endpoint with caching
   */
  @Cacheable({
    ttl: 60, // 1 minute (notifications change frequently)
    keyPrefix: 'notifications:user',
    keyGenerator: (userId: string, page: number, limit: number) =>
      CacheKey(
        'notifications',
        'user',
        userId,
        page.toString(),
        limit.toString()
      ),
    condition: (userId: string, page: number, limit: number) => page <= 3, // Only cache first 3 pages
  })
  async findForUser(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { recipientId: userId },
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications,
      totalCount,
      unreadCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Write operation with cache invalidation
   */
  @CacheWriteThrough({
    ttl: 60,
    keyPrefix: 'notifications:user',
    invalidatePatterns: ['notifications:user:*'],
    keyGenerator: (id: string, userId: string) =>
      CacheKey('notifications', 'read', id, userId),
  })
  async markRead(id: string, userId: string): Promise<Notification> {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.recipientId !== userId)
      throw new ForbiddenException('Not allowed');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { count: res.count };
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.recipientId !== userId)
      throw new ForbiddenException('Not allowed');

    await this.prisma.notification.delete({ where: { id } });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }
}
