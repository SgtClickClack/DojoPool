import { EventEmitter } from 'events';

export interface PlayerStats {
  id: string;
  name: string;
  rating: number;
  winRate: number;
  totalMatches: number;
  recentForm: number; // Last 10 matches performance
  headToHead: Record<string, number>; // Win rate against specific players
  tournamentHistory: {
    tournamentId: string;
    finish: number;
    performance: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  playStyle: 'aggressive' | 'defensive' | 'balanced';
  consistency: number; // 0-1, how consistent their performance is
}

export interface MatchPrediction {
  matchId: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1WinProbability: number;
  player2WinProbability: number;
  predictedScore: {
    player1: number;
    player2: number;
  };
  confidence: number;
  factors: {
    rating: number;
    form: number;
    headToHead: number;
    consistency: number;
    playStyle: number;
  };
  aiInsights: string[];
}

export interface TournamentSeeding {
  tournamentId: string;
  players: {
    id: string;
    name: string;
    seed: number;
    rating: number;
    predictedFinish: number;
    bracketPosition: number;
  }[];
  bracketPredictions: {
    round: number;
    matches: MatchPrediction[];
  }[];
  tournamentWinner: {
    playerId: string;
    playerName: string;
    probability: number;
  };
  darkHorses: {
    playerId: string;
    playerName: string;
    seed: number;
    probability: number;
    reason: string;
  }[];
}

export interface AIAnalysis {
  playerId: string;
  playerName: string;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    recommendedStrategy: string;
    matchupAdvantages: {
      opponentId: string;
      opponentName: string;
      advantage: number;
      reasons: string[];
    }[];
  };
  predictions: {
    nextMatchWinProbability: number;
    tournamentFinish: number;
    keyMatchups: string[];
  };
}

class TournamentPredictionService extends EventEmitter {
  private static instance: TournamentPredictionService;
  private playerStats: PlayerStats[] = [];
  private matchPredictions: MatchPrediction[] = [];
  private tournamentSeedings: TournamentSeeding[] = [];
  private aiAnalyses: AIAnalysis[] = [];

  private constructor() {
    super();
    this.initializeMockData();
    this.startPredictionUpdates();
  }

  public static getInstance(): TournamentPredictionService {
    if (!TournamentPredictionService.instance) {
      TournamentPredictionService.instance = new TournamentPredictionService();
    }
    return TournamentPredictionService.instance;
  }

  private initializeMockData(): void {
    // Mock player statistics
    this.playerStats = [
      {
        id: 'player1',
        name: 'Neon Shadow',
        rating: 9.8,
        winRate: 0.92,
        totalMatches: 150,
        recentForm: 0.95,
        headToHead: {
          'player2': 0.75,
          'player3': 0.80,
          'player4': 0.85,
        },
        tournamentHistory: [
          { tournamentId: 't1', finish: 1, performance: 9.5 },
          { tournamentId: 't2', finish: 2, performance: 9.2 },
          { tournamentId: 't3', finish: 1, performance: 9.8 },
        ],
        strengths: ['Break shots', 'Position play', 'Mental game'],
        weaknesses: ['Long shots under pressure'],
        playStyle: 'aggressive',
        consistency: 0.88,
      },
      {
        id: 'player2',
        name: 'Digital Phantom',
        rating: 9.2,
        winRate: 0.85,
        totalMatches: 120,
        recentForm: 0.88,
        headToHead: {
          'player1': 0.25,
          'player3': 0.70,
          'player4': 0.65,
        },
        tournamentHistory: [
          { tournamentId: 't1', finish: 3, performance: 8.8 },
          { tournamentId: 't2', finish: 1, performance: 9.1 },
          { tournamentId: 't3', finish: 4, performance: 8.5 },
        ],
        strengths: ['Long shots', 'Bank shots', 'Defensive play'],
        weaknesses: ['Break consistency'],
        playStyle: 'defensive',
        consistency: 0.82,
      },
      {
        id: 'player3',
        name: 'Cyber Striker',
        rating: 8.9,
        winRate: 0.78,
        totalMatches: 95,
        recentForm: 0.82,
        headToHead: {
          'player1': 0.20,
          'player2': 0.30,
          'player4': 0.60,
        },
        tournamentHistory: [
          { tournamentId: 't1', finish: 5, performance: 8.2 },
          { tournamentId: 't2', finish: 3, performance: 8.5 },
          { tournamentId: 't3', finish: 2, performance: 8.9 },
        ],
        strengths: ['Safety shots', 'Consistency', 'Pressure handling'],
        weaknesses: ['Aggressive play'],
        playStyle: 'balanced',
        consistency: 0.90,
      },
      {
        id: 'player4',
        name: 'Quantum Pool',
        rating: 8.5,
        winRate: 0.72,
        totalMatches: 80,
        recentForm: 0.78,
        headToHead: {
          'player1': 0.15,
          'player2': 0.35,
          'player3': 0.40,
        },
        tournamentHistory: [
          { tournamentId: 't1', finish: 7, performance: 7.8 },
          { tournamentId: 't2', finish: 5, performance: 8.1 },
          { tournamentId: 't3', finish: 6, performance: 7.9 },
        ],
        strengths: ['Creativity', 'Unpredictable shots', 'Comeback ability'],
        weaknesses: ['Consistency', 'Defensive play'],
        playStyle: 'aggressive',
        consistency: 0.65,
      },
    ];

    // Generate match predictions
    this.generateMatchPredictions();
    
    // Generate tournament seeding
    this.generateTournamentSeeding();
    
    // Generate AI analyses
    this.generateAIAnalyses();
  }

