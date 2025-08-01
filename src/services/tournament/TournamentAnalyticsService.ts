import { Tournament, TournamentMatch, TournamentParticipant as Player, TournamentFormat, TournamentStatus, MatchStatus } from '';
import { EventEmitter } from 'events';

interface PlayerAnalytics {
  playerId: string;
  winRate: number;
  averageScore: number;
  totalMatches: number;
  strengths: string[];
  weaknesses: string[];
}

interface TournamentAnalytics {
  tournamentId: string;
  totalParticipants: number;
  averageMatchDuration: number;
  mostCommonOutcome: string;
  topPerformers: PlayerAnalytics[];
}

export interface PlayerPerformance {
  id: string;
  name: string;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  totalPrizeMoney: number;
  performanceHistory: {
    date: string;
    rating: number;
    matchResult: 'win' | 'loss';
    score: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
}

export interface TournamentStats {
  id: string;
  name: string;
  totalMatches: number;
  totalPlayers: number;
  averageMatchDuration: number;
  totalPrizePool: number;
  completionRate: number;
  averageRating: number;
  topPerformer: {
    id: string;
    name: string;
    rating: number;
    wins: number;
  };
  venueStats: {
    id: string;
    name: string;
    matchesPlayed: number;
    revenue: number;
  }[];
  performanceMetrics: {
    averageShotAccuracy: number;
    averageBreakSuccess: number;
    averageSafetySuccess: number;
    totalFouls: number;
    averageMatchLength: number;
  };
  trends: {
    date: string;
    matchesPlayed: number;
    averageRating: number;
    revenue: number;
  }[];
}

export interface VenueAnalytics {
  id: string;
  name: string;
  totalRevenue: number;
  totalMatches: number;
  averageRating: number;
  playerSatisfaction: number;
  equipmentUtilization: number;
  revenueTrends: {
    date: string;
    revenue: number;
    matches: number;
  }[];
  popularTimeSlots: {
    hour: number;
    matches: number;
    revenue: number;
  }[];
  equipmentHealth: {
    tableId: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    lastMaintenance: string;
    utilizationRate: number;
  }[];
}

export interface RealTimeMetrics {
  activeMatches: number;
  activePlayers: number;
  totalViewers: number;
  averageMatchDuration: number;
  revenuePerHour: number;
  systemPerformance: {
    cpu: number;
    memory: number;
    network: number;
  };
}

class TournamentAnalyticsService extends EventEmitter {
  private static instance: TournamentAnalyticsService;
  private stats: TournamentStats[] = [];
  private playerPerformance: PlayerPerformance[] = [];
  private venueAnalytics: VenueAnalytics[] = [];
  private realTimeMetrics: RealTimeMetrics = {
    activeMatches: 0,
    activePlayers: 0,
    totalViewers: 0,
    averageMatchDuration: 0,
    revenuePerHour: 0,
    systemPerformance: {
      cpu: 0,
      memory: 0,
      network: 0,
    },
  };

  private constructor() {
    super();
    this.initializeMockData();
    this.startRealTimeUpdates();
  }

  public static getInstance(): TournamentAnalyticsService {
    if (!TournamentAnalyticsService.instance) {
      TournamentAnalyticsService.instance = new TournamentAnalyticsService();
    }
    return TournamentAnalyticsService.instance;
  }

