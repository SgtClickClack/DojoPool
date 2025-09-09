import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementEventsService } from './achievement-events.service';
import { AchievementSeederService } from './achievement-seeder.service';
import { AchievementService } from './achievement.service';
import { AchievementsController } from './achievements.controller';
import { RewardService } from './reward.service';

@Module({
  imports: [PrismaModule],
  controllers: [AchievementsController],
  providers: [
    AchievementService,
    RewardService,
    AchievementEventsService,
    AchievementSeederService,
  ],
  exports: [
    AchievementService,
    RewardService,
    AchievementEventsService,
    AchievementSeederService,
  ],
})
export class AchievementsModule {}
