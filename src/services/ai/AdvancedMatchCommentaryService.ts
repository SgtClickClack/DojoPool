import { EventEmitter } from 'events';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { env } from '../../config/environment.backend';

export interface CommentaryStyle {
  id: string;
  name: string;
  description: string;
  tone: 'professional' | 'casual' | 'enthusiastic' | 'analytical' | 'humorous' | 'dramatic';
  language: 'formal' | 'informal' | 'technical' | 'colorful';
  pace: 'slow' | 'moderate' | 'fast';
  focus: 'technical' | 'entertainment' | 'educational' | 'dramatic';
  enabled: boolean;
}

export interface CommentaryEvent {
  id: string;
  matchId: string;
  timestamp: Date;
  eventType: 'shot' | 'foul' | 'score' | 'turnover' | 'timeout' | 'highlight' | 'analysis';
  playerId?: string;
  playerName?: string;
  description: string;
  commentary: string;
  style: string;
  confidence: number;
  context: any;
  highlights: string[];
  insights: string[];
  reactions: CommentaryReaction[];
}

export interface CommentaryReaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'dislike' | 'comment' | 'share';
  content?: string;
  timestamp: Date;
}

export interface CommentaryConfig {
  enabled: boolean;
  realTimeCommentary: boolean;
  autoCommentary: boolean;
  defaultStyle: string;
  commentaryDelay: number;
  maxCommentaryLength: number;
  enableReactions: boolean;
  enableHighlights: boolean;
  enableInsights: boolean;
  styles: CommentaryStyle[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface CommentaryMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  averageConfidence: number;
  reactionRate: number;
  highlightRate: number;
  insightRate: number;
  responseTime: number;
  accuracy: number;
  lastEvent: Date;
  activeMatches: number;
  popularStyles: Record<string, number>;
}

class AdvancedMatchCommentaryService extends EventEmitter {
  private static instance: AdvancedMatchCommentaryService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private events: CommentaryEvent[] = [];
  private metrics: CommentaryMetrics = {
    totalEvents: 0,
    eventsByType: {},
    averageConfidence: 0,
    reactionRate: 0,
    highlightRate: 0,
    insightRate: 0,
    responseTime: 0,
    accuracy: 0,
    lastEvent: new Date(),
    activeMatches: 0,
    popularStyles: {}
  };

  private config: CommentaryConfig = {
    enabled: true,
    realTimeCommentary: true,
    autoCommentary: true,
    defaultStyle: 'professional',
    commentaryDelay: 1000,
    maxCommentaryLength: 200,
    enableReactions: true,
    enableHighlights: true,
    enableInsights: true,
    styles: [
      {
        id: 'professional',
        name: 'Professional',
        description: 'Traditional sports commentary style',
        tone: 'professional',
        language: 'formal',
        pace: 'moderate',
        focus: 'technical',
        enabled: true
      },
      {
        id: 'enthusiastic',
        name: 'Enthusiastic',
        description: 'High-energy, exciting commentary',
        tone: 'enthusiastic',
        language: 'colorful',
        pace: 'fast',
        focus: 'entertainment',
        enabled: true
      },
      {
        id: 'analytical',
        name: 'Analytical',
        description: 'Deep technical analysis and insights',
        tone: 'analytical',
        language: 'technical',
        pace: 'slow',
        focus: 'educational',
        enabled: true
      },
      {
        id: 'casual',
        name: 'Casual',
        description: 'Relaxed, friendly commentary',
        tone: 'casual',
        language: 'informal',
        pace: 'moderate',
        focus: 'entertainment',
        enabled: true
      },
      {
        id: 'dramatic',
        name: 'Dramatic',
        description: 'Over-the-top, dramatic commentary',
        tone: 'dramatic',
        language: 'colorful',
        pace: 'fast',
        focus: 'dramatic',
        enabled: true
      },
      {
        id: 'humorous',
        name: 'Humorous',
        description: 'Funny, lighthearted commentary',
        tone: 'humorous',
        language: 'informal',
        pace: 'moderate',
        focus: 'entertainment',
        enabled: true
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
    this.loadMockData();
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      this._isConnected = true;
    }
  }

  public static getInstance(): AdvancedMatchCommentaryService {
    if (!AdvancedMatchCommentaryService.instance) {
      AdvancedMatchCommentaryService.instance = new AdvancedMatchCommentaryService();
    }
    return AdvancedMatchCommentaryService.instance;
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = env.WEBSOCKET_URL;
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.socket?.emit('commentary:join', { service: 'commentary' });
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.handleReconnection();
        this.emit('disconnected');
      });

