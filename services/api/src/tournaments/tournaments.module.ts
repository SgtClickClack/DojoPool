import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { CacheModule } from '../cache/cache.module';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [AchievementsModule, CacheModule, RedisModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, PrismaService],
})
export class TournamentsModule {}
