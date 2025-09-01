import { Module } from '@nestjs/common';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';
import { AiAnalysisService } from '../matches/ai-analysis.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  providers: [AiService, AiAnalysisService, ArAnalysisService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
