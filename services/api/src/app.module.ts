import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AchievementsModule } from './achievements/achievements.module';
import { ActivityEventsModule } from './activity-events/activity-events.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ArAnalysisModule } from './ar-analysis/ar-analysis.module';
import { AuthModule } from './auth/auth.module';
import { AvatarModule } from './avatar/avatar.module';
import { CacheModule } from './cache/cache.module';
import { ChallengesModule } from './challenges/challenges.module';
import { ChatModule } from './chat/chat.module';
import { ClansModule } from './clans/clans.module';
import { CommonModule } from './common/common.module';
import { CommunityModule } from './community/community.module';
import { ContentModule } from './content/content.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EconomyModule } from './economy/economy.module';
import { ErrorsModule } from './errors/errors.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FriendsModule } from './friends/friends.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { HealthModule } from './health/health.module';
import { InsightsModule } from './insights/insights.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MatchesModule } from './matches/matches.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlayersModule } from './players/players.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { ReferralModule } from './referral/referral.module';
import { SeasonsModule } from './seasons/seasons.module';
import { ShadowRunsModule } from './shadow-runs/shadow-runs.module';
import { SkillsModule } from './skills/skills.module';
import { StrategicMapModule } from './strategic-map/strategic-map.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TerritoriesModule } from './territories/territories.module';
import { TournamentModule } from './tournaments/tournament.module';
import { TradingModule } from './trading/trading.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { WorldMapModule } from './world-map/world-map.module';
import { WorldModule } from './world/world.module';

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
    QueueModule,
    CommonModule,
    // Auth and users
    AuthModule,
    UsersModule,
    // Game features
    MatchesModule,
    GameSessionsModule,
    TournamentModule,
    ChallengesModule,
    SeasonsModule,
    ShadowRunsModule,
    AiModule,
    AvatarModule,
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
    StrategicMapModule,
    // Feedback system
    FeedbackModule,
    // Content sharing system
    ContentModule,
    CommunityModule,
    // Additional features
    AchievementsModule,
    PlayersModule,
    ActivityEventsModule,
    MarketplaceModule,
    TradingModule,
    DashboardModule,
    EconomyModule,
    ReferralModule,
    SkillsModule,
    GeolocationModule,
    WorldModule,
    ArAnalysisModule,
    AdminModule,
    InsightsModule,
    // Telemetry & Analytics
    TelemetryModule,
    // Monitoring & Errors
    MonitoringModule,
    ErrorsModule,
    // System
    HealthModule,
  ],
  providers: [],
})
export class AppModule {}
