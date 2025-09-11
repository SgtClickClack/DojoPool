export interface BattlePassTier {
  id: string;
  tier: number;
  requiredXP: number;
  rewards: {
    free: string[];
    premium: string[];
  };
  isUnlocked: boolean;
  isPremium: boolean;
  name: string;
  description: string;
}

export interface SeasonalBattlePass {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  currentXP: number;
  totalXP: number;
  tiers: BattlePassTier[];
  isPremium: boolean;
  timeRemaining: string;
}

export interface BattlePassProgress {
  currentXP: number;
  totalXP: number;
  currentTier: number;
  unlockedTiers: number[];
  premiumUnlocked: boolean;
}

class BattlePassService {
  private baseUrl = '/api/battle-pass';

  // Get current season battle pass data
  async getCurrentSeason(): Promise<SeasonalBattlePass> {
    try {
      const response = await fetch(`${this.baseUrl}/current`);
      if (!response.ok) {
        throw new Error('Failed to fetch battle pass data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching battle pass:', error);
      // Return mock data for development
      return this.getMockBattlePass();
    }
  }

  // Get user's battle pass progress
  async getUserProgress(userId: string): Promise<BattlePassProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Return mock data for development
      return this.getMockProgress();
    }
  }

  // Purchase premium battle pass
  async purchasePremium(
    seasonId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seasonId }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase premium');
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing premium:', error);
      throw error;
    }
  }

  // Claim tier rewards
  async claimTierRewards(
    tierId: string
  ): Promise<{ success: boolean; rewards: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/claim-rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      if (!response.ok) {
        throw new Error('Failed to claim rewards');
      }

      return await response.json();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  }

  // Calculate XP from tournament results
  calculateTournamentXP(
    placement: number,
    totalParticipants: number,
    tournamentTier: 'bronze' | 'silver' | 'gold' | 'platinum',
    isPremium: boolean = false
  ): number {
    const baseXP = {
      bronze: 25,
      silver: 50,
      gold: 100,
      platinum: 200,
    };

    const tierMultiplier = baseXP[tournamentTier] || 50;

    // Bonus for top placements
    let placementBonus = 0;
    if (placement === 1) placementBonus = 100;
    else if (placement === 2) placementBonus = 75;
    else if (placement === 3) placementBonus = 50;
    else if (placement <= 10) placementBonus = 25;

    // Premium bonus
    const premiumBonus = isPremium ? 1.5 : 1;

    return Math.floor((tierMultiplier + placementBonus) * premiumBonus);
  }

  // Calculate XP from daily challenges
  calculateDailyChallengeXP(challengeType: string, completed: boolean): number {
    if (!completed) return 0;

    const challengeXP = {
      win_streak: 25,
      perfect_game: 50,
      tournament_participation: 15,
      clan_contribution: 20,
      skill_improvement: 30,
    };

    return challengeXP[challengeType as keyof typeof challengeXP] || 10;
  }

  // Get season time remaining
  getTimeRemaining(endDate: string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Mock data for development
  private getMockBattlePass(): SeasonalBattlePass {
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() + 12);

    return {
      id: 'season-2024-09',
      seasonName: 'Neon Nights Championship',
      startDate: currentDate.toISOString(),
      endDate: endDate.toISOString(),
      currentXP: 2500,
      totalXP: 5000,
      isPremium: false,
      timeRemaining: this.getTimeRemaining(endDate.toISOString()),
      tiers: this.generateMockTiers(),
    };
  }

  private generateMockTiers(): BattlePassTier[] {
    return [
      {
        id: 'tier-1',
        tier: 1,
        requiredXP: 100,
        isUnlocked: true,
        isPremium: false,
        name: 'Rookie',
        description: 'Welcome to the battle pass!',
        rewards: {
          free: ['100 DojoCoins', 'Basic Avatar Frame'],
          premium: ['200 DojoCoins', 'Premium Avatar Frame'],
        },
      },
      {
        id: 'tier-2',
        tier: 2,
        requiredXP: 300,
        isUnlocked: true,
        isPremium: false,
        name: 'Apprentice',
        description: 'Getting started!',
        rewards: {
          free: ['150 DojoCoins', 'Tournament Entry Pass'],
          premium: ['300 DojoCoins', 'Premium Tournament Entry'],
        },
      },
      {
        id: 'tier-3',
        tier: 3,
        requiredXP: 600,
        isUnlocked: false,
        isPremium: false,
        name: 'Warrior',
        description: 'Proving your skills',
        rewards: {
          free: ['200 DojoCoins', 'Rare Cue Skin'],
          premium: ['400 DojoCoins', 'Legendary Cue Skin'],
        },
      },
      {
        id: 'tier-4',
        tier: 4,
        requiredXP: 1000,
        isUnlocked: false,
        isPremium: true,
        name: 'Champion',
        description: 'Elite player status',
        rewards: {
          free: ['300 DojoCoins', 'Exclusive Emote'],
          premium: ['600 DojoCoins', 'Champion Title', 'VIP Tournament Access'],
        },
      },
      {
        id: 'tier-5',
        tier: 5,
        requiredXP: 1500,
        isUnlocked: false,
        isPremium: true,
        name: 'Legend',
        description: 'Legendary status achieved',
        rewards: {
          free: ['500 DojoCoins', 'Legendary Avatar'],
          premium: ['1000 DojoCoins', 'Exclusive Tournament', 'Custom Title'],
        },
      },
    ];
  }

  private getMockProgress(): BattlePassProgress {
    return {
      currentXP: 2500,
      totalXP: 5000,
      currentTier: 3,
      unlockedTiers: [1, 2],
      premiumUnlocked: false,
    };
  }
}

const battlePassService = new BattlePassService();
export default battlePassService;
