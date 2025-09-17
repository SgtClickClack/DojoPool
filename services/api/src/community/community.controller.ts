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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunityService } from './community.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Public endpoints (no admin guard)
  @Get('cosmetic-items')
  async getPublicCosmeticItems(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'newest' | 'popular' | 'likes',
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20
  ) {
    return this.communityService.getPublicCosmeticItems(
      {
        category: category as any,
        search,
        sortBy,
      },
      page,
      limit,
      req.user?.userId
    );
  }

  @Get('cosmetic-items/:id')
  async getCosmeticItem(@Param('id') id: string, @Request() req: any) {
    // Increment view count
    await this.communityService.incrementViews(id);
    // Return item details (would need to implement this method)
    return { id };
  }

  @Post('cosmetic-items/:id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.communityService.toggleLike(id, req.user.userId);
  }

  // User submission endpoints
  @Post('cosmetic-items')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type'), false);
        }
      },
    })
  )
  @HttpCode(HttpStatus.CREATED)
  async submitCosmeticItem(
    @Body(ValidationPipe) body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ) {
    const dto = {
      title: body.title,
      description: body.description,
      category: body.category,
      metadata: body.metadata ? JSON.parse(body.metadata) : {},
      tags: body.tags ? JSON.parse(body.tags) : [],
    };

    let designFileUrl: string | undefined;
    let previewImageUrl: string | undefined;

    if (files && files.length > 0) {
      // Process uploaded files
      for (const file of files) {
        if (file.mimetype.startsWith('image/')) {
          previewImageUrl = `/uploads/cosmetic-items/${file.filename}`;
        } else {
          designFileUrl = `/uploads/cosmetic-items/${file.filename}`;
        }
      }
    }

    return this.communityService.submitCosmeticItem(
      req.user.userId,
      dto,
      designFileUrl,
      previewImageUrl
    );
  }

  @Get('my-submissions')
  async getMySubmissions(
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20,
    @Request() req: any
  ) {
    return this.communityService.getCreatorSubmissions(
      req.user.userId,
      page,
      limit
    );
  }

  @Put('cosmetic-items/:id')
  async updateCosmeticItem(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: any,
    @Request() req: any
  ) {
    const dto = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      metadata: updateData.metadata
        ? JSON.parse(updateData.metadata)
        : undefined,
      tags: updateData.tags ? JSON.parse(updateData.tags) : undefined,
    };

    return this.communityService.updateCosmeticItem(id, req.user.userId, dto);
  }

  @Delete('cosmetic-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCosmeticItem(@Param('id') id: string, @Request() req: any) {
    // Only allow deletion of pending items by the creator
    // Implementation would need to check ownership and status
    return;
  }

  // Admin-only endpoints
  @Get('admin/submissions')
  @UseGuards(AdminGuard)
  async getSubmissionsForReview(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('creatorId') creatorId?: string,
    @Query('search') search?: string,
    @Query('page', ValidationPipe) page: number = 1,
    @Query('limit', ValidationPipe) limit: number = 20
  ) {
    return this.communityService.getSubmissionsForReview(
      {
        status: status as any,
        category: category as any,
        creatorId,
        search,
      },
      page,
      limit
    );
  }

  @Put('admin/cosmetic-items/:id/review')
  @UseGuards(AdminGuard)
  async reviewCosmeticItem(
    @Param('id') id: string,
    @Body(ValidationPipe) reviewData: any,
    @Request() req: any
  ) {
    const dto = {
      status: reviewData.status,
      rejectionReason: reviewData.rejectionReason,
      approvedPrice: reviewData.approvedPrice
        ? parseInt(reviewData.approvedPrice)
        : undefined,
    };

    return this.communityService.reviewCosmeticItem(id, req.user.userId, dto);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getSubmissionStats() {
    return this.communityService.getSubmissionStats();
  }

  // Bulk operations for admins
  @Post('admin/bulk-approve')
  @UseGuards(AdminGuard)
  async bulkApprove(
    @Body() data: { itemIds: string[]; price: number },
    @Request() req: any
  ) {
    const results = [];
    for (const id of data.itemIds) {
      try {
        const result = await this.communityService.reviewCosmeticItem(
          id,
          req.user.userId,
          {
            status: 'APPROVED',
            approvedPrice: data.price,
          }
        );
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: (error as Error).message });
      }
    }
    return { results };
  }

  @Post('admin/bulk-reject')
  @UseGuards(AdminGuard)
  async bulkReject(
    @Body() data: { itemIds: string[]; reason: string },
    @Request() req: any
  ) {
    const results = [];
    for (const id of data.itemIds) {
      try {
        const result = await this.communityService.reviewCosmeticItem(
          id,
          req.user.userId,
          {
            status: 'REJECTED',
            rejectionReason: data.reason,
          }
        );
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: (error as Error).message });
      }
    }
    return { results };
  }
}
