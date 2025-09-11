/**
 * DojoPool Physics Service
 *
 * Provides physics simulation capabilities through the native C++ addon.
 * Handles real-time physics calculations for pool game mechanics.
 */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PhysicsEngine } from '../addons';

export interface Vec2 {
  x: number;
  y: number;
}

export interface BallState {
  position: Vec2;
  velocity: Vec2;
  angularVelocity: Vec2;
  radius: number;
  active: boolean;
  id: number;
}

export interface TrajectoryPoint {
  position: Vec2;
  velocity: Vec2;
  time: number;
  valid: boolean;
}

export interface PhysicsConfig {
  tableWidth?: number;
  tableHeight?: number;
  frictionCoefficient?: number;
  timeStep?: number;
}

export interface GameState {
  balls: BallState[];
  deltaTime?: number;
  calculateTrajectories?: boolean;
}

export interface ProcessedGameState {
  balls: BallState[];
  trajectories: Record<number, TrajectoryPoint[]>;
  timestamp: number;
  processed: boolean;
}

export interface ShotRequest {
  start: Vec2;
  target: Vec2;
  power: number;
  spin?: Vec2;
  type?: 'straight' | 'bank';
  cushion?: Vec2; // Required for bank shots
}

export interface ShotPrediction {
  success: boolean;
  trajectory: TrajectoryPoint[];
  type: string;
  power: number;
  spin: Vec2;
}

@Injectable()
export class PhysicsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PhysicsService.name);
  private physicsEngine: any;
  private isInitialized = false;

  onModuleInit() {
    try {
      this.initializePhysicsEngine();
      this.isInitialized = true;
      this.logger.log('Physics engine initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize physics engine: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  onModuleDestroy() {
    try {
      if (this.physicsEngine) {
        this.physicsEngine.clearBalls();
        this.logger.log('Physics engine cleaned up');
      }
    } catch (error) {
      this.logger.error(
        `Error during physics engine cleanup: ${error.message}`
      );
    }
  }

  private initializePhysicsEngine() {
    try {
      // Default physics configuration
      const config: PhysicsConfig = {
        tableWidth: 9.0, // Standard 9ft table
        tableHeight: 4.5, // Standard 9ft table
        frictionCoefficient: 0.02,
        timeStep: 1.0 / 120.0, // 120 FPS simulation
      };

      this.physicsEngine = new PhysicsEngine.PhysicsEngine(config);
      this.logger.log('C++ physics engine loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load physics engine: ${error.message}`);
      throw new Error(
        'Physics engine initialization failed. Make sure the native addon is properly built and installed.'
      );
    }
  }

  /**
   * Process complete game state through physics simulation
   * @param gameState Current game state
   * @returns Updated game state with physics calculations
   */
  async processGameState(gameState: GameState): Promise<ProcessedGameState> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      this.logger.debug(
        `Processing game state with ${gameState.balls.length} balls`
      );

      const result = this.physicsEngine.processGameState(gameState);

      this.logger.debug(
        `Physics processing completed for ${result.balls.length} balls`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Physics processing failed: ${error.message}`,
        error.stack
      );
      throw new Error(`Physics calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate shot prediction for game assistance
   * @param shotRequest Shot calculation parameters
   * @returns Shot prediction with trajectory
   */
  async calculateShotPrediction(
    shotRequest: ShotRequest
  ): Promise<ShotPrediction> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      this.logger.debug(
        `Calculating shot prediction: ${shotRequest.type || 'straight'} shot`
      );

      const result = this.physicsEngine.calculateShotPrediction({
        start: shotRequest.start,
        target: shotRequest.target,
        power: shotRequest.power,
        spin: shotRequest.spin || { x: 0, y: 0 },
        type: shotRequest.type || 'straight',
        cushion: shotRequest.cushion,
      });

      this.logger.debug(
        `Shot prediction calculated with ${result.trajectory.length} trajectory points`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Shot prediction failed: ${error.message}`,
        error.stack
      );
      throw new Error(`Shot calculation failed: ${error.message}`);
    }
  }

  /**
   * Add a ball to the physics simulation
   * @param ball Ball state to add
   */
  async addBall(ball: BallState): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      this.physicsEngine.addBall(
        ball.position,
        ball.velocity,
        ball.angularVelocity,
        ball.id
      );

      this.logger.debug(`Ball ${ball.id} added to physics simulation`);
    } catch (error) {
      this.logger.error(`Failed to add ball ${ball.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all balls from the physics simulation
   */
  async clearBalls(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      this.physicsEngine.clearBalls();
      this.logger.debug('All balls cleared from physics simulation');
    } catch (error) {
      this.logger.error(`Failed to clear balls: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate a single physics time step
   * @param deltaTime Time step in seconds
   */
  async simulateStep(deltaTime: number = 1.0 / 60.0): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      this.physicsEngine.simulateStep(deltaTime);
      this.logger.debug(`Physics step simulated with deltaTime: ${deltaTime}`);
    } catch (error) {
      this.logger.error(`Physics step simulation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current ball states
   * @returns Array of current ball states
   */
  async getBallStates(): Promise<BallState[]> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      const balls = this.physicsEngine.getBallStates();
      this.logger.debug(`Retrieved ${balls.length} ball states`);
      return balls;
    } catch (error) {
      this.logger.error(`Failed to get ball states: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate trajectory for a specific ball
   * @param ballId Ball identifier
   * @param maxTime Maximum simulation time
   * @returns Trajectory points
   */
  async calculateTrajectory(
    ballId: number,
    maxTime: number = 10.0
  ): Promise<TrajectoryPoint[]> {
    if (!this.isInitialized) {
      throw new Error('Physics engine not initialized');
    }

    try {
      const trajectory = this.physicsEngine.calculateTrajectory(
        ballId,
        maxTime
      );
      this.logger.debug(
        `Calculated trajectory for ball ${ballId} with ${trajectory.length} points`
      );
      return trajectory;
    } catch (error) {
      this.logger.error(
        `Trajectory calculation failed for ball ${ballId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get physics engine status
   * @returns Engine status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      engine: 'C++ Native Addon',
      version: '1.0.0',
      capabilities: [
        'Real-time physics simulation',
        'Ball trajectory calculation',
        'Shot prediction',
        'Bank shot analysis',
        'Collision detection',
        'Friction and spin modeling',
      ],
    };
  }
}
