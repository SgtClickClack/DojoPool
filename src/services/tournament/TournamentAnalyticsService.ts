import { Tournament, Match, Player, TournamentFormat } from '../types/tournament';

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  totalPoints: number;
  averagePoints: number;
  highestBreak: number;
  totalFouls: number;
  averageShotTime: number;
  tournamentRank: number;
  currentStreak: number;
  longestStreak: number;
  eliminationRound?: number;
  finalPosition?: number;
}

export interface TournamentStatistics {
  tournamentId: string;
  tournamentName: string;
  totalPlayers: number;
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  totalPrizePool: number;
  averagePointsPerMatch: number;
  highestBreak: number;
  longestMatch: number;
  shortestMatch: number;
  totalFouls: number;
  averageFoulsPerMatch: number;
  completionRate: number;
  averagePlayersPerMatch: number;
}

export interface MatchAnalytics {
  matchId: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  winnerId?: string;
  duration: number;
  totalShots: number;
  totalPoints: number;
  totalFouls: number;
  highestBreak: number;
  averageShotTime: number;
  shotAccuracy: number;
  positionControl: number;
  safetySuccess: number;
  breakSuccess: number;
  keyMoments: KeyMoment[];
  roundNumber: number;
  matchNumber: number;
}

export interface KeyMoment {
  timestamp: number;
  type: 'break' | 'foul' | 'safety' | 'pot' | 'miss';
  playerId: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface HistoricalData {
  tournamentId: string;
  date: string;
  playerCount: number;
  matchCount: number;
  averageScore: number;
  completionRate: number;
  totalPrizePool: number;
}

export interface PerformanceTrends {
  playerId: string;
  playerName: string;
  tournamentsPlayed: number;
  averageRank: number;
  winRateTrend: number[];
  pointsTrend: number[];
  breakTrend: number[];
  improvementRate: number;
}

export interface VenueAnalytics {
  venueId: string;
  venueName: string;
  tournamentsHosted: number;
  totalPlayers: number;
  averageTournamentSize: number;
  completionRate: number;
  averagePrizePool: number;
  popularFormats: string[];
  peakHours: number[];
}

class TournamentAnalyticsService {
  private static instance: TournamentAnalyticsService;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {}

  static getInstance(): TournamentAnalyticsService {
    if (!TournamentAnalyticsService.instance) {
      TournamentAnalyticsService.instance = new TournamentAnalyticsService();
    }
    return TournamentAnalyticsService.instance;
  }

  // Subscribe to analytics updates
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  // Publish analytics updates
  private publish(event: string, data: any): void {
    this.subscribers.get(event)?.forEach(callback => callback(data));
  }

  // Calculate comprehensive tournament statistics
  async calculateTournamentStatistics(tournament: Tournament): Promise<TournamentStatistics> {
    const matches = await this.getTournamentMatches(tournament.id);
    const players = await this.getTournamentPlayers(tournament.id);

    const completedMatches = matches.filter(m => m.status === 'completed');
    const totalPoints = completedMatches.reduce((sum, match) => sum + (match.player1Score || 0) + (match.player2Score || 0), 0);
    const totalFouls = completedMatches.reduce((sum, match) => sum + (match.player1Fouls || 0) + (match.player2Fouls || 0), 0);
    const totalDuration = completedMatches.reduce((sum, match) => sum + (match.duration || 0), 0);

    const statistics: TournamentStatistics = {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      totalPlayers: players.length,
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      averageMatchDuration: completedMatches.length > 0 ? totalDuration / completedMatches.length : 0,
      totalPrizePool: tournament.prizePool || 0,
      averagePointsPerMatch: completedMatches.length > 0 ? totalPoints / completedMatches.length : 0,
      highestBreak: Math.max(...completedMatches.map(m => Math.max(m.player1HighestBreak || 0, m.player2HighestBreak || 0))),
      longestMatch: Math.max(...completedMatches.map(m => m.duration || 0)),
      shortestMatch: Math.min(...completedMatches.map(m => m.duration || 0)),
      totalFouls,
      averageFoulsPerMatch: completedMatches.length > 0 ? totalFouls / completedMatches.length : 0,
      completionRate: matches.length > 0 ? (completedMatches.length / matches.length) * 100 : 0,
      averagePlayersPerMatch: matches.length > 0 ? (players.length * 2) / matches.length : 0,
    };

    this.publish('tournamentStatistics', statistics);
    return statistics;
  }

