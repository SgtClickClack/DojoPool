/**
 * DojoPool Match Replay Analytics Service
 * 
 * This service analyzes replay data to generate insights, identify highlight-worthy
 * moments, and provide statistics about matches and players.
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../lib/db';
import ReplayService from './replayService';
import { 
  ReplayMetadata, 
  ReplayFrame, 
  ReplayHighlight, 
  ReplayEventType,
  BallPosition
} from './replayTypes';
import analyticsService from '../analyticsService';

/**
 * Statistics for a player in a match
 */
interface PlayerMatchStats {
  playerId: string;
  shotsTaken: number;
  ballsPocketed: number;
  fouls: number;
  avgShotTime: number;
  longestShot: number;
  impressiveShots: number;
  turnsPlayed: number;
  winRate: number;
}

/**
 * Shot trajectory analysis
 */
interface ShotTrajectory {
  startPosition: { x: number, y: number };
  endPosition: { x: number, y: number };
  ballsHit: number[];
  pocketedBalls: number[];
  distance: number;
  complexity: number; // 0-1 score of shot difficulty
}

/**
 * Analytics for a match replay
 */
interface ReplayAnalytics {
  replayId: string;
  matchId: string;
  duration: number;
  totalShots: number;
  averageShotTime: number;
  longestShot: number;
  mostComplexShot: number;
  totalBallsPocketed: number;
  totalFouls: number;
  playerStats: Record<string, PlayerMatchStats>;
  highlights: ReplayHighlight[];
  gameFlow: 'one-sided' | 'back-and-forth' | 'close' | 'comeback';
  matchIntensity: number; // 0-1 score
  generatedAt: number;
}

/**
 * Service for analyzing match replays
 */
class ReplayAnalyticsService {
  private replayService: ReplayService;
  private analyticsCacheExpiry: number = 3600000; // 1 hour in milliseconds
  private analyticsCache: Map<string, { data: ReplayAnalytics, timestamp: number }>;
  
  // Singleton instance
  private static instance: ReplayAnalyticsService;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ReplayAnalyticsService {
    if (!ReplayAnalyticsService.instance) {
      ReplayAnalyticsService.instance = new ReplayAnalyticsService();
    }
    return ReplayAnalyticsService.instance;
  }
  
  /**
   * Constructor
   */
  private constructor() {
    this.replayService = new ReplayService();
    this.analyticsCache = new Map();
  }
  
  /**
   * Generate or retrieve analytics for a replay
   * @param replayId The ID of the replay
   * @param forceRefresh Whether to force a refresh of the analytics
   * @returns The analytics for the replay
   */
  public async getReplayAnalytics(
    replayId: string, 
    forceRefresh: boolean = false
  ): Promise<ReplayAnalytics> {
    // Check cache first
    const cached = this.analyticsCache.get(replayId);
    const now = Date.now();
    
    if (cached && !forceRefresh && (now - cached.timestamp) < this.analyticsCacheExpiry) {
      return cached.data;
    }
    
    // Generate analytics
    try {
      // Get replay metadata
      const metadata = await this.replayService.getReplayMetadata(replayId);
      
      // Get all frames
      const frames = await this.replayService.getReplayFrames(replayId);
      
      // Generate analytics
      const analytics = await this.generateAnalytics(metadata, frames);
      
      // Cache results
      this.analyticsCache.set(replayId, {
        data: analytics,
        timestamp: now
      });
      
      // Track analytics generation
      analyticsService.trackEvent('replay_analytics_generated', {
        replayId,
        totalShots: analytics.totalShots,
        duration: analytics.duration,
        matchIntensity: analytics.matchIntensity
      });
      
      return analytics;
    } catch (error) {
      console.error(`Error generating analytics for replay ${replayId}:`, error);
      throw new Error(`Failed to generate analytics: ${error.message}`);
    }
  }
  
