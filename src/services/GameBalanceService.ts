import { EventEmitter } from 'events';
import { logger } from '../config/monitoring';

export interface PlayerSkillProfile {
  playerId: string;
  overallRating: number;
  accuracy: number;
  strategy: number;
  consistency: number;
  experience: number;
  matchesPlayed: number;
  winRate: number;
  recentPerformance: number[];
  skillCategory: 'casual' | 'competitive' | 'professional';
  progressionCurve: 'slow' | 'normal' | 'fast';
  lastUpdated: Date;
}

export interface MatchmakingCriteria {
  skillRange: number;
  experienceRange: number;
  maxWaitTime: number;
  preferredMode: 'casual' | 'competitive' | 'tournament';
  allowCrossSkill: boolean;
}

export interface DifficultyAdjustment {
  playerId: string;
  baseDifficulty: number;
  adjustedDifficulty: number;
  factors: {
    recentPerformance: number;
    skillGap: number;
    experienceLevel: number;
    winStreak: number;
    seasonalAdjustment: number;
  };
  appliedAt: Date;
}

export interface ProgressionCurve {
  playerType: 'casual' | 'competitive' | 'professional';
  experienceMultiplier: number;
  skillGainRate: number;
  rewardScaling: number;
  seasonalResets: boolean;
  milestones: {
    level: number;
    experienceRequired: number;
    rewards: string[];
  }[];
}

export interface GameBalanceMetrics {
  averageMatchDuration: number;
  winRateDistribution: Record<string, number>;
  skillGapAnalysis: {
    averageGap: number;
    maxGap: number;
    problematicGaps: number;
  };
  progressionAnalysis: {
    averageLevel: number;
    progressionRate: number;
    stuckPlayers: number;
  };
  balanceScore: number;
  recommendations: string[];
  lastCalculated: Date;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'tournament' | 'challenge' | 'achievement';
  rewards: {
    experience: number;
    coins: number;
    items: string[];
  };
  progressionMultiplier: number;
  skillAdjustment: number;
}

export interface PlayerFeedback {
  playerId: string;
  feedbackType: 'balance' | 'progression' | 'matchmaking' | 'rewards';
  rating: number;
  comment: string;
  timestamp: Date;
  category: 'casual' | 'competitive' | 'professional';
}

class GameBalanceService extends EventEmitter {
  private static instance: GameBalanceService;
  private playerProfiles: Map<string, PlayerSkillProfile> = new Map();
  private difficultyAdjustments: Map<string, DifficultyAdjustment> = new Map();
  private progressionCurves: Map<string, ProgressionCurve> = new Map();
  private seasonalEvents: Map<string, SeasonalEvent> = new Map();
  private playerFeedback: PlayerFeedback[] = [];
  private balanceMetrics: GameBalanceMetrics | null = null;

  constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): GameBalanceService {
    if (!GameBalanceService.instance) {
      GameBalanceService.instance = new GameBalanceService();
    }
    return GameBalanceService.instance;
  }

  private initializeService(): void {
    console.log('Game Balance Service initialized');
    this.loadProgressionCurves();
    this.loadSeasonalEvents();
    this.loadMockData();
  }

  /**
   * Calculate dynamic difficulty adjustment for a player
   */
  public calculateDifficultyAdjustment(playerId: string, opponentId?: string): DifficultyAdjustment {
    const playerProfile = this.playerProfiles.get(playerId);
    if (!playerProfile) {
      throw new Error(`Player profile not found: ${playerId}`);
    }

    const baseDifficulty = this.calculateBaseDifficulty(playerProfile);
    const recentPerformance = this.calculateRecentPerformance(playerProfile);
    const skillGap = opponentId ? this.calculateSkillGap(playerId, opponentId) : 0;
    const experienceLevel = this.calculateExperienceLevel(playerProfile);
    const winStreak = this.calculateWinStreak(playerId);
    const seasonalAdjustment = this.calculateSeasonalAdjustment();

    const adjustedDifficulty = Math.max(0.1, Math.min(2.0, 
      baseDifficulty * 
      (1 + recentPerformance * 0.2) *
      (1 + skillGap * 0.1) *
      (1 + experienceLevel * 0.05) *
      (1 + winStreak * 0.1) *
      seasonalAdjustment
    ));

    const adjustment: DifficultyAdjustment = {
      playerId,
      baseDifficulty,
      adjustedDifficulty,
      factors: {
        recentPerformance,
        skillGap,
        experienceLevel,
        winStreak,
        seasonalAdjustment
      },
      appliedAt: new Date()
    };

    this.difficultyAdjustments.set(playerId, adjustment);
    this.emit('difficultyAdjusted', adjustment);

    return adjustment;
  }

  /**
   * Find suitable matchmaking opponents
   */
  public findMatchmakingOpponents(playerId: string, criteria: MatchmakingCriteria): string[] {
    const playerProfile = this.playerProfiles.get(playerId);
    if (!playerProfile) {
      return [];
    }

    const candidates: Array<{ playerId: string; score: number }> = [];

    for (const [id, profile] of this.playerProfiles) {
      if (id === playerId) continue;

      const skillGap = Math.abs(profile.overallRating - playerProfile.overallRating);
      const experienceGap = Math.abs(profile.experience - playerProfile.experience);

      if (skillGap <= criteria.skillRange && experienceGap <= criteria.experienceRange) {
        const score = this.calculateMatchmakingScore(playerProfile, profile, criteria);
        candidates.push({ playerId: id, score });
      }
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(c => c.playerId);
  }

  /**
   * Update player progression based on match results
   */
  public updatePlayerProgression(
    playerId: string, 
    matchResult: 'win' | 'loss' | 'draw',
    performance: number,
    experienceGained: number
  ): void {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return;

    // Update experience and level
    profile.experience += experienceGained;
    profile.matchesPlayed++;

    // Update win rate
    const totalWins = profile.winRate * (profile.matchesPlayed - 1);
    profile.winRate = (totalWins + (matchResult === 'win' ? 1 : 0)) / profile.matchesPlayed;

    // Update recent performance
    profile.recentPerformance.push(performance);
    if (profile.recentPerformance.length > 10) {
      profile.recentPerformance.shift();
    }

    // Update skill ratings based on performance
    this.updateSkillRatings(profile, matchResult, performance);

    // Update skill category
    profile.skillCategory = this.calculateSkillCategory(profile);

    // Update progression curve
    profile.progressionCurve = this.calculateProgressionCurve(profile);

    profile.lastUpdated = new Date();
    this.playerProfiles.set(playerId, profile);

    this.emit('progressionUpdated', { playerId, profile });
  }

  /**
   * Calculate game balance metrics
   */
  public calculateBalanceMetrics(): GameBalanceMetrics {
    const profiles = Array.from(this.playerProfiles.values());
    
    const averageMatchDuration = this.calculateAverageMatchDuration();
    const winRateDistribution = this.calculateWinRateDistribution(profiles);
    const skillGapAnalysis = this.analyzeSkillGaps(profiles);
    const progressionAnalysis = this.analyzeProgression(profiles);
    const balanceScore = this.calculateBalanceScore(profiles);
    const recommendations = this.generateBalanceRecommendations(profiles);

    this.balanceMetrics = {
      averageMatchDuration,
      winRateDistribution,
      skillGapAnalysis,
      progressionAnalysis,
      balanceScore,
      recommendations,
      lastCalculated: new Date()
    };

    this.emit('balanceMetricsCalculated', this.balanceMetrics);
    return this.balanceMetrics;
  }

  /**
   * Submit player feedback for balance analysis
   */
  public submitFeedback(feedback: PlayerFeedback): void {
    this.playerFeedback.push(feedback);
    this.emit('feedbackSubmitted', feedback);
    
    // Analyze feedback for balance adjustments
    this.analyzeFeedback();
  }

  /**
   * Get seasonal events affecting progression
   */
  public getActiveSeasonalEvents(): SeasonalEvent[] {
    const now = new Date();
    return Array.from(this.seasonalEvents.values()).filter(event => 
      event.startDate <= now && event.endDate >= now
    );
  }

  /**
   * Apply seasonal adjustments to progression
   */
  public applySeasonalAdjustments(playerId: string): number {
    const activeEvents = this.getActiveSeasonalEvents();
    let totalMultiplier = 1.0;

    for (const event of activeEvents) {
      totalMultiplier *= event.progressionMultiplier;
    }

    return totalMultiplier;
  }

  // Private helper methods

  private calculateBaseDifficulty(profile: PlayerSkillProfile): number {
    return Math.max(0.5, Math.min(1.5, 
      (profile.overallRating / 1000) * 
      (1 + profile.experience / 1000) *
      (profile.skillCategory === 'professional' ? 1.2 : 1.0)
    ));
  }

  private calculateRecentPerformance(profile: PlayerSkillProfile): number {
    if (profile.recentPerformance.length === 0) return 0;
    
    const recent = profile.recentPerformance.slice(-5);
    const average = recent.reduce((sum, perf) => sum + perf, 0) / recent.length;
    return (average - 0.5) * 2; // Normalize to [-1, 1]
  }

  private calculateSkillGap(playerId: string, opponentId: string): number {
    const player = this.playerProfiles.get(playerId);
    const opponent = this.playerProfiles.get(opponentId);
    
    if (!player || !opponent) return 0;
    
    return (opponent.overallRating - player.overallRating) / 1000;
  }

  private calculateExperienceLevel(profile: PlayerSkillProfile): number {
    return Math.min(1.0, profile.experience / 10000);
  }

  private calculateWinStreak(playerId: string): number {
    // Simplified win streak calculation
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return 0;
    
    return Math.min(0.5, (profile.winRate - 0.5) * 2);
  }

  private calculateSeasonalAdjustment(): number {
    const activeEvents = this.getActiveSeasonalEvents();
    let adjustment = 1.0;
    
    for (const event of activeEvents) {
      adjustment *= (1 + event.skillAdjustment);
    }
    
    return adjustment;
  }

  private calculateMatchmakingScore(
    player: PlayerSkillProfile, 
    candidate: PlayerSkillProfile, 
    criteria: MatchmakingCriteria
  ): number {
    const skillGap = Math.abs(candidate.overallRating - player.overallRating);
    const experienceGap = Math.abs(candidate.experience - player.experience);
    
    let score = 100;
    score -= skillGap * 10;
    score -= experienceGap * 0.01;
    
    // Bonus for similar skill categories
    if (candidate.skillCategory === player.skillCategory) {
      score += 20;
    }
    
    return Math.max(0, score);
  }

  private updateSkillRatings(profile: PlayerSkillProfile, result: string, performance: number): void {
    const kFactor = this.calculateKFactor(profile);
    const expectedPerformance = this.calculateExpectedPerformance(profile);
    const actualPerformance = performance;
    
    const ratingChange = kFactor * (actualPerformance - expectedPerformance);
    
    profile.overallRating = Math.max(100, Math.min(3000, profile.overallRating + ratingChange));
    profile.accuracy = Math.max(0, Math.min(100, profile.accuracy + ratingChange * 0.1));
    profile.strategy = Math.max(0, Math.min(100, profile.strategy + ratingChange * 0.1));
    profile.consistency = Math.max(0, Math.min(100, profile.consistency + ratingChange * 0.05));
  }

  private calculateKFactor(profile: PlayerSkillProfile): number {
    if (profile.matchesPlayed < 30) return 32;
    if (profile.overallRating < 2100) return 24;
    return 16;
  }

  private calculateExpectedPerformance(profile: PlayerSkillProfile): number {
    return 0.5 + (profile.overallRating - 1500) / 3000;
  }

  private calculateSkillCategory(profile: PlayerSkillProfile): 'casual' | 'competitive' | 'professional' {
    if (profile.overallRating >= 2500 || profile.experience >= 50000) return 'professional';
    if (profile.overallRating >= 1800 || profile.experience >= 10000) return 'competitive';
    return 'casual';
  }

  private calculateProgressionCurve(profile: PlayerSkillProfile): 'slow' | 'normal' | 'fast' {
    if (profile.skillCategory === 'professional') return 'slow';
    if (profile.skillCategory === 'casual') return 'fast';
    return 'normal';
  }

  private calculateAverageMatchDuration(): number {
    // Mock calculation - in real implementation, this would come from match data
    return 15.5; // minutes
  }

  private calculateWinRateDistribution(profiles: PlayerSkillProfile[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '0-20%': 0, '20-40%': 0, '40-60%': 0, '60-80%': 0, '80-100%': 0
    };
    
    for (const profile of profiles) {
      const winRate = profile.winRate * 100;
      if (winRate <= 20) distribution['0-20%']++;
      else if (winRate <= 40) distribution['20-40%']++;
      else if (winRate <= 60) distribution['40-60%']++;
      else if (winRate <= 80) distribution['60-80%']++;
      else distribution['80-100%']++;
    }
    
    return distribution;
  }

  private analyzeSkillGaps(profiles: PlayerSkillProfile[]): GameBalanceMetrics['skillGapAnalysis'] {
    const gaps: number[] = [];
    
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const gap = Math.abs(profiles[i].overallRating - profiles[j].overallRating);
        gaps.push(gap);
      }
    }
    
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const maxGap = Math.max(...gaps);
    const problematicGaps = gaps.filter(gap => gap > 500).length;
    
    return { averageGap, maxGap, problematicGaps };
  }

  private analyzeProgression(profiles: PlayerSkillProfile[]): GameBalanceMetrics['progressionAnalysis'] {
    const averageLevel = profiles.reduce((sum, p) => sum + p.experience, 0) / profiles.length;
    const progressionRate = profiles.filter(p => p.recentPerformance.length > 0).length / profiles.length;
    const stuckPlayers = profiles.filter(p => p.recentPerformance.length > 5 && 
      p.recentPerformance.slice(-5).every(perf => perf < 0.3)).length;
    
    return { averageLevel, progressionRate, stuckPlayers };
  }

  private calculateBalanceScore(profiles: PlayerSkillProfile[]): number {
    const skillGapAnalysis = this.analyzeSkillGaps(profiles);
    const progressionAnalysis = this.analyzeProgression(profiles);
    
    let score = 100;
    
    // Penalize large skill gaps
    score -= (skillGapAnalysis.averageGap / 1000) * 20;
    score -= skillGapAnalysis.problematicGaps * 2;
    
    // Penalize stuck players
    score -= progressionAnalysis.stuckPlayers * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateBalanceRecommendations(profiles: PlayerSkillProfile[]): string[] {
    const recommendations: string[] = [];
    const skillGapAnalysis = this.analyzeSkillGaps(profiles);
    const progressionAnalysis = this.analyzeProgression(profiles);
    
    if (skillGapAnalysis.averageGap > 300) {
      recommendations.push('Consider implementing skill-based matchmaking to reduce large skill gaps');
    }
    
    if (skillGapAnalysis.problematicGaps > 10) {
      recommendations.push('High number of problematic skill gaps detected - review matchmaking algorithm');
    }
    
    if (progressionAnalysis.stuckPlayers > 5) {
      recommendations.push('Multiple players appear stuck - consider progression curve adjustments');
    }
    
    if (progressionAnalysis.progressionRate < 0.7) {
      recommendations.push('Low progression rate detected - review reward scaling and experience gains');
    }
    
    return recommendations;
  }

  private analyzeFeedback(): void {
    const recentFeedback = this.playerFeedback.filter(f => 
      new Date().getTime() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
    
    const balanceFeedback = recentFeedback.filter(f => f.feedbackType === 'balance');
    const averageBalanceRating = balanceFeedback.reduce((sum, f) => sum + f.rating, 0) / balanceFeedback.length;
    
    if (averageBalanceRating < 3.0) {
      this.emit('balanceIssuesDetected', { averageRating: averageBalanceRating, feedbackCount: balanceFeedback.length });
    }
  }

  private loadProgressionCurves(): void {
    this.progressionCurves.set('casual', {
      playerType: 'casual',
      experienceMultiplier: 1.5,
      skillGainRate: 1.2,
      rewardScaling: 1.3,
      seasonalResets: false,
      milestones: [
        { level: 5, experienceRequired: 1000, rewards: ['Basic Cue', '100 Coins'] },
        { level: 10, experienceRequired: 2500, rewards: ['Intermediate Cue', '250 Coins'] },
        { level: 20, experienceRequired: 5000, rewards: ['Advanced Cue', '500 Coins'] }
      ]
    });

    this.progressionCurves.set('competitive', {
      playerType: 'competitive',
      experienceMultiplier: 1.0,
      skillGainRate: 1.0,
      rewardScaling: 1.0,
      seasonalResets: true,
      milestones: [
        { level: 10, experienceRequired: 5000, rewards: ['Tournament Entry', '1000 Coins'] },
        { level: 25, experienceRequired: 15000, rewards: ['Elite Status', '2500 Coins'] },
        { level: 50, experienceRequired: 50000, rewards: ['Champion Status', '10000 Coins'] }
      ]
    });

    this.progressionCurves.set('professional', {
      playerType: 'professional',
      experienceMultiplier: 0.8,
      skillGainRate: 0.7,
      rewardScaling: 0.8,
      seasonalResets: true,
      milestones: [
        { level: 25, experienceRequired: 25000, rewards: ['Pro Status', '5000 Coins'] },
        { level: 50, experienceRequired: 75000, rewards: ['Master Status', '15000 Coins'] },
        { level: 100, experienceRequired: 200000, rewards: ['Legend Status', '50000 Coins'] }
      ]
    });
  }

  private loadSeasonalEvents(): void {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    this.seasonalEvents.set('spring_tournament', {
      id: 'spring_tournament',
      name: 'Spring Championship',
      startDate: new Date(now.getFullYear(), 2, 1), // March 1st
      endDate: new Date(now.getFullYear(), 5, 31), // May 31st
      type: 'tournament',
      rewards: {
        experience: 5000,
        coins: 2000,
        items: ['Spring Trophy', 'Championship Cue']
      },
      progressionMultiplier: 1.3,
      skillAdjustment: 0.1
    });

    this.seasonalEvents.set('summer_challenge', {
      id: 'summer_challenge',
      name: 'Summer Challenge Series',
      startDate: new Date(now.getFullYear(), 5, 1), // June 1st
      endDate: new Date(now.getFullYear(), 8, 31), // August 31st
      type: 'challenge',
      rewards: {
        experience: 3000,
        coins: 1500,
        items: ['Summer Badge', 'Challenge Cue']
      },
      progressionMultiplier: 1.2,
      skillAdjustment: 0.05
    });
  }

  private loadMockData(): void {
    // Load mock player profiles
    const mockProfiles: PlayerSkillProfile[] = [
      {
        playerId: 'player1',
        overallRating: 1200,
        accuracy: 75,
        strategy: 65,
        consistency: 70,
        experience: 5000,
        matchesPlayed: 45,
        winRate: 0.62,
        recentPerformance: [0.7, 0.8, 0.6, 0.9, 0.7],
        skillCategory: 'competitive',
        progressionCurve: 'normal',
        lastUpdated: new Date()
      },
      {
        playerId: 'player2',
        overallRating: 850,
        accuracy: 60,
        strategy: 45,
        consistency: 55,
        experience: 2000,
        matchesPlayed: 20,
        winRate: 0.45,
        recentPerformance: [0.5, 0.4, 0.6, 0.3, 0.5],
        skillCategory: 'casual',
        progressionCurve: 'fast',
        lastUpdated: new Date()
      },
      {
        playerId: 'player3',
        overallRating: 2100,
        accuracy: 90,
        strategy: 85,
        consistency: 88,
        experience: 25000,
        matchesPlayed: 120,
        winRate: 0.78,
        recentPerformance: [0.9, 0.8, 0.95, 0.85, 0.9],
        skillCategory: 'professional',
        progressionCurve: 'slow',
        lastUpdated: new Date()
      }
    ];

    for (const profile of mockProfiles) {
      this.playerProfiles.set(profile.playerId, profile);
    }
  }

  // Public getter methods
  public getPlayerProfile(playerId: string): PlayerSkillProfile | undefined {
    return this.playerProfiles.get(playerId);
  }

  public getDifficultyAdjustment(playerId: string): DifficultyAdjustment | undefined {
    return this.difficultyAdjustments.get(playerId);
  }

  public getProgressionCurve(playerType: string): ProgressionCurve | undefined {
    return this.progressionCurves.get(playerType);
  }

  public getBalanceMetrics(): GameBalanceMetrics | null {
    return this.balanceMetrics;
  }

  public getAllPlayerProfiles(): PlayerSkillProfile[] {
    return Array.from(this.playerProfiles.values());
  }

  public getPlayerFeedback(): PlayerFeedback[] {
    return this.playerFeedback;
  }
}

export default GameBalanceService; 