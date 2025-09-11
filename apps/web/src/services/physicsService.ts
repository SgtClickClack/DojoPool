/**
 * DojoPool Physics Service - Frontend Integration
 *
 * Frontend service for communicating with the physics engine API.
 * Handles real-time physics calculations and game state processing.
 */

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

export interface GameState {
  balls: BallState[];
  deltaTime?: number;
  calculateTrajectories?: boolean;
}

export interface ProcessedGameState {
  balls: BallState[];
  trajectories: Record<string, TrajectoryPoint[]>;
  timestamp: number;
  processed: boolean;
}

export interface ShotRequest {
  start: Vec2;
  target: Vec2;
  power: number;
  spin?: Vec2;
  type?: 'straight' | 'bank';
  cushion?: Vec2;
}

export interface ShotPrediction {
  success: boolean;
  trajectory: TrajectoryPoint[];
  type: string;
  power: number;
  spin: Vec2;
}

export interface PhysicsAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

class PhysicsService {
  private baseUrl: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic API request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PhysicsAPIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.warn(
          `Physics API request failed (attempt ${attempt}/${this.retryAttempts}):`,
          error
        );

        if (attempt === this.retryAttempts) {
          return {
            success: false,
            error: error.message,
            timestamp: Date.now(),
          };
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt)
        );
      }
    }

    return {
      success: false,
      error: 'Max retry attempts exceeded',
      timestamp: Date.now(),
    };
  }

  /**
   * Process complete game state through physics simulation
   */
  async processGameState(
    gameState: GameState
  ): Promise<ProcessedGameState | null> {
    try {
      console.log(
        `Sending game state with ${gameState.balls.length} balls to physics engine`
      );

      const response = await this.makeRequest<ProcessedGameState>(
        '/physics/process',
        {
          method: 'POST',
          body: JSON.stringify(gameState),
        }
      );

      if (response.success && response.data) {
        console.log(
          `Physics processing completed for ${response.data.balls.length} balls`
        );
        return response.data;
      } else {
        console.error(
          'Physics processing failed:',
          response.error || response.message
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to process game state:', error);
      return null;
    }
  }

  /**
   * Calculate shot prediction
   */
  async calculateShotPrediction(
    shotRequest: ShotRequest
  ): Promise<ShotPrediction | null> {
    try {
      console.log(
        `Calculating ${shotRequest.type || 'straight'} shot prediction`
      );

      const response = await this.makeRequest<ShotPrediction>('/physics/shot', {
        method: 'POST',
        body: JSON.stringify(shotRequest),
      });

      if (response.success && response.data) {
        console.log(
          `Shot prediction calculated: ${response.data.success ? 'success' : 'failed'}`
        );
        return response.data;
      } else {
        console.error(
          'Shot calculation failed:',
          response.error || response.message
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to calculate shot prediction:', error);
      return null;
    }
  }

  /**
   * Calculate trajectory for a specific ball
   */
  async calculateTrajectory(
    ballId: number,
    maxTime: number = 10.0
  ): Promise<TrajectoryPoint[] | null> {
    try {
      console.log(`Calculating trajectory for ball ${ballId}`);

      const response = await this.makeRequest<{
        trajectory: TrajectoryPoint[];
      }>(`/physics/trajectory/${ballId}?max_time=${maxTime}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        console.log(
          `Trajectory calculated with ${response.data.trajectory.length} points`
        );
        return response.data.trajectory;
      } else {
        console.error(
          'Trajectory calculation failed:',
          response.error || response.message
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to calculate trajectory:', error);
      return null;
    }
  }

  /**
   * Add a ball to the physics simulation
   */
  async addBall(ball: BallState): Promise<boolean> {
    try {
      console.log(`Adding ball ${ball.id} to physics simulation`);

      const response = await this.makeRequest('/physics/ball', {
        method: 'POST',
        body: JSON.stringify(ball),
      });

      if (response.success) {
        console.log(`Ball ${ball.id} added successfully`);
        return true;
      } else {
        console.error(
          'Failed to add ball:',
          response.error || response.message
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to add ball:', error);
      return false;
    }
  }

  /**
   * Clear all balls from simulation
   */
  async clearBalls(): Promise<boolean> {
    try {
      console.log('Clearing all balls from physics simulation');

      const response = await this.makeRequest('/physics/clear', {
        method: 'POST',
      });

      if (response.success) {
        console.log('All balls cleared successfully');
        return true;
      } else {
        console.error(
          'Failed to clear balls:',
          response.error || response.message
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to clear balls:', error);
      return false;
    }
  }

  /**
   * Get current ball states
   */
  async getBallStates(): Promise<BallState[] | null> {
    try {
      console.log('Retrieving current ball states');

      const response = await this.makeRequest<{ balls: BallState[] }>(
        '/physics/balls',
        {
          method: 'GET',
        }
      );

      if (response.success && response.data) {
        console.log(`Retrieved ${response.data.balls.length} ball states`);
        return response.data.balls;
      } else {
        console.error(
          'Failed to get ball states:',
          response.error || response.message
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to get ball states:', error);
      return null;
    }
  }

  /**
   * Simulate physics time step
   */
  async simulateStep(deltaTime: number = 1.0 / 60.0): Promise<boolean> {
    try {
      console.log(`Simulating physics step with deltaTime: ${deltaTime}`);

      const response = await this.makeRequest('/physics/step', {
        method: 'POST',
        body: JSON.stringify({ deltaTime }),
      });

      if (response.success) {
        console.log('Physics step simulated successfully');
        return true;
      } else {
        console.error(
          'Physics step simulation failed:',
          response.error || response.message
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to simulate physics step:', error);
      return false;
    }
  }

  /**
   * Get physics engine status
   */
  async getStatus(): Promise<any> {
    try {
      console.log('Getting physics engine status');

      const response = await this.makeRequest('/physics/status', {
        method: 'GET',
      });

      if (response.success) {
        console.log('Physics engine status retrieved');
        return response.data || response;
      } else {
        console.error(
          'Failed to get physics status:',
          response.error || response.message
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to get physics status:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/physics/health', {
        method: 'GET',
      });

      return (
        response.success &&
        (response.data?.status === 'healthy' || response.status === 'healthy')
      );
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Batch process multiple physics operations
   */
  async batchProcess(
    operations: Array<{
      type: 'process' | 'shot' | 'trajectory' | 'add_ball' | 'clear';
      data?: any;
    }>
  ): Promise<Array<any>> {
    const results = [];

    for (const operation of operations) {
      try {
        let result = null;

        switch (operation.type) {
          case 'process':
            result = await this.processGameState(operation.data);
            break;
          case 'shot':
            result = await this.calculateShotPrediction(operation.data);
            break;
          case 'trajectory':
            result = await this.calculateTrajectory(
              operation.data.ballId,
              operation.data.maxTime
            );
            break;
          case 'add_ball':
            result = await this.addBall(operation.data);
            break;
          case 'clear':
            result = await this.clearBalls();
            break;
        }

        results.push({
          type: operation.type,
          success: result !== null && result !== false,
          data: result,
        });
      } catch (error) {
        results.push({
          type: operation.type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Real-time physics loop for continuous simulation
   */
  startRealTimeSimulation(
    getGameState: () => GameState,
    onUpdate: (updatedState: ProcessedGameState) => void,
    targetFPS: number = 60
  ): () => void {
    const interval = 1000 / targetFPS;
    let lastTime = Date.now();
    let animationFrame: number;

    const update = async () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;

      if (deltaTime >= interval / 1000) {
        const gameState = getGameState();
        const updatedState = await this.processGameState(gameState);

        if (updatedState) {
          onUpdate(updatedState);
        }

        lastTime = currentTime;
      }

      animationFrame = requestAnimationFrame(update);
    };

    update();

    // Return cleanup function
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }

  /**
   * Configure service settings
   */
  configure(options: {
    baseUrl?: string;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    }
    if (options.retryAttempts) {
      this.retryAttempts = options.retryAttempts;
    }
    if (options.retryDelay) {
      this.retryDelay = options.retryDelay;
    }
  }
}

// Export singleton instance
export const physicsService = new PhysicsService();

// Export class for custom instances
export { PhysicsService };
export default physicsService;