  /**
   * Generate analytics for a replay
   * @param metadata The replay metadata
   * @param frames The replay frames
   * @returns The analytics for the replay
   */
  private async generateAnalytics(
    metadata: ReplayMetadata, 
    frames: ReplayFrame[]
  ): Promise<ReplayAnalytics> {
    // Initialize player stats
    const playerStats: Record<string, PlayerMatchStats> = {};
    for (const player of metadata.players) {
      playerStats[player.id] = {
        playerId: player.id,
        shotsTaken: 0,
        ballsPocketed: 0,
        fouls: 0,
        avgShotTime: 0,
        longestShot: 0,
        impressiveShots: 0,
        turnsPlayed: 0,
        winRate: 0
      };
    }
    
    // Track shots
    const shots: {
      playerId: string;
      startFrame: number;
      endFrame: number;
      duration: number;
      ballsHit: number[];
      ballsPocketed: number[];
      trajectory?: ShotTrajectory;
      complexity: number;
    }[] = [];
    
    // Initialize counters
    let totalShots = 0;
    let totalShotTime = 0;
    let longestShot = 0;
    let totalBallsPocketed = 0;
    let totalFouls = 0;
    let mostComplexShot = 0;
    
    // Process frames to extract shot data
    let currentShot: {
      playerId: string;
      startFrame: number;
      startTime: number;
      ballPositions: BallPosition[];
    } | null = null;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // Track turns played
      if (i > 0 && frames[i-1].playerTurn !== frame.playerTurn) {
        playerStats[frame.playerTurn].turnsPlayed++;
      }
      
      // Process events in frame
      for (const event of frame.events) {
        switch (event.type) {
          case 'shot_started':
            // Start new shot
            currentShot = {
              playerId: frame.playerTurn,
              startFrame: i,
              startTime: parseInt(frame.timestamp),
              ballPositions: [...frame.ballPositions]
            };
            break;
            
          case 'shot_completed':
            // Complete shot if one is in progress
            if (currentShot) {
              const shotDuration = (parseInt(frame.timestamp) - currentShot.startTime) / 1000; // in seconds
              const ballsHit = this.detectBallsHit(currentShot.ballPositions, frame.ballPositions);
              const ballsPocketed = this.detectPocketedBalls(currentShot.ballPositions, frame.ballPositions);
              const trajectory = this.analyzeShotTrajectory(currentShot.ballPositions, frame.ballPositions, ballsHit, ballsPocketed);
              const complexity = this.calculateShotComplexity(trajectory, ballsHit.length, ballsPocketed.length);
              
              // Update stats
              totalShots++;
              totalShotTime += shotDuration;
              longestShot = Math.max(longestShot, shotDuration);
              totalBallsPocketed += ballsPocketed.length;
              mostComplexShot = Math.max(mostComplexShot, complexity);
              
              // Update player stats
              playerStats[currentShot.playerId].shotsTaken++;
              playerStats[currentShot.playerId].ballsPocketed += ballsPocketed.length;
              playerStats[currentShot.playerId].avgShotTime = 
                (playerStats[currentShot.playerId].avgShotTime * (playerStats[currentShot.playerId].shotsTaken - 1) + shotDuration) / 
                playerStats[currentShot.playerId].shotsTaken;
              playerStats[currentShot.playerId].longestShot = Math.max(playerStats[currentShot.playerId].longestShot, shotDuration);
              
              // Track shot
              shots.push({
                playerId: currentShot.playerId,
                startFrame: currentShot.startFrame,
                endFrame: i,
                duration: shotDuration,
                ballsHit,
                ballsPocketed,
                trajectory,
                complexity
              });
              
              // Reset current shot
              currentShot = null;
            }
            break;
            
          case 'foul_committed':
            totalFouls++;
            if (event.data && event.data.playerId) {
              playerStats[event.data.playerId].fouls++;
            }
            break;
            
          case 'impressive_shot':
            if (event.data && event.data.playerId) {
              playerStats[event.data.playerId].impressiveShots++;
            }
            break;
        }
      }
    }
    
    // Calculate average shot time
    const averageShotTime = totalShots > 0 ? totalShotTime / totalShots : 0;
    
