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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModeratorOrAdminGuard } from '../auth/moderator-or-admin.guard';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackFilterDto } from './dto/feedback-filter.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createFeedbackDto: CreateFeedbackDto,
    @Request() req: any
  ) {
    return this.feedbackService.create(createFeedbackDto, req.user.userId);
  }

  @Get('my')
  async findMyFeedback(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req: any
  ) {
    return this.feedbackService.findByUser(req.user.userId, page, limit);
  }

  @Get('my/:id')
  async findMyFeedbackById(@Param('id') id: string, @Request() req: any) {
    const feedback = await this.feedbackService.findOne(id);

    // Ensure user can only access their own feedback
    if (feedback.userId !== req.user.userId) {
      throw new Error('Unauthorized');
    }

    return feedback;
  }

  @Delete('my/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyFeedback(@Param('id') id: string, @Request() req: any) {
    await this.feedbackService.delete(id, req.user.userId);
  }

  // Admin endpoints
  @Get('admin')
  @UseGuards(AdminGuard)
  async findAllForAdmin(
    @Query(new ValidationPipe({ transform: true })) filters: FeedbackFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ) {
    return this.feedbackService.findAllForAdmin(filters, page, limit);
  }

  // Moderation endpoints (Admin or Moderator)
  @Get('moderation')
  @UseGuards(ModeratorOrAdminGuard)
  async findAllForModeration(
    @Query(new ValidationPipe({ transform: true })) filters: FeedbackFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ) {
    return this.feedbackService.findAllForAdmin(filters, page, limit);
  }

  @Get('moderation/:id')
  @UseGuards(ModeratorOrAdminGuard)
  async findOneForModeration(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put('moderation/:id/status')
  @UseGuards(ModeratorOrAdminGuard)
  async updateStatusForModeration(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFeedbackDto: UpdateFeedbackDto,
    @Request() req: any
  ) {
    return this.feedbackService.update(id, updateFeedbackDto, req.user.userId);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getStats() {
    return this.feedbackService.getStats();
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Put('admin/:id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFeedbackDto: UpdateFeedbackDto,
    @Request() req: any
  ) {
    return this.feedbackService.update(id, updateFeedbackDto, req.user.userId);
  }
}
