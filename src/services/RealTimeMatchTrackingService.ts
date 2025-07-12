import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'shot' | 'foul' | 'timeout' | 'game_end' | 'highlight';
  playerId: string;
  timestamp: Date;
  data: any;
}

export interface MatchAnalytics {
  totalShots: number;
  accuracy: number;
  averageShotTime: number;
  fouls: number;
  highlights: string[];
  playerStats: {
    [playerId: string]: {
      shots: number;
      accuracy: number;
      fouls: number;
      highlights: number;
    };
  };
}

export interface MatchResult {
  matchId: string;
  challengeId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  duration: number;
  highlights: string[];
  analytics: MatchAnalytics;
  timestamp: Date;
  territoryId?: string;
  isTerritoryMatch: boolean;
}

export interface MatchReward {
  winnerRewards: {
    coins: number;
    experience: number;
    territoryControl?: boolean;
    achievements: string[];
  };
  loserRewards: {
    coins: number;
    experience: number;
    achievements: string[];
  };
}

export class RealTimeMatchTrackingService extends EventEmitter {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private activeMatches: Map<string, any> = new Map();
  private matchEvents: Map<string, MatchEvent[]> = new Map();
  private matchAnalytics: Map<string, MatchAnalytics> = new Map();
  private pendingUpdates: any[] = [];

