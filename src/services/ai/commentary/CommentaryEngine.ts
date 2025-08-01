import { BaseService } from '.js';
import { logger } from '.js';
import { CommentaryEventContext, ShotEventContext } from '.js';

/**
 * CommentaryEngine - Focused service for generating AI commentary
 * Extracted from AdvancedAIMatchCommentaryHighlightsService for better maintainability
 */

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
  context: CommentaryEventContext;
  highlights: string[];
  insights: string[];
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
}

export class CommentaryEngine extends BaseService {
  private events: CommentaryEvent[] = [];
  private commentaryConfig: CommentaryConfig;

  constructor() {
    super('CommentaryEngine', {
      enabled: true,
      websocketUrl: '/socket.io'
    });

    this.commentaryConfig = {
      enabled: true,
      realTimeCommentary: true,
      autoCommentary: true,
      defaultStyle: 'professional',
      commentaryDelay: 1000,
      maxCommentaryLength: 200,
      enableReactions: true,
      enableHighlights: true,
      enableInsights: true,
      styles: this.getDefaultStyles()
    };

    this.logger.info('CommentaryEngine initialized', { 
      stylesCount: this.commentaryConfig.styles.length,
      defaultStyle: this.commentaryConfig.defaultStyle 
    });
  }

  /**
   * Generate commentary for a game event
   */
  public async generateCommentary(
    event: Omit<CommentaryEvent, 'id' | 'timestamp' | 'commentary' | 'highlights' | 'insights'>,
    styleId?: string
  ): Promise<CommentaryEvent> {
    const timer = this.logger.startTimer('generateCommentary');
    
    try {
      const style = this.getStyle(styleId || event.style);
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
        style: style.id,
      };

      this.addEvent(newEvent);
      this.emitSocketEvent('commentary:generated', newEvent);
      this.emit('commentaryGenerated', newEvent);

      this.logger.info('Commentary generated successfully', {
        eventId: newEvent.id,
        eventType: newEvent.eventType,
        style: style.name,
        confidence: newEvent.confidence
      });

      return newEvent;
    } catch (error) {
      this.logger.error('Failed to generate commentary', error as Error, {
        eventType: event.eventType,
        styleId
      });
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Generate commentary text based on event and style
   */
  private async generateCommentaryText(
    event: Partial<CommentaryEvent>,
    style: CommentaryStyle
  ): Promise<string> {
    const baseCommentary = this.getBaseCommentary(event);
    return this.applyStyle(baseCommentary, style);
  }

  /**
   * Get base commentary without style applied
   */
  private getBaseCommentary(event: Partial<CommentaryEvent>): string {
    switch (event.eventType) {
      case 'shot':
        const shotContext = event.context as unknown as ShotEventContext;
        return `Player ${event.playerName} takes a shot with ${shotContext?.power || 'unknown'}% power and ${shotContext?.accuracy || 'unknown'}% accuracy.`;
      case 'foul':
        return `Foul called on ${event.playerName} for ${event.context?.description || 'rule violation'}.`;
      case 'score':
        return `${event.playerName} scores! ${event.context?.description || 'Great shot!'}`;
      case 'turnover':
        return `${event.playerName} loses possession. ${event.context?.description || 'Turn switches.'}`;
      case 'timeout':
        return `Timeout called. ${event.context?.description || 'Players take a break.'}`;
      case 'highlight':
        return `Incredible play by ${event.playerName}! ${event.context?.description || 'What a moment!'}`;
      case 'analysis':
        return `Analysis: ${event.context?.description || 'Breaking down the play.'}`;
      default:
        return `Event: ${event.description || 'Something happened in the match.'}`;
    }
  }

  /**
   * Apply style to commentary text
   */
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
      default:
        styledCommentary = `${styledCommentary} An excellent execution.`;
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

  /**
   * Generate highlights for an event
   */
  private async generateHighlights(event: Partial<CommentaryEvent>): Promise<string[]> {
    const highlights: string[] = [];
    
    if (event.eventType === 'shot' && event.context?.power && event.context.power > 80) {
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

  /**
   * Generate insights for an event
   */
  private async generateInsights(event: Partial<CommentaryEvent>): Promise<string[]> {
    const insights: string[] = [];
    
    if (event.eventType === 'shot' && event.context) {
      if (event.context.accuracy) {
        insights.push(`Shot accuracy: ${event.context.accuracy}%`);
      }
      if (event.context.power) {
        insights.push(`Power level: ${event.context.power}%`);
      }
      if (event.context.accuracy && event.context.accuracy > 90) {
        insights.push('Exceptional precision');
      }
    }
    
    if (event.eventType === 'score') {
      insights.push('Player performance improving');
      insights.push('Team momentum building');
    }

    return insights;
  }

  /**
   * Get style by ID or return default
   */
  private getStyle(styleId: string): CommentaryStyle {
    return this.commentaryConfig.styles.find(s => s.id === styleId) || 
           this.commentaryConfig.styles.find(s => s.id === this.commentaryConfig.defaultStyle) ||
           this.commentaryConfig.styles[0];
  }

  /**
   * Add event to internal storage
   */
  private addEvent(event: CommentaryEvent): void {
    this.events.unshift(event);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    
    this.logger.debug('Event added to commentary history', {
      eventId: event.id,
      totalEvents: this.events.length
    });
  }

  /**
   * Get default commentary styles
   */
  private getDefaultStyles(): CommentaryStyle[] {
    return [
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
    ];
  }

  // Implement required abstract methods from BaseService
  protected onWebSocketConnected(): void {
    this.emitSocketEvent('commentary:join', { service: 'commentary' });
    this.logger.info('Commentary engine connected to WebSocket');
  }

  protected onWebSocketDisconnected(): void {
    this.logger.warn('Commentary engine disconnected from WebSocket');
  }

  protected onWebSocketError(error: Error): void {
    this.logger.error('Commentary engine WebSocket error', error);
  }

  // Public API methods
  public getEvents(): CommentaryEvent[] {
    return [...this.events];
  }

  public getEventById(id: string): CommentaryEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  public getEventsByMatch(matchId: string): CommentaryEvent[] {
    return this.events.filter(e => e.matchId === matchId);
  }

  public getConfig(): CommentaryConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CommentaryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Commentary configuration updated', { newConfig });
    this.emit('configUpdated', this.config);
  }

  public getStyles(): CommentaryStyle[] {
    return [...this.config.styles];
  }

  public async addStyle(style: Omit<CommentaryStyle, 'id'>): Promise<void> {
    const newStyle: CommentaryStyle = {
      ...style,
      id: this.generateId()
    };
    
    this.config.styles.push(newStyle);
    this.logger.info('Commentary style added', { styleId: newStyle.id, styleName: newStyle.name });
    this.emit('styleAdded', newStyle);
  }

  public async removeStyle(id: string): Promise<void> {
    const index = this.config.styles.findIndex(s => s.id === id);
    if (index !== -1) {
      const removedStyle = this.config.styles.splice(index, 1)[0];
      this.logger.info('Commentary style removed', { styleId: id, styleName: removedStyle.name });
      this.emit('styleRemoved', removedStyle);
    }
  }
}
