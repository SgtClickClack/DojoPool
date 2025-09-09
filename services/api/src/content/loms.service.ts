import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentStatus, ContentType, ContentVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateNewsItemDto } from './dto/create-news-article.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class LOMSService {
  private readonly logger = new Logger(LOMSService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Event Management
  async createEvent(createEventDto: CreateEventDto, adminId: string) {
    const content = await this.prisma.content.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        contentType: ContentType.EVENT,
        status: ContentStatus.APPROVED, // Admin-created content is auto-approved
        visibility: ContentVisibility.PUBLIC,
        userId: adminId,
        metadata: JSON.stringify({
          eventType: createEventDto.eventType,
          startTime: createEventDto.startTime,
          endTime: createEventDto.endTime,
          rewards: createEventDto.rewards,
          requirements: createEventDto.requirements,
        }),
        tags: JSON.stringify(createEventDto.tags || []),
      },
    });

    const event = await this.prisma.event.create({
      data: {
        contentId: content.id,
        eventType: createEventDto.eventType,
        startTime: new Date(createEventDto.startTime),
        endTime: createEventDto.endTime
          ? new Date(createEventDto.endTime)
          : null,
        priority: createEventDto.priority || 1,
        targetAudience: createEventDto.targetAudience || [],
        rewards: createEventDto.rewards || {},
        requirements: createEventDto.requirements || {},
        createdBy: adminId,
      },
      include: {
        content: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Event created: ${content.title} by admin ${adminId}`);
    return event;
  }

  async findAllEvents(filters?: {
    isActive?: boolean;
    eventType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, isActive, eventType } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (eventType) {
      where.eventType = eventType;
    }

    const [events, totalCount] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { startTime: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      events,
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

  async findOneEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        content: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
    adminId: string
  ) {
    const existingEvent = await this.findOneEvent(id);

    // Update content
    await this.prisma.content.update({
      where: { id: existingEvent.contentId },
      data: {
        title: updateEventDto.title,
        description: updateEventDto.description,
        metadata: JSON.stringify({
          ...JSON.parse(existingEvent.content.metadata),
          ...(updateEventDto.startTime && {
            startTime: updateEventDto.startTime,
          }),
          ...(updateEventDto.endTime && { endTime: updateEventDto.endTime }),
          ...(updateEventDto.rewards && { rewards: updateEventDto.rewards }),
          ...(updateEventDto.requirements && {
            requirements: updateEventDto.requirements,
          }),
        }),
        tags: JSON.stringify(
          updateEventDto.tags || JSON.parse(existingEvent.content.tags)
        ),
        updatedAt: new Date(),
      },
    });

    // Update event
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...(updateEventDto.eventType && {
          eventType: updateEventDto.eventType,
        }),
        ...(updateEventDto.startTime && {
          startTime: new Date(updateEventDto.startTime),
        }),
        ...(updateEventDto.endTime && {
          endTime: updateEventDto.endTime
            ? new Date(updateEventDto.endTime)
            : null,
        }),
        ...(updateEventDto.priority && { priority: updateEventDto.priority }),
        ...(updateEventDto.targetAudience && {
          targetAudience: updateEventDto.targetAudience,
        }),
        ...(updateEventDto.rewards && { rewards: updateEventDto.rewards }),
        ...(updateEventDto.requirements && {
          requirements: updateEventDto.requirements,
        }),
        ...(updateEventDto.isActive !== undefined && {
          isActive: updateEventDto.isActive,
        }),
        updatedBy: adminId,
        updatedAt: new Date(),
      },
      include: {
        content: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Event updated: ${id} by admin ${adminId}`);
    return event;
  }

  async deleteEvent(id: string, adminId: string) {
    const event = await this.findOneEvent(id);

    // Delete event first (cascade will handle content)
    await this.prisma.event.delete({ where: { id } });

    this.logger.log(`Event deleted: ${id} by admin ${adminId}`);
    return { success: true };
  }

  // Promotion Management
  async createPromotion(
    createPromotionDto: CreatePromotionDto,
    adminId: string
  ) {
    const content = await this.prisma.content.create({
      data: {
        title: createPromotionDto.title,
        description: createPromotionDto.description,
        contentType: ContentType.PROMOTION,
        status: ContentStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
        userId: adminId,
        metadata: JSON.stringify({
          code: createPromotionDto.code,
          discountType: createPromotionDto.discountType,
          discountValue: createPromotionDto.discountValue,
          minPurchase: createPromotionDto.minPurchase,
          maxUses: createPromotionDto.maxUses,
        }),
        tags: JSON.stringify(createPromotionDto.tags || []),
      },
    });

    const promotion = await this.prisma.promotion.create({
      data: {
        contentId: content.id,
        code: createPromotionDto.code,
        discountType: createPromotionDto.discountType,
        discountValue: createPromotionDto.discountValue,
        minPurchase: createPromotionDto.minPurchase || 0,
        maxUses: createPromotionDto.maxUses,
        isActive: createPromotionDto.isActive ?? true,
        startTime: createPromotionDto.startTime
          ? new Date(createPromotionDto.startTime)
          : null,
        endTime: createPromotionDto.endTime
          ? new Date(createPromotionDto.endTime)
          : null,
        targetUsers: createPromotionDto.targetUsers || [],
        applicableItems: createPromotionDto.applicableItems || [],
        createdBy: adminId,
      },
      include: {
        content: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Promotion created: ${content.title} by admin ${adminId}`);
    return promotion;
  }

  async findAllPromotions(filters?: {
    isActive?: boolean;
    code?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, isActive, code } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    const [promotions, totalCount] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      promotions,
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

  // Similar methods for News Items and Asset Bundles...
  async createNewsItem(createNewsItemDto: CreateNewsItemDto, adminId: string) {
    const content = await this.prisma.content.create({
      data: {
        title: createNewsItemDto.title,
        description: createNewsItemDto.description,
        contentType: ContentType.NEWS_ITEM,
        status: ContentStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
        userId: adminId,
        metadata: JSON.stringify({
          category: createNewsItemDto.category,
          priority: createNewsItemDto.priority,
          publishTime: createNewsItemDto.publishTime,
          expiryTime: createNewsItemDto.expiryTime,
        }),
        tags: JSON.stringify(createNewsItemDto.tags || []),
      },
    });

    const newsItem = await this.prisma.newsItem.create({
      data: {
        contentId: content.id,
        category: createNewsItemDto.category || 'GENERAL',
        priority: createNewsItemDto.priority || 1,
        isPublished: createNewsItemDto.isPublished ?? false,
        publishTime: createNewsItemDto.publishTime
          ? new Date(createNewsItemDto.publishTime)
          : null,
        expiryTime: createNewsItemDto.expiryTime
          ? new Date(createNewsItemDto.expiryTime)
          : null,
        targetPlatform: createNewsItemDto.targetPlatform || ['WEB', 'MOBILE'],
        createdBy: adminId,
      },
      include: {
        content: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`News item created: ${content.title} by admin ${adminId}`);
    return newsItem;
  }

  async findAllNewsItems(filters?: {
    isPublished?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, isPublished, category } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }
    if (category) {
      where.category = category;
    }

    const [newsItems, totalCount] = await Promise.all([
      this.prisma.newsItem.findMany({
        where,
        include: {
          content: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { publishTime: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.newsItem.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      newsItems,
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

  // Live Content Endpoint for Client Consumption
  async getLiveContent(userId?: string) {
    const now = new Date();

    // Get active events
    const activeEvents = await this.prisma.event.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        OR: [{ endTime: null }, { endTime: { gte: now } }],
      },
      include: {
        content: true,
      },
      orderBy: { priority: 'desc' },
    });

    // Get active promotions
    const activePromotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ startTime: null }, { startTime: { lte: now } }],
        OR: [{ endTime: null }, { endTime: { gte: now } }],
      },
      include: {
        content: true,
      },
    });

    // Get published news items
    const publishedNews = await this.prisma.newsItem.findMany({
      where: {
        isPublished: true,
        OR: [{ publishTime: null }, { publishTime: { lte: now } }],
        OR: [{ expiryTime: null }, { expiryTime: { gte: now } }],
      },
      include: {
        content: true,
      },
      orderBy: { priority: 'desc' },
      take: 10, // Limit to recent news
    });

    return {
      events: activeEvents,
      promotions: activePromotions,
      news: publishedNews,
      lastUpdated: now,
    };
  }
}