  private initializeMockData(): void {
    // Mock tournament statistics
    this.stats = [
      {
        id: '1',
        name: 'Cyberpunk Championship 2025',
        totalMatches: 156,
        totalPlayers: 64,
        averageMatchDuration: 45,
        totalPrizePool: 25000,
        completionRate: 94.2,
        averageRating: 8.7,
        topPerformer: {
          id: 'player1',
          name: 'Neon Shadow',
          rating: 9.8,
          wins: 12,
        },
        venueStats: [
          {
            id: 'venue1',
            name: 'Neon Pool Hall',
            matchesPlayed: 89,
            revenue: 12500,
          },
          {
            id: 'venue2',
            name: 'Cyber Dojo',
            matchesPlayed: 67,
            revenue: 12500,
          },
        ],
        performanceMetrics: {
          averageShotAccuracy: 78.5,
          averageBreakSuccess: 65.2,
          averageSafetySuccess: 72.1,
          totalFouls: 234,
          averageMatchLength: 45,
        },
        trends: [
          { date: '2025-01-25', matchesPlayed: 12, averageRating: 8.5, revenue: 1800 },
          { date: '2025-01-26', matchesPlayed: 15, averageRating: 8.7, revenue: 2200 },
          { date: '2025-01-27', matchesPlayed: 18, averageRating: 8.9, revenue: 2600 },
          { date: '2025-01-28', matchesPlayed: 14, averageRating: 8.6, revenue: 2100 },
          { date: '2025-01-29', matchesPlayed: 16, averageRating: 8.8, revenue: 2400 },
        ],
      },
    ];

    // Mock player performance data
    this.playerPerformance = [
      {
        id: 'player1',
        name: 'Neon Shadow',
        rating: 9.8,
        matchesPlayed: 12,
        wins: 12,
        losses: 0,
        winRate: 100,
        averageScore: 95.2,
        totalPrizeMoney: 5000,
        performanceHistory: [
          { date: '2025-01-25', rating: 9.5, matchResult: 'win', score: 92 },
          { date: '2025-01-26', rating: 9.6, matchResult: 'win', score: 94 },
          { date: '2025-01-27', rating: 9.7, matchResult: 'win', score: 96 },
          { date: '2025-01-28', rating: 9.8, matchResult: 'win', score: 98 },
        ],
        strengths: ['Break shots', 'Position play', 'Safety shots'],
        weaknesses: ['Long shots under pressure'],
        improvementAreas: ['Mental game', 'Pressure situations'],
      },
      {
        id: 'player2',
        name: 'Digital Phantom',
        rating: 9.2,
        matchesPlayed: 10,
        wins: 8,
        losses: 2,
        winRate: 80,
        averageScore: 88.5,
        totalPrizeMoney: 3000,
        performanceHistory: [
          { date: '2025-01-25', rating: 9.0, matchResult: 'win', score: 85 },
          { date: '2025-01-26', rating: 9.1, matchResult: 'loss', score: 82 },
          { date: '2025-01-27', rating: 9.2, matchResult: 'win', score: 90 },
          { date: '2025-01-28', rating: 9.2, matchResult: 'win', score: 89 },
        ],
        strengths: ['Long shots', 'Bank shots', 'Defensive play'],
        weaknesses: ['Break consistency'],
        improvementAreas: ['Break shot practice', 'Opening game strategy'],
      },
    ];

    // Mock venue analytics
    this.venueAnalytics = [
      {
        id: 'venue1',
        name: 'Neon Pool Hall',
        totalRevenue: 12500,
        totalMatches: 89,
        averageRating: 8.8,
        playerSatisfaction: 92,
        equipmentUtilization: 87,
        revenueTrends: [
          { date: '2025-01-25', revenue: 1800, matches: 12 },
          { date: '2025-01-26', revenue: 2200, matches: 15 },
          { date: '2025-01-27', revenue: 2600, matches: 18 },
          { date: '2025-01-28', revenue: 2100, matches: 14 },
          { date: '2025-01-29', revenue: 2400, matches: 16 },
        ],
        popularTimeSlots: [
          { hour: 19, matches: 25, revenue: 3500 },
          { hour: 20, matches: 30, revenue: 4200 },
          { hour: 21, matches: 20, revenue: 2800 },
          { hour: 22, matches: 14, revenue: 2000 },
        ],
        equipmentHealth: [
          {
            tableId: 'table1',
            status: 'excellent',
            lastMaintenance: '2025-01-20',
            utilizationRate: 95,
          },
          {
            tableId: 'table2',
            status: 'good',
            lastMaintenance: '2025-01-18',
            utilizationRate: 88,
          },
        ],
      },
    ];
  }

  private startRealTimeUpdates(): void {
    setInterval(() => {
      this.updateRealTimeMetrics();
      this.emit('realTimeUpdate', this.realTimeMetrics);
    }, 5000);

    setInterval(() => {
      this.updatePerformanceMetrics();
      this.emit('performanceUpdate', this.playerPerformance);
    }, 10000);
  }

