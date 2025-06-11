import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import {
  TrainingService,
  TrainingExercise,
  TrainingSession,
} from "../../ai/shot-analysis/TrainingService";
import { ShotData } from "../../ai/shot-analysis/ShotAnalysisService";

describe("TrainingService", () => {
  let service: TrainingService;
  let mockExercises: TrainingExercise[];
  let mockShot: ShotData;

  beforeEach(() => {
    service = new TrainingService();
    mockExercises = [
      {
        id: "exercise-1",
        type: "accuracy",
        difficulty: 1,
        description: "Basic accuracy training",
        targetMetrics: {
          accuracy: 0.7,
        },
        successCriteria: {
          requiredShots: 5,
          successRate: 0.6,
        },
      },
      {
        id: "exercise-2",
        type: "power",
        difficulty: 2,
        description: "Power control training",
        targetMetrics: {
          accuracy: 0.75,
          power: 0.7,
        },
        successCriteria: {
          requiredShots: 7,
          successRate: 0.65,
        },
      },
    ];

    mockShot = {
      timestamp: Date.now(),
      ballPositions: {
        cueBall: { x: 0, y: 0 },
        targetBall: { x: 0, y: 0 },
      },
      shotType: "straight",
      power: 0.5,
      spin: { top: 0, side: 0 },
      success: true,
      accuracy: 0.8,
    };
  });

  describe("Session Management", () => {
    it("should start a new training session", () => {
      const session = service.startSession(mockExercises);
      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session-\d+$/);
      expect(session.exercises).toEqual(mockExercises);
      expect(session.currentExerciseIndex).toBe(0);
      expect(session.progress.completedExercises).toBe(0);
    });

    it("should throw error when starting session while one is in progress", () => {
      service.startSession(mockExercises);
      expect(() => service.startSession(mockExercises)).toThrow(
        "A training session is already in progress",
      );
    });

    it("should end the current training session", () => {
      service.startSession(mockExercises);
      const endedSession = service.endSession();
      expect(endedSession.endTime).toBeDefined();
      expect(service.getCurrentExercise()).toBeNull();
    });

    it("should throw error when ending session with none in progress", () => {
      expect(() => service.endSession()).toThrow(
        "No training session in progress",
      );
    });
  });

  describe("Shot Processing", () => {
    beforeEach(() => {
      service.startSession(mockExercises);
    });

    it("should process a shot and update session", () => {
      const shotProcessedSpy = jest.fn();
      service.on("shotProcessed", shotProcessedSpy);

      service.processShot(mockShot);

      expect(shotProcessedSpy).toHaveBeenCalled();
      expect(service["currentSession"]?.shots).toContain(mockShot);
    });

    it("should throw error when processing shot with no session", () => {
      service.endSession();
      expect(() => service.processShot(mockShot)).toThrow(
        "No training session in progress",
      );
    });
  });

  describe("Exercise Management", () => {
    beforeEach(() => {
      service.startSession(mockExercises);
    });

    it("should get current exercise", () => {
      const currentExercise = service.getCurrentExercise();
      expect(currentExercise).toEqual(mockExercises[0]);
    });

    it("should move to next exercise when current is completed", () => {
      // Process enough successful shots to complete first exercise
      for (let i = 0; i < 5; i++) {
        service.processShot({ ...mockShot, timestamp: Date.now() + i });
      }

      const currentExercise = service.getCurrentExercise();
      expect(currentExercise).toEqual(mockExercises[1]);
    });

    it("should complete session when all exercises are done", () => {
      const endedSpy = jest.fn();
      service.on("sessionEnded", endedSpy);
      service.startSession(mockExercises);
      try {
        mockExercises.forEach((exercise, idx) => {
          for (let i = 0; i < exercise.successCriteria.requiredShots; i++) {
            service.processShot({ ...mockShot, timestamp: Date.now() + idx * 100 + i });
          }
        });
      } catch (e) {
        // Session ended, ignore error
      }
      expect(endedSpy).toHaveBeenCalled();
    });
  });

  describe("Exercise Generation", () => {
    it("should generate exercises based on weaknesses", () => {
      const weaknesses = ["accuracy", "power"];
      const exercises = service.generateExercises(weaknesses, 2);
      expect(exercises).toHaveLength(2);
      expect(exercises[0].type).toBe("accuracy");
      expect(exercises[1].type).toBe("technique");
      expect(exercises[0].difficulty).toBe(2);
      expect(exercises[1].difficulty).toBe(2);
    });

    it("should create exercises with appropriate difficulty scaling", () => {
      const exercise = service["createExercise"]("accuracy", 3);
      expect(exercise.targetMetrics.accuracy).toBeGreaterThan(0.7);
      expect(exercise.successCriteria.requiredShots).toBeGreaterThan(5);
      expect(exercise.successCriteria.successRate).toBeGreaterThan(0.6);
    });
  });

  describe("Progress Tracking", () => {
    beforeEach(() => {
      service.startSession(mockExercises);
    });

    it("should update progress after each shot", () => {
      const initialProgress = service["currentSession"]?.progress;
      service.processShot(mockShot);
      const updatedProgress = service["currentSession"]?.progress;

      expect(updatedProgress?.completedExercises).toBeGreaterThanOrEqual(
        initialProgress?.completedExercises || 0,
      );
      expect(updatedProgress?.successRate).toBeGreaterThanOrEqual(
        initialProgress?.successRate || 0,
      );
    });

    it("should calculate average accuracy correctly", () => {
      const shots = [
        { ...mockShot, accuracy: 0.8, timestamp: Date.now() },
        { ...mockShot, accuracy: 0.9, timestamp: Date.now() + 1 },
        { ...mockShot, accuracy: 0.7, timestamp: Date.now() + 2 },
      ];

      shots.forEach((shot) => service.processShot(shot));
      const progress = service["currentSession"]?.progress;

      expect(progress?.averageAccuracy).toBeCloseTo(0.8, 1);
    });
  });
});
