import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface PassiveIncomeConfig {
  baseRate: number; // Base DojoCoin per hour
  territoryBonus: number; // Multiplier for territory control
  venueActivityBonus: number; // Bonus based on venue activity
  clanBonus: number; // Bonus for clan-controlled territories
  maxIncomePerHour: number; // Maximum income per hour
  payoutInterval: number; // Payout interval in minutes
}

export interface TerritoryIncome {
  territoryId: string;
  ownerId: string;
  clanId?: string;
  baseIncome: number;
  territoryBonus: number;
  activityBonus: number;
  clanBonus: number;
  totalIncome: number;
  lastPayout: Date;
  nextPayout: Date;
  totalEarned: number;
  venueActivity: {
    playerCount: number;
    matchCount: number;
    tournamentCount: number;
    revenue: number;
  };
}

export interface IncomePayout {
  id: string;
  territoryId: string;
  ownerId: string;
  amount: number;
  timestamp: Date;
  breakdown: {
    base: number;
    territory: number;
    activity: number;
    clan: number;
  };
  transactionHash?: string;
}

export class PassiveIncomeService extends EventEmitter {
  private socket: Socket | null = null;
  private config: PassiveIncomeConfig;
  private territoryIncomes: Map<string, TerritoryIncome> = new Map();
  private payoutHistory: Map<string, IncomePayout[]> = new Map();
  private isRunning: boolean = false;
  private payoutInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PassiveIncomeConfig>) {
    super();
    this.config = {
      baseRate: 10, // 10 DojoCoins per hour base
      territoryBonus: 0.5, // 50% bonus for territory control
      venueActivityBonus: 0.3, // 30% bonus for high activity
      clanBonus: 0.2, // 20% bonus for clan control
      maxIncomePerHour: 100, // Maximum 100 DojoCoins per hour
      payoutInterval: 15, // Payout every 15 minutes
      ...config
    };
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io('/socket.io');
    
    this.socket.on('connect', () => {
      console.log('PassiveIncomeService connected to server');
      this.startPayoutSystem();
    });

    this.socket.on('disconnect', () => {
      console.log('PassiveIncomeService disconnected from server');
      this.stopPayoutSystem();
    });

    this.socket.on('venue-activity-update', (data: any) => {
      this.updateVenueActivity(data.territoryId, data.activity);
    });

    this.socket.on('territory-ownership-change', (data: any) => {
      this.handleTerritoryOwnershipChange(data);
    });
  }

  /**
   * Start the passive income payout system
   */
  public startPayoutSystem(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.payoutInterval = setInterval(() => {
      this.processPayouts();
    }, this.config.payoutInterval * 60 * 1000);

    console.log('Passive income payout system started');
  }

  /**
   * Stop the passive income payout system
   */
  public stopPayoutSystem(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.payoutInterval) {
      clearInterval(this.payoutInterval);
      this.payoutInterval = null;
    }

    console.log('Passive income payout system stopped');
  }

  /**
   * Register a territory for passive income
   */
  public registerTerritory(
    territoryId: string,
    ownerId: string,
    clanId?: string
  ): TerritoryIncome {
    const territoryIncome: TerritoryIncome = {
      territoryId,
      ownerId,
      clanId,
      baseIncome: this.config.baseRate,
      territoryBonus: 0,
      activityBonus: 0,
      clanBonus: 0,
      totalIncome: this.config.baseRate,
      lastPayout: new Date(),
      nextPayout: new Date(Date.now() + this.config.payoutInterval * 60 * 1000),
      totalEarned: 0,
      venueActivity: {
        playerCount: 0,
        matchCount: 0,
        tournamentCount: 0,
        revenue: 0
      }
    };

    this.territoryIncomes.set(territoryId, territoryIncome);
    this.payoutHistory.set(territoryId, []);

    this.socket?.emit('passive-income:territory-registered', {
      territoryId,
      ownerId,
      clanId
    });

    console.log(`Territory ${territoryId} registered for passive income`);
    return territoryIncome;
  }

  /**
   * Update venue activity for a territory
   */
  public updateVenueActivity(territoryId: string, activity: any): void {
    const territory = this.territoryIncomes.get(territoryId);
    if (!territory) return;

    territory.venueActivity = {
      playerCount: activity.playerCount || 0,
      matchCount: activity.matchCount || 0,
      tournamentCount: activity.tournamentCount || 0,
      revenue: activity.revenue || 0
    };

    this.calculateIncome(territoryId);
  }

  /**
   * Calculate income for a territory
   */
  private calculateIncome(territoryId: string): void {
    const territory = this.territoryIncomes.get(territoryId);
    if (!territory) return;

    // Base income
    let totalIncome = territory.baseIncome;

    // Territory bonus (always applied)
    const territoryBonus = totalIncome * this.config.territoryBonus;
    territory.territoryBonus = territoryBonus;
    totalIncome += territoryBonus;

    // Activity bonus (based on venue activity)
    const activityScore = this.calculateActivityScore(territory.venueActivity);
    const activityBonus = totalIncome * (this.config.venueActivityBonus * activityScore);
    territory.activityBonus = activityBonus;
    totalIncome += activityBonus;

    // Clan bonus (if clan-controlled)
    if (territory.clanId) {
      const clanBonus = totalIncome * this.config.clanBonus;
      territory.clanBonus = clanBonus;
      totalIncome += clanBonus;
    }

    // Apply maximum income cap
    totalIncome = Math.min(totalIncome, this.config.maxIncomePerHour);

    territory.totalIncome = totalIncome;

    this.socket?.emit('passive-income:income-updated', {
      territoryId,
      totalIncome,
      breakdown: {
        base: territory.baseIncome,
        territory: territory.territoryBonus,
        activity: territory.activityBonus,
        clan: territory.clanBonus
      }
    });
  }

  /**
   * Calculate activity score based on venue metrics
   */
  private calculateActivityScore(activity: any): number {
    const playerScore = Math.min(activity.playerCount / 10, 1); // Max 10 players
    const matchScore = Math.min(activity.matchCount / 5, 1); // Max 5 matches
    const tournamentScore = Math.min(activity.tournamentCount / 2, 1); // Max 2 tournaments
    const revenueScore = Math.min(activity.revenue / 1000, 1); // Max $1000 revenue

    return (playerScore + matchScore + tournamentScore + revenueScore) / 4;
  }

  /**
   * Process payouts for all territories
   */
  private async processPayouts(): Promise<void> {
    const now = new Date();
    const payouts: IncomePayout[] = [];

    for (const [territoryId, territory] of this.territoryIncomes) {
      if (now >= territory.nextPayout) {
        const payout = await this.createPayout(territory);
        payouts.push(payout);
        
        // Update next payout time
        territory.lastPayout = now;
        territory.nextPayout = new Date(now.getTime() + this.config.payoutInterval * 60 * 1000);
        territory.totalEarned += payout.amount;
      }
    }

    if (payouts.length > 0) {
      this.emit('payoutsProcessed', payouts);
      this.socket?.emit('passive-income:payouts-processed', payouts);
    }
  }

  /**
   * Create a payout for a territory
   */
  private async createPayout(territory: TerritoryIncome): Promise<IncomePayout> {
    const payout: IncomePayout = {
      id: `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      territoryId: territory.territoryId,
      ownerId: territory.ownerId,
      amount: territory.totalIncome,
      timestamp: new Date(),
      breakdown: {
        base: territory.baseIncome,
        territory: territory.territoryBonus,
        activity: territory.activityBonus,
        clan: territory.clanBonus
      }
    };

    // Add to payout history
    const history = this.payoutHistory.get(territory.territoryId) || [];
    history.push(payout);
    this.payoutHistory.set(territory.territoryId, history);

    // Emit payout event
    this.emit('payoutCreated', payout);

    return payout;
  }

  /**
   * Handle territory ownership changes
   */
  private handleTerritoryOwnershipChange(data: any): void {
    const { territoryId, newOwnerId, clanId } = data;
    
    const territory = this.territoryIncomes.get(territoryId);
    if (territory) {
      territory.ownerId = newOwnerId;
      territory.clanId = clanId;
      territory.totalEarned = 0; // Reset for new owner
      
      this.calculateIncome(territoryId);
    }
  }

  /**
   * Get income information for a territory
   */
  public getTerritoryIncome(territoryId: string): TerritoryIncome | null {
    return this.territoryIncomes.get(territoryId) || null;
  }

  /**
   * Get payout history for a territory
   */
  public getPayoutHistory(territoryId: string): IncomePayout[] {
    return this.payoutHistory.get(territoryId) || [];
  }

  /**
   * Get all territory incomes
   */
  public getAllTerritoryIncomes(): TerritoryIncome[] {
    return Array.from(this.territoryIncomes.values());
  }

  /**
   * Get total earnings for a user
   */
  public getUserTotalEarnings(userId: string): number {
    let total = 0;
    for (const territory of this.territoryIncomes.values()) {
      if (territory.ownerId === userId) {
        total += territory.totalEarned;
      }
    }
    return total;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PassiveIncomeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recalculate all incomes with new config
    for (const territoryId of this.territoryIncomes.keys()) {
      this.calculateIncome(territoryId);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): PassiveIncomeConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const passiveIncomeService = new PassiveIncomeService(); 