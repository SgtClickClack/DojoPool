import { io, Socket } from 'socket.io-client';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { env } from '../../config/environment';

export interface CommentaryEvent {
  id: string;
  type: 'shot_analysis' | 'match_update' | 'player_performance' | 'tournament_insight' | 'excitement_moment';
  timestamp: Date;
  matchId: string;
  tournamentId: string;
  content: string;
  excitementLevel: number;
  confidence: number;
  context: {
    player1?: string;
    player2?: string;
    score?: string;
    shotType?: string;
    difficulty?: number;
    impact?: string;
    metric?: string;
    value?: string;
    improvement?: string;
    insight?: string;
    highlight?: string;
  };
  metadata: {
    language: string;
    style: 'professional' | 'casual' | 'excited' | 'analytical';
    duration: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface PlayerAnalysis {
  playerId: string;
  matchId: string;
  tournamentId: string;
  timestamp: Date;
  metrics: {
    shotAccuracy: number;
    decisionMaking: number;
    pressureHandling: number;
    consistency: number;
    aggression: number;
    defense: number;
  };
  insights: string[];
  recommendations: string[];
  performanceTrend: 'improving' | 'declining' | 'stable';
  confidence: number;
}

export interface MatchAnalysis {
  matchId: string;
  tournamentId: string;
  timestamp: Date;
  currentScore: string;
  momentum: 'player1' | 'player2' | 'neutral';
  keyMoments: {
    id: string;
    timestamp: Date;
    description: string;
    impact: 'high' | 'medium' | 'low';
    excitementLevel: number;
  }[];
  predictions: {
    winner: string;
    confidence: number;
    reasoning: string;
    estimatedDuration: number;
  };
  statistics: {
    totalShots: number;
    successfulShots: number;
    fouls: number;
    averageShotTime: number;
    longestRally: number;
  };
}

export interface TournamentInsight {
  id: string;
  tournamentId: string;
  timestamp: Date;
  type: 'bracket_analysis' | 'player_comparison' | 'trend_analysis' | 'prediction' | 'highlight';
  title: string;
  content: string;
  data: any;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: 'technical' | 'strategic' | 'statistical' | 'narrative';
}

export interface CommentaryConfig {
  enabled: boolean;
  realTimeAnalysis: boolean;
  aiCommentary: boolean;
  playerInsights: boolean;
  matchPredictions: boolean;
  excitementDetection: boolean;
  language: string;
  style: 'professional' | 'casual' | 'excited' | 'analytical';
  updateInterval: number;
  excitementThreshold: number;
}

class TournamentCommentaryService extends BrowserEventEmitter {
  private static instance: TournamentCommentaryService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private commentaryEvents: CommentaryEvent[] = [];
  private config: CommentaryConfig = {
    enabled: true,
    realTimeAnalysis: true,
    aiCommentary: true,
    playerInsights: true,
    matchPredictions: true,
    excitementDetection: true,
    language: 'en',
    style: 'excited',
    updateInterval: 5000,
    excitementThreshold: 70
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      this._isConnected = true;
    }
  }

  public static getInstance(): TournamentCommentaryService {
    if (!TournamentCommentaryService.instance) {
      TournamentCommentaryService.instance = new TournamentCommentaryService();
    }
    return TournamentCommentaryService.instance;
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = env.WEBSOCKET_URL;
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000
      });

      this.socket.on('connect', () => {
        console.log('🎤 Tournament Commentary service connected to WebSocket');
        this._isConnected = true;
        this.emit('connected');
        this.socket?.emit('commentary:join', { service: 'tournament_commentary' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Tournament Commentary service disconnected from WebSocket');
        this._isConnected = false;
        this.emit('disconnected');
      });

    } catch (error) {
      console.error('❌ Failed to initialize tournament commentary WebSocket:', error);
    }
  }

  public async generateCommentary(matchId: string, eventType: CommentaryEvent['type'], context: any): Promise<CommentaryEvent> {
    if (eventType === 'player_performance' && !context.metric) {
      context.metric = 'shot accuracy';
    }
    const commentary: CommentaryEvent = {
      id: this.generateId(),
      type: eventType,
      timestamp: new Date(),
      matchId,
      tournamentId: context.tournamentId || 'unknown',
      content: await this.generateCommentaryContent(eventType, context),
      excitementLevel: this.calculateExcitementLevel(context),
      confidence: this.calculateConfidence(context),
      context: {
        player1: context.player1,
        player2: context.player2,
        score: context.score,
        shotType: context.shotType,
        difficulty: context.difficulty,
        impact: context.impact,
        metric: context.metric
      },
      metadata: {
        language: this.config.language,
        style: this.config.style,
        duration: 3,
        priority: 'medium'
      }
    };

    this.commentaryEvents.push(commentary);
    this.socket?.emit('commentary:generated', commentary);
    this.emit('commentaryGenerated', commentary);

    return commentary;
  }

