/**
 * DojoPool Pool Physics WebAssembly Interface
 *
 * JavaScript wrapper for the high-performance pool physics engine.
 * Provides easy-to-use methods for trajectory calculation, shot prediction,
 * and physics simulation with automatic WebAssembly loading.
 */

class PoolPhysicsWasm {
  constructor() {
    this.Module = null;
    this.engine = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
  }

  /**
   * Initialize the WebAssembly module
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.isInitializing) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = this._loadWasm();

    try {
      await this.initPromise;
      this.isInitialized = true;
      this.isInitializing = false;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Load the WebAssembly module
   * @private
   */
  async _loadWasm() {
    return new Promise((resolve, reject) => {
      // Create script element for Emscripten-generated JavaScript
      const script = document.createElement('script');
      script.src = '/wasm/pool-physics.js'; // Path to compiled WASM JS file
      script.onload = () => {
        // Initialize Emscripten Module
        window.Module = {
          onRuntimeInitialized: () => {
            this.Module = window.Module;
            this.engine = new this.Module.PoolPhysicsEngine();
            resolve();
          },
          onAbort: (error) => {
            reject(new Error(`WebAssembly initialization failed: ${error}`));
          },
        };
      };
      script.onerror = () => {
        reject(new Error('Failed to load WebAssembly module'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Ensure the module is initialized before use
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error(
        'PoolPhysicsWasm must be initialized before use. Call initialize() first.'
      );
    }
  }

  /**
   * Add a ball to the physics simulation
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   * @param {number} ax - X angular velocity (spin)
   * @param {number} ay - Y angular velocity (spin)
   * @param {number} id - Ball ID
   */
  addBall(x, y, vx = 0, vy = 0, ax = 0, ay = 0, id = 0) {
    this._ensureInitialized();
    this.engine.addBall(x, y, vx, vy, ax, ay, id);
  }

  /**
   * Clear all balls from simulation
   */
  clearBalls() {
    this._ensureInitialized();
    this.engine.clearBalls();
  }

  /**
   * Calculate trajectory for a ball
   * @param {number} ballId - ID of the ball to calculate trajectory for
   * @param {number} maxTime - Maximum time to simulate (seconds)
   * @returns {Array} Array of trajectory points
   */
  calculateTrajectory(ballId, maxTime = 10.0) {
    this._ensureInitialized();
    const trajectory = this.engine.calculateTrajectory(ballId, maxTime);

    // Convert to JavaScript objects
    return trajectory.map((point) => ({
      x: point.x,
      y: point.y,
      vx: point.vx,
      vy: point.vy,
      time: point.time,
      valid: point.valid,
    }));
  }

  /**
   * Simulate one physics step
   * @param {number} deltaTime - Time step in seconds
   */
  simulateStep(deltaTime = 1 / 60) {
    this._ensureInitialized();
    this.engine.simulateStep(deltaTime);
  }

  /**
   * Get current state of all balls
   * @returns {Array} Array of ball states
   */
  getBallStates() {
    this._ensureInitialized();
    const states = this.engine.getBallStates();

    return states.map((state) => ({
      x: state.x,
      y: state.y,
      vx: state.vx,
      vy: state.vy,
      ax: state.ax,
      ay: state.ay,
      radius: state.radius,
      active: state.active,
      id: state.id,
    }));
  }

  /**
   * Calculate optimal shot trajectory
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {number} power - Shot power (0-1)
   * @param {number} spinX - X spin component
   * @param {number} spinY - Y spin component
   * @returns {Object} Shot result with trajectory information
   */
  calculateShot(startX, startY, targetX, targetY, power, spinX = 0, spinY = 0) {
    this._ensureInitialized();
    const result = this.engine.calculateShot(
      startX,
      startY,
      targetX,
      targetY,
      power,
      spinX,
      spinY
    );

    return {
      x: result.x,
      y: result.y,
      vx: result.vx,
      vy: result.vy,
      time: result.time,
      valid: result.valid,
    };
  }

  /**
   * Calculate bank shot trajectory (shot that bounces off cushions)
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {number} cushionX - Cushion contact X position
   * @param {number} cushionY - Cushion contact Y position
   * @returns {Array} Array of trajectory points for bank shot
   */
  calculateBankShot(startX, startY, targetX, targetY, cushionX, cushionY) {
    this._ensureInitialized();
    const trajectory = this.engine.calculateBankShot(
      startX,
      startY,
      targetX,
      targetY,
      cushionX,
      cushionY
    );

    return trajectory.map((point) => ({
      x: point.x,
      y: point.y,
      vx: point.vx,
      vy: point.vy,
      time: point.time,
      valid: point.valid,
    }));
  }

  /**
   * Set up a standard pool table with balls in rack position
   */
  setupStandardTable() {
    this._ensureInitialized();
    this.clearBalls();

    // Table dimensions (9ft = 2.74m, but we'll use feet for simplicity)
    const tableWidth = 9.0;
    const tableHeight = 4.5;

    // Cue ball position (slightly off center)
    this.addBall(tableWidth * 0.25, tableHeight / 2, 0, 0, 0, 0, 0);

    // Rack formation (simplified triangle)
    const rackX = tableWidth * 0.75;
    const rackY = tableHeight / 2;

    // Apex ball (1-ball)
    this.addBall(rackX, rackY, 0, 0, 0, 0, 1);

    // Second row
    this.addBall(rackX + 0.0866, rackY - 0.05, 0, 0, 0, 0, 2);
    this.addBall(rackX + 0.0866, rackY + 0.05, 0, 0, 0, 0, 3);

    // Third row
    this.addBall(rackX + 0.1732, rackY - 0.1, 0, 0, 0, 0, 4);
    this.addBall(rackX + 0.1732, rackY, 0, 0, 0, 0, 5);
    this.addBall(rackX + 0.1732, rackY + 0.1, 0, 0, 0, 0, 6);

    // Fourth row
    this.addBall(rackX + 0.2598, rackY - 0.15, 0, 0, 0, 0, 7);
    this.addBall(rackX + 0.2598, rackY - 0.05, 0, 0, 0, 0, 8);
    this.addBall(rackX + 0.2598, rackY + 0.05, 0, 0, 0, 0, 9);
    this.addBall(rackX + 0.2598, rackY + 0.15, 0, 0, 0, 0, 10);

    // Fifth row (apex)
    this.addBall(rackX + 0.3464, rackY, 0, 0, 0, 0, 11);
  }

  /**
   * Calculate shot difficulty based on trajectory complexity
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @returns {number} Difficulty score (0-100)
   */
  calculateShotDifficulty(startX, startY, targetX, targetY) {
    this._ensureInitialized();

    // Calculate direct distance
    const directDistance = Math.sqrt(
      Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2)
    );

    // Calculate trajectory and analyze complexity
    this.clearBalls();
    this.addBall(startX, startY, 0, 0, 0, 0, 1);
    const trajectory = this.calculateTrajectory(1, 5.0);

    if (trajectory.length === 0) return 100; // Impossible shot

    // Analyze trajectory for cushions and complexity
    let cushionContacts = 0;
    let maxDeviation = 0;
    let totalDistance = 0;

    for (let i = 1; i < trajectory.length; i++) {
      const prev = trajectory[i - 1];
      const curr = trajectory[i];

      // Calculate segment distance
      const segmentDist = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalDistance += segmentDist;

      // Check for cushion contacts (balls near edges)
      const margin = 0.2; // 2 inches from edge
      if (curr.x < margin || curr.x > 8.8 || curr.y < margin || curr.y > 4.3) {
        cushionContacts++;
      }

      // Calculate deviation from direct line
      const directProgress = i / trajectory.length;
      const expectedX = startX + (targetX - startX) * directProgress;
      const expectedY = startY + (targetY - startY) * directProgress;
      const deviation = Math.sqrt(
        Math.pow(curr.x - expectedX, 2) + Math.pow(curr.y - expectedY, 2)
      );
      maxDeviation = Math.max(maxDeviation, deviation);
    }

    // Calculate difficulty score
    const distanceFactor = Math.min(directDistance / 5.0, 1.0); // Normalize distance
    const cushionFactor = Math.min(cushionContacts / 3.0, 1.0); // More cushions = harder
    const deviationFactor = Math.min(maxDeviation / 2.0, 1.0); // More deviation = harder

    const difficulty =
      distanceFactor * 30 + cushionFactor * 40 + deviationFactor * 30;

    return Math.min(Math.max(difficulty, 0), 100);
  }

  /**
   * Performance benchmark for physics calculations
   * @param {number} iterations - Number of iterations to run
   * @returns {Object} Performance metrics
   */
  async benchmark(iterations = 1000) {
    this._ensureInitialized();

    const startTime = performance.now();

    // Run physics calculations
    for (let i = 0; i < iterations; i++) {
      this.simulateStep(1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTimePerIteration = totalTime / iterations;

    return {
      totalTime,
      avgTimePerIteration,
      iterationsPerSecond: iterations / (totalTime / 1000),
      wasmPerformance: true,
    };
  }
}

// Singleton instance
const poolPhysicsWasm = new PoolPhysicsWasm();

export default poolPhysicsWasm;
export { PoolPhysicsWasm };
