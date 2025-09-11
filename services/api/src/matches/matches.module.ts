import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesController } from './matches.controller';
import { MatchesGateway } from './matches.gateway';
import { MatchesService } from './matches.service';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [MatchesController],
  providers: [MatchesGateway, MatchesService],
  exports: [MatchesGateway],
})
export class MatchesModule {}
