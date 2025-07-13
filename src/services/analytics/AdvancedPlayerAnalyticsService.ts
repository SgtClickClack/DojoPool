import { EventEmitter } from 'events';

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  totalPoints: number;
  shotAccuracy: number;
  breakSuccessRate: number;
  safetyShotRate: number;
  averageMatchDuration: number;
  longestWinStreak: number;
  currentWinStreak: number;
  tournamentWins: number;
  tournamentFinals: number;
  territoryCaptures: number;
  territoryDefenses: number;
  reputation: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetric {
  id: string;
  playerId: string;
  metricType: 'shot_accuracy' | 'break_success' | 'safety_shot' | 'match_duration' | 'win_rate' | 'tournament_performance';
  value: number;
  timestamp: Date;
  matchId?: string;
  tournamentId?: string;
  context?: any;
}

export interface SkillProgression {
  playerId: string;
  skillArea: 'accuracy' | 'power' | 'strategy' | 'consistency' | 'mental_game';
  currentLevel: number;
  maxLevel: number;
  experience: number;
  experienceToNext: number;
  improvements: SkillImprovement[];
  lastUpdated: Date;
}

export interface SkillImprovement {
  id: string;
  skillArea: 'accuracy' | 'power' | 'strategy' | 'consistency' | 'mental_game';
  improvement: number;
  reason: string;
  timestamp: Date;
  matchId?: string;
}

export interface MatchAnalysis {
  id: string;
  matchId: string;
  playerId: string;
  opponentId: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
  duration: number;
  shots: ShotAnalysis[];
  highlights: string[];
  areasForImprovement: string[];
  strengths: string[];
  overallRating: number;
  timestamp: Date;
}

export interface ShotAnalysis {
  id: string;
  shotType: 'break' | 'pot' | 'safety' | 'defensive' | 'trick';
  success: boolean;
  difficulty: number;
  accuracy: number;
  power: number;
  position: { x: number; y: number };
  timestamp: Date;
  context?: any;
}

export interface PlayerInsights {
  playerId: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  recommendedDrills: string[];
  playingStyle: 'aggressive' | 'defensive' | 'balanced' | 'tactical';
  preferredShotTypes: string[];
  performanceTrends: PerformanceTrend[];
  predictions: PerformancePrediction[];
  lastUpdated: Date;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  change: number;
  period: 'week' | 'month' | 'quarter' | 'year';
  confidence: number;
}

export interface PerformancePrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: 'next_match' | 'next_week' | 'next_month' | 'next_tournament';
  factors: string[];
}

