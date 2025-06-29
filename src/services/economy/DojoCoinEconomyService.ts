import { EventEmitter } from 'events';

export interface DojoCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'transfer' | 'reward' | 'penalty';
  amount: number;
  balance: number;
  description: string;
  category: TransactionCategory;
  metadata?: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
}

export interface TransactionCategory {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  dailyLimit?: number;
  weeklyLimit?: number;
}

export interface UserEconomyProfile {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
  lastTransactionDate?: Date;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  rankProgress: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EconomicEvent {
  type: 'transaction' | 'balance_update' | 'rank_upgrade' | 'achievement_unlocked';
  userId: string;
  data: any;
  timestamp: Date;
}

export class DojoCoinEconomyService extends EventEmitter {
  private static instance: DojoCoinEconomyService;
  private userProfiles: Map<string, UserEconomyProfile> = new Map();
  private transactions: Map<string, DojoCoinTransaction[]> = new Map();
  private categories: Map<string, TransactionCategory> = new Map();
  private dailyLimits: Map<string, Map<string, number>> = new Map();
  private weeklyLimits: Map<string, Map<string, number>> = new Map();

  constructor() {
    super();
    this.initializeCategories();
  }

  static getInstance(): DojoCoinEconomyService {
    if (!DojoCoinEconomyService.instance) {
      DojoCoinEconomyService.instance = new DojoCoinEconomyService();
    }
    return DojoCoinEconomyService.instance;
  }