  // Calculate player performance rankings
  async calculatePlayerPerformance(tournament: Tournament): Promise<PlayerPerformance[]> {
    const matches = await this.getTournamentMatches(tournament.id);
    const players = await this.getTournamentPlayers(tournament.id);
    const playerStats = new Map<string, PlayerPerformance>();

    // Initialize player stats
    players.forEach(player => {
      playerStats.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        winRate: 0,
        totalPoints: 0,
        averagePoints: 0,
        highestBreak: 0,
        totalFouls: 0,
        averageShotTime: 0,
        tournamentRank: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
    });

    // Calculate stats from matches
    const completedMatches = matches.filter(m => m.status === 'completed');
    completedMatches.forEach(match => {
      const player1Stats = playerStats.get(match.player1Id);
      const player2Stats = playerStats.get(match.player2Id);

      if (player1Stats && player2Stats) {
        // Update matches played
        player1Stats.matchesPlayed++;
        player2Stats.matchesPlayed++;

        // Update points and breaks
        player1Stats.totalPoints += match.player1Score || 0;
        player2Stats.totalPoints += match.player2Score || 0;
        player1Stats.highestBreak = Math.max(player1Stats.highestBreak, match.player1HighestBreak || 0);
        player2Stats.highestBreak = Math.max(player2Stats.highestBreak, match.player2HighestBreak || 0);

        // Update fouls
        player1Stats.totalFouls += match.player1Fouls || 0;
        player2Stats.totalFouls += match.player2Fouls || 0;

        // Determine winner
        if (match.winnerId === match.player1Id) {
          player1Stats.matchesWon++;
          player2Stats.matchesLost++;
        } else if (match.winnerId === match.player2Id) {
          player2Stats.matchesWon++;
          player1Stats.matchesLost++;
        }
      }
    });

    // Calculate averages and win rates
    playerStats.forEach(stats => {
      stats.winRate = stats.matchesPlayed > 0 ? (stats.matchesWon / stats.matchesPlayed) * 100 : 0;
      stats.averagePoints = stats.matchesPlayed > 0 ? stats.totalPoints / stats.matchesPlayed : 0;
      stats.averageShotTime = stats.matchesPlayed > 0 ? 45 : 0; // Mock average shot time
    });

    // Sort by win rate and assign ranks
    const sortedPlayers = Array.from(playerStats.values()).sort((a, b) => b.winRate - a.winRate);
    sortedPlayers.forEach((player, index) => {
      player.tournamentRank = index + 1;
    });

    this.publish('playerPerformance', sortedPlayers);
    return sortedPlayers;
  }

  // Calculate match analytics
  async calculateMatchAnalytics(match: Match): Promise<MatchAnalytics> {
    const analytics: MatchAnalytics = {
      matchId: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1Name: match.player1Name || 'Player 1',
      player2Name: match.player2Name || 'Player 2',
      winnerId: match.winnerId,
      duration: match.duration || 0,
      totalShots: (match.player1Shots || 0) + (match.player2Shots || 0),
      totalPoints: (match.player1Score || 0) + (match.player2Score || 0),
      totalFouls: (match.player1Fouls || 0) + (match.player2Fouls || 0),
      highestBreak: Math.max(match.player1HighestBreak || 0, match.player2HighestBreak || 0),
      averageShotTime: 45, // Mock average shot time
      shotAccuracy: this.calculateShotAccuracy(match),
      positionControl: this.calculatePositionControl(match),
      safetySuccess: this.calculateSafetySuccess(match),
      breakSuccess: this.calculateBreakSuccess(match),
      keyMoments: this.generateKeyMoments(match),
      roundNumber: match.roundNumber || 1,
      matchNumber: match.matchNumber || 1,
    };

    this.publish('matchAnalytics', analytics);
    return analytics;
  }

  // Calculate historical trends
  async calculateHistoricalTrends(playerId: string, tournaments: Tournament[]): Promise<PerformanceTrends> {
    const playerTournaments = tournaments.filter(t => 
      t.players?.some(p => p.id === playerId)
    );

    const winRateTrend = playerTournaments.map(t => {
      const matches = t.matches?.filter(m => 
        m.player1Id === playerId || m.player2Id === playerId
      ) || [];
      const wins = matches.filter(m => m.winnerId === playerId).length;
      return matches.length > 0 ? (wins / matches.length) * 100 : 0;
    });

    const pointsTrend = playerTournaments.map(t => {
      const matches = t.matches?.filter(m => 
        m.player1Id === playerId || m.player2Id === playerId
      ) || [];
      return matches.reduce((sum, m) => {
        if (m.player1Id === playerId) return sum + (m.player1Score || 0);
        if (m.player2Id === playerId) return sum + (m.player2Score || 0);
        return sum;
      }, 0);
    });

    const breakTrend = playerTournaments.map(t => {
      const matches = t.matches?.filter(m => 
        m.player1Id === playerId || m.player2Id === playerId
      ) || [];
      return Math.max(...matches.map(m => {
        if (m.player1Id === playerId) return m.player1HighestBreak || 0;
        if (m.player2Id === playerId) return m.player2HighestBreak || 0;
        return 0;
      }));
    });

    const trends: PerformanceTrends = {
      playerId,
      playerName: 'Player Name', // Would get from player data
      tournamentsPlayed: playerTournaments.length,
      averageRank: this.calculateAverageRank(playerId, playerTournaments),
      winRateTrend,
      pointsTrend,
      breakTrend,
      improvementRate: this.calculateImprovementRate(winRateTrend),
    };

    this.publish('performanceTrends', trends);
    return trends;
  }

