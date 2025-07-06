import { EventEmitter } from 'events';
import { Tournament, TournamentMatch, TournamentParticipant } from '../../types/tournament';
import { RealTimeMatchService, RealTimeMatchData, ShotData, RefereeDecision } from './RealTimeMatchService';
import { TournamentAnalyticsService } from './TournamentAnalyticsService';

export interface StreamConfig {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  resolution: string;
  bitrate: number;
  enableAudio: boolean;
  enableCommentary: boolean;
  enableStats: boolean;
  enableReplay: boolean;
}

export interface StreamStats {
  viewers: number;
  peakViewers: number;
  averageWatchTime: number;
  chatMessages: number;
  shares: number;
  likes: number;
  streamUptime: number;
  quality: string;
  bitrate: number;
  fps: number;
}

export interface CommentaryEvent {
  id: string;
  type: 'shot' | 'foul' | 'highlight' | 'analysis' | 'prediction';
  message: string;
  timestamp: Date;
  playerId?: string;
  matchId: string;
  confidence: number;
  audioUrl?: string;
  highlightClip?: string;
}

export interface StreamOverlay {
  matchInfo: {
    player1: string;
    player2: string;
    score: string;
    currentPlayer: string;
    timeRemaining?: string;
  };
  statistics: {
    player1Stats: {
      shots: number;
      accuracy: number;
      highestBreak: number;
      fouls: number;
    };
    player2Stats: {
      shots: number;
      accuracy: number;
      highestBreak: number;
      fouls: number;
    };
  };
  tournamentInfo: {
    name: string;
    round: string;
    matchNumber: string;
    venue: string;
  };
  aiInsights: {
    prediction: string;
    confidence: number;
    keyMoment: string;
  };
}

export interface StreamChat {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'moderator' | 'system';
  isHighlighted: boolean;
}

export interface StreamEvent {
  type: 'stream_started' | 'stream_ended' | 'viewer_joined' | 'viewer_left' | 'commentary_added' | 'chat_message' | 'overlay_updated';
  streamKey?: string;
  userId?: string;
  viewerCount?: number;
  stats?: StreamStats;
  data?: Record<string, unknown>;
}

class TournamentStreamingService {
  private streams: Map<string, {
    config: StreamConfig;
    stats: StreamStats;
    overlay: StreamOverlay;
    commentary: CommentaryEvent[];
    chat: StreamChat[];
    isLive: boolean;
    startTime: Date;
    viewers: Set<string>;
  }> = new Map();

  private realTimeMatchService: RealTimeMatchService;
  private analyticsService: TournamentAnalyticsService;
  private subscribers: Map<string, Set<(data: StreamEvent) => void>> = new Map();

  constructor() {
    this.realTimeMatchService = new RealTimeMatchService();
    this.analyticsService = TournamentAnalyticsService.getInstance();
    this.startStreamingUpdates();
  }

  /**
   * Start a live stream for a tournament match
   */
  startStream(tournamentId: string, matchId: string, config: StreamConfig): boolean {
    const streamKey = `${tournamentId}_${matchId}`;
    
    if (this.streams.has(streamKey)) {
      console.warn(`Stream already exists for ${streamKey}`);
      return false;
    }

    const stream = {
      config,
      stats: {
        viewers: 0,
        peakViewers: 0,
        averageWatchTime: 0,
        chatMessages: 0,
        shares: 0,
        likes: 0,
        streamUptime: 0,
        quality: config.quality,
        bitrate: config.bitrate,
        fps: config.fps,
      },
      overlay: this.createInitialOverlay(matchId),
      commentary: [],
      chat: [],
      isLive: true,
      startTime: new Date(),
      viewers: new Set<string>(),
    };

    this.streams.set(streamKey, stream);
    this.subscribers.set(streamKey, new Set());

    // Subscribe to match updates
    this.realTimeMatchService.subscribeToMatch(matchId, (matchData) => {
      this.updateStreamOverlay(streamKey, matchData);
    });

    // Subscribe to analytics updates
    this.analyticsService.subscribe('matchAnalytics', (analytics) => {
      if (analytics.matchId === matchId) {
        this.updateStreamAnalytics(streamKey, analytics);
      }
    });

    console.log(`Started live stream for ${streamKey}`);
    this.publish(streamKey, { type: 'stream_started', streamKey });
    return true;
  }