  /**
   * Initialize transaction categories with multipliers and limits
   */
  private initializeCategories(): void {
    const categories: TransactionCategory[] = [
      {
        id: 'match_win',
        name: 'Match Victory',
        description: 'Coins earned from winning pool matches',
        multiplier: 1.0,
        dailyLimit: 1000
      },
      {
        id: 'tournament_win',
        name: 'Tournament Victory',
        description: 'Coins earned from winning tournaments',
        multiplier: 2.0,
        weeklyLimit: 5000
      },
      {
        id: 'territory_control',
        name: 'Territory Control',
        description: 'Passive income from controlling territories',
        multiplier: 0.5,
        dailyLimit: 500
      },
      {
        id: 'achievement',
        name: 'Achievement Reward',
        description: 'Coins earned from unlocking achievements',
        multiplier: 1.5
      },
      {
        id: 'streak_bonus',
        name: 'Win Streak Bonus',
        description: 'Bonus coins for consecutive wins',
        multiplier: 1.2
      },
      {
        id: 'avatar_upgrade',
        name: 'Avatar Upgrade',
        description: 'Coins spent on avatar upgrades',
        multiplier: -1.0
      },
      {
        id: 'tournament_entry',
        name: 'Tournament Entry',
        description: 'Coins spent on tournament entry fees',
        multiplier: -1.0
      },
      {
        id: 'territory_claim',
        name: 'Territory Claim',
        description: 'Coins spent on claiming territories',
        multiplier: -1.0
      },
      {
        id: 'nft_purchase',
        name: 'NFT Purchase',
        description: 'Coins spent on NFT purchases',
        multiplier: -1.0
      },
      {
        id: 'penalty',
        name: 'Penalty',
        description: 'Coins lost due to penalties or rule violations',
        multiplier: -1.0
      }
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Get or create user economy profile
   */
  private getUserProfile(userId: string): UserEconomyProfile {
    return this.userProfiles.get(userId) || this.createDefaultProfile(userId);
  }

  /**
   * Create default user profile
   */
  private createDefaultProfile(userId: string): UserEconomyProfile {
    const profile: UserEconomyProfile = {
      userId,
      balance: 100,
      totalEarned: 0,
      totalSpent: 0,
      transactionCount: 0,
      dailyEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
      rank: 'bronze',
      rankProgress: 0,
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Earn coins for a user
   */
  async earnCoins(
    userId: string,
    amount: number,
    categoryId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<DojoCoinTransaction> {
    // Validate inputs
    if (!userId) {
      throw new Error('Invalid user ID');
    }
    
    if (amount <= 0) {
      throw new Error('Earning amount must be positive');
    }

    const category = this.categories.get(categoryId);
    if (!category) {
      throw new Error(`Invalid transaction category: ${categoryId}`);
    }

    // Check daily/weekly limits
    if (!this.checkLimits(userId, categoryId, amount)) {
      throw new Error(`Transaction limit exceeded for category: ${categoryId}`);
    }

    const adjustedAmount = Math.floor(amount * category.multiplier);
    const profile = this.getUserProfile(userId);
    
    // Create transaction
    const transaction: DojoCoinTransaction = {
      id: this.generateTransactionId(),
      userId,
      type: 'earn',
      amount: adjustedAmount,
      balance: profile.balance + adjustedAmount,
      description,
      category,
      metadata,
      timestamp: new Date(),
      status: 'completed'
    };

    // Update profile
    profile.balance += adjustedAmount;
    profile.totalEarned += adjustedAmount;
    profile.transactionCount++;
    profile.lastTransactionDate = new Date();
    profile.updatedAt = new Date();

    // Update earnings tracking
    this.updateEarningsTracking(profile, adjustedAmount);

    // Store transaction
    this.storeTransaction(userId, transaction);

    // Check for rank upgrade
    const rankUpgrade = this.checkRankUpgrade(profile);
    if (rankUpgrade) {
      this.emit('rank_upgrade', {
        userId,
        oldRank: rankUpgrade.oldRank,
        newRank: rankUpgrade.newRank,
        timestamp: new Date()
      });
    }

    // Emit transaction event
    this.emit('transaction', {
      type: 'earn',
      userId,
      transaction,
      timestamp: new Date()
    });

    return transaction;
  }

  /**
   * Spend coins for a user
   */
  async spendCoins(
    userId: string,
    amount: number,
    categoryId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<DojoCoinTransaction> {
    // Validate inputs
    if (!userId) {
      throw new Error('Invalid user ID');
    }
    
    if (amount <= 0) {
      throw new Error('Spending amount must be positive');
    }

    const category = this.categories.get(categoryId);
    if (!category) {
      throw new Error(`Invalid transaction category: ${categoryId}`);
    }

    const profile = this.getUserProfile(userId);
    
    // Check if user has sufficient balance
    if (profile.balance < amount) {
      throw new Error(`Insufficient balance. Required: ${amount}, Available: ${profile.balance}`);
    }

    const adjustedAmount = Math.floor(amount * Math.abs(category.multiplier));
    
    // Create transaction
    const transaction: DojoCoinTransaction = {
      id: this.generateTransactionId(),
      userId,
      type: 'spend',
      amount: adjustedAmount,
      balance: profile.balance - adjustedAmount,
      description,
      category,
      metadata,
      timestamp: new Date(),
      status: 'completed'
    };

    // Update profile
    profile.balance -= adjustedAmount;
    profile.totalSpent += adjustedAmount;
    profile.transactionCount++;
    profile.lastTransactionDate = new Date();
    profile.updatedAt = new Date();

    // Store transaction
    this.storeTransaction(userId, transaction);

    // Emit transaction event
    this.emit('transaction', {
      type: 'spend',
      userId,
      transaction,
      timestamp: new Date()
    });

    return transaction;
  }

  /**
   * Transfer coins between users
   */
  async transferCoins(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<{ fromTransaction: DojoCoinTransaction; toTransaction: DojoCoinTransaction }> {
    // Validate inputs
    if (!fromUserId || !toUserId) {
      throw new Error('Invalid user ID');
    }
    
    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to same user');
    }
    
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    const fromProfile = this.getUserProfile(fromUserId);
    const toProfile = this.getUserProfile(toUserId);

    // Check if sender has sufficient balance
    if (fromProfile.balance < amount) {
      throw new Error(`Insufficient balance for transfer. Required: ${amount}, Available: ${fromProfile.balance}`);
    }

    // Create transactions
    const fromTransaction: DojoCoinTransaction = {
      id: this.generateTransactionId(),
      userId: fromUserId,
      type: 'spend',
      amount: amount,
      balance: fromProfile.balance - amount,
      description: `Transfer to ${toUserId}: ${description}`,
      category: this.categories.get('penalty')!,
      metadata: { ...metadata, toUserId },
      timestamp: new Date(),
      status: 'completed'
    };

    const toTransaction: DojoCoinTransaction = {
      id: this.generateTransactionId(),
      userId: toUserId,
      type: 'earn',
      amount: amount,
      balance: toProfile.balance + amount,
      description: `Transfer from ${fromUserId}: ${description}`,
      category: this.categories.get('achievement')!,
      metadata: { ...metadata, fromUserId },
      timestamp: new Date(),
      status: 'completed'
    };

    // Update profiles
    fromProfile.balance -= amount;
    fromProfile.totalSpent += amount;
    fromProfile.transactionCount++;
    fromProfile.lastTransactionDate = new Date();
    fromProfile.updatedAt = new Date();

    toProfile.balance += amount;
    toProfile.totalEarned += amount;
    toProfile.transactionCount++;
    toProfile.lastTransactionDate = new Date();
    toProfile.updatedAt = new Date();

    // Store transactions
    this.storeTransaction(fromUserId, fromTransaction);
    this.storeTransaction(toUserId, toTransaction);

    // Emit transfer event
    this.emit('transfer', {
      fromUserId,
      toUserId,
      amount,
      fromTransaction,
      toTransaction,
      timestamp: new Date()
    });

    return { fromTransaction, toTransaction };
  }

  /**
   * Get user balance
   */
  getUserBalance(userId: string): number {
    if (!userId) {
      throw new Error('Invalid user ID');
    }
    
    const profile = this.getUserProfile(userId);
    return profile.balance;
  }

  /**
   * Get user transaction history
   */
  getUserTransactions(userId: string, limit: number = 50): DojoCoinTransaction[] {
    const userTransactions = this.transactions.get(userId) || [];
    return userTransactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(userId: string): {
    totalTransactions: number;
    totalEarned: number;
    totalSpent: number;
    averageTransaction: number;
    mostUsedCategory: string;
  } {
    const userTransactions = this.transactions.get(userId) || [];
    const totalTransactions = userTransactions.length;
    const totalEarned = userTransactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = userTransactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = totalTransactions > 0 
      ? (totalEarned + totalSpent) / totalTransactions 
      : 0;

    // Find most used category
    const categoryCounts = new Map<string, number>();
    userTransactions.forEach(t => {
      const count = categoryCounts.get(t.category.id) || 0;
      categoryCounts.set(t.category.id, count + 1);
    });
    const mostUsedCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      totalTransactions,
      totalEarned,
      totalSpent,
      averageTransaction,
      mostUsedCategory
    };
  }

  /**
   * Check and update user rank
   */
  private checkRankUpgrade(profile: UserEconomyProfile): { oldRank: string; newRank: string } | null {
    const oldRank = profile.rank;
    let newRank = oldRank;

    // Rank thresholds
    const rankThresholds = {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 15000,
      diamond: 50000
    };

    // Determine new rank
    if (profile.totalEarned >= rankThresholds.diamond) {
      newRank = 'diamond';
    } else if (profile.totalEarned >= rankThresholds.platinum) {
      newRank = 'platinum';
    } else if (profile.totalEarned >= rankThresholds.gold) {
      newRank = 'gold';
    } else if (profile.totalEarned >= rankThresholds.silver) {
      newRank = 'silver';
    }

    if (newRank !== oldRank) {
      profile.rank = newRank as any;
      profile.rankProgress = this.calculateRankProgress(profile.totalEarned, newRank);
      return { oldRank, newRank };
    }

    return null;
  }

  /**
   * Calculate rank progress percentage
   */
  private calculateRankProgress(totalEarned: number, currentRank: string): number {
    const rankThresholds = {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 15000,
      diamond: 50000
    };

    const currentThreshold = rankThresholds[currentRank as keyof typeof rankThresholds];
    const nextRank = this.getNextRank(currentRank);
    const nextThreshold = rankThresholds[nextRank as keyof typeof rankThresholds];

    if (nextThreshold === currentThreshold) return 100;

    const progress = ((totalEarned - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Get next rank
   */
  private getNextRank(currentRank: string): string {
    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = ranks.indexOf(currentRank);
    return ranks[Math.min(currentIndex + 1, ranks.length - 1)];
  }

  /**
   * Check transaction limits
   */
  private checkLimits(userId: string, categoryId: string, amount: number): boolean {
    const category = this.categories.get(categoryId);
    if (!category) return false;

    const today = new Date().toDateString();
    const weekStart = this.getWeekStart().toDateString();

    // Check daily limit
    if (category.dailyLimit) {
      const dailyKey = `${userId}:${today}`;
      if (!this.dailyLimits.has(dailyKey)) {
        this.dailyLimits.set(dailyKey, new Map());
      }
      const dailyLimitMap = this.dailyLimits.get(dailyKey);
      if (dailyLimitMap) {
        const dailyUsed = dailyLimitMap.get(categoryId) || 0;
        if (dailyUsed + amount > category.dailyLimit) {
          return false;
        }
        dailyLimitMap.set(categoryId, dailyUsed + amount);
      }
    }

    // Check weekly limit
    if (category.weeklyLimit) {
      const weeklyKey = `${userId}:${weekStart}`;
      if (!this.weeklyLimits.has(weeklyKey)) {
        this.weeklyLimits.set(weeklyKey, new Map());
      }
      const weeklyLimitMap = this.weeklyLimits.get(weeklyKey);
      if (weeklyLimitMap) {
        const weeklyUsed = weeklyLimitMap.get(categoryId) || 0;
        if (weeklyUsed + amount > category.weeklyLimit) {
          return false;
        }
        weeklyLimitMap.set(categoryId, weeklyUsed + amount);
      }
    }

    return true;
  }

  /**
   * Update earnings tracking
   */
  private updateEarningsTracking(profile: UserEconomyProfile, amount: number): void {
    const today = new Date();
    const weekStart = this.getWeekStart();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toDateString();

    // Reset daily earnings if it's a new day
    if (profile.lastTransactionDate?.toDateString() !== today.toDateString()) {
      profile.dailyEarnings = 0;
    }

    // Reset weekly earnings if it's a new week
    if (profile.lastTransactionDate?.getTime() < weekStart.getTime()) {
      profile.weeklyEarnings = 0;
    }

    // Reset monthly earnings if it's a new month
    if (profile.lastTransactionDate?.toDateString() !== monthStart) {
      profile.monthlyEarnings = 0;
    }

    profile.dailyEarnings += amount;
    profile.weeklyEarnings += amount;
    profile.monthlyEarnings += amount;
  }

  /**
   * Get week start date
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  /**
   * Store transaction
   */
  private storeTransaction(userId: string, transaction: DojoCoinTransaction): void {
    if (!this.transactions.has(userId)) {
      this.transactions.set(userId, []);
    }
    const userTransactions = this.transactions.get(userId);
    if (userTransactions) {
      userTransactions.push(transaction);
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all transaction categories
   */
  getTransactionCategories(): TransactionCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get leaderboard by balance
   */
  getLeaderboard(limit: number = 10): UserEconomyProfile[] {
    return Array.from(this.userProfiles.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }

  /**
   * Get leaderboard by total earned
   */
  getEarningsLeaderboard(limit: number = 10): UserEconomyProfile[] {
    return Array.from(this.userProfiles.values())
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit);
  }
}

// Export singleton instance
export const dojoCoinEconomyService = DojoCoinEconomyService.getInstance(); 