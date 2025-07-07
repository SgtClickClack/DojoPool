import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface PoolGod {
  id: string;
  name: string;
  personality: string;
  commentaryStyle: string;
  specialties: string[];
  catchphrases: string[];
  blessingEffects: string[];
}

export interface AICommentaryEvent {
  id: string;
  matchId: string;
  timestamp: Date;
  eventType: 'shot' | 'foul' | 'score' | 'turnover' | 'timeout' | 'highlight' | 'analysis' | 'blessing' | 'fluke';
  playerId?: string;
  playerName?: string;
  description: string;
  commentary: string;
  poolGod?: string;
  style: string;
  confidence: number;
  context: any;
  highlights: string[];
  insights: string[];
  audioUrl?: string;
  reactions: CommentaryReaction[];
  metadata: {
    excitementLevel: number;
    difficulty: number;
    impact: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    blessingGranted?: boolean;
  };
}

export interface CommentaryReaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'dislike' | 'comment' | 'share' | 'blessing';
  content?: string;
  timestamp: Date;
}

export interface AICommentaryConfig {
  enabled: boolean;
  realTimeCommentary: boolean;
  autoCommentary: boolean;
  audioSynthesis: boolean;
  defaultStyle: string;
  commentaryDelay: number;
  maxCommentaryLength: number;
  enableReactions: boolean;
  enableHighlights: boolean;
  enableInsights: boolean;
  enableBlessings: boolean;
  poolGods: PoolGod[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface AICommentaryMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByGod: Record<string, number>;
  averageConfidence: number;
  reactionRate: number;
  highlightRate: number;
  insightRate: number;
  blessingRate: number;
  responseTime: number;
  accuracy: number;
  lastEvent: Date;
  activeMatches: number;
  popularStyles: Record<string, number>;
  audioGenerated: number;
}

class RealTimeAICommentaryService extends EventEmitter {
  private static instance: RealTimeAICommentaryService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private events: AICommentaryEvent[] = [];
  private activeMatches: Set<string> = new Set();
  private matchCommentary: Map<string, AICommentaryEvent[]> = new Map();

  private metrics: AICommentaryMetrics = {
    totalEvents: 0,
    eventsByType: {},
    eventsByGod: {},
    averageConfidence: 0,
    reactionRate: 0,
    highlightRate: 0,
    insightRate: 0,
    blessingRate: 0,
    responseTime: 0,
    accuracy: 0,
    lastEvent: new Date(),
    activeMatches: 0,
    popularStyles: {},
    audioGenerated: 0
  };

  private config: AICommentaryConfig = {
    enabled: true,
    realTimeCommentary: true,
    autoCommentary: true,
    audioSynthesis: true,
    defaultStyle: 'professional',
    commentaryDelay: 1000,
    maxCommentaryLength: 200,
    enableReactions: true,
    enableHighlights: true,
    enableInsights: true,
    enableBlessings: true,
    poolGods: [
      {
        id: 'ai-umpire',
        name: 'AI Umpire',
        personality: 'Fair, analytical, and precise',
        commentaryStyle: 'professional',
        specialties: ['rule interpretation', 'foul detection', 'fair play'],
        catchphrases: [
          'According to the rules...',
          'That\'s a clear violation!',
          'Excellent sportsmanship!',
          'The call stands!'
        ],
        blessingEffects: ['Enhanced accuracy', 'Fair play bonus', 'Rule clarity']
      },
      {
        id: 'match-commentator',
        name: 'Match Commentator',
        personality: 'Enthusiastic, knowledgeable, and engaging',
        commentaryStyle: 'enthusiastic',
        specialties: ['play-by-play', 'strategy analysis', 'player insights'],
        catchphrases: [
          'What a spectacular shot!',
          'The tension is building!',
          'This is pool at its finest!',
          'Incredible display of skill!'
        ],
        blessingEffects: ['Enhanced commentary', 'Strategic insights', 'Player motivation']
      },
      {
        id: 'fluke-god',
        name: 'God of Luck (Fluke)',
        personality: 'Playful, mysterious, and unpredictable',
        commentaryStyle: 'dramatic',
        specialties: ['lucky shots', 'unexpected outcomes', 'divine intervention'],
        catchphrases: [
          'The Fluke God smiles upon you!',
          'Sometimes luck is the best strategy!',
          'A miracle on the table!',
          'The gods have spoken!'
        ],
        blessingEffects: ['Lucky shots', 'Unexpected flukes', 'Divine favor']
      }
    ],
    notificationSettings: {
      email: true,
      sms: false,
      push: true,
      webhook: true
    }
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.setupEventListeners();
  }