  constructor() {
    super();
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('RealTimeMatchTrackingService connected to server');
        this.emit('connected');
        this.syncPendingUpdates();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('RealTimeMatchTrackingService disconnected from server');
        this.emit('disconnected');
      });

      // Listen for match events
      this.socket.on('match-event', (event: MatchEvent) => {
        this.handleMatchEvent(event);
      });

      // Listen for match results
      this.socket.on('match-result', (result: MatchResult) => {
        this.handleMatchResult(result);
      });

      // Listen for match analytics updates
      this.socket.on('match-analytics-update', (data: { matchId: string; analytics: MatchAnalytics }) => {
        this.updateMatchAnalytics(data.matchId, data.analytics);
      });

    } catch (error) {
      console.error('Failed to initialize RealTimeMatchTrackingService WebSocket:', error);
    }
  }

  /**
   * Start tracking a match for an accepted challenge
   */
  async startMatchTracking(challengeId: string, matchData: any): Promise<void> {
    try {
      const matchId = `match_${Date.now()}_${challengeId}`;
      
      const match = {
        id: matchId,
        challengeId,
        ...matchData,
        status: 'in-progress',
        startTime: new Date(),
        events: [],
        analytics: this.initializeAnalytics(),
      };

      this.activeMatches.set(matchId, match);
      this.matchEvents.set(matchId, []);
      this.matchAnalytics.set(matchId, this.initializeAnalytics());

      // Emit match started event
      this.socket?.emit('match-started', {
        matchId,
        challengeId,
        players: matchData.players,
        startTime: match.startTime,
      });

      this.emit('matchStarted', match);

      console.log(`Started tracking match: ${matchId} for challenge: ${challengeId}`);

    } catch (error) {
      console.error('Error starting match tracking:', error);
      throw error;
    }
  }

  /**
   * Record a match event (shot, foul, timeout, etc.)
   */
  async recordMatchEvent(matchId: string, eventData: Omit<MatchEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      const event: MatchEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Add event to match
      match.events.push(event);
      this.activeMatches.set(matchId, match);

      // Add to events list
      const events = this.matchEvents.get(matchId) || [];
      events.push(event);
      this.matchEvents.set(matchId, events);

      // Update analytics
      this.updateAnalyticsFromEvent(matchId, event);

      // Emit event to server
      this.socket?.emit('match-event', event);

      // Emit local event
      this.emit('matchEvent', { matchId, event });

      console.log(`Recorded match event: ${event.type} for match: ${matchId}`);

    } catch (error) {
      console.error('Error recording match event:', error);
      throw error;
    }
  }

  /**
   * End match and record final result
   */
  async endMatch(matchId: string, resultData: Omit<MatchResult, 'matchId' | 'timestamp' | 'analytics'>): Promise<MatchResult> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      const analytics = this.matchAnalytics.get(matchId) || this.initializeAnalytics();
      const events = this.matchEvents.get(matchId) || [];

      const matchResult: MatchResult = {
        ...resultData,
        matchId,
        timestamp: new Date(),
        analytics,
        duration: this.calculateMatchDuration(match.startTime),
      };

      // Update match status
      match.status = 'completed';
      match.endTime = new Date();
      match.result = matchResult;
      this.activeMatches.set(matchId, match);

      // Emit match result to server
      this.socket?.emit('match-result', matchResult);

      // Process rewards
      const rewards = await this.calculateRewards(matchResult);
      await this.distributeRewards(matchResult, rewards);

      // Generate highlights
      const highlights = await this.generateHighlights(events, analytics);
      matchResult.highlights = highlights;

      // Emit local events
      this.emit('matchEnded', { matchId, result: matchResult, rewards });
      this.emit('matchResult', matchResult);

      console.log(`Match ended: ${matchId}`, matchResult);

      return matchResult;

    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  }

  /**
   * Get real-time match analytics
   */
  getMatchAnalytics(matchId: string): MatchAnalytics | null {
    return this.matchAnalytics.get(matchId) || null;
  }

  /**
   * Get match events
   */
  getMatchEvents(matchId: string): MatchEvent[] {
    return this.matchEvents.get(matchId) || [];
  }

  /**
   * Get active match
   */
  getActiveMatch(matchId: string): any | null {
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Get all active matches
   */
  getActiveMatches(): any[] {
    return Array.from(this.activeMatches.values());
  }

  /**
   * Initialize analytics for a new match
   */
  private initializeAnalytics(): MatchAnalytics {
    return {
      totalShots: 0,
      accuracy: 0,
      averageShotTime: 0,
      fouls: 0,
      highlights: [],
      playerStats: {},
    };
  }

  /**
   * Update analytics from a match event
   */
  private updateAnalyticsFromEvent(matchId: string, event: MatchEvent): void {
    const analytics = this.matchAnalytics.get(matchId) || this.initializeAnalytics();

    switch (event.type) {
      case 'shot':
        analytics.totalShots++;
        if (event.data.success) {
          analytics.accuracy = (analytics.accuracy * (analytics.totalShots - 1) + 1) / analytics.totalShots;
        } else {
          analytics.accuracy = (analytics.accuracy * (analytics.totalShots - 1)) / analytics.totalShots;
        }
        
        // Update player stats
        if (!analytics.playerStats[event.playerId]) {
          analytics.playerStats[event.playerId] = { shots: 0, accuracy: 0, fouls: 0, highlights: 0 };
        }
        analytics.playerStats[event.playerId].shots++;
        if (event.data.success) {
          analytics.playerStats[event.playerId].accuracy = 
            (analytics.playerStats[event.playerId].accuracy * (analytics.playerStats[event.playerId].shots - 1) + 1) / analytics.playerStats[event.playerId].shots;
        } else {
          analytics.playerStats[event.playerId].accuracy = 
            (analytics.playerStats[event.playerId].accuracy * (analytics.playerStats[event.playerId].shots - 1)) / analytics.playerStats[event.playerId].shots;
        }
        break;

      case 'foul':
        analytics.fouls++;
        if (analytics.playerStats[event.playerId]) {
          analytics.playerStats[event.playerId].fouls++;
        }
        break;

      case 'highlight':
        analytics.highlights.push(event.data.description);
        if (analytics.playerStats[event.playerId]) {
          analytics.playerStats[event.playerId].highlights++;
        }
        break;
    }

    this.matchAnalytics.set(matchId, analytics);
    this.emit('analyticsUpdated', { matchId, analytics });
  }

  /**
   * Calculate match duration
   */
  private calculateMatchDuration(startTime: Date): number {
    return Date.now() - startTime.getTime();
  }

  /**
   * Calculate rewards for match result
   */
  private async calculateRewards(matchResult: MatchResult): Promise<MatchReward> {
    const baseCoins = 100;
    const baseExperience = 50;
    const scoreMultiplier = Math.max(matchResult.winnerScore, matchResult.loserScore) / 10;
    const durationBonus = Math.min(matchResult.duration / 60000, 2); // Max 2x bonus for long matches

    const winnerRewards = {
      coins: Math.floor(baseCoins * scoreMultiplier * (1 + durationBonus)),
      experience: Math.floor(baseExperience * scoreMultiplier * (1 + durationBonus)),
      territoryControl: matchResult.isTerritoryMatch,
      achievements: this.calculateAchievements(matchResult, 'winner'),
    };

    const loserRewards = {
      coins: Math.floor(baseCoins * 0.5 * scoreMultiplier),
      experience: Math.floor(baseExperience * 0.5 * scoreMultiplier),
      achievements: this.calculateAchievements(matchResult, 'loser'),
    };

    return { winnerRewards, loserRewards };
  }

  /**
   * Calculate achievements based on match result
   */
  private calculateAchievements(matchResult: MatchResult, playerRole: 'winner' | 'loser'): string[] {
    const achievements: string[] = [];

    if (playerRole === 'winner') {
      if (matchResult.winnerScore >= 10) achievements.push('High Scorer');
      if (matchResult.analytics.playerStats[matchResult.winnerId]?.highlights > 0) achievements.push('Highlight Reel');
      if (matchResult.isTerritoryMatch) achievements.push('Territory Conqueror');
    } else {
      if (matchResult.loserScore >= 5) achievements.push('Resilient Fighter');
      if (matchResult.analytics.playerStats[matchResult.loserId]?.accuracy > 0.7) achievements.push('Precision Player');
    }

    return achievements;
  }

  /**
   * Distribute rewards to players
   */
  private async distributeRewards(matchResult: MatchResult, rewards: MatchReward): Promise<void> {
    try {
      // Emit reward distribution events
      this.socket?.emit('distribute-rewards', {
        matchId: matchResult.matchId,
        winnerId: matchResult.winnerId,
        loserId: matchResult.loserId,
        rewards,
      });

      // Emit local reward events
      this.emit('rewardsDistributed', {
        matchId: matchResult.matchId,
        winnerRewards: rewards.winnerRewards,
        loserRewards: rewards.loserRewards,
      });

      console.log(`Rewards distributed for match: ${matchResult.matchId}`);

    } catch (error) {
      console.error('Error distributing rewards:', error);
      throw error;
    }
  }

  /**
   * Generate highlights from match events
   */
  private async generateHighlights(events: MatchEvent[], analytics: MatchAnalytics): Promise<string[]> {
    const highlights: string[] = [];

    // Find highlight events
    const highlightEvents = events.filter(event => event.type === 'highlight');
    highlightEvents.forEach(event => {
      highlights.push(event.data.description);
    });

    // Generate additional highlights based on analytics
    if (analytics.accuracy > 0.8) highlights.push('Exceptional Accuracy');
    if (analytics.totalShots > 50) highlights.push('Marathon Match');
    if (analytics.fouls === 0) highlights.push('Clean Game');

    return highlights;
  }

  /**
   * Handle incoming match events
   */
  private handleMatchEvent(event: MatchEvent): void {
    const events = this.matchEvents.get(event.matchId) || [];
    events.push(event);
    this.matchEvents.set(event.matchId, events);
    this.updateAnalyticsFromEvent(event.matchId, event);
  }

  /**
   * Handle incoming match results
   */
  private handleMatchResult(result: MatchResult): void {
    this.emit('matchResultReceived', result);
  }

  /**
   * Update match analytics
   */
  private updateMatchAnalytics(matchId: string, analytics: MatchAnalytics): void {
    this.matchAnalytics.set(matchId, analytics);
    this.emit('analyticsUpdated', { matchId, analytics });
  }

  /**
   * Sync pending updates when reconnected
   */
  private syncPendingUpdates(): void {
    if (this.pendingUpdates.length > 0) {
      this.pendingUpdates.forEach(update => {
        this.socket?.emit(update.event, update.data);
      });
      this.pendingUpdates = [];
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }
} 