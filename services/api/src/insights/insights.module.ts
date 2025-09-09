import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JobProducer } from '../queue/producers/job.producer';
import { RedisModule } from '../redis/redis.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { MatchAnalysisQueueService } from './match-analysis-queue.service';
import { MatchAnalysisProcessor } from './match-analysis.processor';

@Module({
  imports: [PrismaModule, AiModule, RedisModule],
  providers: [
    InsightsService,
    MatchAnalysisQueueService,
    MatchAnalysisProcessor,
    JobProducer,
  ],
  controllers: [InsightsController],
  exports: [InsightsService, MatchAnalysisQueueService],
})
export class InsightsModule {}
