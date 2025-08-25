import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChallengesService } from './challenges/challenges.service';
import { ChatModule } from './chat/chat.module';
import { ClansModule } from './clans/clans.module';
import { validateEnv } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MatchesModule } from './matches/matches.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksService } from './tasks/tasks.service';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { WorldMapModule } from './world-map/world-map.module';

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
    ClansModule,
    UsersModule,
    MarketplaceModule,
    ChatModule,
    AdminModule,
    NotificationsModule,
    DashboardModule,
    VenuesModule,
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
