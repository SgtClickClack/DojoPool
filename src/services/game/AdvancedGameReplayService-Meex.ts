import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface ReplayEvent {
  id: string;
  matchId: string;
  timestamp: Date;
  eventType: 'shot' | 'foul' | 'score' | 'turnover' | 'timeout' | 'highlight' | 'analysis';
  playerId?: string;
  playerName?: string;
  description: string;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  ballPosition?: {
    x: number;
    y: number;
    z: number;
  };
  power: number;
  accuracy: number;
  angle: number;
  spin: number;
  context: any;
  highlights: string[];
  insights: string[];
  aiAnalysis: AIAnalysis;
  tags: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIAnalysis {
  shotQuality: number;
  difficulty: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  technique: string;
  strategy: string;
  improvement: string[];
  comparison: {
    similarShots: number;
    averageAccuracy: number;
    percentile: number;
  };
  prediction: {
    successProbability: number;
    expectedOutcome: string;
    confidence: number;
  };
}

export interface ReplaySession {
  id: string;
  matchId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  events: ReplayEvent[];
  highlights: ReplayEvent[];
  analysis: ReplayAnalysis;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  comments: ReplayComment[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplayAnalysis {
  totalEvents: number;
  highlights: number;
  averageShotQuality: number;
  bestShot: ReplayEvent | null;
  worstShot: ReplayEvent | null;
  playerPerformance: Record<string, PlayerReplayStats>;
  matchSummary: string;
  keyMoments: ReplayEvent[];
  improvementAreas: string[];
  recommendations: string[];
}

export interface PlayerReplayStats {
  playerId: string;
  playerName: string;
  totalShots: number;
  successfulShots: number;
  accuracy: number;
  averagePower: number;
  averageQuality: number;
  bestShot: ReplayEvent | null;
  improvement: number;
  consistency: number;
}

export interface ReplayComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  eventId?: string;
  likes: number;
  replies: ReplayComment[];
}

export interface ReplayConfig {
  enabled: boolean;
  autoRecord: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  maxDuration: number;
  storageLimit: number;
  compressionEnabled: boolean;
  aiAnalysisEnabled: boolean;
  highlightDetection: boolean;
  autoTagging: boolean;
  publicByDefault: boolean;
  retentionDays: number;
  exportFormats: string[];
}

export interface ReplayMetrics {
  totalSessions: number;
  totalEvents: number;
  totalViews: number;
  averageSessionDuration: number;
  highlightRate: number;
  aiAnalysisAccuracy: number;
  storageUsed: number;
  popularSessions: ReplaySession[];
  recentActivity: ReplayEvent[];
}

class AdvancedGameReplayService extends BrowserEventEmitter {
  private static instance: AdvancedGameReplayService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private sessions: ReplaySession[] = [];
  private events: ReplayEvent[] = [];
  private metrics: ReplayMetrics = {
    totalSessions: 0,
    totalEvents: 0,
    totalViews: 0,
    averageSessionDuration: 0,
    highlightRate: 0,
    aiAnalysisAccuracy: 0,
    storageUsed: 0,
    popularSessions: [],
    recentActivity: []
  };

  private config: ReplayConfig = {
    enabled: true,
    autoRecord: true,
    quality: 'high',
    maxDuration: 3600, // 1 hour
    storageLimit: 10737418240, // 10GB
    compressionEnabled: true,
    aiAnalysisEnabled: true,
    highlightDetection: true,
    autoTagging: true,
    publicByDefault: false,
    retentionDays: 365,
    exportFormats: ['mp4', 'webm', 'gif', 'json']
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): AdvancedGameReplayService {
    if (!AdvancedGameReplayService.instance) {
      AdvancedGameReplayService.instance = new AdvancedGameReplayService();
    }
    return AdvancedGameReplayService.instance;
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
        this.socket?.emit('replay:join', { service: 'replay' });
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('replay:event_recorded', (event: ReplayEvent) => {
        this.addEvent(event);
      });

      this.socket.on('replay:session_created', (session: ReplaySession) => {
        this.addSession(session);
      });

    } catch (error) {
      console.error('Failed to initialize Replay WebSocket:', error);
      this._isConnected = false;
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    }
  }

  // Session Management
  public async createReplaySession(session: Omit<ReplaySession, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shares' | 'comments'>): Promise<ReplaySession> {
    const newSession: ReplaySession = {
      ...session,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
      shares: 0,
      comments: []
    };

    this.addSession(newSession);
    this.socket?.emit('replay:session_created', newSession);
    this.emit('sessionCreated', newSession);

    return newSession;
  }

  public async updateSession(sessionId: string, updates: Partial<ReplaySession>): Promise<void> {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      this.sessions[index] = { 
        ...this.sessions[index], 
        ...updates, 
        updatedAt: new Date() 
      };
      this.socket?.emit('replay:session_updated', this.sessions[index]);
      this.emit('sessionUpdated', this.sessions[index]);
    }
  }

  public getSessions(): ReplaySession[] {
    return [...this.sessions];
  }

  public getSessionById(id: string): ReplaySession | undefined {
    return this.sessions.find(s => s.id === id);
  }

  public getSessionsByMatch(matchId: string): ReplaySession[] {
    return this.sessions.filter(s => s.matchId === matchId);
  }

  public getPublicSessions(): ReplaySession[] {
    return this.sessions.filter(s => s.isPublic);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      const deletedSession = this.sessions.splice(index, 1)[0];
      this.socket?.emit('replay:session_deleted', deletedSession);
      this.emit('sessionDeleted', deletedSession);
    }
  }

  private addSession(session: ReplaySession): void {
    this.sessions.unshift(session);
    this.updateMetrics();
  }

  // Event Management
  public async recordEvent(event: Omit<ReplayEvent, 'id' | 'timestamp' | 'highlights' | 'insights' | 'aiAnalysis' | 'tags' | 'importance'>): Promise<ReplayEvent> {
    const highlights = await this.detectHighlights(event);
    const insights = await this.generateInsights(event);
    const aiAnalysis = await this.analyzeEvent(event);
    const tags = await this.generateTags(event);
    const importance = this.calculateImportance(event, aiAnalysis);

    const newEvent: ReplayEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      highlights,
      insights,
      aiAnalysis,
      tags,
      importance
    };

    this.addEvent(newEvent);
    this.socket?.emit('replay:event_recorded', newEvent);
    this.emit('eventRecorded', newEvent);

    return newEvent;
  }

  public async updateEvent(eventId: string, updates: Partial<ReplayEvent>): Promise<void> {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };
      this.socket?.emit('replay:event_updated', this.events[index]);
      this.emit('eventUpdated', this.events[index]);
    }
  }

  public getEvents(): ReplayEvent[] {
    return [...this.events];
  }

  public getEventById(id: string): ReplayEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  public getEventsBySession(sessionId: string): ReplayEvent[] {
    return this.events.filter(e => {
      const session = this.sessions.find(s => s.id === sessionId);
      return session && session.events.some(se => se.id === e.id);
    });
  }

  public getHighlights(): ReplayEvent[] {
    return this.events.filter(e => e.highlights.length > 0);
  }

  public getEventsByType(type: ReplayEvent['eventType']): ReplayEvent[] {
    return this.events.filter(e => e.eventType === type);
  }

  public getEventsByPlayer(playerId: string): ReplayEvent[] {
    return this.events.filter(e => e.playerId === playerId);
  }

  private addEvent(event: ReplayEvent): void {
    this.events.unshift(event);
    this.updateMetrics();
  }

  // AI Analysis
  private async analyzeEvent(event: any): Promise<AIAnalysis> {
    const shotQuality = this.calculateShotQuality(event);
    const difficulty = this.calculateDifficulty(event);
    const skillLevel = this.determineSkillLevel(event);
    const technique = this.identifyTechnique(event);
    const strategy = this.analyzeStrategy(event);
    const improvement = this.suggestImprovements(event);
    const comparison = this.compareToSimilar(event);
    const prediction = this.predictOutcome(event);

    return {
      shotQuality,
      difficulty,
      skillLevel,
      technique,
      strategy,
      improvement,
      comparison,
      prediction
    };
  }

  private calculateShotQuality(event: any): number {
    const baseQuality = (event.accuracy + event.power) / 2;
    const positionBonus = this.calculatePositionBonus(event.position);
    const angleBonus = this.calculateAngleBonus(event.angle);
    const spinBonus = this.calculateSpinBonus(event.spin);

    return Math.min(100, baseQuality + positionBonus + angleBonus + spinBonus);
  }

  private calculateDifficulty(event: any): number {
    const distance = this.calculateDistance(event.position);
    const angle = Math.abs(event.angle);
    const obstacles = event.context.obstacles || 0;

    return Math.min(100, (distance * 0.3) + (angle * 0.4) + (obstacles * 0.3));
  }

  private determineSkillLevel(event: any): AIAnalysis['skillLevel'] {
    const quality = this.calculateShotQuality(event);
    const difficulty = this.calculateDifficulty(event);

    if (quality >= 90 && difficulty >= 80) return 'expert';
    if (quality >= 75 && difficulty >= 60) return 'advanced';
    if (quality >= 60 && difficulty >= 40) return 'intermediate';
    return 'beginner';
  }

  private identifyTechnique(event: any): string {
    const power = event.power;
    const spin = event.spin;
    const angle = event.angle;

    if (power > 90) return 'Power Shot';
    if (spin > 80) return 'Spin Shot';
    if (Math.abs(angle) > 45) return 'Bank Shot';
    if (power < 30) return 'Soft Touch';
    return 'Standard Shot';
  }

  private analyzeStrategy(event: any): string {
    const context = event.context;
    const position = event.position;

    if (context.gameState === 'defensive') return 'Defensive positioning and safety shot';
    if (context.gameState === 'offensive') return 'Aggressive offensive play';
    if (context.scoreDifference > 5) return 'Conservative play to maintain lead';
    if (context.scoreDifference < -5) return 'High-risk high-reward strategy';
    return 'Balanced strategic approach';
  }

  private suggestImprovements(event: any): string[] {
    const improvements: string[] = [];
    const analysis = this.analyzeEvent(event);

    if (analysis.shotQuality < 70) {
      improvements.push('Focus on accuracy over power');
      improvements.push('Practice consistent stroke mechanics');
    }

    if (analysis.difficulty > 80) {
      improvements.push('Consider simpler shot selection');
      improvements.push('Work on positioning before shooting');
    }

    if (event.power > 90) {
      improvements.push('Control power for better accuracy');
    }

    if (event.accuracy < 60) {
      improvements.push('Practice aiming and alignment');
      improvements.push('Slow down and focus on form');
    }

    return improvements;
  }

  private compareToSimilar(event: any): AIAnalysis['comparison'] {
    const similarShots = this.events.filter(e => 
      e.eventType === event.eventType && 
      Math.abs(e.power - event.power) < 10 &&
      Math.abs(e.accuracy - event.accuracy) < 10
    );

    const averageAccuracy = similarShots.length > 0 
      ? similarShots.reduce((sum, e) => sum + e.accuracy, 0) / similarShots.length 
      : event.accuracy;

    const percentile = this.calculatePercentile(event.accuracy, similarShots.map(e => e.accuracy));

    return {
      similarShots: similarShots.length,
      averageAccuracy,
      percentile
    };
  }

  private predictOutcome(event: any): AIAnalysis['prediction'] {
    const quality = this.calculateShotQuality(event);
    const difficulty = this.calculateDifficulty(event);
    const successProbability = Math.max(0, Math.min(1, (quality - difficulty + 50) / 100));
    
    let expectedOutcome = 'Miss';
    if (successProbability > 0.8) expectedOutcome = 'Excellent shot';
    else if (successProbability > 0.6) expectedOutcome = 'Good shot';
    else if (successProbability > 0.4) expectedOutcome = 'Fair shot';
    else if (successProbability > 0.2) expectedOutcome = 'Poor shot';

    return {
      successProbability,
      expectedOutcome,
      confidence: Math.abs(quality - difficulty) / 100
    };
  }

  // Highlight Detection
  private async detectHighlights(event: any): Promise<string[]> {
    const highlights: string[] = [];
    
    const quality = this.calculateShotQuality(event);
    const difficulty = this.calculateDifficulty(event);

    if (quality >= 95) {
      highlights.push('Exceptional shot quality');
      highlights.push('Perfect execution');
    }

    if (difficulty >= 90 && quality >= 80) {
      highlights.push('High difficulty shot');
      highlights.push('Skill demonstration');
    }

    if (event.power >= 95) {
      highlights.push('Power shot');
      highlights.push('Impressive force');
    }

    if (event.accuracy >= 95) {
      highlights.push('Precision shot');
      highlights.push('Pinpoint accuracy');
    }

    if (event.context.gameState === 'clutch') {
      highlights.push('Clutch moment');
      highlights.push('High pressure situation');
    }

    return highlights;
  }

  private async generateInsights(event: any): Promise<string[]> {
    const insights: string[] = [];
    
    const analysis = await this.analyzeEvent(event);
    
    insights.push(`Shot quality: ${analysis.shotQuality.toFixed(1)}/100`);
    insights.push(`Difficulty level: ${analysis.difficulty.toFixed(1)}/100`);
    insights.push(`Technique: ${analysis.technique}`);
    insights.push(`Success probability: ${(analysis.prediction.successProbability * 100).toFixed(1)}%`);

    if (analysis.comparison.similarShots > 0) {
      insights.push(`Better than ${analysis.comparison.percentile.toFixed(1)}% of similar shots`);
    }

    return insights;
  }

  private async generateTags(event: any): Promise<string[]> {
    const tags: string[] = [];
    
    tags.push(event.eventType);
    tags.push(event.technique || 'standard');
    
    if (event.power > 80) tags.push('power');
    if (event.accuracy > 80) tags.push('accurate');
    if (event.spin > 70) tags.push('spin');
    if (Math.abs(event.angle) > 30) tags.push('angle');
    
    if (event.context.gameState) tags.push(event.context.gameState);
    if (event.context.obstacles > 0) tags.push('obstacle');
    
    return tags;
  }

  private calculateImportance(event: any, analysis: AIAnalysis): ReplayEvent['importance'] {
    const quality = analysis.shotQuality;
    const difficulty = analysis.difficulty;
    const probability = analysis.prediction.successProbability;

    if (quality >= 95 || (difficulty >= 90 && probability >= 0.8)) return 'critical';
    if (quality >= 85 || (difficulty >= 75 && probability >= 0.7)) return 'high';
    if (quality >= 70 || (difficulty >= 60 && probability >= 0.6)) return 'medium';
    return 'low';
  }

  // Utility Methods
  private calculatePositionBonus(position: any): number {
    const distance = this.calculateDistance(position);
    return Math.max(0, 20 - distance * 0.1);
  }

  private calculateAngleBonus(angle: number): number {
    return Math.max(0, 15 - Math.abs(angle) * 0.2);
  }

  private calculateSpinBonus(spin: number): number {
    return Math.min(10, spin * 0.1);
  }

  private calculateDistance(position: any): number {
    return Math.sqrt(position.x * position.x + position.y * position.y);
  }

  private calculatePercentile(value: number, values: number[]): number {
    if (values.length === 0) return 50;
    const sorted = values.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  }

  // Comment Management
  public async addComment(sessionId: string, comment: Omit<ReplayComment, 'id' | 'timestamp' | 'likes' | 'replies'>): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      const newComment: ReplayComment = {
        ...comment,
        id: this.generateId(),
        timestamp: new Date(),
        likes: 0,
        replies: []
      };
      
      session.comments.push(newComment);
      this.socket?.emit('replay:comment_added', { sessionId, comment: newComment });
      this.emit('commentAdded', { sessionId, comment: newComment });
    }
  }

  public getComments(sessionId: string): ReplayComment[] {
    const session = this.sessions.find(s => s.id === sessionId);
    return session ? session.comments : [];
  }

  // Configuration Management
  public getConfig(): ReplayConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<ReplayConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('replay:config_updated', this.config);
    this.emit('configUpdated', this.config);
  }

  // Metrics Management
  public getMetrics(): ReplayMetrics {
    return { ...this.metrics };
  }

  private updateMetrics(): void {
    const totalSessions = this.sessions.length;
    const totalEvents = this.events.length;
    const totalViews = this.sessions.reduce((sum, s) => sum + s.views, 0);
    const averageSessionDuration = totalSessions > 0 
      ? this.sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions 
      : 0;

    const highlightEvents = this.events.filter(e => e.highlights.length > 0);
    const highlightRate = totalEvents > 0 ? highlightEvents.length / totalEvents : 0;

    this.metrics = {
      totalSessions,
      totalEvents,
      totalViews,
      averageSessionDuration,
      highlightRate,
      aiAnalysisAccuracy: 0.92, // Mock data
      storageUsed: totalEvents * 1024, // Mock data: 1KB per event
      popularSessions: this.sessions
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
      recentActivity: this.events.slice(0, 10)
    };

    this.socket?.emit('replay:metrics_update', this.metrics);
  }

  // Export and Sharing
  public async exportSession(sessionId: string, format: string): Promise<string> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    // Mock export functionality
    const exportData = {
      session,
      events: this.getEventsBySession(sessionId),
      analysis: session.analysis,
      metadata: {
        exportedAt: new Date(),
        format,
        version: '1.0'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  public async shareSession(sessionId: string, platform: string): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.shares++;
      this.socket?.emit('replay:session_shared', { sessionId, platform });
      this.emit('sessionShared', { sessionId, platform });
    }
  }

  // Utility Methods
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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    // Mock replay sessions
    const mockSessions: ReplaySession[] = [
      {
        id: 'session1',
        matchId: 'match1',
        title: 'Championship Final Highlights',
        description: 'Best moments from the championship final match',
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 1800000),
        duration: 1800,
        events: [],
        highlights: [],
        analysis: {
          totalEvents: 45,
          highlights: 8,
          averageShotQuality: 78.5,
          bestShot: null,
          worstShot: null,
          playerPerformance: {},
          matchSummary: 'High-quality match with excellent shot making',
          keyMoments: [],
          improvementAreas: ['Consistency', 'Positioning'],
          recommendations: ['Practice bank shots', 'Improve defensive positioning']
        },
        tags: ['championship', 'final', 'highlights'],
        views: 1250,
        likes: 89,
        shares: 23,
        comments: [],
        isPublic: true,
        createdBy: 'user1',
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 3600000)
      }
    ];

    // Mock replay events
    const mockEvents: ReplayEvent[] = [
      {
        id: 'event1',
        matchId: 'match1',
        timestamp: new Date(Date.now() - 5400000),
        eventType: 'shot',
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Perfect bank shot from difficult angle',
        position: { x: 2.5, y: 1.8 },
        ballPosition: { x: 2.3, y: 1.6, z: 0.1 },
        power: 85,
        accuracy: 92,
        angle: 45,
        spin: 75,
        context: { gameState: 'offensive', scoreDifference: 2 },
        highlights: ['Perfect bank shot', 'High difficulty', 'Skill demonstration'],
        insights: ['Shot quality: 94.2/100', 'Difficulty level: 87.5/100', 'Technique: Bank Shot', 'Success probability: 89.3%'],
        aiAnalysis: {
          shotQuality: 94.2,
          difficulty: 87.5,
          skillLevel: 'expert',
          technique: 'Bank Shot',
          strategy: 'Aggressive offensive play',
          improvement: ['Maintain consistency', 'Practice similar angles'],
          comparison: { similarShots: 12, averageAccuracy: 78.3, percentile: 95.2 },
          prediction: { successProbability: 0.893, expectedOutcome: 'Excellent shot', confidence: 0.85 }
        },
        tags: ['shot', 'bank', 'power', 'accurate', 'angle', 'offensive'],
        importance: 'critical'
      }
    ];

    this.sessions = mockSessions;
    this.events = mockEvents;
    this.updateMetrics();
  }
}

export default AdvancedGameReplayService; 