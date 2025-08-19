import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [AchievementsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, PrismaService],
})
export class TournamentsModule {}
