export interface MatchPrediction {
  id: string;
  matchId: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  player1WinProbability: number;
  player2WinProbability: number;
  predictedScore: {
    player1: { low: number; high: number; expected: number };
    player2: { low: number; high: number; expected: number };
  };
  confidence: number;
  factors: PredictionFactor[];
  timestamp: Date;
  expiresAt: Date;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface BettingMarket {
  id: string;
  matchId: string;
  tournamentId: string;
  totalPool: number;
  player1Bets: number;
  player2Bets: number;
  odds: {
    player1: number;
    player2: number;
  };
  status: 'open' | 'closed' | 'settled';
  createdAt: Date;
  closesAt: Date;
}

export interface Bet {
  id: string;
  userId: string;
  marketId: string;
  matchId: string;
  amount: number;
  prediction: 'player1' | 'player2';
  odds: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  transactionHash?: string;
  createdAt: Date;
  settledAt?: Date;
}

export interface PredictionModel {
  name: string;
  version: string;
  accuracy: number;
  lastUpdated: Date;
  features: string[];
  description: string;
}

export interface BettingStats {
  totalBets: number;
  totalVolume: number;
  averageBetSize: number;
  winRate: number;
  totalWinnings: number;
  activeMarkets: number;
  closedMarkets: number;
}

class TournamentPredictionService {
  private predictions: Map<string, MatchPrediction> = new Map();
  private markets: Map<string, BettingMarket> = new Map();
  private bets: Map<string, Bet> = new Map();
  private models: PredictionModel[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeModels();
    this.loadMockData();
  }

  private initializeModels(): void {
    this.models = [
      {
        name: 'DojoPool AI Predictor v2.1',
        version: '2.1.0',
        accuracy: 0.78,
        lastUpdated: new Date(),
        features: [
          'Historical win rate',
          'Recent form',
          'Head-to-head record',
          'Tournament performance',
          'Skill rating',
          'Match statistics',
          'Venue performance',
          'Time-based factors'
        ],
        description: 'Advanced AI model trained on tournament data with real-time updates'
      },
      {
        name: 'Neural Network Ensemble',
        version: '1.5.2',
        accuracy: 0.82,
        lastUpdated: new Date(),
        features: [
          'Deep learning patterns',
          'Behavioral analysis',
          'Performance trends',
          'Psychological factors',
          'Environmental conditions'
        ],
        description: 'Ensemble neural network model with behavioral analysis'
      }
    ];
  }

