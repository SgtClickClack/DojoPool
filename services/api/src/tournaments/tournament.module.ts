import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { MatchmakingService } from './matchmaking.service';
import { TournamentCacheService } from './tournament-cache.service';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
  imports: [CacheModule, RedisModule, AuthModule],
  controllers: [TournamentController],
  providers: [
    TournamentService,
    MatchmakingService,
    TournamentCacheService,
    PrismaService,
  ],
  exports: [TournamentService, MatchmakingService, TournamentCacheService],
})
export class TournamentModule {}
