import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

// Enhanced Reward Interfaces
export interface DojoCoinReward {
  id: string;
  name: string;
  description: string;
  coinAmount: number;
  type: 'tournament' | 'daily' | 'achievement' | 'special' | 'loyalty' | 'referral' | 'milestone';
  conditions: RewardCondition[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
  redemptionHistory: RewardRedemption[];
  analytics: RewardAnalytics;
}

export interface RewardCondition {
  type: 'tournament_participation' | 'match_win' | 'streak' | 'spending' | 'referral' | 'daily_login' | 'weekly_goal' | 'monthly_challenge';
  value: number;
  description: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'multiple_of';
  additionalParams?: any;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  playerId: string;
  playerName: string;
  redeemedAt: Date;
  coinAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
}

export interface RewardAnalytics {
  totalRedemptions: number;
  uniquePlayers: number;
  averageRedemptionRate: number;
  peakRedemptionTime: string;
  playerEngagement: number;
  revenueImpact: number;
  lastUpdated: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  level: number;
  requiredPoints: number;
  benefits: LoyaltyBenefit[];
  color: string;
  icon: string;
}

export interface LoyaltyBenefit {
  type: 'bonus_coins' | 'discount' | 'exclusive_rewards' | 'priority_access' | 'custom_badge';
  value: number;
  description: string;
  isActive: boolean;
}

export interface PlayerLoyalty {
  playerId: string;
  playerName: string;
  currentTier: LoyaltyTier;
  totalPoints: number;
  pointsThisMonth: number;
  joinDate: Date;
  lastActivity: Date;
  rewardsEarned: number;
  tierHistory: TierHistory[];
}

export interface TierHistory {
  tierId: string;
  tierName: string;
  achievedAt: Date;
  pointsAtAchievement: number;
}

export interface RewardCampaign {
  id: string;
  name: string;
  description: string;
  type: 'seasonal' | 'promotional' | 'milestone' | 'referral';
  rewards: DojoCoinReward[];
  startDate: Date;
  endDate: Date;
  targetAudience: 'all' | 'new_players' | 'loyal_players' | 'high_spenders';
  isActive: boolean;
  analytics: CampaignAnalytics;
}

export interface CampaignAnalytics {
  totalParticipants: number;
  totalRewardsDistributed: number;
  conversionRate: number;
  averageEngagement: number;
  costPerAcquisition: number;
  returnOnInvestment: number;
}

export interface AutomatedReward {
  id: string;
  name: string;
  trigger: RewardTrigger;
  reward: DojoCoinReward;
  isActive: boolean;
  lastTriggered: Date;
  triggerCount: number;
  maxTriggers?: number;
}

export interface RewardTrigger {
  type: 'player_action' | 'time_based' | 'milestone' | 'social' | 'purchase';
  condition: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'on_event';
  parameters: any;
}

class DojoCoinRewardService extends EventEmitter {
  private static instance: DojoCoinRewardService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private rewards: DojoCoinReward[] = [];
  private loyaltyTiers: LoyaltyTier[] = [];
  private playerLoyalty: PlayerLoyalty[] = [];
  private campaigns: RewardCampaign[] = [];
  private automatedRewards: AutomatedReward[] = [];

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
    this.startAutomatedRewardProcessing();
  }