    // Calculate win rates
    const playerMatches = await this.getPlayerMatchHistory(metadata.players.map(p => p.id));
    for (const playerId in playerStats) {
      const playerMatches = await this.getPlayerMatchHistory([playerId]);
      const matchesWithOutcome = playerMatches.filter(m => m.winner !== undefined);
      const wins = matchesWithOutcome.filter(m => m.winner === playerId);
      playerStats[playerId].winRate = matchesWithOutcome.length > 0 ? wins.length / matchesWithOutcome.length : 0;
    }
    
    // Generate highlights
    const highlights = await this.generateHighlights(metadata, frames, shots);
    
    // Analyze game flow
    const gameFlow = this.analyzeGameFlow(frames);
    
    // Calculate match intensity based on multiple factors
    const matchIntensity = this.calculateMatchIntensity(
      shots, 
      totalShots, 
      totalFouls, 
      metadata.duration,
      gameFlow
    );
    
    return {
      replayId: metadata.id,
      matchId: metadata.matchId,
      duration: metadata.duration,
      totalShots,
      averageShotTime,
      longestShot,
      mostComplexShot,
      totalBallsPocketed,
      totalFouls,
      playerStats,
      highlights,
      gameFlow,
      matchIntensity,
      generatedAt: Date.now()
    };
  }
  
  /**
   * Get player match history
   * @param playerIds Array of player IDs
   * @returns Array of match metadata
   */
  private async getPlayerMatchHistory(playerIds: string[]): Promise<ReplayMetadata[]> {
    const history: ReplayMetadata[] = [];
    
    try {
      // Get up to 20 recent matches for each player
      for (const playerId of playerIds) {
        const playerReplays = await this.replayService.getReplays({
          playerIds: [playerId],
          limit: 20
        });
        
        history.push(...playerReplays);
      }
      
      // Remove duplicates
      const uniqueMatches = new Map<string, ReplayMetadata>();
      for (const match of history) {
        uniqueMatches.set(match.id, match);
      }
      
      return Array.from(uniqueMatches.values());
    } catch (error) {
      console.error('Error getting player match history:', error);
      return [];
    }
  }
  
  /**
   * Detect which balls were hit during a shot
   * @param startPositions Ball positions at the start of the shot
   * @param endPositions Ball positions at the end of the shot
   * @returns Array of ball numbers that were hit
   */
  private detectBallsHit(
    startPositions: BallPosition[], 
    endPositions: BallPosition[]
  ): number[] {
    const hitBalls: number[] = [];
    
    // Create maps for easy lookup
    const startMap = new Map<number, BallPosition>();
    for (const ball of startPositions) {
      startMap.set(ball.ballNumber, ball);
    }
    
    const endMap = new Map<number, BallPosition>();
    for (const ball of endPositions) {
      endMap.set(ball.ballNumber, ball);
    }
    
    // Check which balls moved
    for (const [ballNumber, startPos] of startMap.entries()) {
      const endPos = endMap.get(ballNumber);
      
      // Skip if ball wasn't present at the end (pocketed)
      if (!endPos && !startPos.pocketed) {
        hitBalls.push(ballNumber);
        continue;
      }
      
      // Skip if the ball was already pocketed
      if (startPos.pocketed) {
        continue;
      }
      
      // Check if the ball moved significantly
      if (endPos && (
        Math.abs(startPos.x - endPos.x) > 0.01 || 
        Math.abs(startPos.y - endPos.y) > 0.01 ||
        endPos.pocketed
      )) {
        hitBalls.push(ballNumber);
      }
    }
    
    return hitBalls;
  }
  
  /**
   * Detect which balls were pocketed during a shot
   * @param startPositions Ball positions at the start of the shot
   * @param endPositions Ball positions at the end of the shot
   * @returns Array of ball numbers that were pocketed
   */
  private detectPocketedBalls(
    startPositions: BallPosition[],
    endPositions: BallPosition[]
  ): number[] {
    const pocketedBalls: number[] = [];
    
    // Create maps for easy lookup
    const startMap = new Map<number, BallPosition>();
    for (const ball of startPositions) {
      startMap.set(ball.ballNumber, ball);
    }
    
    const endMap = new Map<number, BallPosition>();
    for (const ball of endPositions) {
      endMap.set(ball.ballNumber, ball);
    }
    
    // Find balls that were pocketed during this shot
    for (const [ballNumber, startPos] of startMap.entries()) {
      const endPos = endMap.get(ballNumber);
      
      // If the ball was not pocketed before and is now pocketed
      if (!startPos.pocketed && endPos && endPos.pocketed) {
        pocketedBalls.push(ballNumber);
      }
      
      // If the ball is not in the end positions (implied to be pocketed)
      if (!startPos.pocketed && !endPos) {
        pocketedBalls.push(ballNumber);
      }
    }
    
    return pocketedBalls;
  }
  
  /**
   * Analyze the trajectory of a shot
   * @param startPositions Ball positions at the start of the shot
   * @param endPositions Ball positions at the end of the shot
   * @param ballsHit Balls that were hit during the shot
   * @param ballsPocketed Balls that were pocketed during the shot
   * @returns Shot trajectory analysis
   */
  private analyzeShotTrajectory(
    startPositions: BallPosition[],
    endPositions: BallPosition[],
    ballsHit: number[],
    ballsPocketed: number[]
  ): ShotTrajectory {
    // Find the cue ball (typically ball 0 or 1 depending on the system)
    const cueBallStart = startPositions.find(b => b.ballNumber === 0) || startPositions.find(b => b.ballNumber === 1);
    const cueBallEnd = endPositions.find(b => b.ballNumber === 0) || endPositions.find(b => b.ballNumber === 1);
    
    // Default positions if cue ball not found
    const startPosition = cueBallStart ? { x: cueBallStart.x, y: cueBallStart.y } : { x: 0, y: 0 };
    const endPosition = cueBallEnd ? { x: cueBallEnd.x, y: cueBallEnd.y } : { x: 0, y: 0 };
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(endPosition.x - startPosition.x, 2) + 
      Math.pow(endPosition.y - startPosition.y, 2)
    );
    
    return {
      startPosition,
      endPosition,
      ballsHit,
      pocketedBalls: ballsPocketed,
      distance,
      complexity: 0 // Will be calculated later
    };
  }
  
  /**
   * Calculate the complexity of a shot
   * @param trajectory Shot trajectory
   * @param ballsHitCount Number of balls hit
   * @param ballsPocketedCount Number of balls pocketed
   * @returns Complexity score between 0 and 1
   */
  private calculateShotComplexity(
    trajectory: ShotTrajectory,
    ballsHitCount: number,
    ballsPocketedCount: number
  ): number {
    // Factors that contribute to complexity:
    // 1. Distance traveled by cue ball
    // 2. Number of balls hit
    // 3. Number of balls pocketed
    // 4. Positioning (how close the cue ball ended to a rail or another ball) - approximated
    
    // Normalize distance (max table diagonal is around 1.4 for normalized coordinates)
    const normalizedDistance = Math.min(trajectory.distance / 1.4, 1);
    
    // Normalize balls hit (typical max in pool is around 5 balls)
    const normalizedBallsHit = Math.min(ballsHitCount / 5, 1);
    
    // Normalize balls pocketed (typical max in pool is around 3 in one shot)
    const normalizedBallsPocketed = Math.min(ballsPocketedCount / 3, 1);
    
    // Combined score with weights
    const complexity = (
      normalizedDistance * 0.2 +
      normalizedBallsHit * 0.3 +
      normalizedBallsPocketed * 0.5
    );
    
    return Math.min(complexity, 1);
  }
  
  /**
   * Analyze the flow of a game
   * @param frames Array of replay frames
   * @returns Description of the game flow
   */
  private analyzeGameFlow(frames: ReplayFrame[]): 'one-sided' | 'back-and-forth' | 'close' | 'comeback' {
    // Skip if no frames
    if (frames.length === 0) {
      return 'close'; // Default
    }
    
    // Get player IDs
    const players = Object.keys(frames[0].scoreState);
    if (players.length !== 2) {
      return 'close'; // Default for non-standard games
    }
    
    // Track score changes
    const scoreDiffs: number[] = [];
    let previousLeader: string | null = null;
    let leadershipChanges = 0;
    
    for (const frame of frames) {
      const p1Score = frame.scoreState[players[0]] || 0;
      const p2Score = frame.scoreState[players[1]] || 0;
      const diff = p1Score - p2Score;
      
      // Track score difference
      scoreDiffs.push(diff);
      
      // Track leadership changes
      const currentLeader = diff > 0 ? players[0] : diff < 0 ? players[1] : null;
      if (previousLeader !== null && currentLeader !== null && previousLeader !== currentLeader) {
        leadershipChanges++;
      }
      previousLeader = currentLeader;
    }
    
    // Calculate final score difference
    const finalScoreDiff = Math.abs(scoreDiffs[scoreDiffs.length - 1]);
    const maxScoreDiff = Math.max(...scoreDiffs.map(d => Math.abs(d)));
    
    // Check for comeback (score diff was larger earlier but ended close)
    const comebackThreshold = 3; // Threshold for what constitutes a comeback
    const hadComeback = maxScoreDiff - finalScoreDiff >= comebackThreshold;
    
    // Determine game flow
    if (leadershipChanges >= 3) {
      return 'back-and-forth';
    } else if (finalScoreDiff <= 1) {
      return 'close';
    } else if (hadComeback) {
      return 'comeback';
    } else {
      return 'one-sided';
    }
  }
  
  /**
   * Calculate match intensity based on various factors
   * @param shots Array of shot data
   * @param totalShots Total shots taken
   * @param totalFouls Total fouls committed
   * @param duration Duration of the match in seconds
   * @param gameFlow Flow of the game
   * @returns Intensity score between 0 and 1
   */
  private calculateMatchIntensity(
    shots: any[],
    totalShots: number,
    totalFouls: number,
    duration: number,
    gameFlow: 'one-sided' | 'back-and-forth' | 'close' | 'comeback'
  ): number {
    // Factors that contribute to intensity:
    // 1. Shot complexity
    // 2. Shot frequency
    // 3. Fouls
    // 4. Game flow
    
    // Calculate average complexity
    const avgComplexity = shots.reduce((sum, s) => sum + s.complexity, 0) / Math.max(shots.length, 1);
    
    // Calculate shot frequency (shots per minute)
    const shotFrequency = (totalShots / (duration / 60));
    const normalizedShotFrequency = Math.min(shotFrequency / 10, 1); // 10 shots per minute is high
    
    // Normalize fouls (5 fouls in a game is a lot)
    const normalizedFouls = Math.min(totalFouls / 5, 1);
    
    // Game flow factor
    const gameFlowFactor = {
      'one-sided': 0.25,
      'back-and-forth': 0.8,
      'close': 1.0,
      'comeback': 0.9
    }[gameFlow];
    
    // Combined score with weights
    const intensity = (
      avgComplexity * 0.4 +
      normalizedShotFrequency * 0.2 +
      normalizedFouls * 0.1 +
      gameFlowFactor * 0.3
    );
    
    return Math.min(intensity, 1);
  }
  
  /**
   * Generate highlights for a replay
   * @param metadata Replay metadata
   * @param frames Array of replay frames
   * @param shots Array of shot data
   * @returns Array of highlights
   */
  private async generateHighlights(
    metadata: ReplayMetadata,
    frames: ReplayFrame[],
    shots: any[]
  ): Promise<ReplayHighlight[]> {
    const highlights: ReplayHighlight[] = [];
    
    try {
      // Identify significant shots:
      // 1. Complex shots (top 10% complexity)
      // 2. Game winning shots
      // 3. Multiple balls pocketed
      // 4. Shots that led to comebacks
      
      // Calculate complexity threshold (top 10%)
      const sortedByComplexity = [...shots].sort((a, b) => b.complexity - a.complexity);
      const complexityThreshold = sortedByComplexity.length > 0 
        ? sortedByComplexity[Math.floor(sortedByComplexity.length * 0.1)].complexity
        : 0.7; // Fallback if no shots
      
      // Find game winning shot
      const gameEndEvent = frames.findIndex(f => 
        f.events.some(e => e.type === 'game_ended')
      );
      
      // Process each shot
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        
        // Check if this is the game winning shot
        const isGameWinning = gameEndEvent >= 0 && 
          shot.startFrame <= gameEndEvent && 
          shot.endFrame >= gameEndEvent;
        
        // Check if multiple balls were pocketed
        const hasMultiplePocketed = shot.ballsPocketed.length >= 2;
        
        // Check if this is a complex shot
        const isComplex = shot.complexity >= complexityThreshold;
        
        // Generate highlight if any criteria met
        if (isGameWinning || hasMultiplePocketed || isComplex) {
          let type: ReplayHighlight['type'] = 'user_created';
          
          if (isGameWinning) {
            type = 'game_winning';
          } else if (isComplex) {
            type = 'impressive_shot';
          }
          
          // Add buffer frames before and after the shot
          const bufferFrames = Math.floor(frames.length * 0.05); // 5% of total frames
          const startFrame = Math.max(0, shot.startFrame - bufferFrames);
          const endFrame = Math.min(frames.length - 1, shot.endFrame + bufferFrames);
          
          // Calculate timestamps
          const startTime = parseInt(frames[startFrame].timestamp);
          const endTime = parseInt(frames[endFrame].timestamp);
          
          // Create highlight
          highlights.push({
            id: uuidv4(),
            replayId: metadata.id,
            title: this.generateHighlightTitle(shot, isGameWinning, hasMultiplePocketed, isComplex),
            description: this.generateHighlightDescription(shot, metadata),
            startFrame,
            endFrame,
            startTime,
            endTime,
            type,
            createdBy: 'system',
            createdAt: Date.now()
          });
        }
      }
      
      // Store highlights in the database
      if (highlights.length > 0) {
        await this.replayService.updateReplay({
          replayId: metadata.id,
          highlights
        });
      }
      
      return highlights;
    } catch (error) {
      console.error(`Error generating highlights for replay ${metadata.id}:`, error);
      return [];
    }
  }
  
  /**
   * Generate a title for a highlight
   * @param shot Shot data
   * @param isGameWinning Whether this is the game winning shot
   * @param hasMultiplePocketed Whether multiple balls were pocketed
   * @param isComplex Whether this is a complex shot
   * @returns Highlight title
   */
  private generateHighlightTitle(
    shot: any,
    isGameWinning: boolean,
    hasMultiplePocketed: boolean,
    isComplex: boolean
  ): string {
    if (isGameWinning) {
      return `Game Winning Shot`;
    } else if (hasMultiplePocketed && shot.ballsPocketed.length >= 3) {
      return `Triple! ${shot.ballsPocketed.length} Balls in One Shot`;
    } else if (hasMultiplePocketed) {
      return `Double! 2 Balls in One Shot`;
    } else if (isComplex) {
      return `Impressive Shot`;
    } else {
      return `Great Shot`;
    }
  }
  
  /**
   * Generate a description for a highlight
   * @param shot Shot data
   * @param metadata Replay metadata
   * @returns Highlight description
   */
  private generateHighlightDescription(shot: any, metadata: ReplayMetadata): string {
    const player = metadata.players.find(p => p.id === shot.playerId);
    const playerName = player ? player.name : 'Player';
    
    let description = `${playerName} makes `;
    
    if (shot.ballsPocketed.length > 0) {
      description += `a shot pocketing ${shot.ballsPocketed.length} ball${shot.ballsPocketed.length !== 1 ? 's' : ''}`;
    } else {
      description += 'a skillful shot';
    }
    
    if (shot.complexity > 0.7) {
      description += ' with impressive precision';
    }
    
    return description;
  }
  
  /**
   * Get highlights for a replay
   * @param replayId The ID of the replay
   * @returns Array of highlights
   */
  public async getHighlights(replayId: string): Promise<ReplayHighlight[]> {
    try {
      const metadata = await this.replayService.getReplayMetadata(replayId);
      return metadata.highlights;
    } catch (error) {
      console.error(`Error getting highlights for replay ${replayId}:`, error);
      return [];
    }
  }
  
  /**
   * Get player statistics across multiple matches
   * @param playerId The ID of the player
   * @param limit Maximum number of matches to analyze
   * @returns Player statistics
   */
  public async getPlayerStats(
    playerId: string, 
    limit: number = 10
  ): Promise<{
    matchesPlayed: number;
    matchesWon: number;
    totalShots: number;
    avgShotsPerMatch: number;
    totalBallsPocketed: number;
    avgBallsPocketedPerMatch: number;
    totalFouls: number;
    avgShotTime: number;
    impressiveShots: number;
    winRate: number;
    recentMatches: {
      replayId: string;
      matchId: string;
      date: number;
      opponent: string;
      result: 'win' | 'loss' | 'unknown';
      stats: PlayerMatchStats;
    }[];
  }> {
    try {
      // Get player's recent matches
      const replays = await this.replayService.getReplays({
        playerIds: [playerId],
        limit,
        sortBy: 'date',
        sortOrder: 'desc'
      });
      
      // Get analytics for each match
      const matchAnalytics: ReplayAnalytics[] = [];
      for (const replay of replays) {
        const analytics = await this.getReplayAnalytics(replay.id);
        matchAnalytics.push(analytics);
      }
      
      // Compile statistics
      let totalShots = 0;
      let totalBallsPocketed = 0;
      let totalFouls = 0;
      let totalShotTime = 0;
      let totalImpressiveShots = 0;
      let matchesWon = 0;
      
      const recentMatches = matchAnalytics.map(a => {
        const replay = replays.find(r => r.id === a.replayId)!;
        const playerStats = a.playerStats[playerId];
        const opponent = replay.players.find(p => p.id !== playerId);
        
        // Update totals
        totalShots += playerStats.shotsTaken;
        totalBallsPocketed += playerStats.ballsPocketed;
        totalFouls += playerStats.fouls;
        totalShotTime += playerStats.avgShotTime * playerStats.shotsTaken;
        totalImpressiveShots += playerStats.impressiveShots;
        
        if (replay.winner === playerId) {
          matchesWon++;
        }
        
        return {
          replayId: replay.id,
          matchId: replay.matchId,
          date: replay.endTime,
          opponent: opponent ? opponent.name : 'Unknown',
          result: replay.winner === playerId ? 'win' : replay.winner ? 'loss' : 'unknown',
          stats: playerStats
        };
      });
      
      // Calculate aggregates
      const matchesPlayed = replays.length;
      const avgShotsPerMatch = matchesPlayed > 0 ? totalShots / matchesPlayed : 0;
      const avgBallsPocketedPerMatch = matchesPlayed > 0 ? totalBallsPocketed / matchesPlayed : 0;
      const avgShotTime = totalShots > 0 ? totalShotTime / totalShots : 0;
      const winRate = matchesPlayed > 0 ? matchesWon / matchesPlayed : 0;
      
      return {
        matchesPlayed,
        matchesWon,
        totalShots,
        avgShotsPerMatch,
        totalBallsPocketed,
        avgBallsPocketedPerMatch,
        totalFouls,
        avgShotTime,
        impressiveShots: totalImpressiveShots,
        winRate,
        recentMatches
      };
    } catch (error) {
      console.error(`Error getting player stats for player ${playerId}:`, error);
      throw new Error(`Failed to get player stats: ${error.message}`);
    }
  }
}

// Export singleton instance
export default ReplayAnalyticsService.getInstance(); 