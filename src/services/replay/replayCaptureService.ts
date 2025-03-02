/**
 * DojoPool Match Replay Capture Service
 * 
 * This service is responsible for capturing real-time match data and storing it
 * for replay purposes. It interfaces with the computer vision system to track
 * ball positions, cue movements, and game events.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  BallPosition, 
  CuePosition, 
  ReplayEvent, 
  ReplayFrame, 
  ReplayMetadata,
  CreateReplayParams,
  ReplayEventType
} from './replayTypes';
import ReplayService from './replayService';
import notificationService, { NOTIFICATION_TYPES } from '../notificationService';
import GameMonitorRegistry from '../game/gameMonitorRegistry';
import gameService from '../game/gameService';
import eventBusService from '../eventBus/eventBusService';

/**
 * Configuration for the replay capture service
 */
interface ReplayCaptureConfig {
  frameRate: number;      // Frames to capture per second
  captureEvents: boolean; // Whether to capture events
  notifyPlayers: boolean; // Whether to notify players when replay is ready
}

/**
 * Service for capturing match replay data
 */
export class ReplayCaptureService {
  private replayService: ReplayService;
  private activeCaptures: Map<string, {
    replayId: string;
    config: ReplayCaptureConfig;
    frameCount: number;
    lastCapturedTime: number;
    interval: NodeJS.Timeout | null;
  }>;
  private defaultConfig: ReplayCaptureConfig = {
    frameRate: 15,        // 15 FPS by default
    captureEvents: true,  // Capture events by default
    notifyPlayers: true   // Notify players by default
  };

  // Singleton instance
  private static instance: ReplayCaptureService;

  /**
   * Get singleton instance
   */
  public static getInstance(): ReplayCaptureService {
    if (!ReplayCaptureService.instance) {
      ReplayCaptureService.instance = new ReplayCaptureService();
    }
    return ReplayCaptureService.instance;
  }

  /**
   * Constructor
   */
  private constructor() {
    this.replayService = new ReplayService();
    this.activeCaptures = new Map();
  }

  /**
   * Start capturing replay data for a match
   * @param params Parameters for creating the replay
   * @param config Configuration for the capture
   * @returns The ID of the created replay
   */
  public async startCapture(
    params: CreateReplayParams,
    config: Partial<ReplayCaptureConfig> = {}
  ): Promise<string> {
    try {
      // Create replay metadata
      const replayMetadata = await this.replayService.createReplay(params);
      const replayId = replayMetadata.id;
      
      // Merge config with defaults
      const fullConfig: ReplayCaptureConfig = {
        ...this.defaultConfig,
        ...config
      };
      
      // Store capture information
      this.activeCaptures.set(params.matchId, {
        replayId,
        config: fullConfig,
        frameCount: 0,
        lastCapturedTime: Date.now(),
        interval: null
      });
      
      // Start capture interval
      const captureInterval = 1000 / fullConfig.frameRate;
      const interval = setInterval(() => {
        this.captureFrame(params.matchId).catch(err => {
          console.error(`Error capturing frame for match ${params.matchId}:`, err);
        });
      }, captureInterval);
      
      // Update interval reference
      const captureInfo = this.activeCaptures.get(params.matchId)!;
      captureInfo.interval = interval;
      this.activeCaptures.set(params.matchId, captureInfo);
      
      console.log(`Started replay capture for match ${params.matchId} with ID ${replayId}`);
      return replayId;
    } catch (error) {
      console.error(`Failed to start replay capture for match ${params.matchId}:`, error);
      throw error;
    }
  }
  
  /**
   * Capture a single frame for a match
   * @param matchId The ID of the match
   * @returns The ID of the captured frame
   */
  private async captureFrame(matchId: string): Promise<string | null> {
    const captureInfo = this.activeCaptures.get(matchId);
    if (!captureInfo) {
      console.warn(`No active capture found for match ${matchId}`);
      return null;
    }
    
    try {
      // Get current game state from the computer vision system or game logic
      const gameState = await this.getCurrentGameState(matchId);
      
      if (!gameState) {
        console.warn(`No game state available for match ${matchId}`);
        return null;
      }
      
      // Create frame object
      const frame: Omit<ReplayFrame, 'id'> = {
        matchId,
        replayId: captureInfo.replayId,
        timestamp: gameState.timestamp.toString(),
        sequenceNumber: captureInfo.frameCount,
        ballPositions: gameState.ballPositions,
        cuePosition: gameState.cuePosition,
        tableState: gameState.tableState,
        playerTurn: gameState.playerTurn,
        scoreState: gameState.scoreState,
        shotInProgress: gameState.shotInProgress,
        events: gameState.events || []
      };
      
      // Store frame
      const frameId = await this.replayService.addFrame(frame);
      
      // Update capture info
      captureInfo.frameCount++;
      captureInfo.lastCapturedTime = Date.now();
      this.activeCaptures.set(matchId, captureInfo);
      
      return frameId;
    } catch (error) {
      console.error(`Error capturing frame for match ${matchId}:`, error);
      return null;
    }
  }
  
