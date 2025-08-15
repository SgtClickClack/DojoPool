/// <reference types="jest" />
import { ShotPerformanceAnalyzer } from "../ShotPerformanceAnalyzer";
import { ShotData } from "../ShotAnalysisService";

describe("ShotPerformanceAnalyzer", () => {
  let analyzer: ShotPerformanceAnalyzer;
  let mockShot: ShotData;

  beforeEach(() => {
    analyzer = new ShotPerformanceAnalyzer();
    mockShot = {
      timestamp: Date.now(),
      ballPositions: {
        cueBall: { x: 100, y: 100 },
        targetBall: { x: 200, y: 200 },
      },
      shotType: "straight",
      power: 0.7,
      spin: { top: 0.2, side: 0.1 },
      success: true,
      accuracy: 0.85,
    };
  });

  describe("Single Shot Analysis", () => {
    it("should analyze a single shot correctly", () => {
      const analysis = analyzer.analyzeSingleShot(mockShot);

      expect(analysis).toHaveProperty("strength");
      expect(analysis).toHaveProperty("technique");
      expect(analysis).toHaveProperty("recommendations");
      expect(analysis).toHaveProperty("patterns");
      expect(analysis).toHaveProperty("metrics");
    });

    it("should calculate shot strength correctly", () => {
      const analysis = analyzer.analyzeSingleShot(mockShot);
      // Power factor (0.7 * 0.4) + Accuracy factor (0.85 * 0.6) = 0.28 + 0.51 = 0.79 * 100 = 79
      expect(analysis.strength).toBeCloseTo(79, 0);
    });

    it("should identify shot technique correctly", () => {
      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.technique).toBe("Cut Shot");
    });

    it("should generate appropriate recommendations", () => {
      const highPowerShot = { ...mockShot, power: 0.9, accuracy: 0.6 };
      const analysis = analyzer.analyzeSingleShot(highPowerShot);
      expect(analysis.recommendations).toContain(
        "Consider reducing power for better accuracy",
      );
    });
  });

  describe("Shot History Analysis", () => {
    it("should maintain shot history and analyze patterns", () => {
      // Add multiple shots
      for (let i = 0; i < 5; i++) {
        analyzer.addShot({
          ...mockShot,
          accuracy: 0.8 + i * 0.02,
          power: 0.7 + i * 0.05,
        });
      }

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.patterns.accuracy).toBeGreaterThan(0);
      expect(analysis.patterns.consistency).toBeGreaterThan(0);
      expect(analysis.patterns.powerControl).toBeGreaterThan(0);
      expect(analysis.patterns.spinControl).toBeGreaterThan(0);
    });

    it("should respect history limit", () => {
      for (let i = 0; i < 60; i++) {
        analyzer.addShot({ ...mockShot, timestamp: Date.now() + i });
      }

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.averageAccuracy).toBeDefined();
    });

    it("should calculate consistency correctly", () => {
      // Add shots with varying accuracy
      analyzer.addShot({ ...mockShot, accuracy: 0.9 });
      analyzer.addShot({ ...mockShot, accuracy: 0.8 });
      analyzer.addShot({ ...mockShot, accuracy: 0.7 });
      analyzer.addShot({ ...mockShot, accuracy: 0.6 });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.patterns.consistency).toBeLessThan(1);
    });
  });

  describe("Pattern Analysis", () => {
    it("should identify accuracy patterns", () => {
      // Add shots with consistent accuracy
      for (let i = 0; i < 5; i++) {
        analyzer.addShot({ ...mockShot, accuracy: 0.8 });
      }

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.patterns.accuracy).toBeCloseTo(0.8, 1);
    });

    it("should identify power control patterns", () => {
      // Add shots with varying power
      analyzer.addShot({ ...mockShot, power: 0.6 });
      analyzer.addShot({ ...mockShot, power: 0.7 });
      analyzer.addShot({ ...mockShot, power: 0.8 });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.patterns.powerControl).toBeLessThan(1);
    });

    it("should identify spin control patterns", () => {
      // Add shots with varying spin
      analyzer.addShot({ ...mockShot, spin: { top: 0.1, side: 0.1 } });
      analyzer.addShot({ ...mockShot, spin: { top: 0.2, side: 0.2 } });
      analyzer.addShot({ ...mockShot, spin: { top: 0.3, side: 0.3 } });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.patterns.spinControl).toBeLessThan(1);
    });
  });

  describe("Metric Calculation", () => {
    it("should calculate average accuracy correctly", () => {
      analyzer.addShot({ ...mockShot, accuracy: 0.8 });
      analyzer.addShot({ ...mockShot, accuracy: 0.9 });
      analyzer.addShot({ ...mockShot, accuracy: 0.7 });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.averageAccuracy).toBeCloseTo(0.8, 1);
    });

    it("should calculate success rate correctly", () => {
      analyzer.addShot({ ...mockShot, success: true });
      analyzer.addShot({ ...mockShot, success: false });
      analyzer.addShot({ ...mockShot, success: true });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.successRate).toBeCloseTo(0.67, 2);
    });

    it("should identify preferred shots", () => {
      analyzer.addShot({ ...mockShot, shotType: "straight" });
      analyzer.addShot({ ...mockShot, shotType: "cut" });
      analyzer.addShot({ ...mockShot, shotType: "straight" });

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.preferredShots).toContain("straight");
    });

    it("should identify weaknesses correctly", () => {
      // Add shots with poor long-distance performance
      for (let i = 0; i < 5; i++) {
        analyzer.addShot({
          ...mockShot,
          ballPositions: {
            cueBall: { x: 0, y: 0 },
            targetBall: { x: 200, y: 200 },
          },
          success: false,
          accuracy: 0.4,
        });
      }

      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.weaknesses).toContain("Long Distance Shots");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty shot history", () => {
      const analysis = analyzer.analyzeSingleShot(mockShot);
      expect(analysis.metrics.averageAccuracy).toBe(0.85);
      expect(analysis.metrics.successRate).toBe(1);
      expect(analysis.metrics.preferredShots).toHaveLength(1);
    });

    it("should handle invalid shot data", () => {
      const invalidShot = {
        ...mockShot,
        power: -1,
        accuracy: -1,
        spin: { top: -1, side: -1 },
      };

      const analysis = analyzer.analyzeSingleShot(invalidShot);
      expect(analysis.strength).toBe(0);
      expect(analysis.recommendations).toContain(
        "Focus on fundamental stance and alignment",
      );
    });

    it("should handle extreme values", () => {
      const extremeShot = {
        ...mockShot,
        power: 2,
        accuracy: 2,
        spin: { top: 2, side: 2 },
      };

      const analysis = analyzer.analyzeSingleShot(extremeShot);
      expect(analysis.strength).toBeLessThanOrEqual(100);
      expect(analysis.patterns.accuracy).toBeLessThanOrEqual(1);
    });
  });
});
