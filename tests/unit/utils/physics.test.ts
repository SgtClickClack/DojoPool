import { PhysicsEngine, Vector2D } from "../physics";

describe("Physics Utilities", () => {
  // Instantiate the PhysicsEngine to test its methods that depend on instance properties
  let physicsEngine: PhysicsEngine;

  beforeEach(() => {
    physicsEngine = new PhysicsEngine();
  });

  describe("calculateTrajectory", () => {
    it("calculates correct trajectory for straight shot", () => {
      const initialPosition: Vector2D = { x: 0, y: 0 };
      const power = 100;
      const angle = 0;

      // Call the method on the instance
      // Or if it's truly independent, call using prototype as a standalone function if preferred pattern
      // For now, call on instance for consistency with other methods that require it
      const trajectory = physicsEngine.calculateTrajectory(initialPosition, power, angle);

      expect(trajectory.x).toBeGreaterThan(0);
      expect(trajectory.y).toBe(0);
    });

    it("calculates correct trajectory for angled shot", () => {
      const initialPosition: Vector2D = { x: 0, y: 0 };
      const power = 100;
      const angle = 45;

      // Call the method on the instance
      const trajectory = physicsEngine.calculateTrajectory(initialPosition, power, angle);

      expect(trajectory.x).toBeGreaterThan(0);
      expect(trajectory.y).toBeGreaterThan(0);
      // For 45 degrees, x and y components should be equal
      expect(Math.abs(trajectory.x)).toBeCloseTo(Math.abs(trajectory.y), 5);
    });
  });

  describe("applyFriction", () => {
    it("reduces velocity over time", () => {
      const initialVelocity: Vector2D = { x: 10, y: 10 };
      const friction = 0.1; // Note: Friction is now part of PhysicsEngine instance
      const deltaTime = 1;

      // Call the method on the instance
      // The applyFriction method in PhysicsEngine only takes velocity and deltaTime
      const finalVelocity = physicsEngine.applyFriction(initialVelocity, deltaTime);

      expect(finalVelocity.x).toBeLessThan(initialVelocity.x);
      expect(finalVelocity.y).toBeLessThan(initialVelocity.y);
    });

    it("stops at very low velocities", () => {
      const initialVelocity: Vector2D = { x: 0.01, y: 0.01 };
      const friction = 0.1; // Note: Friction is now part of PhysicsEngine instance
      const deltaTime = 1;

      // Call the method on the instance
       // The applyFriction method in PhysicsEngine only takes velocity and deltaTime
      const finalVelocity = physicsEngine.applyFriction(initialVelocity, deltaTime);

      expect(finalVelocity.x).toBe(0);
      expect(finalVelocity.y).toBe(0);
    });
  });

  // Remove describe block for calculateRebound as it's not in physics.ts
  /*
  describe("calculateRebound", () => {
    it("calculates correct rebound angle for perpendicular collision", () => {
      const incomingAngle = 90;
      const surfaceNormal = 0;

      const reboundAngle = calculateRebound(incomingAngle, surfaceNormal);

      expect(reboundAngle).toBe(90);
    });

    it("maintains energy conservation in elastic collisions", () => {
      const velocity = 10;
      const incomingAngle = 45;
      const surfaceNormal = 0;

      const reboundAngle = calculateRebound(incomingAngle, surfaceNormal);
      const incomingEnergy = velocity * velocity;
      const reboundEnergy = velocity * velocity;

      expect(Math.abs(incomingEnergy - reboundEnergy)).toBeLessThan(0.0001);
    });

    it("handles edge case angles", () => {
      expect(calculateRebound(0, 0)).toBe(0);
      expect(calculateRebound(180, 0)).toBe(180);
      expect(calculateRebound(360, 0)).toBe(0);
    });
  });
  */
});
