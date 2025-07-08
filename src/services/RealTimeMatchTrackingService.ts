import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { ChallengeService, Challenge } from './ChallengeService';

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

export interface MatchResult {
  matchId: string;
  challengeId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  matchDuration: number;
  analytics: MatchAnalytics;
  highlights: MatchHighlight[];
  rewards: MatchRewards;
}

export interface MatchRewards {
  dojoCoins: number;
  experience: number;
  achievements: string[];
  territoryControl?: boolean;
  clanInfluence?: number;
}

export class RealTimeMatchTrackingService extends EventEmitter {
  private socket: Socket | null = null;
  private activeMatches: Map<string, MatchData> = new Map();
  private matchAnalytics: Map<string, MatchAnalytics> = new Map();
  private isConnected = false;

  constructor() {
    super();
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io(process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080');
      
      this.socket.on('connect', () => {
        console.log('RealTimeMatchTrackingService connected to WebSocket');
        this.isConnected = true;
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        console.log('RealTimeMatchTrackingService disconnected from WebSocket');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.socket.on('match_update', (data: { matchId: string; matchData: MatchData }) => {
        this.handleMatchUpdate(data);
      });

      this.socket.on('shot_recorded', (data: { matchId: string; shotData: any }) => {
        this.handleShotRecorded(data);
      });

      this.socket.on('foul_detected', (data: { matchId: string; foulData: any }) => {
        this.handleFoulDetected(data);
      });

    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
    }
  }

  /**
   * Start tracking a match for an accepted challenge
   */
  async startMatchTracking(challengeId: string): Promise<MatchData> {
    try {
      // Get challenge details
      const challenge = await ChallengeService.getChallengeDetails(challengeId);
      
      if (challenge.status !== 'accepted') {
        throw new Error('Challenge must be accepted before starting match tracking');
      }

      const matchData: MatchData = {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId,
        player1Id: challenge.challengerId,
        player2Id: challenge.defenderId,
        dojoId: challenge.dojoId,
        startTime: new Date(),
        status: 'preparing',
        score: { player1: 0, player2: 0 },
        events: []
      };

      this.activeMatches.set(matchData.id, matchData);
      
      // Emit match start event
      this.socket?.emit('match_start', { matchId: matchData.id, matchData });
      this.emit('matchStarted', matchData);

      return matchData;

    } catch (error) {
      console.error('Error starting match tracking:', error);
      throw error;
    }
  }

  /**
   * Activate match tracking (start the actual game)
   */
  activateMatch(matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    match.status = 'active';
    this.activeMatches.set(matchId, match);

    // Emit match activation
    this.socket?.emit('match_activated', { matchId, matchData: match });
    this.emit('matchActivated', match);
  }

  /**
   * Record a shot during the match
   */
  async recordShot(matchId: string, shotData: {
    playerId: string;
    shotType: string;
    success: boolean;
    power: number;
    spin: number;
    accuracy: number;
    ballPositions: any[];
    timestamp: Date;
  }): Promise<void> {
    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const event: MatchEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shot',
      timestamp: shotData.timestamp,
      playerId: shotData.playerId,
      description: `${shotData.playerId} takes a ${shotData.shotType} shot`,
      data: shotData,
      confidence: 0.95,
      aiAnalysis: await this.analyzeShot(shotData)
    };

    match.events.push(event);

    // Update score if shot was successful
    if (shotData.success) {
      if (shotData.playerId === match.player1Id) {
        match.score.player1++;
      } else {
        match.score.player2++;
      }
    }

    this.activeMatches.set(matchId, match);

    // Emit shot recorded event
    this.socket?.emit('shot_recorded', { matchId, shotData: event });
    this.emit('shotRecorded', { matchId, event });

    // Update analytics
    this.updateMatchAnalytics(matchId);
  }

  /**
   * Record a foul during the match
   */
  async recordFoul(matchId: string, foulData: {
    playerId: string;
    foulType: string;
    severity: 'minor' | 'major' | 'serious';
    description: string;
    timestamp: Date;
  }): Promise<void> {
    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const event: MatchEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'foul',
      timestamp: foulData.timestamp,
      playerId: foulData.playerId,
      description: `${foulData.playerId} commits a ${foulData.foulType} foul`,
      data: foulData,
      confidence: 0.9,
      aiAnalysis: await this.analyzeFoul(foulData)
    };

    match.events.push(event);

    this.activeMatches.set(matchId, match);

    // Emit foul recorded event
    this.socket?.emit('foul_recorded', { matchId, foulData: event });
    this.emit('foulRecorded', { matchId, event });

    // Update analytics
    this.updateMatchAnalytics(matchId);
  }