  public static getInstance(): RealTimeAICommentaryService {
    if (!RealTimeAICommentaryService.instance) {
      RealTimeAICommentaryService.instance = new RealTimeAICommentaryService();
    }
    return RealTimeAICommentaryService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        console.log('AI Commentary Service connected to server');
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        console.log('AI Commentary Service disconnected from server');
        this.emit('disconnected');
        this.handleReconnection();
      });

      this.socket.on('error', (error) => {
        console.error('AI Commentary Service WebSocket error:', error);
        this.emit('error', error);
      });

      // Listen for match events
      this.socket.on('match-event', (data) => {
        this.handleMatchEvent(data);
      });

      this.socket.on('shot-detected', (data) => {
        this.handleShotEvent(data);
      });

      this.socket.on('foul-detected', (data) => {
        this.handleFoulEvent(data);
      });

      this.socket.on('score-update', (data) => {
        this.handleScoreEvent(data);
      });

      this.socket.on('game-end', (data) => {
        this.handleGameEndEvent(data);
      });

    } catch (error) {
      console.error('Failed to initialize AI Commentary Service WebSocket:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for territory gameplay events
    this.on('territory-challenge', (data) => {
      this.generateTerritoryCommentary(data);
    });

    this.on('territory-captured', (data) => {
      this.generateTerritoryCaptureCommentary(data);
    });

    this.on('trophy-minted', (data) => {
      this.generateTrophyCommentary(data);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect AI Commentary Service (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached for AI Commentary Service');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  public async handleMatchEvent(eventData: any): Promise<void> {
    if (!this.config.enabled) return;

    const startTime = Date.now();
    
    try {
      const commentary = await this.generateCommentary(eventData);
      if (commentary) {
        this.addEvent(commentary);
        this.broadcastCommentary(commentary);
        this.updateMetrics(Date.now() - startTime);
      }
    } catch (error) {
      console.error('Error handling match event:', error);
    }
  }

  public async handleShotEvent(shotData: any): Promise<void> {
    const eventData = {
      type: 'shot',
      matchId: shotData.matchId,
      playerId: shotData.playerId,
      playerName: shotData.playerName,
      shot: shotData,
      context: {
        power: shotData.power || 50,
        accuracy: shotData.accuracy || 50,
        difficulty: shotData.difficulty || 'medium',
        success: shotData.success || false,
        ballsPotted: shotData.ballsPotted || 0,
        position: shotData.position
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async handleFoulEvent(foulData: any): Promise<void> {
    const eventData = {
      type: 'foul',
      matchId: foulData.matchId,
      playerId: foulData.playerId,
      playerName: foulData.playerName,
      foul: foulData,
      context: {
        foulType: foulData.foulType,
        severity: foulData.severity || 'minor',
        penalty: foulData.penalty || 0
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async handleScoreEvent(scoreData: any): Promise<void> {
    const eventData = {
      type: 'score',
      matchId: scoreData.matchId,
      playerId: scoreData.playerId,
      playerName: scoreData.playerName,
      score: scoreData,
      context: {
        player1Score: scoreData.player1Score,
        player2Score: scoreData.player2Score,
        scoreDifference: scoreData.scoreDifference,
        gameProgress: scoreData.gameProgress
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async handleGameEndEvent(gameData: any): Promise<void> {
    const eventData = {
      type: 'game-end',
      matchId: gameData.matchId,
      playerId: gameData.winnerId,
      playerName: gameData.winnerName,
      game: gameData,
      context: {
        winner: gameData.winner,
        finalScore: gameData.finalScore,
        gameDuration: gameData.duration,
        highlights: gameData.highlights
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async generateCommentary(eventData: any): Promise<AICommentaryEvent | null> {
    const startTime = Date.now();
    
    try {
      // Select appropriate Pool God based on event type
      const poolGod = this.selectPoolGod(eventData);
      
      // Generate commentary text
      const commentaryText = await this.generateCommentaryText(eventData, poolGod);
      
      // Generate highlights and insights
      const highlights = await this.generateHighlights(eventData, poolGod);
      const insights = await this.generateInsights(eventData, poolGod);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(eventData, poolGod);
      
      // Generate audio if enabled
      let audioUrl: string | undefined;
      if (this.config.audioSynthesis) {
        audioUrl = await this.generateAudio(commentaryText, poolGod);
      }

      const commentary: AICommentaryEvent = {
        id: this.generateId(),
        matchId: eventData.matchId,
        timestamp: new Date(),
        eventType: eventData.type,
        playerId: eventData.playerId,
        playerName: eventData.playerName,
        description: eventData.description || this.generateDescription(eventData),
        commentary: commentaryText,
        poolGod: poolGod.id,
        style: poolGod.commentaryStyle,
        confidence: this.calculateConfidence(eventData),
        context: eventData.context || {},
        highlights,
        insights,
        audioUrl,
        reactions: [],
        metadata
      };

      return commentary;

    } catch (error) {
      console.error('Error generating commentary:', error);
      return null;
    }
  }

  private selectPoolGod(eventData: any): PoolGod {
    const { type } = eventData;
    
    switch (type) {
      case 'foul':
        return this.config.poolGods.find(god => god.id === 'ai-umpire')!;
      case 'fluke':
      case 'lucky-shot':
        return this.config.poolGods.find(god => god.id === 'fluke-god')!;
      case 'game-end':
      case 'highlight':
        return this.config.poolGods.find(god => god.id === 'match-commentator')!;
      default:
        // Random selection for variety
        const gods = this.config.poolGods.filter(god => god.id !== 'ai-umpire');
        return gods[Math.floor(Math.random() * gods.length)];
    }
  }

  private async generateCommentaryText(eventData: any, poolGod: PoolGod): Promise<string> {
    const { type, context } = eventData;
    
    // Get base commentary
    let baseCommentary = this.getBaseCommentary(eventData);
    
    // Apply Pool God personality
    baseCommentary = this.applyPoolGodPersonality(baseCommentary, poolGod);
    
    // Add catchphrase if appropriate
    if (Math.random() > 0.7) {
      const catchphrase = poolGod.catchphrases[Math.floor(Math.random() * poolGod.catchphrases.length)];
      baseCommentary += ` ${catchphrase}`;
    }
    
    return baseCommentary;
  }

  private getBaseCommentary(eventData: any): string {
    const { type, context } = eventData;
    
    switch (type) {
      case 'shot':
        if (context.success) {
          if (context.ballsPotted > 1) {
            return `Incredible shot! ${context.ballsPotted} balls potted in one go!`;
          } else {
            return `Excellent shot! The ball finds its mark perfectly.`;
          }
        } else {
          return `The shot goes wide, but the player shows great form.`;
        }
      
      case 'foul':
        return `A foul has been committed. The referee makes the call.`;
      
      case 'score':
        return `The score is now ${context.player1Score} to ${context.player2Score}.`;
      
      case 'game-end':
        return `Game over! ${context.winner} takes the victory!`;
      
      case 'fluke':
        return `What an unbelievable fluke! The gods must be smiling!`;
      
      default:
        return `An interesting moment in this match.`;
    }
  }

  private applyPoolGodPersonality(commentary: string, poolGod: PoolGod): string {
    switch (poolGod.id) {
      case 'ai-umpire':
        return `[AI Umpire] ${commentary}`;
      case 'match-commentator':
        return `[Commentator] ${commentary}`;
      case 'fluke-god':
        return `[Fluke God] ${commentary}`;
      default:
        return commentary;
    }
  }

  private async generateHighlights(eventData: any, poolGod: PoolGod): Promise<string[]> {
    const highlights: string[] = [];
    const { type, context } = eventData;
    
    if (context.success && type === 'shot') {
      highlights.push('Precision shot executed');
      if (context.ballsPotted > 1) {
        highlights.push('Multiple balls potted');
      }
    }
    
    if (type === 'fluke') {
      highlights.push('Divine intervention');
      highlights.push('Miraculous outcome');
    }
    
    return highlights;
  }

  private async generateInsights(eventData: any, poolGod: PoolGod): Promise<string[]> {
    const insights: string[] = [];
    const { type, context } = eventData;
    
    if (type === 'shot' && context.success) {
      insights.push('Player demonstrates excellent technique');
      if (context.difficulty === 'hard') {
        insights.push('High-difficulty shot successfully executed');
      }
    }
    
    if (type === 'foul') {
      insights.push('Player should review the rules');
    }
    
    return insights;
  }

  private calculateMetadata(eventData: any, poolGod: PoolGod): AICommentaryEvent['metadata'] {
    const { type, context } = eventData;
    
    let excitementLevel = 50;
    let difficulty = 50;
    let impact = 50;
    let rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    let blessingGranted = false;
    
    switch (type) {
      case 'shot':
        if (context.success) {
          excitementLevel = 70 + Math.random() * 30;
          difficulty = context.difficulty === 'hard' ? 80 : 60;
          impact = context.ballsPotted > 1 ? 90 : 70;
        }
        break;
      
      case 'fluke':
        excitementLevel = 90 + Math.random() * 10;
        difficulty = 100;
        impact = 100;
        rarity = 'legendary';
        blessingGranted = true;
        break;
      
      case 'game-end':
        excitementLevel = 80 + Math.random() * 20;
        impact = 100;
        rarity = 'epic';
        break;
    }
    
    return {
      excitementLevel,
      difficulty,
      impact,
      rarity,
      blessingGranted
    };
  }

  private calculateConfidence(eventData: any): number {
    const { type, context } = eventData;
    
    let confidence = 70; // Base confidence
    
    switch (type) {
      case 'shot':
        confidence = context.success ? 85 : 75;
        break;
      case 'foul':
        confidence = 95; // High confidence for fouls
        break;
      case 'score':
        confidence = 90; // High confidence for scores
        break;
      case 'fluke':
        confidence = 100; // Maximum confidence for flukes
        break;
    }
    
    return Math.min(100, confidence + Math.random() * 10);
  }

  private async generateAudio(text: string, poolGod: PoolGod): Promise<string | undefined> {
    try {
      // This would integrate with AudioCraft or similar TTS service
      // For now, return a placeholder URL
      const audioId = this.generateId();
      this.metrics.audioGenerated++;
      
      return `https://api.dojopool.com/audio/${audioId}.mp3`;
    } catch (error) {
      console.error('Error generating audio:', error);
      return undefined;
    }
  }

  private generateDescription(eventData: any): string {
    const { type, context } = eventData;
    
    switch (type) {
      case 'shot':
        return `Shot taken by ${eventData.playerName}`;
      case 'foul':
        return `Foul committed by ${eventData.playerName}`;
      case 'score':
        return `Score update in match`;
      case 'game-end':
        return `Game ended`;
      default:
        return `Event occurred`;
    }
  }

  public async generateTerritoryCommentary(territoryData: any): Promise<void> {
    const eventData = {
      type: 'territory-challenge',
      matchId: territoryData.matchId,
      playerId: territoryData.challengerId,
      playerName: territoryData.challengerName,
      context: {
        territoryName: territoryData.territoryName,
        challengeType: territoryData.challengeType,
        stakes: territoryData.stakes
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async generateTerritoryCaptureCommentary(captureData: any): Promise<void> {
    const eventData = {
      type: 'territory-captured',
      matchId: captureData.matchId,
      playerId: captureData.winnerId,
      playerName: captureData.winnerName,
      context: {
        territoryName: captureData.territoryName,
        previousOwner: captureData.previousOwner,
        victoryType: captureData.victoryType
      }
    };

    await this.handleMatchEvent(eventData);
  }

  public async generateTrophyCommentary(trophyData: any): Promise<void> {
    const eventData = {
      type: 'trophy-minted',
      matchId: trophyData.matchId,
      playerId: trophyData.playerId,
      playerName: trophyData.playerName,
      context: {
        trophyName: trophyData.trophyName,
        rarity: trophyData.rarity,
        territoryId: trophyData.territoryId
      }
    };

    await this.handleMatchEvent(eventData);
  }

  private addEvent(event: AICommentaryEvent): void {
    this.events.push(event);
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.eventType] = (this.metrics.eventsByType[event.eventType] || 0) + 1;
    if (event.poolGod) {
      this.metrics.eventsByGod[event.poolGod] = (this.metrics.eventsByGod[event.poolGod] || 0) + 1;
    }
    this.metrics.lastEvent = new Date();
    
    // Add to match-specific commentary
    if (!this.matchCommentary.has(event.matchId)) {
      this.matchCommentary.set(event.matchId, []);
    }
    this.matchCommentary.get(event.matchId)!.push(event);
    
    this.emit('commentaryGenerated', event);
  }

  private broadcastCommentary(commentary: AICommentaryEvent): void {
    if (this.socket && this._isConnected) {
      this.socket.emit('ai-commentary', commentary);
    }
  }

  private updateMetrics(responseTime: number): void {
    this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2;
    this.metrics.averageConfidence = this.events.reduce((sum, event) => sum + event.confidence, 0) / this.events.length;
  }

  public getEvents(): AICommentaryEvent[] {
    return this.events;
  }

  public getEventsByMatch(matchId: string): AICommentaryEvent[] {
    return this.matchCommentary.get(matchId) || [];
  }

  public getEventsByGod(godId: string): AICommentaryEvent[] {
    return this.events.filter(event => event.poolGod === godId);
  }

  public getPoolGods(): PoolGod[] {
    return this.config.poolGods;
  }

  public getConfig(): AICommentaryConfig {
    return this.config;
  }

  public getMetrics(): AICommentaryMetrics {
    return this.metrics;
  }

  public getConnectionStatus(): boolean {
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
    return `commentary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const realTimeAICommentaryService = RealTimeAICommentaryService.getInstance(); 