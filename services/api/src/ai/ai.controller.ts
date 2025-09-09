import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobProducer } from '../queue/producers/job.producer';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jobProducer: JobProducer
  ) {}

  @Get('health')
  async getHealthStatus() {
    return await this.aiService.getHealthStatus();
  }

  @Get('config')
  getConfiguration() {
    return this.aiService.getConfiguration();
  }

  @Post('analyze/match')
  async analyzeMatch(
    @Body()
    body: {
      matchId: string;
      matchData: {
        playerAName: string;
        playerBName: string;
        scoreA: number;
        scoreB: number;
        winner: string;
        shots?: any[];
        venue: string;
        round: number;
      };
    },
    @Query('async') asyncMode?: string
  ) {
    const { matchId, matchData } = body;

    // If async mode is requested, enqueue job instead of processing immediately
    if (asyncMode === 'true') {
      const { jobId, queued } = await this.aiService.enqueueMatchAnalysis(
        matchId,
        matchData
      );

      if (queued) {
        return {
          success: true,
          jobId,
          status: 'queued',
          message: 'Match analysis job has been queued for processing',
          estimatedTime: '30-120 seconds',
        };
      }
    }

    // Default: process synchronously
    return await this.aiService.generateMatchAnalysis(matchData);
  }

  @Post('analyze/shot')
  async analyzeShot(
    @Body()
    body: {
      matchId: string;
      sessionId: string;
      shotData: {
        playerName?: string;
        ballSunk?: boolean;
        wasFoul?: boolean;
        position?: { x: number; y: number };
        timestamp: string;
      };
    },
    @Query('async') asyncMode?: string
  ) {
    const { matchId, sessionId, shotData } = body;

    // If async mode is requested, enqueue job instead of processing immediately
    if (asyncMode === 'true') {
      const { jobId, queued } = await this.aiService.enqueueLiveCommentary(
        matchId,
        shotData,
        sessionId
      );

      if (queued) {
        return {
          success: true,
          jobId,
          status: 'queued',
          message: 'Live commentary job has been queued for processing',
          estimatedTime: '5-15 seconds',
        };
      }
    }

    // Default: process synchronously
    return await this.aiService.generateLiveCommentary(shotData);
  }

  @Post('analyze/table')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeTable(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { matchId: string; sessionId: string },
    @Query('async') asyncMode?: string
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    const { matchId, sessionId } = body;

    // If async mode is requested, enqueue job instead of processing immediately
    if (asyncMode === 'true') {
      const { jobId, queued } = await this.aiService.enqueueTableAnalysis(
        matchId,
        file.buffer,
        file.mimetype,
        sessionId
      );

      if (queued) {
        return {
          success: true,
          jobId,
          status: 'queued',
          message: 'Table analysis job has been queued for processing',
          estimatedTime: '20-60 seconds',
        };
      }
    }

    // Default: process synchronously
    return await this.aiService.analyzeTableImage(file.buffer, file.mimetype);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    // This endpoint can be used to check the status of async jobs
    // For now, we'll return a placeholder response
    // In a full implementation, you'd query the job queue for status
    return {
      jobId,
      status: 'unknown',
      message: 'Job status checking not yet implemented',
      checkLater: true,
    };
  }
}
