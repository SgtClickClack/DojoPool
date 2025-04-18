/// <reference types="jest" />
import { ShotAnalysisService, ShotData } from "../ShotAnalysisService";

describe("ShotAnalysisService", () => {
  let service: ShotAnalysisService;

  beforeEach(() => {
    service = new ShotAnalysisService();
  });

  describe("startTracking", () => {
    it("should start tracking a new shot", () => {
      const spy = jest.fn();
      service.on("trackingStarted", spy);

      service.startTracking();

      expect(spy).toHaveBeenCalled();
      expect(service["isTracking"]).toBe(true);
      expect(service["currentShot"]).not.toBeNull();
      expect(service["currentShot"]).toMatchObject({
        timestamp: expect.any(Number),
        ballPositions: {
          cueBall: { x: 0, y: 0 },
          targetBall: { x: 0, y: 0 },
        },
        shotType: "",
        power: 0,
        spin: { top: 0, side: 0 },
        success: false,
        accuracy: 0,
      });
    });

    it("should reset tracking state when starting a new shot", () => {
      service.startTracking();
      service.updateBallPositions({ x: 10, y: 20 }, { x: 30, y: 40 });

      service.startTracking();

      expect(service["currentShot"]?.ballPositions).toEqual({
        cueBall: { x: 0, y: 0 },
        targetBall: { x: 0, y: 0 },
      });
    });
  });

  describe("updateBallPositions", () => {
    it("should update ball positions during tracking", () => {
      service.startTracking();
      const spy = jest.fn();
      service.on("positionsUpdated", spy);

      service.updateBallPositions({ x: 10, y: 20 }, { x: 30, y: 40 });

      expect(spy).toHaveBeenCalledWith({
        cueBall: { x: 10, y: 20 },
        targetBall: { x: 30, y: 40 },
      });
      expect(service["currentShot"]?.ballPositions).toEqual({
        cueBall: { x: 10, y: 20 },
        targetBall: { x: 30, y: 40 },
      });
    });

    it("should not update positions when not tracking", () => {
      const spy = jest.fn();
      service.on("positionsUpdated", spy);

      service.updateBallPositions({ x: 10, y: 20 }, { x: 30, y: 40 });

      expect(spy).not.toHaveBeenCalled();
      expect(service["currentShot"]).toBeNull();
    });
  });

  describe("completeShot", () => {
    it("should complete the current shot", () => {
      service.startTracking();
      const spy = jest.fn();
      service.on("shotCompleted", spy);

      const completedShot = service.completeShot(true, 0.95);

      expect(spy).toHaveBeenCalledWith(completedShot);
      expect(service["isTracking"]).toBe(false);
      expect(service["currentShot"]).toBeNull();
      expect(completedShot.success).toBe(true);
      expect(completedShot.accuracy).toBe(0.95);
    });

    it("should throw error when no shot is being tracked", () => {
      expect(() => service.completeShot(true, 0.95)).toThrow(
        "No shot is currently being tracked",
      );
    });

    it("should maintain all shot data when completing", () => {
      service.startTracking();
      service.updateBallPositions({ x: 10, y: 20 }, { x: 30, y: 40 });

      const completedShot = service.completeShot(true, 0.95);

      expect(completedShot.ballPositions).toEqual({
        cueBall: { x: 10, y: 20 },
        targetBall: { x: 30, y: 40 },
      });
      expect(completedShot.timestamp).toBeDefined();
    });
  });

  describe("analyzeShot", () => {
    const mockShot: ShotData = {
      timestamp: Date.now(),
      ballPositions: {
        cueBall: { x: 10, y: 20 },
        targetBall: { x: 30, y: 40 },
      },
      shotType: "straight",
      power: 0.8,
      spin: { top: 0.2, side: 0.1 },
      success: true,
      accuracy: 0.95,
    };

    it("should analyze a completed shot", () => {
      const analysis = service.analyzeShot(mockShot);

      expect(analysis).toHaveProperty("strength");
      expect(analysis).toHaveProperty("technique");
      expect(analysis).toHaveProperty("recommendations");
    });

    it("should handle different shot types", () => {
      const analysis = service.analyzeShot({
        ...mockShot,
        shotType: "cut",
        power: 0.6,
        spin: { top: 0.1, side: 0.3 },
      });

      expect(analysis.technique).toBeDefined();
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it("should provide appropriate recommendations for low accuracy shots", () => {
      const analysis = service.analyzeShot({
        ...mockShot,
        accuracy: 0.4,
        power: 0.9,
      });

      expect(analysis.recommendations).toContain(
        "Consider reducing power for better accuracy",
      );
      expect(analysis.recommendations).toContain(
        "Focus on fundamental stance and alignment",
      );
    });

    it("should handle high spin shots", () => {
      const analysis = service.analyzeShot({
        ...mockShot,
        spin: { top: 0.1, side: 0.8 },
      });

      expect(analysis.recommendations).toContain(
        "High side spin may reduce consistency",
      );
    });

    it("should handle failed shots", () => {
      const analysis = service.analyzeShot({
        ...mockShot,
        success: false,
        accuracy: 0.3,
      });

      expect(analysis.recommendations).toContain(
        "Focus on fundamental stance and alignment",
      );
    });
  });
});