  // Calculate venue analytics
  async calculateVenueAnalytics(venueId: string, tournaments: Tournament[]): Promise<VenueAnalytics> {
    const venueTournaments = tournaments.filter(t => t.venueId === venueId);
    const formatCounts = new Map<string, number>();
    
    venueTournaments.forEach(t => {
      const format = t.format || 'single_elimination';
      formatCounts.set(format, (formatCounts.get(format) || 0) + 1);
    });

    const analytics: VenueAnalytics = {
      venueId,
      venueName: 'Venue Name', // Would get from venue data
      tournamentsHosted: venueTournaments.length,
      totalPlayers: venueTournaments.reduce((sum, t) => sum + (t.players?.length || 0), 0),
      averageTournamentSize: venueTournaments.length > 0 ? 
        venueTournaments.reduce((sum, t) => sum + (t.players?.length || 0), 0) / venueTournaments.length : 0,
      completionRate: venueTournaments.length > 0 ? 
        (venueTournaments.filter(t => t.status === 'completed').length / venueTournaments.length) * 100 : 0,
      averagePrizePool: venueTournaments.length > 0 ? 
        venueTournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0) / venueTournaments.length : 0,
      popularFormats: Array.from(formatCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([format]) => format),
      peakHours: [14, 16, 18, 20], // Mock peak hours
    };

    this.publish('venueAnalytics', analytics);
    return analytics;
  }

  // Generate real-time analytics dashboard data
  async generateAnalyticsDashboard(tournament: Tournament): Promise<any> {
    const [statistics, playerPerformance, matches] = await Promise.all([
      this.calculateTournamentStatistics(tournament),
      this.calculatePlayerPerformance(tournament),
      this.getTournamentMatches(tournament.id),
    ]);

    const dashboard = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      },
      statistics,
      playerPerformance,
      matchAnalytics: await Promise.all(
        matches.filter(m => m.status === 'completed').map(m => this.calculateMatchAnalytics(m))
      ),
      realTimeUpdates: {
        lastUpdate: new Date().toISOString(),
        activeMatches: matches.filter(m => m.status === 'in_progress').length,
        completedToday: matches.filter(m => 
          m.status === 'completed' && 
          new Date(m.updatedAt || '').toDateString() === new Date().toDateString()
        ).length,
      },
    };

    this.publish('analyticsDashboard', dashboard);
    return dashboard;
  }

  // Helper methods for calculations
  private calculateShotAccuracy(match: Match): number {
    const totalShots = (match.player1Shots || 0) + (match.player2Shots || 0);
    const successfulShots = (match.player1Score || 0) + (match.player2Score || 0);
    return totalShots > 0 ? (successfulShots / totalShots) * 100 : 0;
  }

  private calculatePositionControl(match: Match): number {
    // Mock position control calculation
    return Math.random() * 100;
  }

  private calculateSafetySuccess(match: Match): number {
    // Mock safety success calculation
    return Math.random() * 100;
  }

  private calculateBreakSuccess(match: Match): number {
    const totalBreaks = (match.player1Breaks || 0) + (match.player2Breaks || 0);
    const successfulBreaks = (match.player1HighestBreak || 0) + (match.player2HighestBreak || 0);
    return totalBreaks > 0 ? (successfulBreaks / totalBreaks) * 100 : 0;
  }

  private generateKeyMoments(match: Match): KeyMoment[] {
    const moments: KeyMoment[] = [];
    const duration = match.duration || 1800; // 30 minutes default

    // Generate mock key moments
    for (let i = 0; i < 5; i++) {
      moments.push({
        timestamp: Math.random() * duration,
        type: ['break', 'foul', 'safety', 'pot', 'miss'][Math.floor(Math.random() * 5)] as any,
        playerId: Math.random() > 0.5 ? match.player1Id : match.player2Id,
        description: `Key moment ${i + 1}`,
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      });
    }

    return moments.sort((a, b) => a.timestamp - b.timestamp);
  }

  private calculateAverageRank(playerId: string, tournaments: Tournament[]): number {
    const ranks = tournaments.map(t => {
      const players = t.players || [];
      const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
      const playerIndex = sortedPlayers.findIndex(p => p.id === playerId);
      return playerIndex >= 0 ? playerIndex + 1 : players.length;
    });

    return ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : 0;
  }

  private calculateImprovementRate(winRateTrend: number[]): number {
    if (winRateTrend.length < 2) return 0;
    
    const recent = winRateTrend.slice(-3);
    const earlier = winRateTrend.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, rate) => sum + rate, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, rate) => sum + rate, 0) / earlier.length;
    
    return earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
  }

  // Mock data methods (would be replaced with actual API calls)
  private async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    // Mock implementation - would fetch from API
    return [];
  }

  private async getTournamentPlayers(tournamentId: string): Promise<Player[]> {
    // Mock implementation - would fetch from API
    return [];
  }
}

export default TournamentAnalyticsService; 