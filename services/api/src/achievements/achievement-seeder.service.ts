import { Injectable, Logger } from '@nestjs/common';
import { AchievementCategory, RewardType } from '@prisma/client';
import { AchievementService } from './achievement.service';
import { RewardService } from './reward.service';

@Injectable()
export class AchievementSeederService {
  private readonly logger = new Logger(AchievementSeederService.name);

  constructor(
    private readonly achievementService: AchievementService,
    private readonly rewardService: RewardService
  ) {}

  /**
   * Seed initial achievements and rewards
   */
  async seedAchievements(): Promise<void> {
    try {
      this.logger.log('Starting achievement seeding...');

      // Create rewards first
      await this.seedRewards();

      // Create achievements
      await this.seedVenueAchievements();
      await this.seedMatchAchievements();
      await this.seedTerritoryAchievements();
      await this.seedTradingAchievements();
      await this.seedSocialAchievements();
      await this.seedProgressionAchievements();

      this.logger.log('Achievement seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed achievements:', error);
      throw error;
    }
  }

  /**
   * Seed reward definitions
   */
  private async seedRewards(): Promise<void> {
    const rewards = [
      {
        name: 'Welcome Bonus',
        description: 'A small reward to get you started',
        type: RewardType.DOJO_COINS,
        dojoCoinAmount: 100,
      },
      {
        name: 'First Win Reward',
        description: 'Congratulations on your first victory!',
        type: RewardType.DOJO_COINS,
        dojoCoinAmount: 250,
      },
      {
        name: 'Explorer Badge',
        description: 'For visiting multiple venues',
        type: RewardType.DOJO_COINS,
        dojoCoinAmount: 500,
      },
      {
        name: 'Champion Title',
        description: 'Exclusive champion title',
        type: RewardType.EXCLUSIVE_TITLE,
        title: 'Champion',
      },
      {
        name: 'Victory Emote',
        description: 'Celebrate your wins with style',
        type: RewardType.AVATAR_ASSET,
        // avatarAssetId would be set to an actual avatar asset ID
      },
      {
        name: 'Clan Boost',
        description: "Boost your clan's experience",
        type: RewardType.CLAN_POINTS,
        clanPoints: 100,
      },
      {
        name: 'Master Player Badge',
        description: 'A special badge for accomplished players',
        type: RewardType.SPECIAL_BADGE,
        badgeData: { rarity: 'legendary', effect: 'prestige' },
      },
    ];

    for (const rewardData of rewards) {
      try {
        await this.rewardService.createReward(rewardData);
        this.logger.log(`Created reward: ${rewardData.name}`);
      } catch (error) {
        // Reward might already exist, skip
        this.logger.warn(`Reward ${rewardData.name} might already exist`);
      }
    }
  }