  public static getInstance(): DojoCoinRewardService {
    if (!DojoCoinRewardService.instance) {
      DojoCoinRewardService.instance = new DojoCoinRewardService();
    }
    return DojoCoinRewardService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('dojo_coin:join', { service: 'dojo_coin_rewards' });
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.emit('disconnected');
        this.handleReconnection();
      });

      this.socket.on('dojo_coin:reward_created', (reward: DojoCoinReward) => {
        this.addReward(reward);
        this.emit('rewardCreated', reward);
      });

      this.socket.on('dojo_coin:reward_redeemed', (redemption: RewardRedemption) => {
        this.processRedemption(redemption);
        this.emit('rewardRedeemed', redemption);
      });

      this.socket.on('dojo_coin:loyalty_updated', (loyalty: PlayerLoyalty) => {
        this.updatePlayerLoyalty(loyalty);
        this.emit('loyaltyUpdated', loyalty);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this._isConnected = false;
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    }
  }

  // Reward Management
  public async createReward(reward: Omit<DojoCoinReward, 'id' | 'currentRedemptions' | 'redemptionHistory' | 'analytics'>): Promise<DojoCoinReward> {
    const newReward: DojoCoinReward = {
      ...reward,
      id: this.generateId(),
      currentRedemptions: 0,
      redemptionHistory: [],
      analytics: {
        totalRedemptions: 0,
        uniquePlayers: 0,
        averageRedemptionRate: 0,
        peakRedemptionTime: '12:00',
        playerEngagement: 0,
        revenueImpact: 0,
        lastUpdated: new Date()
      }
    };

    this.rewards.push(newReward);
    this.socket?.emit('dojo_coin:create_reward', newReward);
    this.emit('rewardCreated', newReward);
    return newReward;
  }

  public async updateReward(reward: DojoCoinReward): Promise<void> {
    const index = this.rewards.findIndex(r => r.id === reward.id);
    if (index !== -1) {
      this.rewards[index] = reward;
      this.socket?.emit('dojo_coin:update_reward', reward);
      this.emit('rewardUpdated', reward);
    }
  }

  public getRewards(venueId: string): DojoCoinReward[] {
    return this.rewards.filter(r => r.isActive);
  }

  public getActiveRewards(venueId: string): DojoCoinReward[] {
    const now = new Date();
    return this.rewards.filter(r => 
      r.isActive && 
      r.startDate <= now && 
      (!r.endDate || r.endDate >= now)
    );
  }

  // Redemption Management
  public async redeemReward(rewardId: string, playerId: string, playerName: string): Promise<RewardRedemption> {
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward || !reward.isActive) {
      throw new Error('Reward not found or inactive');
    }

    if (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions) {
      throw new Error('Reward redemption limit reached');
    }

    const redemption: RewardRedemption = {
      id: this.generateId(),
      rewardId,
      playerId,
      playerName,
      redeemedAt: new Date(),
      coinAmount: reward.coinAmount,
      status: 'pending'
    };

    reward.currentRedemptions++;
    reward.redemptionHistory.push(redemption);
    this.updateRewardAnalytics(reward);

    this.socket?.emit('dojo_coin:redeem_reward', redemption);
    this.emit('rewardRedeemed', redemption);
    return redemption;
  }

  private processRedemption(redemption: RewardRedemption): void {
    const reward = this.rewards.find(r => r.id === redemption.rewardId);
    if (reward) {
      reward.redemptionHistory.push(redemption);
      this.updateRewardAnalytics(reward);
    }
  }

  private updateRewardAnalytics(reward: DojoCoinReward): void {
    const uniquePlayers = new Set(reward.redemptionHistory.map(r => r.playerId)).size;
    const totalRedemptions = reward.redemptionHistory.length;
    const averageRate = totalRedemptions > 0 ? totalRedemptions / uniquePlayers : 0;

    reward.analytics = {
      totalRedemptions,
      uniquePlayers,
      averageRedemptionRate: averageRate,
      peakRedemptionTime: this.calculatePeakTime(reward.redemptionHistory),
      playerEngagement: this.calculateEngagement(reward),
      revenueImpact: this.calculateRevenueImpact(reward),
      lastUpdated: new Date()
    };
  }

  private calculatePeakTime(redemptions: RewardRedemption[]): string {
    const hourCounts = new Array(24).fill(0);
    redemptions.forEach(r => {
      const hour = r.redeemedAt.getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    return `${peakHour.toString().padStart(2, '0')}:00`;
  }

  private calculateEngagement(reward: DojoCoinReward): number {
    const recentRedemptions = reward.redemptionHistory.filter(r => 
      r.redeemedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return recentRedemptions.length;
  }

  private calculateRevenueImpact(reward: DojoCoinReward): number {
    // Mock calculation - in real implementation, this would calculate actual revenue impact
    return reward.currentRedemptions * reward.coinAmount * 0.1;
  }

  // Loyalty Program Management
  public async createLoyaltyTier(tier: Omit<LoyaltyTier, 'id'>): Promise<LoyaltyTier> {
    const newTier: LoyaltyTier = {
      ...tier,
      id: this.generateId()
    };

    this.loyaltyTiers.push(newTier);
    this.socket?.emit('dojo_coin:create_loyalty_tier', newTier);
    this.emit('loyaltyTierCreated', newTier);
    return newTier;
  }

  public getLoyaltyTiers(): LoyaltyTier[] {
    return this.loyaltyTiers.sort((a, b) => a.level - b.level);
  }

  public async updatePlayerLoyalty(loyalty: PlayerLoyalty): Promise<void> {
    const index = this.playerLoyalty.findIndex(p => p.playerId === loyalty.playerId);
    if (index !== -1) {
      this.playerLoyalty[index] = loyalty;
    } else {
      this.playerLoyalty.push(loyalty);
    }
    this.socket?.emit('dojo_coin:update_loyalty', loyalty);
    this.emit('loyaltyUpdated', loyalty);
  }

  public getPlayerLoyalty(playerId: string): PlayerLoyalty | undefined {
    return this.playerLoyalty.find(p => p.playerId === playerId);
  }

  public async addPlayerPoints(playerId: string, points: number): Promise<void> {
    let loyalty = this.getPlayerLoyalty(playerId);
    if (!loyalty) {
      loyalty = {
        playerId,
        playerName: `Player ${playerId}`,
        currentTier: this.loyaltyTiers[0] || this.createDefaultTier(),
        totalPoints: 0,
        pointsThisMonth: 0,
        joinDate: new Date(),
        lastActivity: new Date(),
        rewardsEarned: 0,
        tierHistory: []
      };
    }

    loyalty.totalPoints += points;
    loyalty.pointsThisMonth += points;
    loyalty.lastActivity = new Date();

    // Check for tier upgrades
    const newTier = this.checkTierUpgrade(loyalty);
    if (newTier && newTier.level > loyalty.currentTier.level) {
      loyalty.tierHistory.push({
        tierId: loyalty.currentTier.id,
        tierName: loyalty.currentTier.name,
        achievedAt: new Date(),
        pointsAtAchievement: loyalty.totalPoints - points
      });
      loyalty.currentTier = newTier;
    }

    await this.updatePlayerLoyalty(loyalty);
  }

  private checkTierUpgrade(loyalty: PlayerLoyalty): LoyaltyTier | null {
    const nextTier = this.loyaltyTiers.find(t => 
      t.level > loyalty.currentTier.level && 
      loyalty.totalPoints >= t.requiredPoints
    );
    return nextTier || null;
  }

  private createDefaultTier(): LoyaltyTier {
    return {
      id: this.generateId(),
      name: 'Bronze',
      description: 'Starting tier for new players',
      level: 1,
      requiredPoints: 0,
      benefits: [],
      color: '#CD7F32',
      icon: '🥉'
    };
  }

  // Campaign Management
  public async createCampaign(campaign: Omit<RewardCampaign, 'id' | 'analytics'>): Promise<RewardCampaign> {
    const newCampaign: RewardCampaign = {
      ...campaign,
      id: this.generateId(),
      analytics: {
        totalParticipants: 0,
        totalRewardsDistributed: 0,
        conversionRate: 0,
        averageEngagement: 0,
        costPerAcquisition: 0,
        returnOnInvestment: 0
      }
    };

    this.campaigns.push(newCampaign);
    this.socket?.emit('dojo_coin:create_campaign', newCampaign);
    this.emit('campaignCreated', newCampaign);
    return newCampaign;
  }

  public getActiveCampaigns(): RewardCampaign[] {
    const now = new Date();
    return this.campaigns.filter(c => 
      c.isActive && 
      c.startDate <= now && 
      c.endDate >= now
    );
  }

  // Automated Reward Processing
  private startAutomatedRewardProcessing(): void {
    setInterval(() => {
      this.processAutomatedRewards();
    }, 60000); // Check every minute
  }

  private processAutomatedRewards(): void {
    this.automatedRewards.forEach(async (automatedReward) => {
      if (!automatedReward.isActive) return;

      const shouldTrigger = this.checkTriggerCondition(automatedReward.trigger);
      if (shouldTrigger && (!automatedReward.maxTriggers || automatedReward.triggerCount < automatedReward.maxTriggers)) {
        await this.triggerAutomatedReward(automatedReward);
      }
    });
  }

  private checkTriggerCondition(trigger: RewardTrigger): boolean {
    // Mock implementation - in real system, this would check actual conditions
    switch (trigger.type) {
      case 'time_based':
        return this.checkTimeBasedTrigger(trigger);
      case 'player_action':
        return this.checkPlayerActionTrigger(trigger);
      case 'milestone':
        return this.checkMilestoneTrigger(trigger);
      default:
        return false;
    }
  }

  private checkTimeBasedTrigger(trigger: RewardTrigger): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Mock time-based logic
    return hour >= 9 && hour <= 17; // Business hours
  }

  private checkPlayerActionTrigger(trigger: RewardTrigger): boolean {
    // Mock player action logic
    return Math.random() > 0.7; // 30% chance
  }

  private checkMilestoneTrigger(trigger: RewardTrigger): boolean {
    // Mock milestone logic
    return Math.random() > 0.8; // 20% chance
  }

  private async triggerAutomatedReward(automatedReward: AutomatedReward): Promise<void> {
    automatedReward.triggerCount++;
    automatedReward.lastTriggered = new Date();

    // Create a new reward instance for this trigger
    const triggeredReward = await this.createReward({
      ...automatedReward.reward,
      name: `${automatedReward.reward.name} (Auto)`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    this.emit('automatedRewardTriggered', { automatedReward, triggeredReward });
  }

  // Analytics and Reporting
  public getRewardAnalytics(venueId: string): any {
    const venueRewards = this.rewards.filter(r => r.isActive);
    const totalRewards = venueRewards.length;
    const totalRedemptions = venueRewards.reduce((sum, r) => sum + r.currentRedemptions, 0);
    const totalCoinsDistributed = venueRewards.reduce((sum, r) => sum + (r.currentRedemptions * r.coinAmount), 0);

    return {
      totalRewards,
      totalRedemptions,
      totalCoinsDistributed,
      averageRedemptionRate: totalRewards > 0 ? totalRedemptions / totalRewards : 0,
      topPerformingRewards: this.getTopPerformingRewards(venueRewards),
      loyaltyStats: this.getLoyaltyStats(),
      campaignPerformance: this.getCampaignPerformance()
    };
  }

  private getTopPerformingRewards(rewards: DojoCoinReward[]): DojoCoinReward[] {
    return rewards
      .sort((a, b) => b.currentRedemptions - a.currentRedemptions)
      .slice(0, 5);
  }

  private getLoyaltyStats(): any {
    const totalPlayers = this.playerLoyalty.length;
    const tierDistribution = this.loyaltyTiers.map(tier => ({
      tier: tier.name,
      count: this.playerLoyalty.filter(p => p.currentTier.id === tier.id).length
    }));

    return {
      totalPlayers,
      tierDistribution,
      averagePoints: totalPlayers > 0 ? 
        this.playerLoyalty.reduce((sum, p) => sum + p.totalPoints, 0) / totalPlayers : 0
    };
  }

  private getCampaignPerformance(): any {
    return this.campaigns.map(campaign => ({
      name: campaign.name,
      participants: campaign.analytics.totalParticipants,
      conversionRate: campaign.analytics.conversionRate,
      roi: campaign.analytics.returnOnInvestment
    }));
  }

  // Utility Methods
  public isConnected(): boolean {
    return this._isConnected;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadMockData(): void {
    // Load mock loyalty tiers
    this.loyaltyTiers = [
      {
        id: '1',
        name: 'Bronze',
        description: 'Starting tier for new players',
        level: 1,
        requiredPoints: 0,
        benefits: [
          { type: 'bonus_coins', value: 10, description: '10% bonus coins', isActive: true }
        ],
        color: '#CD7F32',
        icon: '🥉'
      },
      {
        id: '2',
        name: 'Silver',
        description: 'Active players tier',
        level: 2,
        requiredPoints: 100,
        benefits: [
          { type: 'bonus_coins', value: 20, description: '20% bonus coins', isActive: true },
          { type: 'discount', value: 5, description: '5% discount on purchases', isActive: true }
        ],
        color: '#C0C0C0',
        icon: '🥈'
      },
      {
        id: '3',
        name: 'Gold',
        description: 'Loyal players tier',
        level: 3,
        requiredPoints: 500,
        benefits: [
          { type: 'bonus_coins', value: 30, description: '30% bonus coins', isActive: true },
          { type: 'discount', value: 10, description: '10% discount on purchases', isActive: true },
          { type: 'exclusive_rewards', value: 1, description: 'Exclusive rewards access', isActive: true }
        ],
        color: '#FFD700',
        icon: '🥇'
      }
    ];

    // Load mock automated rewards
    this.automatedRewards = [
      {
        id: '1',
        name: 'Daily Login Bonus',
        trigger: {
          type: 'time_based',
          condition: 'daily_login',
          frequency: 'daily',
          parameters: { hour: 9 }
        },
        reward: {
          id: 'auto_1',
          name: 'Daily Login Reward',
          description: 'Bonus coins for daily login',
          coinAmount: 50,
          type: 'daily',
          conditions: [],
          isActive: true,
          startDate: new Date(),
          currentRedemptions: 0,
          redemptionHistory: [],
          analytics: {
            totalRedemptions: 0,
            uniquePlayers: 0,
            averageRedemptionRate: 0,
            peakRedemptionTime: '09:00',
            playerEngagement: 0,
            revenueImpact: 0,
            lastUpdated: new Date()
          }
        },
        isActive: true,
        lastTriggered: new Date(),
        triggerCount: 0
      }
    ];
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default DojoCoinRewardService; 