  /**
   * Complete the match and record results
   */
  async completeMatch(matchId: string, winnerId: string): Promise<MatchResult> {
    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    match.status = 'completed';
    match.endTime = new Date();
    match.winnerId = winnerId;

    // Calculate match duration
    const duration = match.endTime.getTime() - match.startTime.getTime();

    // Generate final analytics
    const analytics = await this.generateFinalAnalytics(matchId);
    match.matchAnalytics = analytics;

    // Generate highlights
    const highlights = await this.generateHighlights(matchId);
    match.highlights = highlights;

    // Calculate rewards
    const rewards = await this.calculateRewards(match, winnerId);

    const matchResult: MatchResult = {
      matchId,
      challengeId: match.challengeId,
      winnerId,
      loserId: winnerId === match.player1Id ? match.player2Id : match.player1Id,
      winnerScore: winnerId === match.player1Id ? match.score.player1 : match.score.player2,
      loserScore: winnerId === match.player1Id ? match.score.player2 : match.score.player1,
      matchDuration: duration,
      analytics,
      highlights,
      rewards
    };

    // Store replay data
    const replayData: ReplayData = {
      matchId,
      events: match.events,
      highlights,
      analytics,
      duration
    };

    // Emit match completion events
    this.socket?.emit('match_completed', { matchId, matchResult, replayData });
    this.emit('matchCompleted', { matchResult, replayData });

    // Update challenge status
    await this.updateChallengeStatus(match.challengeId, matchResult);

    // Distribute rewards
    await this.distributeRewards(matchResult);

    // Remove from active matches
    this.activeMatches.delete(matchId);

    return matchResult;
  }

