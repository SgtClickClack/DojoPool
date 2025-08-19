import { Module } from '@nestjs/common';
import { TerritoriesModule } from './territories/territories.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { UsersModule } from './users/users.module';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { AchievementsModule } from './achievements/achievements.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [UsersModule, TournamentsModule, TerritoriesModule, MatchesModule, PlayersModule, AchievementsModule, FriendsModule],
})
export class AppModule {}
