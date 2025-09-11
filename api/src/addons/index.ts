/**
 * DojoPool Addons
 *
 * This file provides TypeScript declarations and imports for native addons.
 * The actual addon binaries are copied here during the build process.
 */

// Type definitions for the C++ physics addon
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

export interface PhysicsAddon {
  addBall(
    position: Vec2,
    velocity?: Vec2,
    angularVelocity?: Vec2,
    id?: number
  ): void;
  clearBalls(): void;
  simulateStep(deltaTime: number): void;
  getBallStates(): BallState[];
  calculateTrajectory(ballId: number, maxTime?: number): TrajectoryPoint[];
  calculateShot(
    start: Vec2,
    target: Vec2,
    power: number,
    spinX?: number,
    spinY?: number
  ): TrajectoryPoint;
  calculateBankShot(
    start: Vec2,
    cushion: Vec2,
    target: Vec2,
    power: number,
    spinX?: number,
    spinY?: number
  ): TrajectoryPoint[];
}

export interface PhysicsEngine {
  new (config?: any): PhysicsAddon;
}

// Dynamic import of the native addon
// This will be available after the build process copies the addon binary
let PhysicsEngine: PhysicsEngine;

try {
  // Attempt to load the addon
  const addon = require('./dojopool_physics.node');
  PhysicsEngine = addon.PhysicsAddon;
} catch (error) {
  console.warn(
    'Native physics addon not found. Make sure to build the C++ addon first.'
  );
  console.warn('Falling back to mock implementation for development.');

  // Mock implementation for development when addon is not available
  const MockAddon = class implements PhysicsAddon {
    addBall(
      position: Vec2,
      velocity?: Vec2,
      angularVelocity?: Vec2,
      id?: number
    ): void {
      console.log(`Mock: Adding ball at (${position.x}, ${position.y})`);
    }

    clearBalls(): void {
      console.log('Mock: Clearing all balls');
    }

    simulateStep(deltaTime: number): void {
      console.log(`Mock: Simulating step with deltaTime: ${deltaTime}`);
    }

    getBallStates(): BallState[] {
      console.log('Mock: Getting ball states');
      return [];
    }

    calculateTrajectory(ballId: number, maxTime?: number): TrajectoryPoint[] {
      console.log(`Mock: Calculating trajectory for ball ${ballId}`);
      return [];
    }

    calculateShot(
      start: Vec2,
      target: Vec2,
      power: number,
      spinX?: number,
      spinY?: number
    ): TrajectoryPoint {
      console.log(
        `Mock: Calculating shot from (${start.x}, ${start.y}) to (${target.x}, ${target.y})`
      );
      return {
        position: target,
        velocity: { x: 0, y: 0 },
        time: 1.0,
        valid: true,
      };
    }

    calculateBankShot(
      start: Vec2,
      cushion: Vec2,
      target: Vec2,
      power: number,
      spinX?: number,
      spinY?: number
    ): TrajectoryPoint[] {
      console.log(`Mock: Calculating bank shot`);
      return [];
    }
  };

  PhysicsEngine = MockAddon as any;
}

export { PhysicsEngine };
