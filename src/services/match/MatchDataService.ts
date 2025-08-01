import { BrowserEventEmitter } from '';
import { io, Socket } from 'socket.io-client';

export interface MatchData {
  id: string;
  challengeId: string;
  player1Id: string;
  player2Id: string;
  dojoId: string;
  startTime: Date;
  endTime?: Date;
  status: 'preparing' | 'active' | 'paused' | 'completed' | 'cancelled';
  score: {
    player1: number;
    player2: number;
  };
  events: MatchEvent[];
  winnerId?: string;
  matchAnalytics?: MatchAnalytics;
  highlights?: MatchHighlight[];
  replayData?: ReplayData;
}

export interface MatchEvent {
  id: string;
  type: 'shot' | 'foul' | 'timeout' | 'game_end' | 'break' | 'safety' | 'challenge_complete';
  timestamp: Date;
  playerId: string;
  description: string;
  data?: any;
  confidence?: number;
  aiAnalysis?: any;
}

export interface MatchAnalytics {
  totalShots: number;
  successfulShots: number;
  fouls: number;
  breaks: number;
  averageShotTime: number;
  playerPerformance: {
    player1: PlayerPerformance;
    player2: PlayerPerformance;
  };
  gameFlow: GameFlowData[];
  skillGap: number;
  excitementLevel: number;
}

export interface PlayerPerformance {
  shots: number;
  successfulShots: number;
  fouls: number;
  breaks: number;
  averageShotTime: number;
  accuracy: number;
  consistency: number;
  pressureHandling: number;
}

export interface GameFlowData {
  timestamp: Date;
  score: { player1: number; player2: number };
  momentum: number;
  excitement: number;
}

export interface MatchHighlight {
  id: string;
  type: 'amazing_shot' | 'clutch_play' | 'comeback' | 'perfect_break' | 'foul_recovery';
  timestamp: Date;
  description: string;
  videoTimestamp: number;
  importance: number;
}

export interface ReplayData {
  matchId: string;
  events: MatchEvent[];
  highlights: MatchHighlight[];
  analytics: MatchAnalytics;
  videoUrl?: string;
  duration: number;
}

export class MatchDataService extends BrowserEventEmitter {
  private socket: Socket | null = null;
  private activeMatches: Map<string, MatchData> = new Map();
  private isConnected = false;

  constructor() {
    super();
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.socket.on('match_update', this.handleMatchUpdate.bind(this));
      this.socket.on('shot_recorded', this.handleShotRecorded.bind(this));
      this.socket.on('foul_detected', this.handleFoulDetected.bind(this));

    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  async startMatchTracking(challengeId: string): Promise<MatchData> {
    if (!this.isConnected) {
      throw new Error('Socket not connected');
    }

    const matchData: MatchData = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengeId,
      player1Id: '', // Will be set by challenge service
      player2Id: '', // Will be set by challenge service
      dojoId: '', // Will be set by challenge service
      startTime: new Date(),
      status: 'preparing',
      score: { player1: 0, player2: 0 },
      events: [],
    };

    this.activeMatches.set(matchData.id, matchData);
    this.emit('match_started', matchData);

    return matchData;
  }

  activateMatch(matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (match) {
      match.status = 'active';
      this.emit('match_activated', match);
    }
  }

  getMatchData(matchId: string): MatchData | null {
    return this.activeMatches.get(matchId) || null;
  }

  getActiveMatches(): MatchData[] {
    return Array.from(this.activeMatches.values());
  }

  subscribeToMatch(matchId: string, callback: (data: any) => void): void {
    this.on(`match_${matchId}`, callback);
  }

  unsubscribeFromMatch(matchId: string, callback: (data: any) => void): void {
    this.removeListener(`match_${matchId}`, callback);
  }

  private handleMatchUpdate(data: { matchId: string; matchData: MatchData }): void {
    this.activeMatches.set(data.matchId, data.matchData);
    this.emit(`match_${data.matchId}`, data.matchData);
  }

  private handleShotRecorded(data: { matchId: string; shotData: any }): void {
    const match = this.activeMatches.get(data.matchId);
    if (match) {
      // Update match with shot data
      this.emit(`shot_${data.matchId}`, data.shotData);
    }
  }

  private handleFoulDetected(data: { matchId: string; foulData: any }): void {
    const match = this.activeMatches.get(data.matchId);
    if (match) {
      // Update match with foul data
      this.emit(`foul_${data.matchId}`, data.foulData);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  isConnected(): boolean {
    return this.isConnected;
  }
} 
