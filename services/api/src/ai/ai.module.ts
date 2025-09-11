import { Module } from '@nestjs/common';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';
import { AiAnalysisService } from '../matches/ai-analysis.service';
import { JobProducer } from '../queue/producers/job.producer';
import { QueueModule } from '../queue/queue.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [QueueModule],
  providers: [AiService, AiAnalysisService, ArAnalysisService, JobProducer],
  controllers: [AiController],
  exports: [AiService, AiAnalysisService],
})
export class AiModule {}
