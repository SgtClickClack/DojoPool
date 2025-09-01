import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentService } from './content.service';
import { ContentFilterDto } from './dto/content-filter.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createContentDto: CreateContentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    let fileUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file) {
      // In a real implementation, you would upload to cloud storage
      // For now, we'll just use a placeholder URL
      fileUrl = `/uploads/content/${file.filename}`;
      // Generate thumbnail URL if it's an image/video
      if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/')
      ) {
        thumbnailUrl = `/uploads/thumbnails/${file.filename}`;
      }
    }

    return this.contentService.create(
      createContentDto,
      req.user.userId,
      fileUrl,
      thumbnailUrl
    );
  }

  @Get('feed')
  async getFeed(
    @Query(new ValidationPipe({ transform: true })) filters: ContentFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Request() req: any
  ) {
    return this.contentService.findFeed(req.user.userId, filters, page, limit);
  }

  @Get('user/:userId')
  async getUserContent(
    @Param('userId') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Request() req: any
  ) {
    return this.contentService.findByUser(userId, req.user.userId, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.contentService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateContentDto: UpdateContentDto,
    @Request() req: any
  ) {
    return this.contentService.update(id, updateContentDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.contentService.delete(id, req.user.userId);
  }

  // Social features
  @Post(':id/like')
  async likeContent(@Param('id') contentId: string, @Request() req: any) {
    return this.contentService.likeContent(contentId, req.user.userId);
  }

  @Post(':id/share')
  async shareContent(
    @Param('id') contentId: string,
    @Body('sharedWithIds') sharedWithIds: string[],
    @Request() req: any
  ) {
    await this.contentService.shareContent(
      contentId,
      req.user.userId,
      sharedWithIds
    );
    return { success: true };
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(AdminGuard)
  async findAllForAdmin(
    @Query(new ValidationPipe({ transform: true })) filters: ContentFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ) {
    return this.contentService.findAllForAdmin(filters, page, limit);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getStats() {
    return this.contentService.getStats();
  }

  @Put('admin/:id/moderate')
  @UseGuards(AdminGuard)
  async moderateContent(
    @Param('id') id: string,
    @Body(ValidationPipe) moderateContentDto: ModerateContentDto,
    @Request() req: any
  ) {
    return this.contentService.moderateContent(
      id,
      moderateContentDto,
      req.user.userId
    );
  }
}
