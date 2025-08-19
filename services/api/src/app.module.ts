import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GameSessionsModule,
    // Temporarily commented out for testing
    // UsersModule,
    // TournamentsModule,
    // TerritoriesModule,
    // MatchesModule,
    // PlayersModule,
    // AchievementsModule,
    // FriendsModule
  ],
})
export class AppModule {}
