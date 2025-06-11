/// <reference types="jest" />
import { ShotFeedbackService } from "../ShotFeedbackService";
import { ShotData } from "../ShotAnalysisService";

describe("ShotFeedbackService", () => {
  let service: ShotFeedbackService;
  let mockShot: ShotData;

  beforeEach(() => {
    service = new ShotFeedbackService();
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

  describe("processShot", () => {
    it("should process a shot and generate feedback", () => {
      const spy = jest.fn();
      service.on("feedbackGenerated", spy);

      service.processShot(mockShot);

      expect(spy).toHaveBeenCalled();
      const feedback = service.getRecentFeedback();
      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback[0]).toHaveProperty("type");
      expect(feedback[0]).toHaveProperty("message");
      expect(feedback[0]).toHaveProperty("severity");
      expect(feedback[0]).toHaveProperty("timestamp");
    });

    it("should generate power feedback for high power shots", () => {
      const highPowerShot = {
        ...mockShot,
        power: 0.9,
        accuracy: 0.6,
      };

      service.processShot(highPowerShot);
      const powerFeedback = service.getFeedbackByType("power");

      expect(powerFeedback.length).toBeGreaterThan(0);
      expect(powerFeedback[0].message).toContain("Power too high");
      expect(powerFeedback[0].severity).toBe("warning");
    });

    it("should generate accuracy feedback for low accuracy shots", () => {
      const lowAccuracyShot = {
        ...mockShot,
        accuracy: 0.5,
      };

      service.processShot(lowAccuracyShot);
      const accuracyFeedback = service.getFeedbackByType("accuracy");

      expect(accuracyFeedback.length).toBeGreaterThan(0);
      expect(accuracyFeedback[0].message).toContain("Focus on fundamental");
      expect(accuracyFeedback[0].severity).toBe("warning");
    });

    it("should generate spin feedback for high spin shots", () => {
      const highSpinShot = {
        ...mockShot,
        spin: { top: 0.2, side: 0.8 },
      };

      service.processShot(highSpinShot);
      const spinFeedback = service.getFeedbackByType("spin");

      expect(spinFeedback.length).toBeGreaterThan(0);
      expect(spinFeedback[0].message).toContain("High side spin");
      expect(spinFeedback[0].severity).toBe("warning");
    });

    it("should generate success feedback for successful shots", () => {
      const successfulShot = {
        ...mockShot,
        success: true,
        accuracy: 0.9,
      };

      service.processShot(successfulShot);
      const successFeedback = service.getFeedbackByType("success");

      expect(successFeedback.length).toBeGreaterThan(0);
      expect(successFeedback[0].message).toContain("Great shot");
      expect(successFeedback[0].severity).toBe("info");
    });

    it("should generate success feedback for failed shots", () => {
      const failedShot = {
        ...mockShot,
        success: false,
        accuracy: 0.4,
      };

      service.processShot(failedShot);
      const successFeedback = service.getFeedbackByType("success");

      expect(successFeedback.length).toBeGreaterThan(0);
      expect(successFeedback[0].message).toContain("Try again");
      expect(successFeedback[0].severity).toBe("warning");
    });

    it("should generate technique feedback for all shots", () => {
      service.processShot(mockShot);
      const techniqueFeedback = service.getFeedbackByType("technique");

      expect(techniqueFeedback.length).toBeGreaterThan(0);
      expect(techniqueFeedback[0].message).toContain("Technique:");
      expect(techniqueFeedback[0].severity).toBe("info");
    });

    it("should handle multiple feedback types for a single shot", () => {
      const complexShot = {
        ...mockShot,
        power: 0.9,
        accuracy: 0.5,
        spin: { top: 0.2, side: 0.8 },
      };

      service.processShot(complexShot);
      const allFeedback = service.getRecentFeedback();

      const feedbackTypes = new Set(allFeedback.map((f) => f.type));
      expect(feedbackTypes.size).toBeGreaterThan(1);
      expect(allFeedback.some((f) => f.type === "power")).toBe(true);
      expect(allFeedback.some((f) => f.type === "accuracy")).toBe(true);
      expect(allFeedback.some((f) => f.type === "spin")).toBe(true);
    });
  });

  describe("feedback history", () => {
    it("should maintain feedback history", () => {
      for (let i = 0; i < 5; i++) {
        service.processShot({
          ...mockShot,
          timestamp: Date.now() + i,
        });
      }

      const recentFeedback = service.getRecentFeedback();
      expect(recentFeedback.length).toBe(10);
      expect(recentFeedback[0].timestamp).toBeGreaterThan(
        recentFeedback[4].timestamp,
      );
    });

    it("should limit feedback history size", () => {
      for (let i = 0; i < 150; i++) {
        service.processShot({
          ...mockShot,
          timestamp: Date.now() + i,
        });
      }

      const recentFeedback = service.getRecentFeedback();
      expect(recentFeedback.length).toBeLessThanOrEqual(100);
    });

    it("should clear feedback history", () => {
      const spy = jest.fn();
      service.on("feedbackCleared", spy);

      service.processShot(mockShot);
      service.clearFeedbackHistory();

      expect(spy).toHaveBeenCalled();
      expect(service.getRecentFeedback().length).toBe(0);
    });

    it("should maintain feedback order by timestamp", () => {
      const timestamps = [1000, 2000, 3000];
      timestamps.forEach((timestamp) => {
        service.processShot({
          ...mockShot,
          timestamp,
        });
      });

      const recentFeedback = service.getRecentFeedback();
      expect(recentFeedback[0].timestamp).toBe(3000);
      expect(recentFeedback[1].timestamp).toBe(2000);
      expect(recentFeedback[2].timestamp).toBe(1000);
    });

    it("should handle duplicate timestamps", () => {
      const timestamp = Date.now();
      for (let i = 0; i < 3; i++) {
        service.processShot({
          ...mockShot,
          timestamp,
        });
      }

      const recentFeedback = service.getRecentFeedback();
      expect(recentFeedback.length).toBe(6);
      expect(recentFeedback.every((f) => f.timestamp === timestamp)).toBe(true);
    });

    it("should return all feedback when limit is greater than history size", () => {
      for (let i = 0; i < 3; i++) {
        service.processShot({
          ...mockShot,
          timestamp: Date.now() + i,
        });
      }

      const feedback = service.getRecentFeedback(10);
      expect(feedback.length).toBe(6);
    });

    it("should handle negative limit values", () => {
      service.processShot(mockShot);
      const feedback = service.getRecentFeedback(-1);
      expect(feedback).toHaveLength(1);
    });

    it("should handle zero limit value", () => {
      service.processShot(mockShot);
      const feedback = service.getRecentFeedback(0);
      expect(feedback).toHaveLength(0);
    });
  });

  describe("feedback filtering", () => {
    it("should filter feedback by type", () => {
      service.processShot(mockShot);
      const techniqueFeedback = service.getFeedbackByType("technique");

      expect(techniqueFeedback.length).toBeGreaterThan(0);
      expect(techniqueFeedback.every((f) => f.type === "technique")).toBe(true);
    });

    it("should limit recent feedback count", () => {
      for (let i = 0; i < 15; i++) {
        service.processShot({
          ...mockShot,
          timestamp: Date.now() + i,
        });
      }

      const limitedFeedback = service.getRecentFeedback(5);
      expect(limitedFeedback.length).toBe(5);
    });

    it("should return empty array for non-existent feedback type", () => {
      const nonExistentFeedback = service.getFeedbackByType(
        "nonExistent" as any,
      );
      expect(nonExistentFeedback).toHaveLength(0);
    });

    it("should return all feedback when limit is greater than history size", () => {
      for (let i = 0; i < 3; i++) {
        service.processShot({
          ...mockShot,
          timestamp: Date.now() + i,
        });
      }

      const feedback = service.getRecentFeedback(10);
      expect(feedback.length).toBe(6);
    });

    it("should handle negative limit values", () => {
      service.processShot(mockShot);
      const feedback = service.getRecentFeedback(-1);
      expect(feedback).toHaveLength(1);
    });

    it("should handle zero limit value", () => {
      service.processShot(mockShot);
      const feedback = service.getRecentFeedback(0);
      expect(feedback).toHaveLength(0);
    });
  });

  describe("event handling", () => {
    it("should emit events in the correct order", () => {
      const events: string[] = [];
      service.on("feedbackGenerated", () => events.push("feedbackGenerated"));
      service.on("feedbackCleared", () => events.push("feedbackCleared"));

      service.processShot(mockShot);
      service.clearFeedbackHistory();

      expect(events).toEqual(["feedbackGenerated", "feedbackCleared"]);
    });

    it("should remove event listeners correctly", () => {
      const spy = jest.fn();
      service.on("feedbackGenerated", spy);
      service.removeAllListeners("feedbackGenerated");

      service.processShot(mockShot);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
