import { io, Socket } from 'socket.io-client';

export interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  totalMatches: number;
  averageMatchDuration: number;
  totalPrizePool: number;
  averagePrizePool: number;
}

export interface PlayerAnalytics {
  playerId: string;
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  highestScore: number;
  tournamentWins: number;
  tournamentFinals: number;
  totalPrizeMoney: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
  skillRating: number;
  rank: number;
}

export interface MatchAnalytics {
  matchId: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  duration: number;
  totalShots: number;
  averageShotTime: number;
  accuracy: number;
  difficulty: 'easy' | 'medium' | 'hard';
  excitement: number;
  viewership: number;
  highlights: string[];
}

export interface TournamentAnalytics {
  tournamentId: string;
  name: string;
  type: string;
  startDate: Date;
  endDate?: Date;
  totalPlayers: number;
  totalMatches: number;
  averageMatchDuration: number;
  totalPrizePool: number;
  viewership: number;
  engagement: number;
  completionRate: number;
  playerSatisfaction: number;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
}

export interface PredictiveInsights {
  tournamentId: string;
  predictedWinner: string;
  winProbability: number;
  expectedDuration: number;
  predictedViewership: number;
  revenueForecast: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

export interface AnalyticsConfig {
  refreshInterval: number;
  enablePredictions: boolean;
  enableRealTime: boolean;
  dataRetention: number;
  exportFormats: string[];
  alertThresholds: {
    lowEngagement: number;
    highCosts: number;
    lowCompletion: number;
  };
}

class TournamentAnalyticsService {
  private socket: Socket | null = null;
  private static instance: TournamentAnalyticsService;
  private config: AnalyticsConfig;
  private stats: TournamentStats | null = null;
  private playerAnalytics: Map<string, PlayerAnalytics> = new Map();
  private matchAnalytics: Map<string, MatchAnalytics> = new Map();
  private tournamentAnalytics: Map<string, TournamentAnalytics> = new Map();
  private predictiveInsights: Map<string, PredictiveInsights> = new Map();
  private isConnected: boolean = false;

  private constructor() {
    this.config = {
      refreshInterval: 5000,
      enablePredictions: true,
      enableRealTime: true,
      dataRetention: 30,
      exportFormats: ['JSON', 'CSV', 'PDF'],
      alertThresholds: {
        lowEngagement: 0.3,
        highCosts: 0.8,
        lowCompletion: 0.5,
      },
    };
    this.initializeSocket();
  }

  public static getInstance(): TournamentAnalyticsService {
    if (!TournamentAnalyticsService.instance) {
      TournamentAnalyticsService.instance = new TournamentAnalyticsService();
    }
    return TournamentAnalyticsService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('TournamentAnalyticsService connected to server');
      this.isConnected = true;
      this.requestAnalytics();
    });

    this.socket.on('disconnect', () => {
      console.log('TournamentAnalyticsService disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('analytics-update', (data: any) => {
      this.handleAnalyticsUpdate(data);
    });

    this.socket.on('prediction-update', (data: any) => {
      this.handlePredictionUpdate(data);
    });

    this.socket.on('stats-update', (data: any) => {
      this.handleStatsUpdate(data);
    });
  }

  private handleAnalyticsUpdate(data: any): void {
    if (data.tournamentAnalytics) {
      this.tournamentAnalytics.set(data.tournamentAnalytics.tournamentId, data.tournamentAnalytics);
    }
    if (data.playerAnalytics) {
      this.playerAnalytics.set(data.playerAnalytics.playerId, data.playerAnalytics);
    }
    if (data.matchAnalytics) {
      this.matchAnalytics.set(data.matchAnalytics.matchId, data.matchAnalytics);
    }
  }

  private handlePredictionUpdate(data: any): void {
    if (data.predictiveInsights) {
      this.predictiveInsights.set(data.predictiveInsights.tournamentId, data.predictiveInsights);
    }
  }

  private handleStatsUpdate(data: any): void {
    this.stats = data.stats;
  }

  private requestAnalytics(): void {
    this.socket?.emit('request-analytics', {
      enableRealTime: this.config.enableRealTime,
      enablePredictions: this.config.enablePredictions,
    });
  }

  // Public Methods
  public getStats(): TournamentStats | null {
    return this.stats;
  }

  public getPlayerAnalytics(playerId?: string): PlayerAnalytics[] {
    if (playerId) {
      const player = this.playerAnalytics.get(playerId);
      return player ? [player] : [];
    }
    return Array.from(this.playerAnalytics.values());
  }

  public getMatchAnalytics(matchId?: string): MatchAnalytics[] {
    if (matchId) {
      const match = this.matchAnalytics.get(matchId);
      return match ? [match] : [];
    }
    return Array.from(this.matchAnalytics.values());
  }

  public getTournamentAnalytics(tournamentId?: string): TournamentAnalytics[] {
    if (tournamentId) {
      const tournament = this.tournamentAnalytics.get(tournamentId);
      return tournament ? [tournament] : [];
    }
    return Array.from(this.tournamentAnalytics.values());
  }

