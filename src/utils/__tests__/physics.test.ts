import { calculateTrajectory, applyFriction, calculateRebound } from '../physics';

describe('Physics Utilities', () => {
  describe('calculateTrajectory', () => {
    it('calculates correct trajectory for straight shot', () => {
      const initialPosition = { x: 0, y: 0 };
      const power = 100;
      const angle = 0;
      
      const trajectory = calculateTrajectory(initialPosition, power, angle);
      
      expect(trajectory.x).toBeGreaterThan(0);
      expect(trajectory.y).toBe(0);
    });

    it('calculates correct trajectory for angled shot', () => {
      const initialPosition = { x: 0, y: 0 };
      const power = 100;
      const angle = 45;
      
      const trajectory = calculateTrajectory(initialPosition, power, angle);
      
      expect(trajectory.x).toBeGreaterThan(0);
      expect(trajectory.y).toBeGreaterThan(0);
      // For 45 degrees, x and y components should be equal
      expect(Math.abs(trajectory.x)).toBeCloseTo(Math.abs(trajectory.y), 5);
    });
  });

  describe('applyFriction', () => {
    it('reduces velocity over time', () => {
      const initialVelocity = { x: 10, y: 10 };
      const friction = 0.1;
      const deltaTime = 1;

      const finalVelocity = applyFriction(initialVelocity, friction, deltaTime);

      expect(finalVelocity.x).toBeLessThan(initialVelocity.x);
      expect(finalVelocity.y).toBeLessThan(initialVelocity.y);
    });

    it('stops at very low velocities', () => {
      const initialVelocity = { x: 0.01, y: 0.01 };
      const friction = 0.1;
      const deltaTime = 1;

      const finalVelocity = applyFriction(initialVelocity, friction, deltaTime);

      expect(finalVelocity.x).toBe(0);
      expect(finalVelocity.y).toBe(0);
    });
  });

  describe('calculateRebound', () => {
    it('calculates correct rebound angle for perpendicular collision', () => {
      const incomingAngle = 90;
      const surfaceNormal = 0;
      
      const reboundAngle = calculateRebound(incomingAngle, surfaceNormal);
      
      expect(reboundAngle).toBe(90);
    });

    it('maintains energy conservation in elastic collisions', () => {
      const velocity = 10;
      const incomingAngle = 45;
      const surfaceNormal = 0;
      
      const reboundAngle = calculateRebound(incomingAngle, surfaceNormal);
      const incomingEnergy = velocity * velocity;
      const reboundEnergy = velocity * velocity;
      
      expect(Math.abs(incomingEnergy - reboundEnergy)).toBeLessThan(0.0001);
    });

    it('handles edge case angles', () => {
      expect(calculateRebound(0, 0)).toBe(0);
      expect(calculateRebound(180, 0)).toBe(180);
      expect(calculateRebound(360, 0)).toBe(0);
    });
  });
}); 