import { ContentType, ContentStatus } from './dto/content-filter.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentService } from './content.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { CreateNewsArticleDto } from './dto/create-news-article.dto';
import { CreateSystemMessageDto } from './dto/create-system-message.dto';

@Controller('cms')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CmsController {
  constructor(private readonly contentService: ContentService) {}

  // Event Management Endpoints
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Body(ValidationPipe) createEventDto: CreateEventDto,
    @Request() req: any
  ) {
    const payload: CreateContentDto = {
      ...(createEventDto as any),
      contentType: ContentType.EVENT,
      visibility: undefined,
    };
    return this.contentService.create(
      payload,
      req.user.userId,
      undefined, // fileUrl
      undefined // thumbnailUrl
    );
  }

  @Get('events')
  async getEvents(
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20
  ) {
    return this.contentService.findAllForAdmin(
      {
        contentType: ContentType.EVENT,
      },
      page,
      limit
    );
  }

  @Put('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateEventDto>,
    @Request() req: any
  ) {
    return this.contentService.update(id, updateData as any, req.user.userId);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('id') id: string, @Request() req: any) {
    await this.contentService.delete(id, req.user.userId);
  }

  // News Article Management Endpoints
  @Post('news')
  @HttpCode(HttpStatus.CREATED)
  async createNewsArticle(
    @Body(ValidationPipe) createNewsDto: CreateNewsArticleDto,
    @Request() req: any
  ) {
    const payload: CreateContentDto = {
      ...(createNewsDto as any),
      contentType: ContentType.NEWS_ARTICLE,
      visibility: undefined,
    };
    return this.contentService.create(
      payload,
      req.user.userId,
      undefined, // fileUrl
      createNewsDto.featuredImage // thumbnailUrl
    );
  }

  @Get('news')
  async getNewsArticles(
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    const filters: any = {
      contentType: ContentType.NEWS_ARTICLE,
    };

    if (status) filters.status = status;
    if (category) {
      filters.metadata = {
        path: ['category'],
        equals: category,
      };
    }

    return this.contentService.findAllForAdmin(filters, page, limit);
  }

  @Put('news/:id')
  async updateNewsArticle(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateNewsArticleDto>,
    @Request() req: any
  ) {
    return this.contentService.update(id, updateData as any, req.user.userId);
  }

  @Delete('news/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNewsArticle(@Param('id') id: string, @Request() req: any) {
    await this.contentService.delete(id, req.user.userId);
  }

  // System Message Management Endpoints
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async createSystemMessage(
    @Body(ValidationPipe) createMessageDto: CreateSystemMessageDto,
    @Request() req: any
  ) {
    const payload: CreateContentDto = {
      ...(createMessageDto as any),
      contentType: ContentType.SYSTEM_MESSAGE,
      visibility: undefined,
    };
    return this.contentService.create(
      payload,
      req.user.userId,
      undefined, // fileUrl
      undefined // thumbnailUrl
    );
  }

  @Get('messages')
  async getSystemMessages(
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20,
    @Query('active') active?: boolean
  ) {
    const filters: any = {
      contentType: ContentType.SYSTEM_MESSAGE,
    };

    if (active !== undefined) {
      filters.metadata = {
        path: ['isActive'],
        equals: active,
      };
    }

    return this.contentService.findAllForAdmin(filters, page, limit);
  }

  @Put('messages/:id')
  async updateSystemMessage(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateSystemMessageDto>,
    @Request() req: any
  ) {
    return this.contentService.update(id, updateData as any, req.user.userId);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSystemMessage(@Param('id') id: string, @Request() req: any) {
    await this.contentService.delete(id, req.user.userId);
  }

  // Preview endpoints (for viewing content before publishing)
  @Post('preview/event')
  async previewEvent(@Body(ValidationPipe) eventData: CreateEventDto) {
    return {
      ...eventData,
      contentType: ContentType.EVENT,
      id: 'preview',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PREVIEW',
      likes: 0,
      shares: 0,
      views: 0,
    };
  }

  @Post('preview/news')
  async previewNewsArticle(
    @Body(ValidationPipe) newsData: CreateNewsArticleDto
  ) {
    return {
      ...newsData,
      contentType: ContentType.NEWS_ARTICLE,
      id: 'preview',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PREVIEW',
      likes: 0,
      shares: 0,
      views: 0,
    };
  }

  @Post('preview/message')
  async previewSystemMessage(
    @Body(ValidationPipe) messageData: CreateSystemMessageDto
  ) {
    return {
      ...messageData,
      contentType: ContentType.SYSTEM_MESSAGE,
      id: 'preview',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PREVIEW',
      likes: 0,
      shares: 0,
      views: 0,
    };
  }

  // Bulk operations
  @Post('bulk-publish')
  async bulkPublish(
    @Body() data: { contentIds: string[] },
    @Request() req: any
  ) {
    const results = [];
    for (const id of data.contentIds) {
      try {
        const result = await this.contentService.update(
          id,
          { status: ContentStatus.APPROVED as any },
          req.user.userId
        );
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: (error as Error).message });
      }
    }
    return { results };
  }

  @Post('bulk-archive')
  async bulkArchive(
    @Body() data: { contentIds: string[] },
    @Request() req: any
  ) {
    const results = [];
    for (const id of data.contentIds) {
      try {
        const result = await this.contentService.update(
          id,
          { status: ContentStatus.ARCHIVED as any },
          req.user.userId
        );
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: (error as Error).message });
      }
    }
    return { results };
  }

  // CMS Statistics endpoint
  @Get('stats')
  async getCMSStats() {
    const allStats = await this.contentService.getStats();

    // Get counts by content type
    const [eventStats, newsStats, messageStats] = await Promise.all([
      this.contentService.findAllForAdmin(
        {
          contentType: ContentType.EVENT,
          status: ContentStatus.APPROVED,
        },
        1,
        1000
      ),
      this.contentService.findAllForAdmin(
        {
          contentType: ContentType.NEWS_ARTICLE,
          status: ContentStatus.APPROVED,
        },
        1,
        1000
      ),
      this.contentService.findAllForAdmin(
        {
          contentType: ContentType.SYSTEM_MESSAGE,
          status: ContentStatus.APPROVED,
        },
        1,
        1000
      ),
    ]);

    // Count active system messages (those with isActive: true)
    const activeSystemMessages = messageStats.content.filter(
      (msg) =>
        msg.metadata && JSON.parse(msg.metadata.toString()).isActive === true
    ).length;

    return {
      totalEvents: eventStats.totalCount,
      totalNewsArticles: newsStats.totalCount,
      totalSystemMessages: messageStats.totalCount,
      activeSystemMessages,
      pendingContent: allStats.pending,
      totalViews: allStats.totalViews,
      totalLikes: allStats.totalLikes,
      totalShares: allStats.totalShares,
    };
  }
}
