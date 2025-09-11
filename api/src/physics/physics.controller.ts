/**
 * DojoPool Physics Controller
 *
 * REST API endpoints for physics calculations and game state processing.
 * Provides real-time physics simulation capabilities to the frontend.
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  BallState,
  GameState,
  PhysicsService,
  ShotRequest,
} from './physics.service';

@Controller('physics')
export class PhysicsController {
  private readonly logger = new Logger(PhysicsController.name);

  constructor(private readonly physicsService: PhysicsService) {}

  /**
   * Process complete game state through physics simulation
   * POST /physics/process
   */
  @Post('process')
  @UsePipes(new ValidationPipe({ transform: true }))
  async processGameState(@Body() gameState: GameState) {
    try {
      this.logger.log(
        `Processing game state with ${gameState.balls?.length || 0} balls`
      );

      const result = await this.physicsService.processGameState(gameState);

      this.logger.log(
        `Game state processed successfully, ${result.balls.length} balls updated`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Game state processing failed: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Physics processing failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Calculate shot prediction
   * POST /physics/shot
   */
  @Post('shot')
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateShot(@Body() shotRequest: ShotRequest) {
    try {
      this.logger.log(
        `Calculating ${shotRequest.type || 'straight'} shot prediction`
      );

      const prediction =
        await this.physicsService.calculateShotPrediction(shotRequest);

      this.logger.log(
        `Shot prediction calculated: ${prediction.success ? 'success' : 'failed'}`
      );
      return prediction;
    } catch (error) {
      this.logger.error(
        `Shot calculation failed: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Shot calculation failed',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Calculate trajectory for a specific ball
   * GET /physics/trajectory/:ballId
   */
  @Get('trajectory/:ballId')
  async getTrajectory(
    @Query('ballId') ballId: string,
    @Query('maxTime') maxTime?: string
  ) {
    try {
      const id = parseInt(ballId, 10);
      const time = maxTime ? parseFloat(maxTime) : 10.0;

      if (isNaN(id)) {
        throw new Error('Invalid ball ID');
      }

      this.logger.log(`Calculating trajectory for ball ${id}`);

      const trajectory = await this.physicsService.calculateTrajectory(
        id,
        time
      );

      this.logger.log(`Trajectory calculated with ${trajectory.length} points`);
      return {
        ballId: id,
        trajectory,
        maxTime: time,
      };
    } catch (error) {
      this.logger.error(
        `Trajectory calculation failed: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Trajectory calculation failed',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Add a ball to the simulation
   * POST /physics/ball
   */
  @Post('ball')
  @UsePipes(new ValidationPipe({ transform: true }))
  async addBall(@Body() ball: BallState) {
    try {
      this.logger.log(`Adding ball ${ball.id} to physics simulation`);

      await this.physicsService.addBall(ball);

      this.logger.log(`Ball ${ball.id} added successfully`);
      return {
        success: true,
        ballId: ball.id,
        message: 'Ball added to physics simulation',
      };
    } catch (error) {
      this.logger.error(`Failed to add ball: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to add ball',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Clear all balls from simulation
   * POST /physics/clear
   */
  @Post('clear')
  async clearBalls() {
    try {
      this.logger.log('Clearing all balls from physics simulation');

      await this.physicsService.clearBalls();

      this.logger.log('All balls cleared successfully');
      return {
        success: true,
        message: 'All balls cleared from physics simulation',
      };
    } catch (error) {
      this.logger.error(`Failed to clear balls: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to clear balls',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current ball states
   * GET /physics/balls
   */
  @Get('balls')
  async getBallStates() {
    try {
      this.logger.log('Retrieving current ball states');

      const balls = await this.physicsService.getBallStates();

      this.logger.log(`Retrieved ${balls.length} ball states`);
      return {
        balls,
        count: balls.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get ball states: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to get ball states',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Simulate physics time step
   * POST /physics/step
   */
  @Post('step')
  async simulateStep(@Body() body: { deltaTime?: number }) {
    try {
      const deltaTime = body.deltaTime || 1.0 / 60.0;

      this.logger.log(`Simulating physics step with deltaTime: ${deltaTime}`);

      await this.physicsService.simulateStep(deltaTime);

      this.logger.log('Physics step simulated successfully');
      return {
        success: true,
        deltaTime,
        message: 'Physics step simulated',
      };
    } catch (error) {
      this.logger.error(
        `Physics step simulation failed: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Physics step simulation failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get physics engine status
   * GET /physics/status
   */
  @Get('status')
  getStatus() {
    try {
      const status = this.physicsService.getStatus();

      this.logger.log('Physics engine status requested');
      return {
        ...status,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get physics status: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to get physics status',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint
   * GET /physics/health
   */
  @Get('health')
  healthCheck() {
    const status = this.physicsService.getStatus();

    if (!status.initialized) {
      throw new HttpException(
        {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'Physics engine not available',
          message: 'Physics engine is not initialized',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'healthy',
      engine: status.engine,
      initialized: status.initialized,
      timestamp: new Date().toISOString(),
    };
  }
}