  private loadMockData(): void {
    // Mock predictions
    const mockPrediction: MatchPrediction = {
      id: 'pred_001',
      matchId: 'match_001',
      tournamentId: 'tournament_001',
      player1Id: 'player_001',
      player2Id: 'player_002',
      player1WinProbability: 0.65,
      player2WinProbability: 0.35,
      predictedScore: {
        player1: { low: 7, high: 9, expected: 8 },
        player2: { low: 4, high: 6, expected: 5 }
      },
      confidence: 0.78,
      factors: [
        {
          name: 'Recent Form',
          weight: 0.3,
          impact: 'positive',
          description: 'Player 1 has won 8 of last 10 matches'
        },
        {
          name: 'Head-to-Head',
          weight: 0.25,
          impact: 'positive',
          description: 'Player 1 leads 3-1 in previous encounters'
        },
        {
          name: 'Tournament Performance',
          weight: 0.2,
          impact: 'positive',
          description: 'Player 1 has higher tournament win rate'
        },
        {
          name: 'Skill Rating',
          weight: 0.15,
          impact: 'positive',
          description: 'Player 1 has 150 points higher rating'
        },
        {
          name: 'Venue Experience',
          weight: 0.1,
          impact: 'neutral',
          description: 'Both players have similar venue experience'
        }
      ],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.predictions.set(mockPrediction.id, mockPrediction);

    // Mock betting market
    const mockMarket: BettingMarket = {
      id: 'market_001',
      matchId: 'match_001',
      tournamentId: 'tournament_001',
      totalPool: 5000,
      player1Bets: 3200,
      player2Bets: 1800,
      odds: {
        player1: 1.56,
        player2: 2.78
      },
      status: 'open',
      createdAt: new Date(),
      closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    };

    this.markets.set(mockMarket.id, mockMarket);
  }

  // AI Prediction Methods
  async generateMatchPrediction(matchId: string, player1Id: string, player2Id: string): Promise<MatchPrediction> {
    // Simulate AI prediction generation
    const prediction: MatchPrediction = {
      id: `pred_${Date.now()}`,
      matchId,
      tournamentId: 'tournament_001',
      player1Id,
      player2Id,
      player1WinProbability: Math.random() * 0.4 + 0.3, // 30-70% range
      player2WinProbability: 0,
      predictedScore: {
        player1: { low: 5, high: 9, expected: 7 },
        player2: { low: 4, high: 8, expected: 6 }
      },
      confidence: Math.random() * 0.3 + 0.6, // 60-90% confidence
      factors: this.generatePredictionFactors(),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    prediction.player2WinProbability = 1 - prediction.player1WinProbability;

    this.predictions.set(prediction.id, prediction);
    this.publish('prediction_generated', prediction);

    return prediction;
  }

  private generatePredictionFactors(): PredictionFactor[] {
    const factorTypes = [
      { name: 'Recent Form', impact: 'positive' as const },
      { name: 'Head-to-Head Record', impact: 'positive' as const },
      { name: 'Tournament Performance', impact: 'positive' as const },
      { name: 'Skill Rating', impact: 'positive' as const },
      { name: 'Venue Experience', impact: 'neutral' as const },
      { name: 'Match Statistics', impact: 'positive' as const },
      { name: 'Psychological Factors', impact: 'negative' as const },
      { name: 'Environmental Conditions', impact: 'neutral' as const }
    ];

    return factorTypes.map(factor => ({
      name: factor.name,
      weight: Math.random() * 0.3 + 0.1, // 10-40% weight
      impact: factor.impact,
      description: `AI analysis of ${factor.name.toLowerCase()}`
    }));
  }

  async getMatchPrediction(matchId: string): Promise<MatchPrediction | null> {
    const prediction = Array.from(this.predictions.values()).find(p => p.matchId === matchId);
    return prediction || null;
  }

  async updatePrediction(predictionId: string, updates: Partial<MatchPrediction>): Promise<MatchPrediction | null> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) return null;

    const updatedPrediction = { ...prediction, ...updates, lastUpdated: new Date() };
    this.predictions.set(predictionId, updatedPrediction);
    this.publish('prediction_updated', updatedPrediction);

    return updatedPrediction;
  }

  // Betting Market Methods
  async createBettingMarket(matchId: string, tournamentId: string): Promise<BettingMarket> {
    const prediction = await this.getMatchPrediction(matchId);
    if (!prediction) {
      throw new Error('No prediction available for this match');
    }

    const market: BettingMarket = {
      id: `market_${Date.now()}`,
      matchId,
      tournamentId,
      totalPool: 0,
      player1Bets: 0,
      player2Bets: 0,
      odds: this.calculateInitialOdds(prediction),
      status: 'open',
      createdAt: new Date(),
      closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    };

    this.markets.set(market.id, market);
    this.publish('market_created', market);

    return market;
  }

  private calculateInitialOdds(prediction: MatchPrediction): { player1: number; player2: number } {
    const margin = 0.05; // 5% house margin
    const player1Odds = (1 / prediction.player1WinProbability) * (1 - margin);
    const player2Odds = (1 / prediction.player2WinProbability) * (1 - margin);

    return {
      player1: Math.round(player1Odds * 100) / 100,
      player2: Math.round(player2Odds * 100) / 100
    };
  }

  async placeBet(
    userId: string,
    marketId: string,
    amount: number,
    prediction: 'player1' | 'player2'
  ): Promise<Bet> {
    const market = this.markets.get(marketId);
    if (!market || market.status !== 'open') {
      throw new Error('Market not available for betting');
    }

    if (amount <= 0) {
      throw new Error('Bet amount must be positive');
    }

    // Simulate blockchain transaction
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    const bet: Bet = {
      id: `bet_${Date.now()}`,
      userId,
      marketId,
      matchId: market.matchId,
      amount,
      prediction,
      odds: prediction === 'player1' ? market.odds.player1 : market.odds.player2,
      potentialWinnings: amount * (prediction === 'player1' ? market.odds.player1 : market.odds.player2),
      status: 'pending',
      transactionHash,
      createdAt: new Date()
    };

    this.bets.set(bet.id, bet);

    // Update market
    if (prediction === 'player1') {
      market.player1Bets += amount;
    } else {
      market.player2Bets += amount;
    }
    market.totalPool += amount;

    // Recalculate odds
    market.odds = this.recalculateOdds(market);

    this.publish('bet_placed', bet);
    this.publish('market_updated', market);

    return bet;
  }