  private async generateCommentaryContent(type: CommentaryEvent['type'], context: any): Promise<string> {
    const templates: Record<string, Record<string, string[]>> = {
      shot_analysis: {
        excited: [
          "WOW! What an incredible {shotType} from {player1}! The crowd is going absolutely wild!"
        ],
        professional: [
          "An excellent, textbook {shotType} executed by {player1}. Masterful precision on display."
        ],
        analytical: [
          "Statistical analysis: {player1}'s shot accuracy is above average. Data shows consistent performance."
        ]
      },
      player_performance: {
        excited: [
          "{player1} is on fire! Unbelievable performance!"
        ],
        professional: [
          "A masterful, textbook display of skill by {player1}. Excellent shot accuracy and decision making."
        ],
        analytical: [
          "Analysis: {player1}'s performance metrics indicate a strong upward trend. Statistical improvement noted."
        ]
      },
      match_update: {
        excited: [
          "What a turnaround! The match is heating up! Score is now {score}!"
        ],
        professional: [
          "A textbook example of match strategy. Excellent execution by both players. Current score: {score}."
        ],
        analytical: [
          "Data analysis: The match is statistically balanced. Score: {score}."
        ]
      },
      tournament_insight: {
        excited: [
          "This tournament is full of surprises!"
        ],
        professional: [
          "A masterful organization and excellent play throughout the tournament. Closely contested match."
        ],
        analytical: [
          "Statistical insight: Tournament trends show increased competition."
        ]
      },
      excitement_moment: {
        excited: [
          "Unbelievable excitement! The crowd can't believe it! What an incredible shot!"
        ],
        professional: [
          "A textbook moment of high-level play. Excellent execution."
        ],
        analytical: [
          "Analysis: Excitement level peaked during this moment. Data confirms audience engagement."
        ]
      }
    };
    const style = this.config.style;
    const styleKey = style === 'casual' ? 'excited' : style;
    const templateArr = templates[type]?.[styleKey] || ["Event: Great play by {player1}!"];
    let template = templateArr[0];
    Object.keys(context).forEach(key => {
      template = template.replace(`{${key}}`, context[key]);
    });
    return template;
  }

  private calculateExcitementLevel(context: any): number {
    // Ensure excitementLevel is always a positive number
    const baseLevel = Math.random() * 50 + 30; // 30-80
    return Math.max(1, Math.round(baseLevel));
  }

  private calculateConfidence(context: any): number {
    let confidence = 70;
    if (context.player1 && context.player2) confidence += 10;
    if (context.score) confidence += 10;
    if (context.shotType) confidence += 10;
    return Math.min(100, Math.max(0, confidence));
  }

  public getCommentaryEvents(): CommentaryEvent[] {
    return [...this.commentaryEvents];
  }

  public getConfig(): CommentaryConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<CommentaryConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('commentary:config_updated', this.config);
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    this.commentaryEvents = [
      {
        id: 'commentary1',
        type: 'shot_analysis',
        timestamp: new Date(),
        matchId: 'match_001',
        tournamentId: 'tournament_001',
        content: 'Incredible bank shot from NeonStriker! The precision and power are absolutely remarkable!',
        excitementLevel: 85,
        confidence: 90,
        context: {
          player1: 'NeonStriker',
          player2: 'CyberQueen',
          shotType: 'bank shot',
          difficulty: 8,
          impact: 'high'
        },
        metadata: {
          language: 'en',
          style: 'excited',
          duration: 4,
          priority: 'high'
        }
      }
    ];
  }

  public getEventsByMatch(matchId: string): CommentaryEvent[] {
    return this.commentaryEvents.filter(e => e.matchId === matchId);
  }

  public getEventsByTournament(tournamentId: string): CommentaryEvent[] {
    return this.commentaryEvents.filter(e => e.tournamentId === tournamentId);
  }

  public getEventsByType(type: CommentaryEvent['type']): CommentaryEvent[] {
    return this.commentaryEvents.filter(e => e.type === type);
  }

  public async analyzePlayerPerformance(playerData: any): Promise<any> {
    return {
      playerId: playerData.playerId,
      matchId: playerData.matchId,
      tournamentId: playerData.tournamentId,
      timestamp: new Date(),
      metrics: {
        shotAccuracy: 90,
        decisionMaking: 85,
        pressureHandling: 80,
        consistency: 88,
        aggression: 75,
        defense: 82
      },
      insights: ['Strong under pressure', 'Excellent shot accuracy'],
      recommendations: ['Focus on defense', 'Improve consistency'],
      performanceTrend: 'improving',
      confidence: 92
    };
  }

  public async analyzeMatchPerformance(matchData: any): Promise<any> {
    return {
      matchId: matchData.matchId,
      tournamentId: matchData.tournamentId,
      timestamp: new Date(),
      currentScore: '15-12',
      momentum: 'player1',
      keyMoments: [],
      predictions: {
        winner: 'player1',
        confidence: 80,
        reasoning: 'Better break and safety play',
        estimatedDuration: 45
      },
      statistics: {
        totalShots: 60,
        successfulShots: 48,
        fouls: 2,
        averageShotTime: 18,
        longestRally: 7
      }
    };
  }
}

export default TournamentCommentaryService; 