  /**
   * Stop a live stream
   */
  stopStream(tournamentId: string, matchId: string): boolean {
    const streamKey = `${tournamentId}_${matchId}`;
    const stream = this.streams.get(streamKey);
    
    if (!stream) {
      console.warn(`Stream not found for ${streamKey}`);
      return false;
    }

    stream.isLive = false;
    stream.stats.streamUptime = Date.now() - stream.startTime.getTime();

    // Unsubscribe from services
    this.realTimeMatchService.unsubscribeFromMatch(matchId);
    this.analyticsService.unsubscribe('matchAnalytics');

    this.publish(streamKey, { type: 'stream_ended', streamKey, stats: stream.stats });
    console.log(`Stopped live stream for ${streamKey}`);
    return true;
  }

  /**
   * Add a viewer to the stream
   */
  addViewer(streamKey: string, userId: string): void {
    const stream = this.streams.get(streamKey);
    if (!stream || !stream.isLive) return;

    stream.viewers.add(userId);
    stream.stats.viewers = stream.viewers.size;
    stream.stats.peakViewers = Math.max(stream.stats.peakViewers, stream.stats.viewers);

    this.publish(streamKey, { 
      type: 'viewer_joined', 
      userId, 
      viewerCount: stream.stats.viewers 
    });
  }

  /**
   * Remove a viewer from the stream
   */
  removeViewer(streamKey: string, userId: string): void {
    const stream = this.streams.get(streamKey);
    if (!stream) return;

    stream.viewers.delete(userId);
    stream.stats.viewers = stream.viewers.size;

    this.publish(streamKey, { 
      type: 'viewer_left', 
      userId, 
      viewerCount: stream.stats.viewers 
    });
  }

  /**
   * Add commentary to the stream
   */
  addCommentary(streamKey: string, commentary: Omit<CommentaryEvent, 'id' | 'timestamp'>): void {
    const stream = this.streams.get(streamKey);
    if (!stream || !stream.isLive) return;

    const commentaryEvent: CommentaryEvent = {
      ...commentary,
      id: `commentary_${Date.now()}`,
      timestamp: new Date(),
    };

    stream.commentary.push(commentaryEvent);
    
    // Keep only last 50 commentary events
    if (stream.commentary.length > 50) {
      stream.commentary = stream.commentary.slice(-50);
    }

    this.publish(streamKey, { 
      type: 'commentary_added', 
      commentary: commentaryEvent 
    });
  }

  /**
   * Add chat message to the stream
   */
  addChatMessage(streamKey: string, chatMessage: Omit<StreamChat, 'id' | 'timestamp'>): void {
    const stream = this.streams.get(streamKey);
    if (!stream || !stream.isLive) return;

    const chat: StreamChat = {
      ...chatMessage,
      id: `chat_${Date.now()}`,
      timestamp: new Date(),
    };

    stream.chat.push(chat);
    stream.stats.chatMessages++;

    // Keep only last 100 chat messages
    if (stream.chat.length > 100) {
      stream.chat = stream.chat.slice(-100);
    }

    this.publish(streamKey, { 
      type: 'chat_message', 
      chat 
    });
  }

  /**
   * Get stream information
   */
  getStreamInfo(streamKey: string) {
    const stream = this.streams.get(streamKey);
    if (!stream) return null;

    return {
      config: stream.config,
      stats: stream.stats,
      overlay: stream.overlay,
      isLive: stream.isLive,
      startTime: stream.startTime,
      viewerCount: stream.viewers.size,
    };
  }

  /**
   * Get recent commentary
   */
  getRecentCommentary(streamKey: string, limit: number = 10): CommentaryEvent[] {
    const stream = this.streams.get(streamKey);
    if (!stream) return [];

    return stream.commentary.slice(-limit);
  }

  /**
   * Get recent chat messages
   */
  getRecentChat(streamKey: string, limit: number = 20): StreamChat[] {
    const stream = this.streams.get(streamKey);
    if (!stream) return [];

    return stream.chat.slice(-limit);
  }

