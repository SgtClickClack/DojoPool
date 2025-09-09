import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai/ai.service';
import { AnalyticsService } from './analytics/analytics.service';
import { ArAnalysisService } from './ar-analysis/ar-analysis.service';
import { CacheService } from './cache/cache.service';
import { MatchesService } from './matches/matches.service';
import { PlayersService } from './players/players.service';
import { AIProcessor } from './queue/processors/ai.processor';
import { BatchProcessor } from './queue/processors/batch.processor';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    QueueModule,
  ],
  providers: [
    // Processors
    AIProcessor,
    BatchProcessor,

    // Services needed by processors
    AiService,
    ArAnalysisService,
    MatchesService,
    CacheService,
    PlayersService,
    AnalyticsService,
  ],
})
export class WorkerModule {}
