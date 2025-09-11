import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Feedback, FeedbackStatus } from '@dojopool/prisma';
import {
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackFilterDto } from './dto/feedback-filter.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly cacheHelper: CacheHelper
  ) {}

  async create(
    createFeedbackDto: CreateFeedbackDto,
    userId: string
  ): Promise<Feedback> {
    const feedback = await this.prisma.feedback.create({
      data: {
        ...createFeedbackDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Notify all admin users about new feedback
    await this.notifyAdminsOfNewFeedback(feedback);

    this.logger.log(
      `New feedback submitted by user ${userId}: ${feedback.category}`
    );
    return feedback;
  }

  /**
   * Read-heavy endpoint with caching for admin feedback list
   */
  @Cacheable({
    ttl: 300, // 5 minutes (feedback changes frequently)
    keyPrefix: 'feedback:admin',
    keyGenerator: (filters: FeedbackFilterDto, page: number, limit: number) =>
      CacheKey(
        'feedback',
        'admin',
        JSON.stringify(filters),
        page.toString(),
        limit.toString()
      ),
    condition: (filters: FeedbackFilterDto, page: number, limit: number) =>
      page <= 5, // Only cache first 5 pages
  })
  async findAllForAdmin(
    filters: FeedbackFilterDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    feedback: (Feedback & {
      user: { id: string; username: string; email: string };
    })[];
    totalCount: number;
    pendingCount: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);

    const [feedback, totalCount, pendingCount] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.count({
        where: { ...where, status: FeedbackStatus.PENDING },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      feedback,
      totalCount,
      pendingCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(
    id: string
  ): Promise<
    Feedback & { user: { id: string; username: string; email: string } }
  > {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    feedback: Feedback[];
    totalCount: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const [feedback, totalCount] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      feedback,
      totalCount,
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
    ttl: 300,
    keyPrefix: 'feedback:admin',
    invalidatePatterns: ['feedback:admin:*'],
    keyGenerator: (
      id: string,
      updateFeedbackDto: UpdateFeedbackDto,
      adminId: string
    ) => CacheKey('feedback', 'update', id, adminId),
  })
  async update(
    id: string,
    updateFeedbackDto: UpdateFeedbackDto,
    adminId: string
  ): Promise<Feedback> {
    const existingFeedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingFeedback) {
      throw new NotFoundException('Feedback not found');
    }

    const feedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        ...updateFeedbackDto,
        ...(updateFeedbackDto.status === FeedbackStatus.RESOLVED && {
          resolvedAt: new Date(),
          resolvedBy: adminId,
        }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Notify user if feedback status changed to resolved
    if (
      existingFeedback.status !== FeedbackStatus.RESOLVED &&
      updateFeedbackDto.status === FeedbackStatus.RESOLVED
    ) {
      await this.notifyUserOfResolution(feedback);
    }

    this.logger.log(
      `Feedback ${id} updated by admin ${adminId}: ${updateFeedbackDto.status}`
    );
    return feedback;
  }

  async delete(id: string, userId: string): Promise<void> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.userId !== userId) {
      throw new ForbiddenException('You can only delete your own feedback');
    }

    await this.prisma.feedback.delete({ where: { id } });
    this.logger.log(`Feedback ${id} deleted by user ${userId}`);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    inReview: number;
    resolved: number;
    closed: number;
    rejected: number;
    averageResolutionTime: number | null;
  }> {
    const [
      total,
      pending,
      inReview,
      resolved,
      closed,
      rejected,
      resolvedFeedback,
    ] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
      this.prisma.feedback.count({
        where: { status: FeedbackStatus.IN_REVIEW },
      }),
      this.prisma.feedback.count({
        where: { status: FeedbackStatus.RESOLVED },
      }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.CLOSED } }),
      this.prisma.feedback.count({
        where: { status: FeedbackStatus.REJECTED },
      }),
      this.prisma.feedback.findMany({
        where: {
          status: FeedbackStatus.RESOLVED,
          resolvedAt: { not: null },
          createdAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
    ]);

    // Calculate average resolution time in hours
    let averageResolutionTime: number | null = null;
    if (resolvedFeedback.length > 0) {
      const totalResolutionTime = resolvedFeedback.reduce((sum, feedback) => {
        const created = new Date(feedback.createdAt).getTime();
        const resolved = new Date(feedback.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      averageResolutionTime =
        totalResolutionTime / resolvedFeedback.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      total,
      pending,
      inReview,
      resolved,
      closed,
      rejected,
      averageResolutionTime,
    };
  }

  private buildWhereClause(filters: FeedbackFilterDto) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(filters.dateFrom),
      };
    }

    if (filters.dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(filters.dateTo),
      };
    }

    return where;
  }

  private async notifyAdminsOfNewFeedback(
    feedback: Feedback & {
      user: { id: string; username: string; email: string };
    }
  ): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      const notificationPromises = admins.map((admin) =>
        this.notificationsService.createNotification(
          admin.id,
          'NEW_FEEDBACK_SUBMITTED',
          `New ${feedback.category.toLowerCase().replace(/_/g, ' ')} feedback from ${feedback.user.username}`,
          {
            feedbackId: feedback.id,
            category: feedback.category,
            userId: feedback.user.id,
            username: feedback.user.username,
          }
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      this.logger.error('Failed to notify admins of new feedback', error);
    }
  }

  private async notifyUserOfResolution(
    feedback: Feedback & {
      user: { id: string; username: string; email: string };
    }
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(
        feedback.user.id,
        'SYSTEM',
        'Your feedback has been resolved',
        {
          feedbackId: feedback.id,
          category: feedback.category,
          status: feedback.status,
        }
      );
    } catch (error) {
      this.logger.error('Failed to notify user of feedback resolution', error);
    }
  }
}