  /**
   * Subscribe to stream updates
   */
  subscribeToStream(streamKey: string, callback: (data: StreamEvent) => void): () => void {
    if (!this.subscribers.has(streamKey)) {
      this.subscribers.set(streamKey, new Set());
    }

    this.subscribers.get(streamKey)!.add(callback);

    // Send initial stream info
    const streamInfo = this.getStreamInfo(streamKey);
    if (streamInfo) {
      callback({ type: 'stream_info', data: streamInfo });
    }

    return () => {
      const subscribers = this.subscribers.get(streamKey);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Create initial overlay for a match
   */
  private createInitialOverlay(matchId: string): StreamOverlay {
    return {
      matchInfo: {
        player1: 'Player 1',
        player2: 'Player 2',
        score: '0 - 0',
        currentPlayer: 'Player 1',
      },
      statistics: {
        player1Stats: {
          shots: 0,
          accuracy: 0,
          highestBreak: 0,
          fouls: 0,
        },
        player2Stats: {
          shots: 0,
          accuracy: 0,
          highestBreak: 0,
          fouls: 0,
        },
      },
      tournamentInfo: {
        name: 'Tournament Name',
        round: 'Round 1',
        matchNumber: 'Match 1',
        venue: 'Venue Name',
      },
      aiInsights: {
        prediction: 'AI analysis in progress...',
        confidence: 0,
        keyMoment: 'Waiting for first shot...',
      },
    };
  }

  /**
   * Update stream overlay with match data
   */
  private updateStreamOverlay(streamKey: string, matchData: RealTimeMatchData): void {
    const stream = this.streams.get(streamKey);
    if (!stream) return;

    // Update match info
    stream.overlay.matchInfo = {
      player1: matchData.match.player1?.name || 'Player 1',
      player2: matchData.match.player2?.name || 'Player 2',
      score: `${matchData.match.player1Score || 0} - ${matchData.match.player2Score || 0}`,
      currentPlayer: matchData.currentPlayer?.name || 'Player 1',
    };

    // Update statistics based on shot history
    const player1Shots = matchData.shotHistory.filter((s: ShotData) => s.playerId === matchData.match.player1Id);
    const player2Shots = matchData.shotHistory.filter((s: ShotData) => s.playerId === matchData.match.player2Id);

    stream.overlay.statistics.player1Stats = {
      shots: player1Shots.length,
      accuracy: player1Shots.length > 0 ? (player1Shots.filter((s: ShotData) => s.outcome === 'success').length / player1Shots.length) * 100 : 0,
      highestBreak: Math.max(...player1Shots.map((s: ShotData) => s.break || 0), 0),
      fouls: matchData.refereeDecisions.filter((d: RefereeDecision) => d.affectedPlayer === matchData.match.player1Id).length,
    };

    stream.overlay.statistics.player2Stats = {
      shots: player2Shots.length,
      accuracy: player2Shots.length > 0 ? (player2Shots.filter((s: ShotData) => s.outcome === 'success').length / player2Shots.length) * 100 : 0,
      highestBreak: Math.max(...player2Shots.map((s: ShotData) => s.break || 0), 0),
      fouls: matchData.refereeDecisions.filter((d: RefereeDecision) => d.affectedPlayer === matchData.match.player2Id).length,
    };

    this.publish(streamKey, { 
      type: 'overlay_updated', 
      overlay: stream.overlay 
    });
  }

  /**
   * Update stream analytics
   */
  private updateStreamAnalytics(streamKey: string, analytics: Record<string, unknown>): void {
    const stream = this.streams.get(streamKey);
    if (!stream) return;

    // Update AI insights
    stream.overlay.aiInsights = {
      prediction: analytics.prediction || 'AI analysis in progress...',
      confidence: analytics.confidence || 0,
      keyMoment: analytics.keyMoment || 'Analyzing match...',
    };

    this.publish(streamKey, { 
      type: 'analytics_updated', 
      analytics: stream.overlay.aiInsights 
    });
  }

  /**
   * Start streaming updates simulation
   */
  private startStreamingUpdates(): void {
    setInterval(() => {
      this.streams.forEach((stream, streamKey) => {
        if (stream.isLive) {
          // Simulate viewer count changes
          const viewerChange = Math.floor(Math.random() * 3) - 1;
          const newViewerCount = Math.max(0, stream.stats.viewers + viewerChange);
          
          if (newViewerCount !== stream.stats.viewers) {
            stream.stats.viewers = newViewerCount;
            stream.stats.peakViewers = Math.max(stream.stats.peakViewers, stream.stats.viewers);
          }

          // Simulate occasional commentary
          if (Math.random() > 0.98) {
            this.addCommentary(streamKey, {
              type: 'highlight',
              message: 'What an incredible shot! The crowd is going wild!',
              matchId: streamKey.split('_')[1],
              confidence: 0.9,
            });
          }

          // Update stream uptime
          stream.stats.streamUptime = Date.now() - stream.startTime.getTime();
        }
      });
    }, 5000);
  }

  /**
   * Publish updates to subscribers
   */
  private publish(streamKey: string, data: StreamEvent): void {
    const subscribers = this.subscribers.get(streamKey);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in stream subscriber callback:', error);
        }
      });
    }
  }
}

// Export singleton instance
export const tournamentStreamingService = new TournamentStreamingService();
export default tournamentStreamingService; 