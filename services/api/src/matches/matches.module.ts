import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AiAnalysisService } from './ai-analysis.service';
import { MatchesController } from './matches.controller';
import { MatchesGateway } from './matches.gateway';
import { MatchGateway } from './match.gateway';
import { MatchesService } from './matches.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [MatchesController],
  providers: [MatchesService, AiAnalysisService, MatchesGateway, MatchGateway],
  exports: [MatchesService, AiAnalysisService, MatchesGateway, MatchGateway],
})
export class MatchesModule {}