  public getPredictiveInsights(tournamentId?: string): PredictiveInsights[] {
    if (tournamentId) {
      const insights = this.predictiveInsights.get(tournamentId);
      return insights ? [insights] : [];
    }
    return Array.from(this.predictiveInsights.values());
  }

  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('analytics-config-updated', this.config);
  }

  public generateReport(type: 'tournament' | 'player' | 'match' | 'comprehensive', id?: string): any {
    const report = {
      timestamp: new Date(),
      type,
      data: {},
      insights: [],
      recommendations: [],
    };

    switch (type) {
      case 'tournament':
        if (id) {
          const tournament = this.tournamentAnalytics.get(id);
          const insights = this.predictiveInsights.get(id);
          if (tournament) {
            report.data = tournament;
            report.insights = insights ? [insights] : [];
            report.recommendations = this.generateTournamentRecommendations(tournament);
          }
        }
        break;
      case 'player':
        if (id) {
          const player = this.playerAnalytics.get(id);
          if (player) {
            report.data = player;
            report.insights = this.generatePlayerInsights(player);
            report.recommendations = this.generatePlayerRecommendations(player);
          }
        }
        break;
      case 'match':
        if (id) {
          const match = this.matchAnalytics.get(id);
          if (match) {
            report.data = match;
            report.insights = this.generateMatchInsights(match);
            report.recommendations = this.generateMatchRecommendations(match);
          }
        }
        break;
      case 'comprehensive':
        report.data = {
          stats: this.stats,
          tournaments: Array.from(this.tournamentAnalytics.values()),
          players: Array.from(this.playerAnalytics.values()),
          matches: Array.from(this.matchAnalytics.values()),
          predictions: Array.from(this.predictiveInsights.values()),
        };
        report.insights = this.generateComprehensiveInsights();
        report.recommendations = this.generateComprehensiveRecommendations();
        break;
    }

    return report;
  }

  private generateTournamentRecommendations(tournament: TournamentAnalytics): string[] {
    const recommendations: string[] = [];
    
    if (tournament.engagement < this.config.alertThresholds.lowEngagement) {
      recommendations.push('Consider implementing engagement-boosting features like live chat or interactive polls');
    }
    
    if (tournament.completionRate < this.config.alertThresholds.lowCompletion) {
      recommendations.push('Review tournament structure and scheduling to improve completion rates');
    }
    
    if (tournament.roi < 1.2) {
      recommendations.push('Optimize prize pool distribution and sponsorship opportunities');
    }
    
    return recommendations;
  }

  private generatePlayerInsights(player: PlayerAnalytics): any[] {
    return [
      {
        type: 'performance',
        title: 'Performance Trend',
        value: player.performanceTrend,
        description: `Player is showing ${player.performanceTrend} performance`,
      },
      {
        type: 'ranking',
        title: 'Current Rank',
        value: player.rank,
        description: `Ranked #${player.rank} among all players`,
      },
    ];
  }

  private generatePlayerRecommendations(player: PlayerAnalytics): string[] {
    const recommendations: string[] = [];
    
    if (player.winRate < 0.4) {
      recommendations.push('Consider additional training programs to improve win rate');
    }
    
    if (player.performanceTrend === 'declining') {
      recommendations.push('Review recent matches to identify areas for improvement');
    }
    
    return recommendations;
  }

  private generateMatchInsights(match: MatchAnalytics): any[] {
    return [
      {
        type: 'excitement',
        title: 'Match Excitement',
        value: match.excitement,
        description: `Excitement level: ${match.excitement}/10`,
      },
      {
        type: 'viewership',
        title: 'Viewership',
        value: match.viewership,
        description: `${match.viewership} viewers watched this match`,
      },
    ];
  }

  private generateMatchRecommendations(match: MatchAnalytics): string[] {
    const recommendations: string[] = [];
    
    if (match.excitement > 8) {
      recommendations.push('Consider featuring this match in highlights and promotional content');
    }
    
    if (match.viewership > 1000) {
      recommendations.push('This match type attracts high viewership - consider similar matchups');
    }
    
    return recommendations;
  }

  private generateComprehensiveInsights(): any[] {
    const insights: any[] = [];
    
    if (this.stats) {
      insights.push({
        type: 'overview',
        title: 'System Overview',
        value: `${this.stats.totalTournaments} tournaments, ${this.stats.totalPlayers} players`,
        description: 'Overall system performance and engagement',
      });
    }
    
    return insights;
  }

  private generateComprehensiveRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.stats && this.stats.averagePrizePool < 1000) {
      recommendations.push('Consider increasing prize pools to attract more competitive players');
    }
    
    recommendations.push('Implement advanced analytics dashboard for better insights');
    recommendations.push('Consider AI-powered matchmaking for improved player experience');
    
    return recommendations;
  }

  public exportData(format: string, data: any): string {
    switch (format.toUpperCase()) {
      case 'JSON':
        return JSON.stringify(data, null, 2);
      case 'CSV':
        return this.convertToCSV(data);
      case 'PDF':
        return this.convertToPDF(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const csv = [headers.join(',')];
      data.forEach(item => {
        csv.push(headers.map(header => item[header]).join(','));
      });
      return csv.join('\n');
    }
    return '';
  }

  private convertToPDF(data: any): string {
    // Placeholder for PDF conversion - in production, use a proper PDF library
    return `PDF Report: ${JSON.stringify(data).substring(0, 100)}...`;
  }

  public isConnected(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}

export default TournamentAnalyticsService; 