  /**
   * Get current match data
   */
  getMatchData(matchId: string): MatchData | null {
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Get all active matches
   */
  getActiveMatches(): MatchData[] {
    return Array.from(this.activeMatches.values());
  }

  /**
   * Subscribe to match updates
   */
  subscribeToMatch(matchId: string, callback: (data: any) => void): void {
    this.socket?.emit('subscribe_to_match', { matchId });
    this.on(`match_update_${matchId}`, callback);
  }

  /**
   * Unsubscribe from match updates
   */
  unsubscribeFromMatch(matchId: string, callback: (data: any) => void): void {
    this.socket?.emit('unsubscribe_from_match', { matchId });
    this.off(`match_update_${matchId}`, callback);
  }

  /**
   * Handle match updates from WebSocket
   */
  private handleMatchUpdate(data: { matchId: string; matchData: MatchData }): void {
    this.activeMatches.set(data.matchId, data.matchData);
    this.emit(`match_update_${data.matchId}`, data.matchData);
    this.emit('matchUpdated', data);
  }

  /**
   * Handle shot recorded events
   */
  private handleShotRecorded(data: { matchId: string; shotData: any }): void {
    this.emit(`shot_recorded_${data.matchId}`, data.shotData);
    this.emit('shotRecorded', data);
  }

  /**
   * Handle foul detected events
   */
  private handleFoulDetected(data: { matchId: string; foulData: any }): void {
    this.emit(`foul_detected_${data.matchId}`, data.foulData);
    this.emit('foulDetected', data);
  }

  /**
   * Analyze shot with AI
   */
  private async analyzeShot(shotData: any): Promise<any> {
    // Mock AI analysis - in real implementation, this would call AI services
    return {
      difficulty: Math.random() * 10,
      technique: shotData.shotType,
      riskLevel: Math.random() * 5,
      skillRequired: Math.random() * 10,
      recommendation: 'Good shot technique'
    };
  }

  /**
   * Analyze foul with AI
   */
  private async analyzeFoul(foulData: any): Promise<any> {
    // Mock AI analysis - in real implementation, this would call AI referee
    return {
      severity: foulData.severity,
      ruleViolation: foulData.foulType,
      penalty: foulData.severity === 'serious' ? 'loss_of_turn' : 'free_ball',
      explanation: `Player committed ${foulData.foulType}`
    };
  }

  /**
   * Update match analytics in real-time
   */
  private updateMatchAnalytics(matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const analytics: MatchAnalytics = {
      totalShots: match.events.filter(e => e.type === 'shot').length,
      successfulShots: match.events.filter(e => e.type === 'shot' && e.data?.success).length,
      fouls: match.events.filter(e => e.type === 'foul').length,
      breaks: match.events.filter(e => e.type === 'break').length,
      averageShotTime: this.calculateAverageShotTime(match),
      playerPerformance: this.calculatePlayerPerformance(match),
      gameFlow: this.calculateGameFlow(match),
      skillGap: this.calculateSkillGap(match),
      excitementLevel: this.calculateExcitementLevel(match)
    };

    this.matchAnalytics.set(matchId, analytics);
    this.emit('analyticsUpdated', { matchId, analytics });
  }

  /**
   * Generate final analytics for completed match
   */
  private async generateFinalAnalytics(matchId: string): Promise<MatchAnalytics> {
    const match = this.activeMatches.get(matchId);
    if (!match) throw new Error('Match not found');

    return this.matchAnalytics.get(matchId) || {
      totalShots: 0,
      successfulShots: 0,
      fouls: 0,
      breaks: 0,
      averageShotTime: 0,
      playerPerformance: {
        player1: { shots: 0, successfulShots: 0, fouls: 0, breaks: 0, averageShotTime: 0, accuracy: 0, consistency: 0, pressureHandling: 0 },
        player2: { shots: 0, successfulShots: 0, fouls: 0, breaks: 0, averageShotTime: 0, accuracy: 0, consistency: 0, pressureHandling: 0 }
      },
      gameFlow: [],
      skillGap: 0,
      excitementLevel: 0
    };
  }

  /**
   * Generate match highlights
   */
  private async generateHighlights(matchId: string): Promise<MatchHighlight[]> {
    const match = this.activeMatches.get(matchId);
    if (!match) return [];

    const highlights: MatchHighlight[] = [];

    // Find amazing shots
    const amazingShots = match.events.filter(e => 
      e.type === 'shot' && e.data?.success && e.data?.accuracy > 0.8
    );

    amazingShots.forEach((shot, index) => {
      highlights.push({
        id: `highlight_${Date.now()}_${index}`,
        type: 'amazing_shot',
        timestamp: shot.timestamp,
        description: `Amazing shot by ${shot.playerId}`,
        videoTimestamp: shot.timestamp.getTime(),
        importance: 0.8
      });
    });

    // Find clutch plays
    const clutchPlays = match.events.filter(e => 
      e.type === 'shot' && e.data?.success && 
      (match.score.player1 === 8 || match.score.player2 === 8)
    );

    clutchPlays.forEach((play, index) => {
      highlights.push({
        id: `highlight_${Date.now()}_clutch_${index}`,
        type: 'clutch_play',
        timestamp: play.timestamp,
        description: `Clutch play by ${play.playerId}`,
        videoTimestamp: play.timestamp.getTime(),
        importance: 0.9
      });
    });

    return highlights;
  }

  /**
   * Calculate rewards for match completion
   */
  private async calculateRewards(match: MatchData, winnerId: string): Promise<MatchRewards> {
    const baseCoins = 100;
    const baseExperience = 50;
    
    // Calculate bonus based on match performance
    const analytics = this.matchAnalytics.get(match.id);
    const performanceBonus = analytics ? analytics.excitementLevel * 0.5 : 1;

    const rewards: MatchRewards = {
      dojoCoins: Math.floor(baseCoins * performanceBonus),
      experience: Math.floor(baseExperience * performanceBonus),
      achievements: [],
      territoryControl: match.challengeId.includes('pilgrimage') || match.challengeId.includes('gauntlet'),
      clanInfluence: performanceBonus > 1.5 ? 10 : 5
    };

    // Add achievements based on performance
    if (analytics) {
      if (analytics.successfulShots / analytics.totalShots > 0.8) {
        rewards.achievements.push('Sharpshooter');
      }
      if (analytics.fouls === 0) {
        rewards.achievements.push('Clean Player');
      }
      if (analytics.excitementLevel > 0.8) {
        rewards.achievements.push('Thrilling Match');
      }
    }

    return rewards;
  }

  /**
   * Update challenge status after match completion
   */
  private async updateChallengeStatus(challengeId: string, matchResult: MatchResult): Promise<void> {
    try {
      await ChallengeService.completeChallenge(challengeId, {
        winnerId: matchResult.winnerId,
        matchData: matchResult
      });
    } catch (error) {
      console.error('Error updating challenge status:', error);
    }
  }

  /**
   * Distribute rewards to players
   */
  private async distributeRewards(matchResult: MatchResult): Promise<void> {
    // In a real implementation, this would integrate with the wallet/currency system
    console.log('Distributing rewards:', matchResult.rewards);
    
    // Emit reward distribution event
    this.emit('rewardsDistributed', matchResult);
  }

  // Helper methods for analytics calculations
  private calculateAverageShotTime(match: MatchData): number {
    const shots = match.events.filter(e => e.type === 'shot');
    if (shots.length === 0) return 0;
    
    const totalTime = shots.reduce((sum, shot, index) => {
      if (index === 0) return 0;
      const prevShot = shots[index - 1];
      return sum + (shot.timestamp.getTime() - prevShot.timestamp.getTime());
    }, 0);
    
    return totalTime / (shots.length - 1);
  }

  private calculatePlayerPerformance(match: MatchData): { player1: PlayerPerformance; player2: PlayerPerformance } {
    const player1Events = match.events.filter(e => e.playerId === match.player1Id);
    const player2Events = match.events.filter(e => e.playerId === match.player2Id);

    return {
      player1: this.calculateIndividualPerformance(player1Events),
      player2: this.calculateIndividualPerformance(player2Events)
    };
  }

  private calculateIndividualPerformance(events: MatchEvent[]): PlayerPerformance {
    const shots = events.filter(e => e.type === 'shot');
    const successfulShots = shots.filter(s => s.data?.success);
    const fouls = events.filter(e => e.type === 'foul');
    const breaks = events.filter(e => e.type === 'break');

    return {
      shots: shots.length,
      successfulShots: successfulShots.length,
      fouls: fouls.length,
      breaks: breaks.length,
      averageShotTime: this.calculateAverageShotTime({ events } as MatchData),
      accuracy: shots.length > 0 ? successfulShots.length / shots.length : 0,
      consistency: this.calculateConsistency(shots),
      pressureHandling: this.calculatePressureHandling(events)
    };
  }

  private calculateConsistency(shots: MatchEvent[]): number {
    if (shots.length < 2) return 1;
    
    const accuracies = shots.map(shot => shot.data?.accuracy || 0);
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    
    return Math.max(0, 1 - Math.sqrt(variance));
  }

  private calculatePressureHandling(events: MatchEvent[]): number {
    // Calculate pressure handling based on performance in high-stakes moments
    const lateGameEvents = events.filter(e => {
      // Consider events in the last 25% of the match as high-pressure
      return e.timestamp.getTime() > Date.now() - (Date.now() * 0.25);
    });
    
    if (lateGameEvents.length === 0) return 1;
    
    const lateGameShots = lateGameEvents.filter(e => e.type === 'shot');
    const lateGameSuccess = lateGameShots.filter(s => s.data?.success).length;
    
    return lateGameShots.length > 0 ? lateGameSuccess / lateGameShots.length : 1;
  }

  private calculateGameFlow(match: MatchData): GameFlowData[] {
    return match.events
      .filter(e => e.type === 'shot')
      .map((event, index) => ({
        timestamp: event.timestamp,
        score: this.getScoreAtTime(match, event.timestamp),
        momentum: this.calculateMomentum(match, index),
        excitement: this.calculateExcitementAtTime(match, event.timestamp)
      }));
  }

  private getScoreAtTime(match: MatchData, timestamp: Date): { player1: number; player2: number } {
    const eventsBefore = match.events.filter(e => e.timestamp <= timestamp);
    let player1Score = 0;
    let player2Score = 0;
    
    eventsBefore.forEach(event => {
      if (event.type === 'shot' && event.data?.success) {
        if (event.playerId === match.player1Id) {
          player1Score++;
        } else {
          player2Score++;
        }
      }
    });
    
    return { player1: player1Score, player2: player2Score };
  }

  private calculateMomentum(match: MatchData, eventIndex: number): number {
    // Calculate momentum based on recent performance
    const recentEvents = match.events.slice(Math.max(0, eventIndex - 5), eventIndex + 1);
    const successfulShots = recentEvents.filter(e => e.type === 'shot' && e.data?.success).length;
    
    return recentEvents.length > 0 ? successfulShots / recentEvents.length : 0.5;
  }

  private calculateExcitementAtTime(match: MatchData, timestamp: Date): number {
    // Calculate excitement based on game state and recent events
    const recentEvents = match.events.filter(e => 
      e.timestamp >= new Date(timestamp.getTime() - 60000) // Last minute
    );
    
    const scoreAtTime = this.getScoreAtTime(match, timestamp);
    const closeGame = Math.abs(scoreAtTime.player1 - scoreAtTime.player2) <= 2;
    const recentActivity = recentEvents.length > 3;
    
    return (closeGame ? 0.8 : 0.4) + (recentActivity ? 0.2 : 0);
  }

  private calculateSkillGap(match: MatchData): number {
    const analytics = this.matchAnalytics.get(match.id);
    if (!analytics) return 0;
    
    const p1Perf = analytics.playerPerformance.player1;
    const p2Perf = analytics.playerPerformance.player2;
    
    const p1Skill = (p1Perf.accuracy * 0.4) + (p1Perf.consistency * 0.3) + (p1Perf.pressureHandling * 0.3);
    const p2Skill = (p2Perf.accuracy * 0.4) + (p2Perf.consistency * 0.3) + (p2Perf.pressureHandling * 0.3);
    
    return Math.abs(p1Skill - p2Skill);
  }

  private calculateExcitementLevel(match: MatchData): number {
    const analytics = this.matchAnalytics.get(match.id);
    if (!analytics) return 0.5;
    
    const closeGame = Math.abs(match.score.player1 - match.score.player2) <= 2;
    const highActivity = analytics.totalShots > 20;
    const amazingShots = analytics.successfulShots / analytics.totalShots > 0.7;
    
    let excitement = 0.5;
    if (closeGame) excitement += 0.3;
    if (highActivity) excitement += 0.2;
    if (amazingShots) excitement += 0.2;
    
    return Math.min(1, excitement);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.activeMatches.clear();
    this.matchAnalytics.clear();
  }
}

export default RealTimeMatchTrackingService; 