  /**
   * Stop capturing replay data for a match
   * @param matchId The ID of the match
   * @param winner Optional ID of the match winner
   * @returns The metadata for the completed replay
   */
  public async stopCapture(matchId: string, winner?: string): Promise<ReplayMetadata | null> {
    const captureInfo = this.activeCaptures.get(matchId);
    if (!captureInfo) {
      console.warn(`No active capture found for match ${matchId}`);
      return null;
    }
    
    try {
      // Clear capture interval
      if (captureInfo.interval) {
        clearInterval(captureInfo.interval);
      }
      
      // Finalize replay
      const replayMetadata = await this.replayService.finalizeReplay(
        captureInfo.replayId,
        winner
      );
      
      // Clean up
      this.activeCaptures.delete(matchId);
      
      // Notify players if configured
      if (captureInfo.config.notifyPlayers) {
        this.notifyPlayers(replayMetadata);
      }
      
      console.log(`Stopped replay capture for match ${matchId}`);
      
      return replayMetadata;
    } catch (error) {
      console.error(`Failed to stop replay capture for match ${matchId}:`, error);
      return null;
    }
  }
  
  /**
   * Record a specific event during a match
   * @param matchId The ID of the match
   * @param eventType The type of event
   * @param data Additional data for the event
   * @returns True if the event was recorded successfully
   */
  public async recordEvent(
    matchId: string, 
    eventType: ReplayEventType,
    data: any = {}
  ): Promise<boolean> {
    const captureInfo = this.activeCaptures.get(matchId);
    if (!captureInfo || !captureInfo.config.captureEvents) {
      return false;
    }
    
    try {
      // Create event object
      const event: ReplayEvent = {
        id: uuidv4(),
        type: eventType,
        timestamp: Date.now().toString(),
        data
      };
      
      // Force an immediate frame capture to include this event
      const frameData = await this.getCurrentGameState(matchId);
      if (frameData) {
        frameData.events = frameData.events || [];
        frameData.events.push(event);
        
        // Create and store the frame with the event
        const frame: Omit<ReplayFrame, 'id'> = {
          matchId,
          replayId: captureInfo.replayId,
          timestamp: frameData.timestamp.toString(),
          sequenceNumber: captureInfo.frameCount,
          ballPositions: frameData.ballPositions,
          cuePosition: frameData.cuePosition,
          tableState: frameData.tableState,
          playerTurn: frameData.playerTurn,
          scoreState: frameData.scoreState,
          shotInProgress: frameData.shotInProgress,
          events: frameData.events
        };
        
        await this.replayService.addFrame(frame);
        
        // Update capture info
        captureInfo.frameCount++;
        captureInfo.lastCapturedTime = Date.now();
        this.activeCaptures.set(matchId, captureInfo);
        
        // For impressive shots, create a highlight automatically
        if (eventType === 'impressive_shot') {
          // Create highlight spanning from 2 seconds before to 2 seconds after
          const frameRate = captureInfo.config.frameRate;
          const startFrame = Math.max(0, captureInfo.frameCount - (2 * frameRate));
          const endFrame = captureInfo.frameCount + (2 * frameRate);
          
          await this.replayService.createHighlight(
            captureInfo.replayId,
            'Impressive Shot',
            startFrame,
            endFrame,
            'impressive_shot',
            frameData.playerTurn, // Creator is the player who made the shot
            data.description || 'An impressive shot detected by the system'
          );
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error recording event for match ${matchId}:`, error);
      return false;
    }
  }
  
  /**
   * Get the current state of a match from the computer vision system or game logic
   * @param matchId The ID of the match
   * @returns The current game state
   */
  private async getCurrentGameState(matchId: string): Promise<{
    timestamp: number;
    ballPositions: BallPosition[];
    cuePosition?: CuePosition;
    tableState: string;
    playerTurn: string;
    scoreState: Record<string, number>;
    shotInProgress: boolean;
    events?: ReplayEvent[];
  } | null> {
    try {
      // Get the vision system monitor for this match
      const gameMonitor = GameMonitorRegistry.getMonitorForMatch(matchId);
      
      if (!gameMonitor) {
        console.warn(`No game monitor found for match ${matchId}, falling back to simulation`);
        return this.simulateGameState(matchId);
      }
      
      // Request the current frame from the game monitor
      const visionFrame = await gameMonitor.getCurrentFrame();
      
      if (!visionFrame) {
        console.warn(`No vision frame available for match ${matchId}, falling back to simulation`);
        return this.simulateGameState(matchId);
      }
      
      // Get match state from the game service
      const matchState = await gameService.getMatchState(matchId);
      
      if (!matchState) {
        console.warn(`No match state available for match ${matchId}, falling back to simulation`);
        return this.simulateGameState(matchId);
      }
      
      // Convert ball positions from vision system format to replay format
      const ballPositions: BallPosition[] = visionFrame.ball_positions.map(ball => ({
        ballNumber: ball.ball_number,
        x: ball.x,
        y: ball.y,
        pocketed: ball.is_pocketed || false
      }));
      
      // Convert cue position if available
      let cuePosition: CuePosition | undefined = undefined;
      if (visionFrame.cue_position) {
        cuePosition = {
          originX: visionFrame.cue_position.origin_x,
          originY: visionFrame.cue_position.origin_y,
          angle: visionFrame.cue_position.angle,
          power: visionFrame.cue_position.power || 0
        };
      }
      
      // Get any recent events from the event bus that haven't been captured yet
      const recentEvents = await eventBusService.getRecentEventsForMatch(matchId);
      
      // Convert event bus events to replay events
      const events: ReplayEvent[] = recentEvents.map(event => ({
        id: uuidv4(),
        type: this.mapEventTypeToReplayEventType(event.type),
        timestamp: Date.now().toString(),
        data: event.data
      }));
      
      return {
        timestamp: Date.now(),
        ballPositions,
        cuePosition,
        tableState: matchState.tableState,
        playerTurn: matchState.currentTurn,
        scoreState: matchState.scores,
        shotInProgress: visionFrame.shot_in_progress || false,
        events
      };
    } catch (error) {
      console.error(`Error getting game state for match ${matchId}:`, error);
      // Fall back to simulation in case of error
      return this.simulateGameState(matchId);
    }
  }
  
  /**
   * Map event bus event types to replay event types
   * @param eventType Event bus event type
   * @returns Replay event type
   */
  private mapEventTypeToReplayEventType(eventType: string): ReplayEventType {
    const eventTypeMap: Record<string, ReplayEventType> = {
      'shot_started': 'shot_started',
      'shot_completed': 'shot_completed',
      'ball_pocketed': 'ball_pocketed',
      'foul': 'foul_committed',
      'turn_changed': 'turn_changed',
      'game_started': 'game_started',
      'game_ended': 'game_ended',
      'player_assigned_balls': 'player_assigned_balls',
      'ball_in_hand': 'ball_in_hand',
      'break': 'break_shot',
      'impressive_shot': 'impressive_shot'
    };
    
    return eventTypeMap[eventType] || 'shot_completed'; // Default to shot_completed if unknown
  }
  
  /**
   * Simulate game state for development/testing
   * @param matchId The ID of the match
   * @returns Simulated game state
   */
  private simulateGameState(matchId: string): {
    timestamp: number;
    ballPositions: BallPosition[];
    cuePosition?: CuePosition;
    tableState: string;
    playerTurn: string;
    scoreState: Record<string, number>;
    shotInProgress: boolean;
    events?: ReplayEvent[];
  } {
    // Generate semi-random ball positions
    const ballPositions: BallPosition[] = [];
    for (let i = 0; i <= 15; i++) {
      // 20% chance a ball is pocketed
      const pocketed = Math.random() < 0.2;
      
      ballPositions.push({
        ballId: i,
        x: pocketed ? -1 : Math.random(),
        y: pocketed ? -1 : Math.random(),
        pocketed
      });
    }
    
    // 50% chance a shot is in progress
    const shotInProgress = Math.random() < 0.5;
    
    // Cue position (only if shot in progress)
    const cuePosition = shotInProgress ? {
      originX: Math.random(),
      originY: Math.random(),
      angle: Math.random() * Math.PI * 2,
      power: Math.random()
    } : undefined;
    
    // Simulate player IDs
    const player1Id = `player_${matchId}_1`;
    const player2Id = `player_${matchId}_2`;
    
    // Simulate score (0-7 for each player)
    const scoreState: Record<string, number> = {
      [player1Id]: Math.floor(Math.random() * 8),
      [player2Id]: Math.floor(Math.random() * 8)
    };
    
    // 50% chance for each player to be the current player
    const playerTurn = Math.random() < 0.5 ? player1Id : player2Id;
    
    // Very simple table state simulation (in a real app, this would be more complex)
    const tableState = JSON.stringify({
      gameType: 'eight_ball',
      stage: 'normal',
      activePlayer: {
        id: playerTurn,
        ballGroup: playerTurn === player1Id ? 'solids' : 'stripes'
      },
      inactivePlayer: {
        id: playerTurn === player1Id ? player2Id : player1Id,
        ballGroup: playerTurn === player1Id ? 'stripes' : 'solids'
      },
      foulCommitted: false,
      consecutiveFouls: {
        [player1Id]: 0,
        [player2Id]: 0
      }
    });
    
    return {
      timestamp: Date.now(),
      ballPositions,
      cuePosition,
      tableState,
      playerTurn,
      scoreState,
      shotInProgress,
      events: [] // No events by default in simulation
    };
  }
  
  /**
   * Get a list of active captures
   * @returns Map of match IDs to their capture status
   */
  public getActiveCaptures(): Map<string, {
    replayId: string;
    frameCount: number;
    duration: number; // milliseconds since started
  }> {
    const result = new Map<string, {
      replayId: string;
      frameCount: number;
      duration: number;
    }>();
    
    for (const [matchId, captureInfo] of this.activeCaptures.entries()) {
      result.set(matchId, {
        replayId: captureInfo.replayId,
        frameCount: captureInfo.frameCount,
        duration: Date.now() - captureInfo.lastCapturedTime + 1000 // Add 1 second buffer
      });
    }
    
    return result;
  }
  
  /**
   * Pause replay capture for a match
   * @param matchId The ID of the match
   * @returns True if the capture was paused successfully
   */
  public pauseCapture(matchId: string): boolean {
    const captureInfo = this.activeCaptures.get(matchId);
    if (!captureInfo || !captureInfo.interval) {
      return false;
    }
    
    clearInterval(captureInfo.interval);
    captureInfo.interval = null;
    this.activeCaptures.set(matchId, captureInfo);
    
    console.log(`Paused replay capture for match ${matchId}`);
    return true;
  }
  
  /**
   * Resume replay capture for a match
   * @param matchId The ID of the match
   * @returns True if the capture was resumed successfully
   */
  public resumeCapture(matchId: string): boolean {
    const captureInfo = this.activeCaptures.get(matchId);
    if (!captureInfo || captureInfo.interval) {
      return false;
    }
    
    const captureInterval = 1000 / captureInfo.config.frameRate;
    const interval = setInterval(() => {
      this.captureFrame(matchId).catch(err => {
        console.error(`Error capturing frame for match ${matchId}:`, err);
      });
    }, captureInterval);
    
    captureInfo.interval = interval;
    this.activeCaptures.set(matchId, captureInfo);
    
    console.log(`Resumed replay capture for match ${matchId}`);
    return true;
  }
  
  /**
   * Notify players that a replay is available
   * @param replay The replay metadata
   */
  private notifyPlayers(replay: ReplayMetadata): void {
    for (const player of replay.players) {
      try {
        notificationService.notify(player.id, NOTIFICATION_TYPES.MATCH_REPLAY_AVAILABLE, {
          replayId: replay.id,
          matchId: replay.matchId,
          opponentName: replay.players.find(p => p.id !== player.id)?.name || 'Opponent',
          result: replay.winner === player.id ? 'win' : 'loss',
          date: new Date(replay.endTime).toLocaleString()
        });
      } catch (error) {
        console.error(`Failed to notify player ${player.id} about replay ${replay.id}:`, error);
      }
    }
  }
}

// Create and export the singleton instance
export const replayCaptureService = ReplayCaptureService.getInstance();
export default replayCaptureService; 