  private updateRealTimeMetrics(): void {
    this.realTimeMetrics = {
      activeMatches: Math.floor(Math.random() * 10) + 5,
      activePlayers: Math.floor(Math.random() * 20) + 15,
      totalViewers: Math.floor(Math.random() * 100) + 50,
      averageMatchDuration: Math.floor(Math.random() * 10) + 40,
      revenuePerHour: Math.floor(Math.random() * 200) + 300,
      systemPerformance: {
        cpu: Math.random() * 30 + 20,
        memory: Math.random() * 25 + 30,
        network: Math.random() * 20 + 15,
      },
    };
  }

  private updatePerformanceMetrics(): void {
    this.playerPerformance.forEach((player) => {
      if (Math.random() > 0.7) {
        const change = (Math.random() - 0.5) * 0.2;
        player.rating = Math.max(0, Math.min(10, player.rating + change));
      }
    });
  }

  public getTournamentStats(): TournamentStats[] {
    return this.stats;
  }

  public getPlayerPerformance(): PlayerPerformance[] {
    return this.playerPerformance;
  }

  public getVenueAnalytics(): VenueAnalytics[] {
    return this.venueAnalytics;
  }

  public getRealTimeMetrics(): RealTimeMetrics {
    return this.realTimeMetrics;
  }

  public getTopPerformers(limit: number = 10): PlayerPerformance[] {
    return this.playerPerformance
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  public getRevenueAnalytics(): { total: number; trend: number; projection: number } {
    const total = this.venueAnalytics.reduce((sum, venue) => sum + venue.totalRevenue, 0);
    const recentTrend = this.stats[0]?.trends.slice(-3).reduce((sum, trend) => sum + trend.revenue, 0) / 3;
    const projection = recentTrend * 1.15; // 15% growth projection

    return { total, trend: recentTrend, projection };
  }

  public getPerformanceInsights(): {
    topStrengths: string[];
    commonWeaknesses: string[];
    improvementRecommendations: string[];
  } {
    const allStrengths = this.playerPerformance.flatMap((p) => p.strengths);
    const allWeaknesses = this.playerPerformance.flatMap((p) => p.weaknesses);

    const strengthCounts = allStrengths.reduce((acc, strength) => {
      if (typeof strength === 'string' && strength.length > 0) {
        acc[strength] = (acc[strength] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const weaknessCounts = allWeaknesses.reduce((acc, weakness) => {
      if (typeof weakness === 'string' && weakness.length > 0) {
        acc[weakness] = (acc[weakness] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topStrengths = Object.entries(strengthCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([strength]) => strength);

    const commonWeaknesses = Object.entries(weaknessCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([weakness]) => weakness);

    const improvementRecommendations = [
      'Focus on break shot consistency training',
      'Implement mental game coaching programs',
      'Develop pressure situation simulation drills',
      'Enhance safety shot practice routines',
    ];

    return { topStrengths, commonWeaknesses, improvementRecommendations };
  }

  public subscribeToUpdates(callback: (data: TournamentStats | PlayerPerformance | VenueAnalytics | RealTimeMetrics) => void): () => void {
    this.on('analyticsUpdate', callback);
    return () => {
      this.off('analyticsUpdate', callback);
    };
  }

  async getPlayerAnalytics(playerId: string): Promise<PlayerAnalytics> {
    // Implementation of getPlayerAnalytics method
    return {
      playerId,
      winRate: 0.5,
      averageScore: 0,
      totalMatches: 0,
      strengths: [],
      weaknesses: []
    };
  }

  async getTournamentAnalytics(tournamentId: string): Promise<TournamentAnalytics> {
    // Implementation of getTournamentAnalytics method
    return {
      tournamentId,
      totalParticipants: 0,
      averageMatchDuration: 0,
      mostCommonOutcome: '',
      topPerformers: []
    };
  }

  private onMatchUpdate = (data: TournamentMatch): void => {
    // Implementation of onMatchUpdate method
    console.log('Match update received:', data);
  };
}

export default TournamentAnalyticsService; 
