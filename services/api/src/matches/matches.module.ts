import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SkillsModule } from '../skills/skills.module';
import { AiAnalysisService } from './ai-analysis.service';
import { MatchGateway } from './match.gateway';
import { MatchesController } from './matches.controller';
import { MatchesGateway } from './matches.gateway';
import { MatchesService } from './matches.service';

@Module({
  imports: [PrismaModule, ConfigModule, forwardRef(() => SkillsModule)],
  controllers: [MatchesController],
  providers: [MatchesService, AiAnalysisService, MatchesGateway, MatchGateway],
  exports: [MatchesService, AiAnalysisService, MatchesGateway, MatchGateway],
})
export class MatchesModule {}
