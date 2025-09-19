import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Content } from '@prisma/client';
import { ContentStatus, ContentType, ContentVisibility } from './dto/content-filter.dto';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  CacheKey,
  CacheWriteThrough,
  Cacheable,
} from '../cache/cache.decorator';
import { CacheHelper } from '../cache/cache.helper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentFilterDto } from './dto/content-filter.dto';
import { type CreateContentDto } from './dto/create-content.dto';
import { type ModerateContentDto } from './dto/moderate-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly cacheHelper: CacheHelper
  ) {}

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  private sanitizeHtml(content: string): string {
    if (!content) return content;

    // Create a DOM window for DOMPurify
    const window = new JSDOM('').window;
    const DOMPurifyInstance = DOMPurify(window);

    // Configure allowed tags and attributes for rich text content
    return DOMPurifyInstance.sanitize(content, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'span',
        'div',
      ],
      ALLOWED_ATTR: [
        'href',
        'target',
        'rel',
        'src',
        'alt',
        'title',
        'class',
        'style',
        'colspan',
        'rowspan',
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: [
        'onload',
        'onerror',
        'onclick',
        'onmouseover',
        'onmouseout',
      ],
    });
  }

  /**
   * Validate and sanitize content data
   */
  private validateAndSanitizeContent(data: CreateContentDto): CreateContentDto {
    const sanitized = { ...data };

    // Sanitize description
    if (sanitized.description) {
      sanitized.description = this.sanitizeHtml(sanitized.description);
    }

    // Sanitize metadata content field (for rich text)
    if (sanitized.metadata?.content) {
      sanitized.metadata.content = this.sanitizeHtml(
        sanitized.metadata.content
      );
    }

    // Validate and sanitize tags
    if (sanitized.tags && Array.isArray(sanitized.tags)) {
      sanitized.tags = sanitized.tags
        .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag) => tag.trim().toLowerCase())
        .slice(0, 10); // Limit to 10 tags
    }

    // Validate title length
    if (sanitized.title && sanitized.title.length > 200) {
      sanitized.title = sanitized.title.substring(0, 200);
    }

    return sanitized;
  }

  async create(
    createContentDto: CreateContentDto,
    userId: string,
    fileUrl?: string,
    thumbnailUrl?: string
  ): Promise<Content> {
    // Validate and sanitize input data
    const sanitizedData = this.validateAndSanitizeContent(createContentDto);

    const content = await this.prisma.content.create({
      data: {
        ...sanitizedData,
        userId,
        fileUrl,
        thumbnailUrl,
        metadata: JSON.stringify(sanitizedData.metadata || {}),
        tags: JSON.stringify(sanitizedData.tags || []),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify admins about new content for moderation
    await this.notifyAdminsOfNewContent(content);

    // Notify followers/friends if content is public
    if (content.visibility === ContentVisibility.PUBLIC) {
      await this.notifyFollowersOfNewContent(content);
    }

    this.logger.log(
      `New content created by user ${userId}: ${content.title} (${content.contentType})`
    );
    return content;
  }

  /**
   * Read-heavy endpoint with caching for public content feed
   */
  @Cacheable({
    ttl: 300, // 5 minutes (content changes frequently)
    keyPrefix: 'content:feed',
    keyGenerator: (filters: ContentFilterDto, page: number, limit: number) =>
      CacheKey(
        'content',
        'feed',
        JSON.stringify(filters),
        page.toString(),
        limit.toString()
      ),
    condition: (filters: ContentFilterDto, page: number, limit: number) =>
      page <= 5, // Only cache first 5 pages
  })
  async findFeed(
    userId: string,
    filters: ContentFilterDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    content: (Content & {
      user: { id: string; username: string; avatarUrl?: string };
      _count?: { likes: number; shares: number };
      userLiked?: boolean;
      userShared?: boolean;
    })[];
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
    const where = await this.buildFeedWhereClause(userId, filters);

    const [content, totalCount] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    // Add user interaction status
    const contentWithInteractions = await Promise.all(
      content.map(async (item) => {
        const [userLiked, userShared] = await Promise.all([
          this.prisma.contentLike.findUnique({
            where: {
              contentId_userId: {
                contentId: item.id,
                userId,
              },
            },
          }),
          this.prisma.contentShare.findFirst({
            where: {
              contentId: item.id,
              userId,
            },
          }),
        ]);

        return {
          ...item,
          userLiked: !!userLiked,
          userShared: !!userShared,
        } as (typeof content)[number] & { userLiked: boolean; userShared: boolean };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      content: contentWithInteractions as any,
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

  async findByUser(
    creatorId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    content: (Content & {
      user: { id: string; username: string; avatarUrl?: string };
      _count?: { likes: number; shares: number };
    })[];
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

    // Check if user can view creator's content
    const canView = await this.canUserViewContent(userId, creatorId);
    if (!canView) {
      throw new ForbiddenException("You cannot view this user's content");
    }

    const where: any = {
      userId: creatorId,
      status: ContentStatus.APPROVED,
    };

    // If not the owner, only show public content
    if (userId !== creatorId) {
      where.visibility = ContentVisibility.PUBLIC;
    }

    const [content, totalCount] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      content: content as any,
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

  async findOne(
    id: string,
    userId: string
  ): Promise<
    Content & {
      user: { id: string; username: string; avatarUrl?: string };
      _count?: { likes: number; shares: number };
      userLiked?: boolean;
      userShared?: boolean;
    }
  > {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: true,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if user can view this content
    const canView = await this.canUserViewContent(userId, content.userId);
    if (!canView) {
      throw new ForbiddenException('You cannot view this content');
    }

    if (
      content.visibility === ContentVisibility.PRIVATE &&
      content.userId !== userId
    ) {
      throw new ForbiddenException('This content is private');
    }

    // Add user interaction status
    const [userLiked, userShared] = await Promise.all([
      this.prisma.contentLike.findUnique({
        where: {
          contentId_userId: {
            contentId: id,
            userId,
          },
        },
      }),
      this.prisma.contentShare.findFirst({
        where: {
          contentId: id,
          userId,
        },
      }),
    ]);

    // Increment view count
    await this.prisma.content.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return {
      ...content,
      userLiked: !!userLiked,
      userShared: !!userShared,
    } as any;
  }

  /**
   * Write operation with cache invalidation
   */
  @CacheWriteThrough({
    ttl: 300,
    keyPrefix: 'content:feed',
    invalidatePatterns: ['content:feed:*', 'content:user:*'],
    keyGenerator: (
      id: string,
      updateContentDto: UpdateContentDto,
      userId: string
    ) => CacheKey('content', 'update', id, userId),
  })
  async update(
    id: string,
    updateContentDto: UpdateContentDto,
    userId: string
  ): Promise<Content> {
    const existingContent = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!existingContent) {
      throw new NotFoundException('Content not found');
    }

    if (existingContent.userId !== userId) {
      throw new ForbiddenException('You can only update your own content');
    }

    if (
      existingContent.status !== ContentStatus.APPROVED &&
      existingContent.status !== ContentStatus.PENDING
    ) {
      throw new ForbiddenException(
        'Cannot update content that has been moderated'
      );
    }

    // Build Prisma-friendly update payload
    const data: any = {
      ...updateContentDto,
      ...(updateContentDto.metadata && {
        metadata: JSON.stringify(updateContentDto.metadata),
      }),
      updatedAt: new Date(),
    };
    if (updateContentDto.tags) {
      data.tags = Array.isArray(updateContentDto.tags)
        ? JSON.stringify(updateContentDto.tags)
        : (updateContentDto.tags as unknown as string);
    }

    const content = await this.prisma.content.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Content ${id} updated by user ${userId}`);
    return content;
  }

  async delete(id: string, userId: string): Promise<void> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.userId !== userId) {
      throw new ForbiddenException('You can only delete your own content');
    }

    await this.prisma.content.delete({ where: { id } });
    this.logger.log(`Content ${id} deleted by user ${userId}`);
  }

  // Admin methods
  async findAllForAdmin(
    filters: ContentFilterDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    content: (Content & {
      user: { id: string; username: string; email: string };
      moderator?: { id: string; username: string };
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
    const where = this.buildAdminWhereClause(filters);

    const [content, totalCount, pendingCount] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          moderator: {
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
      this.prisma.content.count({ where }),
      this.prisma.content.count({
        where: { ...where, status: ContentStatus.PENDING },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      content: content as any,
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

  async moderateContent(
    id: string,
    moderateContentDto: ModerateContentDto,
    adminId: string
  ): Promise<Content> {
    const existingContent = await this.prisma.content.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingContent) {
      throw new NotFoundException('Content not found');
    }

    const content = await this.prisma.content.update({
      where: { id },
      data: {
        status: moderateContentDto.status,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        moderationNotes: moderateContentDto.moderationNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Notify content creator about moderation decision
    await this.notifyUserOfModeration(content);

    this.logger.log(
      `Content ${id} moderated by admin ${adminId}: ${moderateContentDto.status}`
    );
    return content;
  }

  // Social features
  async likeContent(
    contentId: string,
    userId: string
  ): Promise<{ liked: boolean }> {
    const existingLike = await this.prisma.contentLike.findUnique({
      where: {
        contentId_userId: {
          contentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.contentLike.delete({
        where: { id: existingLike.id },
      });
      await this.prisma.content.update({
        where: { contentId },
        data: { likes: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      // Like
      await this.prisma.contentLike.create({
        data: {
          contentId,
          userId,
        },
      });
      await this.prisma.content.update({
        where: { contentId },
        data: { likes: { increment: 1 } },
      });

      // Notify content creator
      const content = await this.prisma.content.findUnique({
        where: { contentId },
        include: { user: true },
      });

      if (content && content.userId !== userId) {
        await this.notificationsService.createNotification(
          content.userId,
          'CONTENT_LIKED',
          `${userId} liked your content: ${content.title}`,
          {
            contentId,
            likerId: userId,
          }
        );
      }

      return { liked: true };
    }
  }

  async shareContent(
    contentId: string,
    userId: string,
    sharedWithIds: string[]
  ): Promise<void> {
    const content = await this.prisma.content.findUnique({
      where: { contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Create shares
    const sharePromises = sharedWithIds.map((sharedWithId) =>
      this.prisma.contentShare.upsert({
        where: {
          contentId_userId_sharedWithId: {
            contentId,
            userId,
            sharedWithId,
          },
        },
        update: {
          createdAt: new Date(),
        },
        create: {
          contentId,
          userId,
          sharedWithId,
        },
      })
    );

    await Promise.all(sharePromises);

    // Update share count
    await this.prisma.content.update({
      where: { contentId },
      data: { shares: { increment: sharedWithIds.length } },
    });

    // Notify recipients
    const notificationPromises = sharedWithIds.map((sharedWithId) =>
      this.notificationsService.createNotification(
        sharedWithId,
        'CONTENT_SHARED_WITH_YOU',
        `Content shared with you: ${content.title}`,
        {
          contentId,
          sharerId: userId,
        }
      )
    );

    await Promise.all(notificationPromises);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalLikes: number;
    totalShares: number;
    totalViews: number;
  }> {
    const [total, pending, approved, rejected, stats] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.content.count({ where: { status: ContentStatus.PENDING } }),
      this.prisma.content.count({ where: { status: ContentStatus.APPROVED } }),
      this.prisma.content.count({ where: { status: ContentStatus.REJECTED } }),
      this.prisma.content.aggregate({
        _sum: {
          likes: true,
          shares: true,
          views: true,
        },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      totalLikes: stats._sum.likes || 0,
      totalShares: stats._sum.shares || 0,
      totalViews: stats._sum.views || 0,
    };
  }

  private async buildFeedWhereClause(
    userId: string,
    filters: ContentFilterDto
  ) {
    const where: any = {
      status: ContentStatus.APPROVED,
    };

    // Visibility filter
    const visibilityConditions = [{ visibility: ContentVisibility.PUBLIC }];

    // If user is logged in, also show friends-only content from friends
    if (userId) {
      // For now, we'll assume all users can see friends-only content
      // In a real implementation, you'd check friendship relationships
      visibilityConditions.push({ visibility: ContentVisibility.FRIENDS_ONLY });
    }

    where.OR = visibilityConditions;

    // Apply other filters
    if (filters.contentType) {
      where.contentType = filters.contentType;
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

    if (filters.search) {
      where.OR = where.OR || [];
      where.OR.push(
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      );
    }

    return where;
  }

  private buildAdminWhereClause(filters: ContentFilterDto) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
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

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async canUserViewContent(
    viewerId: string,
    creatorId: string
  ): Promise<boolean> {
    if (viewerId === creatorId) {
      return true;
    }

    // For now, allow all users to view content
    // In a real implementation, you might check friendship or follow relationships
    return true;
  }

  private async notifyAdminsOfNewContent(
    content: Content & { user: { id: string; username: string } }
  ): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      const notificationPromises = admins.map((admin) =>
        this.notificationsService.createNotification(
          admin.id,
          'NEW_CONTENT_SHARED',
          `New content requires moderation: ${content.title} by ${content.user.username}`,
          {
            contentId: content.id,
            contentType: content.contentType,
            userId: content.user.id,
            username: content.user.username,
          }
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      this.logger.error('Failed to notify admins of new content', error);
    }
  }

  private async notifyFollowersOfNewContent(
    content: Content & { user: { id: string; username: string } }
  ): Promise<void> {
    try {
      // For now, notify all users (in a real app, you'd notify followers/friends)
      const users = await this.prisma.user.findMany({
        where: {
          NOT: { id: content.userId }, // Don't notify the creator
        },
        select: { id: true },
        take: 50, // Limit to prevent spam
      });

      const notificationPromises = users.map((user) =>
        this.notificationsService.createNotification(
          user.id,
          'NEW_CONTENT_SHARED',
          `${content.user.username} shared new content: ${content.title}`,
          {
            contentId: content.id,
            contentType: content.contentType,
            userId: content.user.id,
          }
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      this.logger.error('Failed to notify followers of new content', error);
    }
  }

  private async notifyUserOfModeration(
    content: Content & { user: { id: string; username: string; email: string } }
  ): Promise<void> {
    try {
      const statusMessage =
        content.status === ContentStatus.APPROVED
          ? 'approved'
          : content.status === ContentStatus.REJECTED
            ? 'rejected'
            : 'archived';

      await this.notificationsService.createNotification(
        content.user.id,
        'SYSTEM',
        `Your content "${content.title}" has been ${statusMessage}`,
        {
          contentId: content.id,
          status: content.status,
          moderationNotes: content.moderationNotes,
        }
      );
    } catch (error) {
      this.logger.error('Failed to notify user of content moderation', error);
    }
  }
}