  private startPredictionUpdates(): void {
    setInterval(() => {
      this.updatePredictions();
      this.emit('predictionUpdate', {
        matchPredictions: this.matchPredictions,
        tournamentSeedings: this.tournamentSeedings,
        aiAnalyses: this.aiAnalyses,
      });
    }, 30000); // Update every 30 seconds
  }

  private updatePredictions(): void {
    // Simulate real-time updates to predictions
    this.playerStats.forEach((player) => {
      if (Math.random() > 0.7) {
        const formChange = (Math.random() - 0.5) * 0.1;
        player.recentForm = Math.max(0, Math.min(1, player.recentForm + formChange));
      }
    });

    this.generateMatchPredictions();
    this.generateTournamentSeeding();
    this.generateAIAnalyses();
  }

  private generateMatchPredictions(): void {
    this.matchPredictions = [];
    
    // Generate predictions for all possible matchups
    for (let i = 0; i < this.playerStats.length; i++) {
      for (let j = i + 1; j < this.playerStats.length; j++) {
        const player1 = this.playerStats[i];
        const player2 = this.playerStats[j];
        
        const prediction = this.calculateMatchPrediction(player1, player2);
        this.matchPredictions.push(prediction);
      }
    }
  }

  private calculateMatchPrediction(player1: PlayerStats, player2: PlayerStats): MatchPrediction {
    // Calculate win probability based on multiple factors
    const ratingFactor = (player1.rating - player2.rating) / 10;
    const formFactor = (player1.recentForm - player2.recentForm) * 0.3;
    const headToHeadFactor = (player1.headToHead[player2.id] || 0.5) - 0.5;
    const consistencyFactor = (player1.consistency - player2.consistency) * 0.2;
    
    // Play style matchup factor
    const playStyleFactor = this.calculatePlayStyleMatchup(player1.playStyle, player2.playStyle);
    
    // Combine factors with weights
    const player1Advantage = 
      ratingFactor * 0.4 +
      formFactor * 0.25 +
      headToHeadFactor * 0.2 +
      consistencyFactor * 0.1 +
      playStyleFactor * 0.05;
    
    const player1WinProbability = Math.max(0.1, Math.min(0.9, 0.5 + player1Advantage));
    const player2WinProbability = 1 - player1WinProbability;
    
    // Calculate confidence based on data quality
    const confidence = Math.min(0.95, 
      0.5 + 
      Math.abs(player1Advantage) * 0.3 +
      (player1.totalMatches + player2.totalMatches) / 500 * 0.2
    );
    
    // Generate AI insights
    const aiInsights = this.generateMatchInsights(player1, player2, player1Advantage);
    
    return {
      matchId: `match_${player1.id}_${player2.id}`,
      player1Id: player1.id,
      player2Id: player2.id,
      player1Name: player1.name,
      player2Name: player2.name,
      player1WinProbability,
      player2WinProbability,
      predictedScore: {
        player1: Math.round(player1WinProbability * 100),
        player2: Math.round(player2WinProbability * 100),
      },
      confidence,
      factors: {
        rating: ratingFactor,
        form: formFactor,
        headToHead: headToHeadFactor,
        consistency: consistencyFactor,
        playStyle: playStyleFactor,
      },
      aiInsights,
    };
  }