  private recalculateOdds(market: BettingMarket): { player1: number; player2: number } {
    const margin = 0.05; // 5% house margin
    const totalBets = market.player1Bets + market.player2Bets;

    if (totalBets === 0) {
      return { player1: 2.0, player2: 2.0 };
    }

    const player1Probability = market.player1Bets / totalBets;
    const player2Probability = market.player2Bets / totalBets;

    return {
      player1: Math.round((1 / player1Probability) * (1 - margin) * 100) / 100,
      player2: Math.round((1 / player2Probability) * (1 - margin) * 100) / 100
    };
  }

  async settleBet(betId: string, winner: 'player1' | 'player2'): Promise<Bet | null> {
    const bet = this.bets.get(betId);
    if (!bet) return null;

    const won = bet.prediction === winner;
    bet.status = won ? 'won' : 'lost';
    bet.settledAt = new Date();

    this.bets.set(betId, bet);
    this.publish('bet_settled', bet);

    return bet;
  }

  async getBettingStats(): Promise<BettingStats> {
    const allBets = Array.from(this.bets.values());
    const wonBets = allBets.filter(bet => bet.status === 'won');
    const activeMarkets = Array.from(this.markets.values()).filter(market => market.status === 'open');
    const closedMarkets = Array.from(this.markets.values()).filter(market => market.status === 'closed');

    return {
      totalBets: allBets.length,
      totalVolume: allBets.reduce((sum, bet) => sum + bet.amount, 0),
      averageBetSize: allBets.length > 0 ? allBets.reduce((sum, bet) => sum + bet.amount, 0) / allBets.length : 0,
      winRate: allBets.length > 0 ? wonBets.length / allBets.length : 0,
      totalWinnings: wonBets.reduce((sum, bet) => sum + bet.potentialWinnings, 0),
      activeMarkets: activeMarkets.length,
      closedMarkets: closedMarkets.length
    };
  }

  // Model Management
  getPredictionModels(): PredictionModel[] {
    return [...this.models];
  }

  async updateModelAccuracy(modelName: string, newAccuracy: number): Promise<void> {
    const model = this.models.find(m => m.name === modelName);
    if (model) {
      model.accuracy = newAccuracy;
      model.lastUpdated = new Date();
      this.publish('model_updated', model);
    }
  }

  // Data Access Methods
  getPredictions(): MatchPrediction[] {
    return Array.from(this.predictions.values());
  }

  getMarkets(): BettingMarket[] {
    return Array.from(this.markets.values());
  }

  getBets(): Bet[] {
    return Array.from(this.bets.values());
  }

  getUserBets(userId: string): Bet[] {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  getMarketBets(marketId: string): Bet[] {
    return Array.from(this.bets.values()).filter(bet => bet.marketId === marketId);
  }

  // Subscription System
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  private publish(event: string, data: any): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in prediction service subscriber callback:', error);
        }
      });
    }
  }

  // Utility Methods
  calculateExpectedValue(bet: Bet, winProbability: number): number {
    const winAmount = bet.potentialWinnings - bet.amount;
    const loseAmount = -bet.amount;
    return (winAmount * winProbability) + (loseAmount * (1 - winProbability));
  }

  getRiskLevel(bet: Bet, prediction: MatchPrediction): 'low' | 'medium' | 'high' {
    const expectedValue = this.calculateExpectedValue(bet, 
      bet.prediction === 'player1' ? prediction.player1WinProbability : prediction.player2WinProbability
    );
    
    if (expectedValue > 0.1 * bet.amount) return 'low';
    if (expectedValue > -0.1 * bet.amount) return 'medium';
    return 'high';
  }
}

export const tournamentPredictionService = new TournamentPredictionService();
export default tournamentPredictionService; 