  /**
   * Seed venue-related achievements
   */
  private async seedVenueAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'first_venue_visit',
        name: 'First Steps',
        description: 'Visit your first Dojo venue',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'VENUE_CHECK_INS',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-visit.png',
      },
      {
        key: 'venue_explorer',
        name: 'Dojo Explorer',
        description: 'Visit 5 different venues',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'UNIQUE_VENUES_VISITED',
        criteriaValue: 5,
        iconUrl: '/icons/achievements/explorer.png',
      },
      {
        key: 'venue_master',
        name: 'Dojo Master',
        description: 'Visit 25 different venues',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'UNIQUE_VENUES_VISITED',
        criteriaValue: 25,
        iconUrl: '/icons/achievements/master.png',
      },
      {
        key: 'loyal_visitor',
        name: 'Loyal Visitor',
        description: 'Visit the same venue 10 times',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'VENUE_LOYALTY',
        criteriaValue: 10,
        criteriaMetadata: { consecutive: false },
        iconUrl: '/icons/achievements/loyalty.png',
      },
      {
        key: 'daily_warrior',
        name: 'Daily Warrior',
        description: 'Visit a venue for 7 consecutive days',
        category: AchievementCategory.VENUE_VISITS,
        criteriaType: 'CONSECUTIVE_DAILY_VISITS',
        criteriaValue: 7,
        iconUrl: '/icons/achievements/daily.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }

  /**
   * Seed match-related achievements
   */
  private async seedMatchAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'first_game',
        name: 'First Game',
        description: 'Play your first pool match',
        category: AchievementCategory.MATCHES_PLAYED,
        criteriaType: 'FIRST_GAME_PLAYED',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-game.png',
      },
      {
        key: 'first_win',
        name: 'First Victory',
        description: 'Win your first pool match',
        category: AchievementCategory.MATCHES_WON,
        criteriaType: 'MATCHES_WON',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-win.png',
      },
      {
        key: 'winning_streak_3',
        name: 'Hot Streak',
        description: 'Win 3 matches in a row',
        category: AchievementCategory.MATCHES_WON,
        criteriaType: 'WIN_STREAK',
        criteriaValue: 3,
        iconUrl: '/icons/achievements/streak-3.png',
      },
      {
        key: 'winning_streak_10',
        name: 'Unstoppable',
        description: 'Win 10 matches in a row',
        category: AchievementCategory.MATCHES_WON,
        criteriaType: 'WIN_STREAK',
        criteriaValue: 10,
        iconUrl: '/icons/achievements/streak-10.png',
      },
      {
        key: 'experienced_player',
        name: 'Experienced Player',
        description: 'Play 50 matches',
        category: AchievementCategory.MATCHES_PLAYED,
        criteriaType: 'MATCHES_PLAYED',
        criteriaValue: 50,
        iconUrl: '/icons/achievements/experienced.png',
      },
      {
        key: 'veteran_player',
        name: 'Veteran Player',
        description: 'Play 200 matches',
        category: AchievementCategory.MATCHES_PLAYED,
        criteriaType: 'MATCHES_PLAYED',
        criteriaValue: 200,
        iconUrl: '/icons/achievements/veteran.png',
      },
      {
        key: 'venue_champion',
        name: 'Venue Champion',
        description: 'Win 10 matches at the same venue',
        category: AchievementCategory.MATCHES_WON,
        criteriaType: 'VENUE_MATCHES_WON',
        criteriaValue: 10,
        iconUrl: '/icons/achievements/venue-champion.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }

  /**
   * Seed territory-related achievements
   */
  private async seedTerritoryAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'first_territory',
        name: 'Land Owner',
        description: 'Claim your first territory',
        category: AchievementCategory.TERRITORY_CONTROL,
        criteriaType: 'TERRITORIES_CLAIMED',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-territory.png',
      },
      {
        key: 'territory_expansion',
        name: 'Empire Builder',
        description: 'Control 5 different territories',
        category: AchievementCategory.TERRITORY_CONTROL,
        criteriaType: 'UNIQUE_TERRITORIES_CONTROLLED',
        criteriaValue: 5,
        iconUrl: '/icons/achievements/expansion.png',
      },
      {
        key: 'territory_master',
        name: 'Territory Master',
        description: 'Control 20 different territories',
        category: AchievementCategory.TERRITORY_CONTROL,
        criteriaType: 'UNIQUE_TERRITORIES_CONTROLLED',
        criteriaValue: 20,
        iconUrl: '/icons/achievements/territory-master.png',
      },
      {
        key: 'defensive_specialist',
        name: 'Defensive Specialist',
        description: 'Successfully defend a territory from 5 challenges',
        category: AchievementCategory.TERRITORY_CONTROL,
        criteriaType: 'TERRITORY_DEFENSES',
        criteriaValue: 5,
        iconUrl: '/icons/achievements/defensive.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }

  /**
   * Seed trading-related achievements
   */
  private async seedTradingAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'first_trade',
        name: 'Merchant',
        description: 'Complete your first trade',
        category: AchievementCategory.TRADING,
        criteriaType: 'TRADES_COMPLETED',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-trade.png',
      },
      {
        key: 'trader',
        name: 'Experienced Trader',
        description: 'Complete 25 trades',
        category: AchievementCategory.TRADING,
        criteriaType: 'TRADES_COMPLETED',
        criteriaValue: 25,
        iconUrl: '/icons/achievements/trader.png',
      },
      {
        key: 'trade_master',
        name: 'Trade Master',
        description: 'Complete 100 trades',
        category: AchievementCategory.TRADING,
        criteriaType: 'TRADES_COMPLETED',
        criteriaValue: 100,
        iconUrl: '/icons/achievements/trade-master.png',
      },
      {
        key: 'wealth_accumulator',
        name: 'Wealth Accumulator',
        description: 'Accumulate 10,000 DojoCoins through trading',
        category: AchievementCategory.TRADING,
        criteriaType: 'TOTAL_TRADE_VALUE',
        criteriaValue: 10000,
        iconUrl: '/icons/achievements/wealth.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }

  /**
   * Seed social interaction achievements
   */
  private async seedSocialAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'first_friend',
        name: 'Social Butterfly',
        description: 'Make your first friend',
        category: AchievementCategory.SOCIAL_INTERACTION,
        criteriaType: 'FRIENDS_MADE',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/first-friend.png',
      },
      {
        key: 'clan_member',
        name: 'Clan Member',
        description: 'Join your first clan',
        category: AchievementCategory.CLAN_ACTIVITY,
        criteriaType: 'CLANS_JOINED',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/clan-member.png',
      },
      {
        key: 'clan_leader',
        name: 'Clan Leader',
        description: 'Become a clan leader',
        category: AchievementCategory.CLAN_ACTIVITY,
        criteriaType: 'CLAN_LEADER',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/clan-leader.png',
      },
      {
        key: 'team_player',
        name: 'Team Player',
        description: 'Participate in 10 clan activities',
        category: AchievementCategory.CLAN_ACTIVITY,
        criteriaType: 'CLAN_ACTIVITIES',
        criteriaValue: 10,
        iconUrl: '/icons/achievements/team-player.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }

  /**
   * Seed progression and special achievements
   */
  private async seedProgressionAchievements(): Promise<void> {
    const achievements = [
      {
        key: 'tournament_participant',
        name: 'Tournament Player',
        description: 'Participate in your first tournament',
        category: AchievementCategory.PROGRESSION,
        criteriaType: 'TOURNAMENTS_PARTICIPATED',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/tournament-participant.png',
      },
      {
        key: 'tournament_winner',
        name: 'Tournament Champion',
        description: 'Win your first tournament',
        category: AchievementCategory.PROGRESSION,
        criteriaType: 'TOURNAMENTS_WON',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/tournament-winner.png',
      },
      {
        key: 'podium_finisher',
        name: 'Podium Finisher',
        description: 'Finish in the top 3 of a tournament',
        category: AchievementCategory.PROGRESSION,
        criteriaType: 'TOURNAMENT_TOP_3',
        criteriaValue: 1,
        iconUrl: '/icons/achievements/podium.png',
      },
      {
        key: 'dedicated_player',
        name: 'Dedicated Player',
        description: 'Play for 30 consecutive days',
        category: AchievementCategory.PROGRESSION,
        criteriaType: 'CONSECUTIVE_DAILY_VISITS',
        criteriaValue: 30,
        iconUrl: '/icons/achievements/dedicated.png',
      },
      {
        key: 'legendary_player',
        name: 'Legendary Player',
        description: 'Reach the highest tier of achievements',
        category: AchievementCategory.PROGRESSION,
        criteriaType: 'LEGENDARY_STATUS',
        criteriaValue: 1,
        isHidden: true,
        iconUrl: '/icons/achievements/legendary.png',
      },
    ];

    for (const achievementData of achievements) {
      try {
        await this.achievementService.createAchievement(achievementData);
        this.logger.log(`Created achievement: ${achievementData.name}`);
      } catch (error) {
        this.logger.warn(
          `Achievement ${achievementData.name} might already exist`
        );
      }
    }
  }
}