  private calculatePlayStyleMatchup(style1: string, style2: string): number {
    const matchups = {
      'aggressive': { 'defensive': 0.1, 'balanced': -0.05, 'aggressive': 0 },
      'defensive': { 'aggressive': -0.1, 'balanced': 0.05, 'defensive': 0 },
      'balanced': { 'aggressive': 0.05, 'defensive': -0.05, 'balanced': 0 },
    };
    
    return matchups[style1 as keyof typeof matchups]?.[style2 as keyof typeof matchups[typeof style1]] || 0;
  }

  private generateMatchInsights(player1: PlayerStats, player2: PlayerStats, advantage: number): string[] {
    const insights: string[] = [];
    
    if (Math.abs(advantage) > 0.2) {
      const favorite = advantage > 0 ? player1 : player2;
      const underdog = advantage > 0 ? player2 : player1;
      
      insights.push(`${favorite.name} has a significant advantage in this matchup`);
      insights.push(`${favorite.name}'s ${favorite.strengths[0]} could be the deciding factor`);
      
      if (underdog.recentForm > 0.8) {
        insights.push(`${underdog.name} is in excellent form and could cause an upset`);
      }
    } else {
      insights.push('This is a closely contested matchup with no clear favorite');
      insights.push('Recent form and mental game will likely decide the outcome');
    }
    
    if (player1.headToHead[player2.id] && Math.abs(player1.headToHead[player2.id] - 0.5) > 0.2) {
      const dominant = player1.headToHead[player2.id] > 0.5 ? player1 : player2;
      insights.push(`${dominant.name} has historically dominated this matchup`);
    }
    
    return insights;
  }

  private generateTournamentSeeding(): void {
    // Sort players by rating and recent form
    const sortedPlayers = [...this.playerStats].sort((a, b) => {
      const aScore = a.rating * 0.7 + a.recentForm * 0.3;
      const bScore = b.rating * 0.7 + b.recentForm * 0.3;
      return bScore - aScore;
    });
    
    // Generate bracket positions
    const seededPlayers = sortedPlayers.map((player, index) => ({
      id: player.id,
      name: player.name,
      seed: index + 1,
      rating: player.rating,
      predictedFinish: this.predictTournamentFinish(player),
      bracketPosition: this.calculateBracketPosition(index + 1, sortedPlayers.length),
    }));
    
    // Generate bracket predictions
    const bracketPredictions = this.generateBracketPredictions(seededPlayers);
    
    // Predict tournament winner
    const tournamentWinner = this.predictTournamentWinner(seededPlayers);
    
    // Identify dark horses
    const darkHorses = this.identifyDarkHorses(seededPlayers);
    
    this.tournamentSeedings = [{
      tournamentId: 'current_tournament',
      players: seededPlayers,
      bracketPredictions,
      tournamentWinner,
      darkHorses,
    }];
  }

  private predictTournamentFinish(player: PlayerStats): number {
    // Simple prediction based on rating and consistency
    const baseFinish = Math.max(1, Math.round(player.rating * 0.8));
    const consistencyAdjustment = (1 - player.consistency) * 2;
    return Math.max(1, Math.round(baseFinish + consistencyAdjustment));
  }

  private calculateBracketPosition(seed: number, totalPlayers: number): number {
    // Standard tournament bracket positioning
    if (totalPlayers === 4) {
      return seed === 1 ? 1 : seed === 2 ? 4 : seed === 3 ? 2 : 3;
    }
    // Simplified for demo
    return seed;
  }

  private generateBracketPredictions(players: any[]): any[] {
    const rounds = Math.ceil(Math.log2(players.length));
    const bracketPredictions = [];
    
    for (let round = 1; round <= rounds; round++) {
      const matches = [];
      const playersInRound = round === 1 ? players : this.simulateRoundWinners(players, round - 1);
      
      for (let i = 0; i < playersInRound.length; i += 2) {
        if (i + 1 < playersInRound.length) {
          const player1 = playersInRound[i];
          const player2 = playersInRound[i + 1];
          const prediction = this.matchPredictions.find(
            p => (p.player1Id === player1.id && p.player2Id === player2.id) ||
                 (p.player1Id === player2.id && p.player2Id === player1.id)
          );
          
          if (prediction) {
            matches.push(prediction);
          }
        }
      }
      
      bracketPredictions.push({ round, matches });
    }
    
    return bracketPredictions;
  }

  private simulateRoundWinners(players: any[], round: number): any[] {
    // Simplified simulation - in reality this would be more complex
    return players.slice(0, Math.ceil(players.length / 2));
  }