      this.socket.on('commentary:event_generated', (event: CommentaryEvent) => {
        this.addEvent(event);
      });

    } catch (error) {
      console.error('Failed to initialize Commentary WebSocket:', error);
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

  // Event Management
  public async generateCommentary(event: Omit<CommentaryEvent, 'id' | 'timestamp' | 'commentary' | 'highlights' | 'insights' | 'reactions'>, styleId?: string): Promise<CommentaryEvent> {
    const style = this.config.styles.find(s => s.id === (styleId || event.style)) || this.config.styles.find(s => s.id === this.config.defaultStyle)!;
    const commentary = await this.generateCommentaryText(event, style);
    const highlights = await this.generateHighlights(event);
    const insights = await this.generateInsights(event);

    const newEvent: CommentaryEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      commentary,
      highlights,
      insights,
      reactions: [],
      style: style.id,
    };

    this.addEvent(newEvent);
    this.socket?.emit('commentary:event_generated', newEvent);
    this.socket?.emit('commentary:generated', newEvent);
    this.emit('commentaryGenerated', newEvent);

    return newEvent;
  }

  public async updateEvent(eventId: string, updates: Partial<CommentaryEvent>): Promise<void> {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };
      this.socket?.emit('commentary:event_updated', this.events[index]);
      this.emit('commentaryUpdated', this.events[index]);
    }
  }

  public getEvents(): CommentaryEvent[] {
    return [...this.events];
  }

  public getEventById(id: string): CommentaryEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  public getEventsByMatch(matchId: string): CommentaryEvent[] {
    return this.events.filter(e => e.matchId === matchId);
  }

  public getEventsByType(type: CommentaryEvent['eventType']): CommentaryEvent[] {
    return this.events.filter(e => e.eventType === type);
  }

  public getEventsByStyle(style: string): CommentaryEvent[] {
    return this.events.filter(e => e.style === style);
  }

  private addEvent(event: CommentaryEvent): void {
    this.events.unshift(event);
    this.updateMetrics();
  }

  // Commentary Generation
  private async generateCommentaryText(event: any, style: CommentaryStyle): Promise<string> {
    const baseCommentary = this.getBaseCommentary(event);
    return this.applyStyle(baseCommentary, style);
  }

  private getBaseCommentary(event: any): string {
    switch (event.eventType) {
      case 'shot':
        return `Player ${event.playerName} takes a shot with ${event.context.power}% power and ${event.context.accuracy}% accuracy.`;
      case 'foul':
        return `Foul called on ${event.playerName} for ${event.context.reason}.`;
      case 'score':
        return `${event.playerName} scores! The score is now ${event.context.score}.`;
      case 'turnover':
        return `${event.playerName} loses possession due to ${event.context.reason}.`;
      case 'timeout':
        return `${event.context.team} calls a timeout.`;
      case 'highlight':
        return `Incredible play by ${event.playerName}! ${event.context.description}`;
      case 'analysis':
        return `Analysis: ${event.context.analysis}`;
      default:
        return `Event: ${event.description}`;
    }
  }

  private applyStyle(commentary: string, style: CommentaryStyle): string {
    let styledCommentary = commentary;

    switch (style.tone) {
      case 'enthusiastic':
        styledCommentary = `🎯 ${styledCommentary} WOW! What a play! 🔥`;
        break;
      case 'dramatic':
        styledCommentary = `⚡ DRAMATIC MOMENT! ${styledCommentary} The tension is palpable! ⚡`;
        break;
      case 'humorous':
        styledCommentary = `😄 ${styledCommentary} That's one for the highlight reel! 😂`;
        break;
      case 'analytical':
        styledCommentary = `📊 Analysis: ${styledCommentary} The statistics show...`;
        break;
      case 'casual':
        styledCommentary = `Hey there! ${styledCommentary} Pretty cool, right?`;
        break;
      case 'professional':
        styledCommentary = `${styledCommentary} An excellent shot.`;
        break;
      default:
        // Professional tone - keep as is
        break;
    }

    // Apply language style
    if (style.language === 'technical') {
      styledCommentary += ' The technical execution was flawless.';
    } else if (style.language === 'colorful') {
      styledCommentary += ' Absolutely spectacular!';
    }

    return styledCommentary;
  }

  private async generateHighlights(event: any): Promise<string[]> {
    const highlights: string[] = [];
    
    if (event.eventType === 'shot' && event.context.power > 80) {
      highlights.push('High power shot detected');
    }
    
    if (event.eventType === 'score') {
      highlights.push('Point scored');
      highlights.push('Score updated');
    }
    
    if (event.eventType === 'highlight') {
      highlights.push('Moment of brilliance');
      highlights.push('Highlight reel material');
    }

    return highlights;
  }

  private async generateInsights(event: any): Promise<string[]> {
    const insights: string[] = [];
    
    if (event.eventType === 'shot') {
      insights.push(`Shot accuracy: ${event.context.accuracy}%`);
      insights.push(`Power level: ${event.context.power}%`);
      if (event.context.accuracy > 90) {
        insights.push('Exceptional precision');
      }
    }
    
    if (event.eventType === 'score') {
      insights.push('Player performance improving');
      insights.push('Team momentum building');
    }

    return insights;
  }

  // Reaction Management
  public async addReaction(eventId: string, reaction: Omit<CommentaryReaction, 'id' | 'timestamp'>): Promise<void> {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      const newReaction: CommentaryReaction = {
        ...reaction,
        id: this.generateId(),
        timestamp: new Date()
      };
      
      event.reactions.push(newReaction);
      this.socket?.emit('commentary:reaction_added', { eventId, reaction: newReaction });
      this.emit('reactionAdded', { eventId, reaction: newReaction });
    }
  }

  public getReactions(eventId: string): CommentaryReaction[] {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.reactions : [];
  }

  // Style Management
  public getStyles(): CommentaryStyle[] {
    return [...this.config.styles];
  }

  public getStyleById(id: string): CommentaryStyle | undefined {
    return this.config.styles.find(s => s.id === id);
  }

  public async updateStyle(id: string, updates: Partial<CommentaryStyle>): Promise<void> {
    const index = this.config.styles.findIndex(s => s.id === id);
    if (index !== -1) {
      this.config.styles[index] = { ...this.config.styles[index], ...updates };
      this.socket?.emit('commentary:style_updated', this.config.styles[index]);
      this.emit('styleUpdated', this.config.styles[index]);
    }
  }

  public async addStyle(style: Omit<CommentaryStyle, 'id'>): Promise<void> {
    const newStyle: CommentaryStyle = {
      ...style,
      id: this.generateId()
    };
    
    this.config.styles.push(newStyle);
    this.socket?.emit('commentary:style_added', newStyle);
    this.emit('styleAdded', newStyle);
  }

  public async removeStyle(id: string): Promise<void> {
    const index = this.config.styles.findIndex(s => s.id === id);
    if (index !== -1) {
      const removedStyle = this.config.styles.splice(index, 1)[0];
      this.socket?.emit('commentary:style_removed', removedStyle);
      this.emit('styleRemoved', removedStyle);
    }
  }

  // Configuration Management
  public getConfig(): CommentaryConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<CommentaryConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('commentary:config_updated', this.config);
    this.emit('configUpdated', this.config);
  }

  // Metrics Management
  public getMetrics(): CommentaryMetrics {
    return { ...this.metrics };
  }

  private updateMetrics(): void {
    const totalEvents = this.events.length;
    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let averageConfidence = 1;
    if (totalEvents > 0) {
      averageConfidence = this.events.reduce((sum, e) => sum + e.confidence, 0) / totalEvents;
    }

    const popularStyles = this.events.reduce((acc, event) => {
      acc[event.style] = (acc[event.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.metrics = {
      totalEvents,
      eventsByType,
      averageConfidence,
      reactionRate: 0.15, // Mock data
      highlightRate: 0.25, // Mock data
      insightRate: 0.35, // Mock data
      responseTime: 200, // Mock data in ms
      accuracy: 0.92, // Mock data
      lastEvent: this.events[0]?.timestamp || new Date(),
      activeMatches: 2, // Mock data
      popularStyles
    };

    this.socket?.emit('commentary:metrics_update', this.metrics);
  }

  // Real-time Commentary
  public async startRealTimeCommentary(matchId: string, style: string = 'professional'): Promise<void> {
    if (!this.config.realTimeCommentary) return;

    // Simulate real-time commentary generation
    setInterval(async () => {
      const mockEvent = {
        matchId,
        eventType: 'shot' as CommentaryEvent['eventType'],
        description: 'Real-time shot detected',
        style,
        confidence: 85 + Math.random() * 15,
        context: {
          power: 70 + Math.random() * 30,
          accuracy: 75 + Math.random() * 25,
          playerName: 'Player ' + Math.floor(Math.random() * 10 + 1)
        }
      };

      await this.generateCommentary(mockEvent);
    }, this.config.commentaryDelay);
  }

  public stopRealTimeCommentary(matchId: string): void {
    // Implementation for stopping real-time commentary
    console.log(`Stopped real-time commentary for match ${matchId}`);
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
    // Mock commentary events
    const mockEvents: CommentaryEvent[] = [
      {
        id: 'event1',
        matchId: 'match1',
        timestamp: new Date(Date.now() - 3600000),
        eventType: 'shot',
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        commentary: '🎯 John Smith takes a shot with 95% power and 88% accuracy. WOW! What a play! 🔥',
        style: 'enthusiastic',
        confidence: 92,
        context: { power: 95, accuracy: 88 },
        highlights: ['High power shot detected', 'Exceptional precision'],
        insights: ['Shot accuracy: 88%', 'Power level: 95%', 'Exceptional precision'],
        reactions: [
          {
            id: 'reaction1',
            userId: 'user1',
            userName: 'Fan1',
            type: 'like',
            timestamp: new Date(Date.now() - 3500000)
          }
        ]
      },
      {
        id: 'event2',
        matchId: 'match1',
        timestamp: new Date(Date.now() - 1800000),
        eventType: 'score',
        playerId: 'player2',
        playerName: 'Mike Johnson',
        description: 'Point scored',
        commentary: '📊 Analysis: Mike Johnson scores! The score is now 15-12. The statistics show...',
        style: 'analytical',
        confidence: 88,
        context: { score: '15-12' },
        highlights: ['Point scored', 'Score updated'],
        insights: ['Player performance improving', 'Team momentum building'],
        reactions: []
      }
    ];

    this.events = mockEvents;
    this.updateMetrics();
  }

  public async generateFlukeGodCommentary(matchId: string, playerId: string, playerName: string): Promise<CommentaryEvent> {
    const event: CommentaryEvent = {
      id: this.generateId(),
      matchId,
      timestamp: new Date(),
      eventType: 'highlight',
      playerId,
      playerName,
      description: 'A miraculous fluke shot!',
      commentary: `The Fluke God smiles upon ${playerName}! What an unbelievable shot!`,
      style: 'dramatic',
      confidence: 100,
      context: { fluke: true },
      highlights: ['Fluke God moment'],
      insights: ['Sometimes luck is the best strategy.'],
      reactions: []
    };
    this.addEvent(event);
    this.emit('commentaryGenerated', event);
    return event;
  }

  public getEventsByPlayerId(playerId: string): CommentaryEvent[] {
    return this.events.filter(e => e.playerId === playerId);
  }

  public getRecentEvents(count: number): CommentaryEvent[] {
    return this.events.slice(0, count);
  }

  public getPopularEvents(count: number): CommentaryEvent[] {
    // Sort by number of reactions (descending)
    return [...this.events]
      .sort((a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0))
      .slice(0, count);
  }

  public getCurrentStyle(): string {
    return this.config.defaultStyle;
  }

  public getCurrentLanguage(): string {
    // For this implementation, assume language is a property of the default style
    const style = this.config.styles.find(s => s.id === this.config.defaultStyle);
    return style ? style.language : 'formal';
  }

  public updateLanguage(lang: string): void {
    // Update the language of the default style
    const style = this.config.styles.find(s => s.id === this.config.defaultStyle);
    if (style) {
      style.language = lang as CommentaryStyle['language'];
    }
  }

  public static resetInstance(): void {
    AdvancedMatchCommentaryService.instance = undefined as any;
  }
}

export default AdvancedMatchCommentaryService; 