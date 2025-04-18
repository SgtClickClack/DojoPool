import { calculateScore, validateShot, detectCollision } from "../gameUtils";

describe("Game Utilities", () => {
  describe("calculateScore", () => {
    it("calculates correct score for valid shots", () => {
      const mockShot = {
        pocketedBalls: [1, 2],
        isBreak: false,
      };
      expect(calculateScore(mockShot)).toBe(2);
    });

    it("handles break shot scoring correctly", () => {
      const mockShot = {
        pocketedBalls: [1],
        isBreak: true,
      };
      expect(calculateScore(mockShot)).toBe(1);
    });
  });

  describe("validateShot", () => {
    it("validates legal shots", () => {
      const mockShot = {
        cueBall: { x: 0, y: 0 },
        targetBall: { x: 10, y: 10 },
        pocket: { x: 20, y: 20 },
      };
      expect(validateShot(mockShot)).toBe(true);
    });

    it("detects illegal shots", () => {
      const mockShot = {
        cueBall: { x: 0, y: 0 },
        targetBall: null,
        pocket: { x: 20, y: 20 },
      };
      expect(validateShot(mockShot)).toBe(false);
    });
  });

  describe("detectCollision", () => {
    it("detects collision between balls", () => {
      const ball1 = { x: 0, y: 0, radius: 5 };
      const ball2 = { x: 8, y: 0, radius: 5 };
      expect(detectCollision(ball1, ball2)).toBe(true);
    });

    it("returns false when no collision", () => {
      const ball1 = { x: 0, y: 0, radius: 5 };
      const ball2 = { x: 20, y: 20, radius: 5 };
      expect(detectCollision(ball1, ball2)).toBe(false);
    });
  });
});