  private predictTournamentWinner(players: any[]): any {
    const winner = players.reduce((best, current) => {
      const bestScore = best.rating * 0.6 + (1 / best.seed) * 0.4;
      const currentScore = current.rating * 0.6 + (1 / current.seed) * 0.4;
      return currentScore > bestScore ? current : best;
    });
    
    return {
      playerId: winner.id,
      playerName: winner.name,
      probability: 0.35 + (winner.rating - 8) * 0.1,
    };
  }

  private identifyDarkHorses(players: any[]): any[] {
    return players
      .filter(player => player.seed > 2 && player.rating > 8.5)
      .slice(0, 2)
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        seed: player.seed,
        probability: 0.15 + (player.rating - 8.5) * 0.1,
        reason: `Strong recent form and high consistency despite lower seeding`,
      }));
  }

  private generateAIAnalyses(): void {
    this.aiAnalyses = this.playerStats.map(player => {
      const analysis = this.generatePlayerAnalysis(player);
      const predictions = this.generatePlayerPredictions(player);
      
      return {
        playerId: player.id,
        playerName: player.name,
        analysis,
        predictions,
      };
    });
  }

  private generatePlayerAnalysis(player: PlayerStats): any {
    const strengths = [...player.strengths];
    const weaknesses = [...player.weaknesses];
    
    // Add AI-generated insights
    if (player.recentForm > 0.9) {
      strengths.push('Excellent recent form');
    }
    if (player.consistency < 0.7) {
      weaknesses.push('Inconsistent performance');
    }
    
    const improvementAreas = [
      'Mental game under pressure',
      'Adaptability to different play styles',
      'Tournament preparation',
    ];
    
    const recommendedStrategy = this.generateStrategy(player);
    
    const matchupAdvantages = this.playerStats
      .filter(p => p.id !== player.id)
      .map(opponent => ({
        opponentId: opponent.id,
        opponentName: opponent.name,
        advantage: (player.headToHead[opponent.id] || 0.5) - 0.5,
        reasons: this.generateMatchupReasons(player, opponent),
      }));
    
    return {
      strengths,
      weaknesses,
      improvementAreas,
      recommendedStrategy,
      matchupAdvantages,
    };
  }

  private generateStrategy(player: PlayerStats): string {
    if (player.playStyle === 'aggressive') {
      return 'Maintain aggressive play but focus on shot selection and safety when needed';
    } else if (player.playStyle === 'defensive') {
      return 'Look for opportunities to be more aggressive while maintaining defensive strengths';
    } else {
      return 'Adapt play style based on opponent and match situation';
    }
  }

  private generateMatchupReasons(player: PlayerStats, opponent: PlayerStats): string[] {
    const reasons: string[] = [];
    
    if (player.rating > opponent.rating) {
      reasons.push('Higher overall rating');
    }
    if (player.recentForm > opponent.recentForm) {
      reasons.push('Better recent form');
    }
    if (player.headToHead[opponent.id] && player.headToHead[opponent.id] > 0.6) {
      reasons.push('Strong head-to-head record');
    }
    
    return reasons;
  }

  private generatePlayerPredictions(player: PlayerStats): any {
    const nextMatchWinProbability = 0.6 + (player.rating - 8) * 0.1;
    const tournamentFinish = this.predictTournamentFinish(player);
    
    const keyMatchups = this.playerStats
      .filter(p => p.id !== player.id)
      .sort((a, b) => (b.rating - a.rating))
      .slice(0, 3)
      .map(p => p.name);
    
    return {
      nextMatchWinProbability: Math.min(0.95, Math.max(0.05, nextMatchWinProbability)),
      tournamentFinish,
      keyMatchups,
    };
  }

  public getPlayerStats(): PlayerStats[] {
    return this.playerStats;
  }

  public getMatchPredictions(): MatchPrediction[] {
    return this.matchPredictions;
  }

  public getTournamentSeedings(): TournamentSeeding[] {
    return this.tournamentSeedings;
  }

  public getAIAnalyses(): AIAnalysis[] {
    return this.aiAnalyses;
  }

  public getPlayerAnalysis(playerId: string): AIAnalysis | null {
    return this.aiAnalyses.find(analysis => analysis.playerId === playerId) || null;
  }

  public getMatchPrediction(player1Id: string, player2Id: string): MatchPrediction | null {
    return this.matchPredictions.find(
      prediction => 
        (prediction.player1Id === player1Id && prediction.player2Id === player2Id) ||
        (prediction.player1Id === player2Id && prediction.player2Id === player1Id)
    ) || null;
  }

  public subscribeToUpdates(callback: (data: any) => void): () => void {
    this.on('predictionUpdate', callback);
    return () => {
      this.off('predictionUpdate', callback);
    };
  }
}

export default TournamentPredictionService; 