import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CommunityCosmeticItem,
  CosmeticCategory,
  SubmissionStatus,
} from '@dojopool/prisma';
import {
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCosmeticItemDto {
  title: string;
  description?: string;
  category: CosmeticCategory;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateCosmeticItemDto {
  title?: string;
  description?: string;
  category?: CosmeticCategory;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ReviewCosmeticItemDto {
  status: SubmissionStatus;
  rejectionReason?: string;
  approvedPrice?: number;
}

export interface CosmeticItemWithCreator {
  id: string;
  title: string;
  description?: string;
  category: CosmeticCategory;
  designFileUrl?: string;
  previewImageUrl?: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  metadata: Record<string, any>;
  tags: string[];
  likes: number;
  views: number;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  userLiked?: boolean;
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheHelper: CacheHelper,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Submit a new cosmetic item for review
   */
  async submitCosmeticItem(
    creatorId: string,
    dto: CreateCosmeticItemDto,
    designFileUrl?: string,
    previewImageUrl?: string
  ): Promise<CommunityCosmeticItem> {
    const item = await this.prisma.communityCosmeticItem.create({
      data: {
        creatorId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        designFileUrl,
        previewImageUrl,
        metadata: JSON.stringify(dto.metadata || {}),
        tags: JSON.stringify(dto.tags || []),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify admins about new submission
    await this.notifyAdminsOfNewSubmission(item);

    this.logger.log(
      `New cosmetic item submitted by user ${creatorId}: ${item.title} (${item.category})`
    );

    return item;
  }

  /**
   * Get cosmetic items for a specific creator
   */
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'community:creator',
    keyGenerator: (creatorId: string, page: number, limit: number) =>
      CacheKey(
        'community',
        'creator',
        creatorId,
        page.toString(),
        limit.toString()
      ),
  })
  async getCreatorSubmissions(
    creatorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: CosmeticItemWithCreator[];
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

    const [items, totalCount] = await Promise.all([
      this.prisma.communityCosmeticItem.findMany({
        where: { creatorId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          reviewer: {
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
      this.prisma.communityCosmeticItem.count({ where: { creatorId } }),
    ]);

    const itemsWithLikes = await Promise.all(
      items.map(async (item) => {
        const parsedItem = this.parseItemMetadata(item);
        return {
          ...parsedItem,
          userLiked: false, // Creator always sees their own items
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: itemsWithLikes,
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
   * Get cosmetic items for admin review
   */
  @Cacheable({
    ttl: 300, // 5 minutes
    keyPrefix: 'community:admin',
    keyGenerator: (filters: any, page: number, limit: number) =>
      CacheKey(
        'community',
        'admin',
        JSON.stringify(filters),
        page.toString(),
        limit.toString()
      ),
  })
  async getSubmissionsForReview(
    filters: {
      status?: SubmissionStatus;
      category?: CosmeticCategory;
      creatorId?: string;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: CosmeticItemWithCreator[];
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

    const [items, totalCount, pendingCount] = await Promise.all([
      this.prisma.communityCosmeticItem.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          reviewer: {
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
      this.prisma.communityCosmeticItem.count({ where }),
      this.prisma.communityCosmeticItem.count({
        where: { ...where, status: SubmissionStatus.PENDING },
      }),
    ]);

    const itemsWithLikes = await Promise.all(
      items.map(async (item) => {
        const parsedItem = this.parseItemMetadata(item);
        return {
          ...parsedItem,
          userLiked: false, // Admin view doesn't need like status
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: itemsWithLikes,
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

  /**
   * Get public cosmetic items (approved ones)
   */
  @Cacheable({
    ttl: 600, // 10 minutes
    keyPrefix: 'community:public',
    keyGenerator: (
      filters: any,
      page: number,
      limit: number,
      userId?: string
    ) =>
      CacheKey(
        'community',
        'public',
        JSON.stringify(filters),
        page.toString(),
        limit.toString(),
        userId || 'anon'
      ),
  })
  async getPublicCosmeticItems(
    filters: {
      category?: CosmeticCategory;
      search?: string;
      sortBy?: 'newest' | 'popular' | 'likes';
    } = {},
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<{
    items: CosmeticItemWithCreator[];
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
    const where: any = {
      status: SubmissionStatus.APPROVED,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy === 'popular') {
      orderBy.views = 'desc';
    } else if (filters.sortBy === 'likes') {
      orderBy.likes = 'desc';
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.communityCosmeticItem.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.communityCosmeticItem.count({ where }),
    ]);

    const itemsWithLikes = await Promise.all(
      items.map(async (item) => {
        const parsedItem = this.parseItemMetadata(item);
        let userLiked = false;

        if (userId) {
          const like = await this.prisma.cosmeticItemLike.findUnique({
            where: {
              userId_cosmeticItemId: {
                userId,
                cosmeticItemId: item.id,
              },
            },
          });
          userLiked = !!like;
        }

        return {
          ...parsedItem,
          userLiked,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: itemsWithLikes,
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
   * Update a cosmetic item (only by creator or admin)
   */
  @CacheWriteThrough({
    ttl: 300,
    keyPrefix: 'community',
    invalidatePatterns: ['community:*'],
    keyGenerator: (id: string) => CacheKey('community', 'item', id),
  })
  async updateCosmeticItem(
    id: string,
    userId: string,
    dto: UpdateCosmeticItemDto
  ): Promise<CommunityCosmeticItem> {
    const existingItem = await this.prisma.communityCosmeticItem.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!existingItem) {
      throw new NotFoundException('Cosmetic item not found');
    }

    // Only creator can update their own items, and only if not approved/rejected
    if (existingItem.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own submissions');
    }

    if (
      existingItem.status !== SubmissionStatus.PENDING &&
      existingItem.status !== SubmissionStatus.REQUIRES_CHANGES
    ) {
      throw new ForbiddenException(
        'Cannot update items that have been reviewed'
      );
    }

    const item = await this.prisma.communityCosmeticItem.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.metadata && { metadata: JSON.stringify(dto.metadata) }),
        ...(dto.tags && { tags: JSON.stringify(dto.tags) }),
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Cosmetic item ${id} updated by user ${userId}`);
    return item;
  }

  /**
   * Review a cosmetic item (admin only)
   */
  @CacheWriteThrough({
    ttl: 300,
    keyPrefix: 'community',
    invalidatePatterns: ['community:*', 'marketplace:*'],
    keyGenerator: (id: string) => CacheKey('community', 'review', id),
  })
  async reviewCosmeticItem(
    id: string,
    reviewerId: string,
    dto: ReviewCosmeticItemDto
  ): Promise<CommunityCosmeticItem> {
    const existingItem = await this.prisma.communityCosmeticItem.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!existingItem) {
      throw new NotFoundException('Cosmetic item not found');
    }

    const item = await this.prisma.$transaction(async (tx) => {
      // Update the submission status
      const updatedItem = await tx.communityCosmeticItem.update({
        where: { id },
        data: {
          status: dto.status,
          rejectionReason: dto.rejectionReason,
          reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          creator: true,
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // If approved, create marketplace item
      if (dto.status === SubmissionStatus.APPROVED && dto.approvedPrice) {
        const marketplaceItem = await tx.marketplaceItem.create({
          data: {
            name: existingItem.title,
            description: existingItem.description,
            price: dto.approvedPrice,
            category: existingItem.category,
            imageUrl: existingItem.previewImageUrl,
            communityItemId: existingItem.id,
          },
        });

        // Link the approved item
        await tx.communityCosmeticItem.update({
          where: { id },
          data: {
            approvedItemId: marketplaceItem.id,
          },
        });
      }

      return updatedItem;
    });

    // Notify creator about the review
    await this.notifyCreatorOfReview(item);

    this.logger.log(
      `Cosmetic item ${id} reviewed by admin ${reviewerId}: ${dto.status}`
    );

    return item;
  }

  /**
   * Like/unlike a cosmetic item
   */
  async toggleLike(
    cosmeticItemId: string,
    userId: string
  ): Promise<{ liked: boolean }> {
    const existingLike = await this.prisma.cosmeticItemLike.findUnique({
      where: {
        userId_cosmeticItemId: {
          userId,
          cosmeticItemId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.$transaction([
        this.prisma.cosmeticItemLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.communityCosmeticItem.update({
          where: { id: cosmeticItemId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    } else {
      // Like
      await this.prisma.$transaction([
        this.prisma.cosmeticItemLike.create({
          data: {
            userId,
            cosmeticItemId,
          },
        }),
        this.prisma.communityCosmeticItem.update({
          where: { id: cosmeticItemId },
          data: { likes: { increment: 1 } },
        }),
      ]);

      // Notify creator
      const item = await this.prisma.communityCosmeticItem.findUnique({
        where: { id: cosmeticItemId },
        include: { creator: true },
      });

      if (item && item.creatorId !== userId) {
        await this.notificationsService.createNotification(
          item.creatorId,
          'COSMETIC_ITEM_LIKED',
          `Someone liked your cosmetic item: ${item.title}`,
          {
            cosmeticItemId,
            likerId: userId,
          }
        );
      }

      return { liked: true };
    }
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    requiresChanges: number;
    totalLikes: number;
    totalViews: number;
  }> {
    const [total, pending, approved, rejected, requiresChanges, stats] =
      await Promise.all([
        this.prisma.communityCosmeticItem.count(),
        this.prisma.communityCosmeticItem.count({
          where: { status: SubmissionStatus.PENDING },
        }),
        this.prisma.communityCosmeticItem.count({
          where: { status: SubmissionStatus.APPROVED },
        }),
        this.prisma.communityCosmeticItem.count({
          where: { status: SubmissionStatus.REJECTED },
        }),
        this.prisma.communityCosmeticItem.count({
          where: { status: SubmissionStatus.REQUIRES_CHANGES },
        }),
        this.prisma.communityCosmeticItem.aggregate({
          _sum: {
            likes: true,
            views: true,
          },
        }),
      ]);

    return {
      total,
      pending,
      approved,
      rejected,
      requiresChanges,
      totalLikes: stats._sum.likes || 0,
      totalViews: stats._sum.views || 0,
    };
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await this.prisma.communityCosmeticItem.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  private buildWhereClause(filters: {
    status?: SubmissionStatus;
    category?: CosmeticCategory;
    creatorId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private parseItemMetadata(item: any): CosmeticItemWithCreator {
    return {
      ...item,
      metadata: JSON.parse(item.metadata || '{}'),
      tags: JSON.parse(item.tags || '[]'),
    };
  }

  private async notifyAdminsOfNewSubmission(
    item: CommunityCosmeticItem & { creator: any }
  ): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      const notificationPromises = admins.map((admin) =>
        this.notificationsService.createNotification(
          admin.id,
          'COSMETIC_ITEM_SUBMITTED',
          `New cosmetic item submitted for review: ${item.title} by ${item.creator.username}`,
          {
            cosmeticItemId: item.id,
            creatorId: item.creatorId,
            category: item.category,
          }
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      this.logger.error('Failed to notify admins of new submission', error);
    }
  }

  private async notifyCreatorOfReview(
    item: CommunityCosmeticItem & { creator: any }
  ): Promise<void> {
    try {
      const statusMessage =
        item.status === SubmissionStatus.APPROVED
          ? 'approved'
          : item.status === SubmissionStatus.REJECTED
            ? 'rejected'
            : 'requires changes';

      await this.notificationsService.createNotification(
        item.creatorId,
        'COSMETIC_ITEM_REVIEWED',
        `Your cosmetic item "${item.title}" has been ${statusMessage}`,
        {
          cosmeticItemId: item.id,
          status: item.status,
          rejectionReason: item.rejectionReason,
        }
      );
    } catch (error) {
      this.logger.error('Failed to notify creator of review', error);
    }
  }
}