export interface PlayerComparison {
  playerId: string;
  comparisonPlayerId: string;
  metrics: {
    [key: string]: {
      player: number;
      comparison: number;
      difference: number;
      percentage: number;
    };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface PlayerAnalyticsConfig {
  enabled: boolean;
  realTimeTracking: boolean;
  performancePrediction: boolean;
  skillProgression: boolean;
  matchAnalysis: boolean;
  playerInsights: boolean;
  comparisonAnalytics: boolean;
  updateInterval: number;
  retentionPeriod: number;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface PlayerAnalyticsMetrics {
  totalPlayers: number;
  activePlayers: number;
  averageSkillLevel: number;
  totalMatches: number;
  averageMatchDuration: number;
  topPerformers: string[];
  mostImproved: string[];
  averageWinRate: number;
  lastActivity: Date;
}

class AdvancedPlayerAnalyticsService extends EventEmitter {
  private static instance: AdvancedPlayerAnalyticsService;
  private config: PlayerAnalyticsConfig;
  private metrics: PlayerAnalyticsMetrics;
  private playerPerformances: Map<string, PlayerPerformance>;
  private performanceMetrics: Map<string, PerformanceMetric[]>;
  private skillProgressions: Map<string, SkillProgression[]>;
  private matchAnalyses: Map<string, MatchAnalysis[]>;
  private playerInsights: Map<string, PlayerInsights>;
  private playerComparisons: Map<string, PlayerComparison[]>;

  constructor() {
    super();
    this.playerPerformances = new Map();
    this.performanceMetrics = new Map();
    this.skillProgressions = new Map();
    this.matchAnalyses = new Map();
    this.playerInsights = new Map();
    this.playerComparisons = new Map();

    this.config = {
      enabled: true,
      realTimeTracking: true,
      performancePrediction: true,
      skillProgression: true,
      matchAnalysis: true,
      playerInsights: true,
      comparisonAnalytics: true,
      updateInterval: 5000,
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      notificationSettings: {
        email: false,
        sms: false,
        push: true,
        webhook: false
      }
    };

    this.metrics = {
      totalPlayers: 0,
      activePlayers: 0,
      averageSkillLevel: 0,
      totalMatches: 0,
      averageMatchDuration: 0,
      topPerformers: [],
      mostImproved: [],
      averageWinRate: 0,
      lastActivity: new Date()
    };

    this.initializeService();
  }

  public static getInstance(): AdvancedPlayerAnalyticsService {
    if (!AdvancedPlayerAnalyticsService.instance) {
      AdvancedPlayerAnalyticsService.instance = new AdvancedPlayerAnalyticsService();
    }
    return AdvancedPlayerAnalyticsService.instance;
  }

  private initializeService(): void {
    console.log('Advanced Player Analytics Service initialized');
    this.loadSampleData();
    this.startPeriodicUpdates();
  }

  private loadSampleData(): void {
    // Sample player performances
    const samplePlayers: PlayerPerformance[] = [
      {
        playerId: 'player-1',
        playerName: 'John Smith',
        totalMatches: 45,
        wins: 32,
        losses: 13,
        winRate: 71.1,
        averageScore: 8.2,
        totalPoints: 369,
        shotAccuracy: 78.5,
        breakSuccessRate: 65.2,
        safetyShotRate: 82.1,
        averageMatchDuration: 25.5,
        longestWinStreak: 8,
        currentWinStreak: 3,
        tournamentWins: 2,
        tournamentFinals: 4,
        territoryCaptures: 5,
        territoryDefenses: 3,
        reputation: 1250,
        skillLevel: 'advanced',
        lastActive: new Date(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    samplePlayers.forEach(player => {
      this.playerPerformances.set(player.playerId, player);
    });

    this.updateMetrics();
  }

  private startPeriodicUpdates(): void {
    if (this.config.realTimeTracking) {
      setInterval(() => {
        this.updateMetrics();
        this.emit('metricsUpdated', this.metrics);
      }, this.config.updateInterval);
    }
  }

  // Player Performance Management
  public async updatePlayerPerformance(
    playerId: string, 
    matchData: any
  ): Promise<PlayerPerformance> {
    const existing = this.playerPerformances.get(playerId);
    const performance = existing || this.createNewPlayerPerformance(playerId, matchData.playerName);

    // Update performance based on match data
    performance.totalMatches++;
    if (matchData.result === 'win') {
      performance.wins++;
      performance.currentWinStreak++;
      if (performance.currentWinStreak > performance.longestWinStreak) {
        performance.longestWinStreak = performance.currentWinStreak;
      }
    } else {
      performance.losses++;
      performance.currentWinStreak = 0;
    }

    performance.winRate = (performance.wins / performance.totalMatches) * 100;
    performance.averageScore = (performance.averageScore * (performance.totalMatches - 1) + matchData.score) / performance.totalMatches;
    performance.totalPoints += matchData.score;
    performance.lastActive = new Date();
    performance.updatedAt = new Date();

    // Update skill level based on performance
    performance.skillLevel = this.calculateSkillLevel(performance);

    this.playerPerformances.set(playerId, performance);
    this.emit('performanceUpdated', performance);

    return performance;
  }

  private createNewPlayerPerformance(playerId: string, playerName: string): PlayerPerformance {
    return {
      playerId,
      playerName,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageScore: 0,
      totalPoints: 0,
      shotAccuracy: 0,
      breakSuccessRate: 0,
      safetyShotRate: 0,
      averageMatchDuration: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      tournamentWins: 0,
      tournamentFinals: 0,
      territoryCaptures: 0,
      territoryDefenses: 0,
      reputation: 0,
      skillLevel: 'beginner',
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateSkillLevel(performance: PlayerPerformance): PlayerPerformance['skillLevel'] {
    const { winRate, totalMatches, shotAccuracy, reputation } = performance;

    if (totalMatches < 10) return 'beginner';
    if (winRate >= 80 && shotAccuracy >= 85 && reputation >= 1500) return 'master';
    if (winRate >= 70 && shotAccuracy >= 80 && reputation >= 1200) return 'expert';
    if (winRate >= 60 && shotAccuracy >= 75 && reputation >= 800) return 'advanced';
    if (winRate >= 50 && shotAccuracy >= 70 && reputation >= 500) return 'intermediate';
    return 'beginner';
  }

  // Performance Metrics
  public async addPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric> {
    const newMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date()
    };

    if (!this.performanceMetrics.has(metric.playerId)) {
      this.performanceMetrics.set(metric.playerId, []);
    }
    this.performanceMetrics.get(metric.playerId)!.push(newMetric);

    this.emit('metricAdded', newMetric);
    return newMetric;
  }

  public getPerformanceMetrics(playerId: string, metricType?: string): PerformanceMetric[] {
    const metrics = this.performanceMetrics.get(playerId) || [];
    if (metricType) {
      return metrics.filter(m => m.metricType === metricType);
    }
    return metrics;
  }

  // Skill Progression
  public async updateSkillProgression(
    playerId: string,
    skillArea: 'accuracy' | 'power' | 'strategy' | 'consistency' | 'mental_game',
    improvement: number,
    reason: string,
    matchId?: string
  ): Promise<SkillProgression> {
    const progressions = this.skillProgressions.get(playerId) || [];
    let progression: SkillProgression | undefined = progressions.find(p => p.skillArea === skillArea);

    if (!progression) {
      progression = {
        playerId,
        skillArea,
        currentLevel: 1,
        maxLevel: 10,
        experience: 0,
        experienceToNext: 100,
        improvements: [],
        lastUpdated: new Date()
      };
      progressions.push(progression);
    }

    // Add improvement
    const skillImprovement: SkillImprovement = {
      id: this.generateId(),
      skillArea,
      improvement,
      reason,
      timestamp: new Date(),
      matchId
    };

    progression.improvements.push(skillImprovement);
    progression.experience += improvement;
    progression.lastUpdated = new Date();

    // Check for level up
    if (progression.experience >= progression.experienceToNext && progression.currentLevel < progression.maxLevel) {
      progression.currentLevel++;
      progression.experienceToNext = progression.currentLevel * 100;
      this.emit('skillLevelUp', { playerId, skillArea, newLevel: progression.currentLevel });
    }

    this.skillProgressions.set(playerId, progressions);
    this.emit('skillProgressionUpdated', progression);

    return progression;
  }

  public getSkillProgression(playerId: string): SkillProgression[] {
    return this.skillProgressions.get(playerId) || [];
  }

  // Match Analysis
  public async analyzeMatch(matchData: any): Promise<MatchAnalysis> {
    const analysis: MatchAnalysis = {
      id: this.generateId(),
      matchId: matchData.matchId,
      playerId: matchData.playerId,
      opponentId: matchData.opponentId,
      result: matchData.result,
      score: matchData.score,
      duration: matchData.duration,
      shots: this.analyzeShots(matchData.shots),
      highlights: this.generateHighlights(matchData),
      areasForImprovement: this.identifyImprovementAreas(matchData),
      strengths: this.identifyStrengths(matchData),
      overallRating: this.calculateOverallRating(matchData),
      timestamp: new Date()
    };

    if (!this.matchAnalyses.has(matchData.playerId)) {
      this.matchAnalyses.set(matchData.playerId, []);
    }
    this.matchAnalyses.get(matchData.playerId)!.push(analysis);

    this.emit('matchAnalyzed', analysis);
    return analysis;
  }

  private analyzeShots(shots: any[]): ShotAnalysis[] {
    // Ensure shots is an array before calling map
    if (!Array.isArray(shots)) {
      console.warn('Shots data is not an array, creating default shot analysis');
      return [];
    }
    
    return shots.map(shot => ({
      id: this.generateId(),
      shotType: shot.type,
      success: shot.success,
      difficulty: shot.difficulty || 5,
      accuracy: shot.accuracy || 75,
      power: shot.power || 70,
      position: shot.position || { x: 0, y: 0 },
      timestamp: new Date(shot.timestamp),
      context: shot.context
    }));
  }

  private generateHighlights(matchData: any): string[] {
    const highlights: string[] = [];
    
    if (matchData.shots.some((s: any) => s.success && s.difficulty > 8)) {
      highlights.push('Exceptional difficult shots');
    }
    if (matchData.winStreak > 3) {
      highlights.push('Impressive win streak');
    }
    if (matchData.breakSuccess > 0.8) {
      highlights.push('Excellent break performance');
    }

    return highlights;
  }

  private identifyImprovementAreas(matchData: any): string[] {
    const areas: string[] = [];
    
    if (matchData.shotAccuracy < 70) {
      areas.push('Shot accuracy needs improvement');
    }
    if (matchData.breakSuccess < 0.5) {
      areas.push('Break shot success rate');
    }
    if (matchData.safetyShotRate < 0.6) {
      areas.push('Safety shot execution');
    }

    return areas;
  }

  private identifyStrengths(matchData: any): string[] {
    const strengths: string[] = [];
    
    if (matchData.shotAccuracy > 85) {
      strengths.push('Excellent shot accuracy');
    }
    if (matchData.breakSuccess > 0.8) {
      strengths.push('Strong break performance');
    }
    if (matchData.safetyShotRate > 0.8) {
      strengths.push('Defensive play mastery');
    }

    return strengths;
  }

  private calculateOverallRating(matchData: any): number {
    let rating = 50; // Base rating
    
    rating += matchData.shotAccuracy * 0.3;
    rating += matchData.breakSuccess * 20;
    rating += matchData.safetyShotRate * 15;
    rating += (matchData.result === 'win' ? 10 : 0);
    
    return Math.min(100, Math.max(0, rating));
  }

  // Player Insights
  public async generatePlayerInsights(playerId: string): Promise<PlayerInsights> {
    const performance = this.playerPerformances.get(playerId);
    const matchAnalyses = this.matchAnalyses.get(playerId) || [];
    const skillProgressions = this.skillProgressions.get(playerId) || [];

    if (!performance) {
      throw new Error('Player performance not found');
    }

    const insights: PlayerInsights = {
      playerId,
      strengths: this.analyzeStrengths(performance, matchAnalyses),
      weaknesses: this.analyzeWeaknesses(performance, matchAnalyses),
      improvementAreas: this.identifyPlayerImprovementAreas(performance, matchAnalyses),
      recommendedDrills: this.generateRecommendedDrills(performance, skillProgressions),
      playingStyle: this.determinePlayingStyle(performance, matchAnalyses),
      preferredShotTypes: this.analyzePreferredShots(matchAnalyses),
      performanceTrends: this.analyzePerformanceTrends(playerId),
      predictions: this.generatePerformancePredictions(playerId),
      lastUpdated: new Date()
    };

    this.playerInsights.set(playerId, insights);
    this.emit('insightsGenerated', insights);

    return insights;
  }

  private analyzeStrengths(performance: PlayerPerformance, matchAnalyses: MatchAnalysis[]): string[] {
    const strengths: string[] = [];
    
    if (performance.winRate > 70) strengths.push('High win rate');
    if (performance.shotAccuracy > 80) strengths.push('Excellent shot accuracy');
    if (performance.breakSuccessRate > 70) strengths.push('Strong break performance');
    if (performance.longestWinStreak > 5) strengths.push('Consistent winning');
    
    return strengths;
  }

  private analyzeWeaknesses(performance: PlayerPerformance, matchAnalyses: MatchAnalysis[]): string[] {
    const weaknesses: string[] = [];
    
    if (performance.shotAccuracy < 70) weaknesses.push('Shot accuracy needs work');
    if (performance.breakSuccessRate < 50) weaknesses.push('Break shot consistency');
    if (performance.safetyShotRate < 60) weaknesses.push('Defensive play');
    
    return weaknesses;
  }

  private identifyPlayerImprovementAreas(performance: PlayerPerformance, matchAnalyses: MatchAnalysis[]): string[] {
    const areas: string[] = [];
    
    if (performance.shotAccuracy < 75) areas.push('Shot accuracy drills');
    if (performance.breakSuccessRate < 60) areas.push('Break shot practice');
    if (performance.safetyShotRate < 70) areas.push('Safety shot training');
    if (performance.winRate < 50) areas.push('Match strategy improvement');
    
    return areas;
  }

  private generateRecommendedDrills(performance: PlayerPerformance, skillProgressions: SkillProgression[]): string[] {
    const drills: string[] = [];
    
    if (performance.shotAccuracy < 75) {
      drills.push('Accuracy drills with target practice');
    }
    if (performance.breakSuccessRate < 60) {
      drills.push('Break shot power and control exercises');
    }
    if (performance.safetyShotRate < 70) {
      drills.push('Defensive play and safety shot practice');
    }
    
    return drills;
  }

  private determinePlayingStyle(performance: PlayerPerformance, matchAnalyses: MatchAnalysis[]): PlayerInsights['playingStyle'] {
    if (performance.shotAccuracy > 85 && performance.breakSuccessRate > 75) {
      return 'aggressive';
    } else if (performance.safetyShotRate > 80) {
      return 'defensive';
    } else if (performance.winRate > 60) {
      return 'balanced';
    } else {
      return 'tactical';
    }
  }

  private analyzePreferredShots(matchAnalyses: MatchAnalysis[]): string[] {
    const shotTypes: { [key: string]: number } = {};
    
    matchAnalyses.forEach(analysis => {
      analysis.shots.forEach(shot => {
        shotTypes[shot.shotType] = (shotTypes[shot.shotType] || 0) + 1;
      });
    });
    
    return Object.entries(shotTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private analyzePerformanceTrends(playerId: string): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const metrics = this.performanceMetrics.get(playerId) || [];
    
    // Analyze shot accuracy trend
    const accuracyMetrics = metrics.filter(m => m.metricType === 'shot_accuracy');
    if (accuracyMetrics.length > 1) {
      const recent = accuracyMetrics.slice(-5);
      const older = accuracyMetrics.slice(-10, -5);
      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
      
      trends.push({
        metric: 'shot_accuracy',
        direction: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable',
        change: recentAvg - olderAvg,
        period: 'week',
        confidence: 0.8
      });
    }
    
    return trends;
  }

  private generatePerformancePredictions(playerId: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = [];
    const performance = this.playerPerformances.get(playerId);
    
    if (performance) {
      predictions.push({
        metric: 'win_rate',
        predictedValue: Math.min(100, performance.winRate + 2),
        confidence: 0.75,
        timeframe: 'next_week',
        factors: ['Current form', 'Recent improvements', 'Practice consistency']
      });
      
      predictions.push({
        metric: 'shot_accuracy',
        predictedValue: Math.min(100, performance.shotAccuracy + 1.5),
        confidence: 0.8,
        timeframe: 'next_match',
        factors: ['Skill progression', 'Recent performance', 'Practice focus']
      });
    }
    
    return predictions;
  }

  // Player Comparison
  public async comparePlayers(playerId: string, comparisonPlayerId: string): Promise<PlayerComparison> {
    const player = this.playerPerformances.get(playerId);
    const comparison = this.playerPerformances.get(comparisonPlayerId);
    
    if (!player || !comparison) {
      throw new Error('One or both players not found');
    }
    
    const comparisonData: PlayerComparison = {
      playerId,
      comparisonPlayerId,
      metrics: {
        winRate: {
          player: player.winRate,
          comparison: comparison.winRate,
          difference: player.winRate - comparison.winRate,
          percentage: ((player.winRate - comparison.winRate) / comparison.winRate) * 100
        },
        shotAccuracy: {
          player: player.shotAccuracy,
          comparison: comparison.shotAccuracy,
          difference: player.shotAccuracy - comparison.shotAccuracy,
          percentage: ((player.shotAccuracy - comparison.shotAccuracy) / comparison.shotAccuracy) * 100
        },
        breakSuccessRate: {
          player: player.breakSuccessRate,
          comparison: comparison.breakSuccessRate,
          difference: player.breakSuccessRate - comparison.breakSuccessRate,
          percentage: ((player.breakSuccessRate - comparison.breakSuccessRate) / comparison.breakSuccessRate) * 100
        }
      },
      strengths: this.identifyComparisonStrengths(player, comparison),
      weaknesses: this.identifyComparisonWeaknesses(player, comparison),
      recommendations: this.generateComparisonRecommendations(player, comparison),
      timestamp: new Date()
    };
    
    if (!this.playerComparisons.has(playerId)) {
      this.playerComparisons.set(playerId, []);
    }
    this.playerComparisons.get(playerId)!.push(comparisonData);
    
    this.emit('playersCompared', comparisonData);
    return comparisonData;
  }

  private identifyComparisonStrengths(player: PlayerPerformance, comparison: PlayerPerformance): string[] {
    const strengths: string[] = [];
    
    if (player.winRate > comparison.winRate) strengths.push('Higher win rate');
    if (player.shotAccuracy > comparison.shotAccuracy) strengths.push('Better shot accuracy');
    if (player.breakSuccessRate > comparison.breakSuccessRate) strengths.push('Superior break performance');
    if (player.longestWinStreak > comparison.longestWinStreak) strengths.push('Longer win streaks');
    
    return strengths;
  }

  private identifyComparisonWeaknesses(player: PlayerPerformance, comparison: PlayerPerformance): string[] {
    const weaknesses: string[] = [];
    
    if (player.winRate < comparison.winRate) weaknesses.push('Lower win rate');
    if (player.shotAccuracy < comparison.shotAccuracy) weaknesses.push('Lower shot accuracy');
    if (player.breakSuccessRate < comparison.breakSuccessRate) weaknesses.push('Weaker break performance');
    if (player.safetyShotRate < comparison.safetyShotRate) weaknesses.push('Defensive play needs work');
    
    return weaknesses;
  }

  private generateComparisonRecommendations(player: PlayerPerformance, comparison: PlayerPerformance): string[] {
    const recommendations: string[] = [];
    
    if (player.shotAccuracy < comparison.shotAccuracy) {
      recommendations.push('Focus on accuracy drills to improve shot precision');
    }
    if (player.breakSuccessRate < comparison.breakSuccessRate) {
      recommendations.push('Practice break shots to improve opening game');
    }
    if (player.safetyShotRate < comparison.safetyShotRate) {
      recommendations.push('Work on defensive play and safety shots');
    }
    if (player.winRate < comparison.winRate) {
      recommendations.push('Analyze match strategies to improve win rate');
    }
    
    return recommendations;
  }

  // Utility Methods
  public getPlayerPerformance(playerId: string): PlayerPerformance | undefined {
    return this.playerPerformances.get(playerId);
  }

  public getAllPlayerPerformances(): PlayerPerformance[] {
    return Array.from(this.playerPerformances.values());
  }

  public getTopPerformers(limit: number = 10): PlayerPerformance[] {
    return Array.from(this.playerPerformances.values())
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  }

  public getMostImproved(limit: number = 10): PlayerPerformance[] {
    return Array.from(this.playerPerformances.values())
      .filter(p => p.lastActive > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
  }

  public getPlayerInsights(playerId: string): PlayerInsights | undefined {
    return this.playerInsights.get(playerId);
  }

  public getMatchAnalyses(playerId: string): MatchAnalysis[] {
    return this.matchAnalyses.get(playerId) || [];
  }

  public getPlayerComparisons(playerId: string): PlayerComparison[] {
    return this.playerComparisons.get(playerId) || [];
  }

  private updateMetrics(): void {
    const players = Array.from(this.playerPerformances.values());
    
    this.metrics.totalPlayers = players.length;
    this.metrics.activePlayers = players.filter(p => 
      p.lastActive > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    this.metrics.averageSkillLevel = this.calculateAverageSkillLevel(players);
    this.metrics.totalMatches = players.reduce((sum, p) => sum + p.totalMatches, 0);
    this.metrics.averageMatchDuration = players.reduce((sum, p) => sum + p.averageMatchDuration, 0) / players.length;
    this.metrics.topPerformers = this.getTopPerformers(5).map(p => p.playerId);
    this.metrics.mostImproved = this.getMostImproved(5).map(p => p.playerId);
    this.metrics.averageWinRate = players.reduce((sum, p) => sum + p.winRate, 0) / players.length;
    this.metrics.lastActivity = new Date();
  }

  private calculateAverageSkillLevel(players: PlayerPerformance[]): number {
    const skillLevels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 };
    const total = players.reduce((sum, p) => sum + skillLevels[p.skillLevel], 0);
    return total / players.length;
  }

  public getConfig(): PlayerAnalyticsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PlayerAnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getMetrics(): PlayerAnalyticsMetrics {
    return { ...this.metrics };
  }

  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AdvancedPlayerAnalyticsService; 