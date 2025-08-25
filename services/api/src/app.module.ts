import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorldMapModule } from './world-map/world-map.module';
// import { ClansModule } from './clans/clans.module';
import { AdminModule } from './admin/admin.module';
import { ChallengesService } from './challenges/challenges.service';
import { ChatModule } from './chat/chat.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksService } from './tasks/tasks.service';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    GameSessionsModule,
    WorldMapModule,
    MatchesModule,
    // ClansModule,
    UsersModule,
    MarketplaceModule,
    ChatModule,
    AdminModule,
    NotificationsModule,
    DashboardModule,
    // Temporarily commented out for testing
    // TournamentsModule,
    // TerritoriesModule,
    // PlayersModule,
    // AchievementsModule,
    // FriendsModule
  ],
  providers: [TasksService, ChallengesService],
})
export class AppModule {}
