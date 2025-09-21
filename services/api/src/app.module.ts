import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AchievementsModule } from './achievements/achievements.module';
import { ActivityEventsModule } from './activity-events/activity-events.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ArAnalysisModule } from './ar-analysis/ar-analysis.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { ChallengesModule } from './challenges/challenges.module';
import { ChatModule } from './chat/chat.module';
import { ClansModule } from './clans/clans.module';
import { CommunityModule } from './community/community.module';
import { ContentModule } from './content/content.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ErrorsModule } from './errors/errors.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FriendsModule } from './friends/friends.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { HealthModule } from './health/health.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MatchesModule } from './matches/matches.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlayersModule } from './players/players.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SeasonsModule } from './seasons/seasons.module';
import { ShadowRunsModule } from './shadow-runs/shadow-runs.module';
import { TerritoriesModule } from './territories/territories.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { WorldMapModule } from './world-map/world-map.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    // Core infrastructure
    PrismaModule,
    RedisModule,
    CacheModule,
    // Auth and users
    AuthModule,
    UsersModule,
    // Game features
    MatchesModule,
    GameSessionsModule,
    TournamentsModule,
    ChallengesModule,
    SeasonsModule,
    ShadowRunsModule,
    AiModule,
    // Social features
    ClansModule,
    FriendsModule,
    ChatModule,
    NotificationsModule,
    ActivityEventsModule,
    // Venue management
    VenuesModule,
    TerritoriesModule,
    WorldMapModule,
    // Feedback system
    FeedbackModule,
    // Content sharing system
    ContentModule,
    CommunityModule,
    // Additional features
    AchievementsModule,
    PlayersModule,
    MarketplaceModule,
    DashboardModule,
    ArAnalysisModule,
    AdminModule,
    // Monitoring & Errors
    MonitoringModule,
    ErrorsModule,
    // System
    HealthModule,
    ScheduledTasksModule,
  ],
  providers: [],
})
export class AppModule {}
