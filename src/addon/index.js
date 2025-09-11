/**
 * DojoPool Physics Engine JavaScript Wrapper
 *
 * Provides a clean JavaScript interface to the native C++ physics engine.
 */

const path = require('path');
const addon = require('./dojopool_physics.node');

class PhysicsEngine {
  constructor(config = {}) {
    this.addon = new addon.PhysicsAddon(config);
  }

  /**
   * Add a ball to the physics simulation
   * @param {Object} position - Ball position {x, y}
   * @param {Object} velocity - Ball velocity {x, y}
   * @param {Object} angularVelocity - Ball angular velocity {x, y}
   * @param {number} id - Ball identifier
   */
  addBall(
    position,
    velocity = { x: 0, y: 0 },
    angularVelocity = { x: 0, y: 0 },
    id = 0
  ) {
    this.addon.addBall(position, velocity, angularVelocity, id);
  }

  /**
   * Clear all balls from the simulation
   */
  clearBalls() {
    this.addon.clearBalls();
  }

  /**
   * Advance the physics simulation by one time step
   * @param {number} deltaTime - Time step in seconds
   */
  simulateStep(deltaTime) {
    this.addon.simulateStep(deltaTime);
  }

  /**
   * Get the current state of all balls
   * @returns {Array} Array of ball states
   */
  getBallStates() {
    return this.addon.getBallStates();
  }

  /**
   * Calculate trajectory for a specific ball
   * @param {number} ballId - ID of the ball to track
   * @param {number} maxTime - Maximum simulation time (optional)
   * @returns {Array} Array of trajectory points
   */
  calculateTrajectory(ballId, maxTime = 10.0) {
    return this.addon.calculateTrajectory(ballId, maxTime);
  }

  /**
   * Calculate optimal shot trajectory
   * @param {Object} start - Starting position {x, y}
   * @param {Object} target - Target position {x, y}
   * @param {number} power - Shot power (0.0 to 1.0)
   * @param {number} spinX - Horizontal spin component
   * @param {number} spinY - Vertical spin component
   * @returns {Object} Trajectory point at target
   */
  calculateShot(start, target, power, spinX = 0, spinY = 0) {
    return this.addon.calculateShot(start, target, power, spinX, spinY);
  }

  /**
   * Calculate bank shot trajectory
   * @param {Object} start - Starting position {x, y}
   * @param {Object} cushion - Cushion contact point {x, y}
   * @param {Object} target - Target position {x, y}
   * @param {number} power - Shot power (0.0 to 1.0)
   * @param {number} spinX - Horizontal spin component
   * @param {number} spinY - Vertical spin component
   * @returns {Array} Bank shot trajectory points
   */
  calculateBankShot(start, cushion, target, power, spinX = 0, spinY = 0) {
    return this.addon.calculateBankShot(
      start,
      cushion,
      target,
      power,
      spinX,
      spinY
    );
  }

  /**
   * Process game state for physics simulation
   * @param {Object} gameState - Complete game state
   * @returns {Object} Updated game state with physics calculations
   */
  processGameState(gameState) {
    try {
      // Clear existing balls
      this.clearBalls();

      // Add balls from game state
      if (gameState.balls && Array.isArray(gameState.balls)) {
        gameState.balls.forEach((ball) => {
          this.addBall(
            ball.position,
            ball.velocity || { x: 0, y: 0 },
            ball.angularVelocity || { x: 0, y: 0 },
            ball.id
          );
        });
      }

      // Simulate physics step
      const deltaTime = gameState.deltaTime || 1.0 / 60.0; // Default 60 FPS
      this.simulateStep(deltaTime);

      // Get updated ball states
      const updatedBalls = this.getBallStates();

      // Calculate trajectories if requested
      let trajectories = {};
      if (gameState.calculateTrajectories) {
        updatedBalls.forEach((ball) => {
          if (ball.active) {
            trajectories[ball.id] = this.calculateTrajectory(ball.id);
          }
        });
      }

      return {
        balls: updatedBalls,
        trajectories: trajectories,
        timestamp: Date.now(),
        processed: true,
      };
    } catch (error) {
      throw new Error(`Physics processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate shot prediction for game assistance
   * @param {Object} shotRequest - Shot calculation request
   * @returns {Object} Shot prediction result
   */
  calculateShotPrediction(shotRequest) {
    try {
      const {
        start,
        target,
        power = 0.5,
        spin = { x: 0, y: 0 },
        type = 'straight',
      } = shotRequest;

      let result;

      if (type === 'bank') {
        const { cushion } = shotRequest;
        if (!cushion) {
          throw new Error('Bank shot requires cushion position');
        }
        result = this.calculateBankShot(
          start,
          cushion,
          target,
          power,
          spin.x,
          spin.y
        );
      } else {
        result = this.calculateShot(start, target, power, spin.x, spin.y);
      }

      return {
        success: result.valid !== false,
        trajectory: Array.isArray(result) ? result : [result],
        type: type,
        power: power,
        spin: spin,
      };
    } catch (error) {
      throw new Error(`Shot calculation failed: ${error.message}`);
    }
  }
}

// Export the physics engine class
module.exports = {
  PhysicsEngine,
  // Also export the raw addon for advanced usage
  addon: addon,
};
