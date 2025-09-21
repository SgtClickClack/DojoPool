import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly _aiService: AiService) {}

  @Get('health')
  async getHealthStatus() {
    return await this._aiService.getHealthStatus();
  }

  @Get('config')
  getConfiguration() {
    return this._aiService.getConfiguration();
  }

  @Post('analyze/match')
  async analyzeMatch(
    @Body()
    matchData: {
      playerAName: string;
      playerBName: string;
      scoreA: number;
      scoreB: number;
      winner: string;
      shots?: unknown[];
      venue: string;
      round: number;
    }
  ) {
    return await this.aiService.generateMatchAnalysis(matchData);
  }

  @Post('analyze/shot')
  async analyzeShot(
    @Body()
    shotData: {
      matchId: string;
      playerId: string;
      playerName?: string;
      ballSunk?: string | number | boolean | null;
      wasFoul?: boolean;
      shotType?: string;
    }
  ) {
    return await this.aiService.generateLiveCommentary(shotData);
  }

  @Post('analyze/table')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeTable(@UploadedFile() file: Express.Multer.File) {
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

    return await this.aiService.analyzeTableImage(file.buffer!, file.mimetype);
  }
}
