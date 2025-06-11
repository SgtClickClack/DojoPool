/// <reference types="jest" />
import {
  TrainingService,
  TrainingExercise,
  TrainingSession,
} from "../TrainingService";
import { ShotData } from "../ShotAnalysisService";

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
          accuracy: 0.7,
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

  describe("session management", () => {
    it("should start a new training session", () => {
      const spy = jest.fn();
      service.on("sessionStarted", spy);

      const session = service.startSession(mockExercises);

      expect(spy).toHaveBeenCalledWith(session);
      expect(session.id).toMatch(/^session-\d+$/);
      expect(session.exercises).toEqual(mockExercises);
      expect(session.currentExerciseIndex).toBe(0);
      expect(session.progress.completedExercises).toBe(0);
    });

    it("should throw error when starting session while another is in progress", () => {
      service.startSession(mockExercises);
      expect(() => service.startSession(mockExercises)).toThrow(
        "A training session is already in progress",
      );
    });

    it("should end the current training session", () => {
      const startSpy = jest.fn();
      const endSpy = jest.fn();
      service.on("sessionStarted", startSpy);
      service.on("sessionEnded", endSpy);

      const session = service.startSession(mockExercises);
      const endedSession = service.endSession();

      expect(endSpy).toHaveBeenCalledWith(endedSession);
      expect(endedSession.endTime).toBeDefined();
      expect(endedSession.id).toBe(session.id);
    });

    it("should throw error when ending session with no active session", () => {
      expect(() => service.endSession()).toThrow(
        "No training session in progress",
      );
    });
  });

  describe("exercise management", () => {
    it("should get the current exercise", () => {
      service.startSession(mockExercises);
      const currentExercise = service.getCurrentExercise();
      expect(currentExercise).toEqual(mockExercises[0]);
    });

    it("should return null when no session is active", () => {
      expect(service.getCurrentExercise()).toBeNull();
    });

    it("should move to the next exercise after completing the current one", () => {
      const completedSpy = jest.fn();
      service.on("exerciseCompleted", completedSpy);
      service.startSession(mockExercises);
      // Complete first exercise
      for (let i = 0; i < mockExercises[0].successCriteria.requiredShots; i++) {
        service.processShot({ ...mockShot, timestamp: Date.now() + i });
      }
      expect(completedSpy).toHaveBeenCalled();
      expect(service.getCurrentExercise()).toEqual(mockExercises[1]);
    });

    it("should complete the session when all exercises are done", () => {
      const endedSpy = jest.fn();
      service.on("sessionEnded", endedSpy);
      service.startSession(mockExercises);
      // For each exercise, process the required number of shots, but break if session ends
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

  describe("shot processing", () => {
    it("should process a shot and update session progress", () => {
      const spy = jest.fn();
      service.on("shotProcessed", spy);
      service.startSession(mockExercises);
      service.processShot(mockShot);
      expect(spy).toHaveBeenCalled();
      const session = (service as any)["currentSession"];
      expect(session?.shots.length).toBe(1);
      expect(session?.shots[0]).toEqual(mockShot);
    });

    it("should throw error when processing shot with no active session", () => {
      expect(() => service.processShot(mockShot)).toThrow(
        "No training session in progress",
      );
    });

    it("should evaluate exercise completion based on success criteria", () => {
      const completedSpy = jest.fn();
      service.on("exerciseCompleted", completedSpy);
      service.startSession(mockExercises);
      const exercise = service.getCurrentExercise();
      for (let i = 0; i < (exercise?.successCriteria.requiredShots || 0); i++) {
        service.processShot({ ...mockShot, success: true });
      }
      expect(completedSpy).toHaveBeenCalled();
    });
  });

  describe("exercise generation", () => {
    it("should generate exercises based on weaknesses", () => {
      const weaknesses = ["accuracy", "power"];
      const exercises = service.generateExercises(weaknesses, 1);
      expect(exercises.length).toBe(2);
      expect(exercises[0].type).toBe("accuracy");
      // 'power' maps to 'technique' in implementation
      expect(exercises[1].type).toBe("technique");
      expect(exercises[0].difficulty).toBe(1);
      expect(exercises[1].difficulty).toBe(1);
    });

    it("should create exercises with appropriate difficulty scaling", () => {
      const weaknesses = ["accuracy"];
      const exercises = service.generateExercises(weaknesses, 3);

      expect(exercises[0].difficulty).toBe(3);
      expect(exercises[0].targetMetrics.accuracy).toBeGreaterThan(0.7);
      expect(exercises[0].successCriteria.requiredShots).toBeGreaterThan(5);
      expect(exercises[0].successCriteria.successRate).toBeGreaterThan(0.6);
    });
  });

  describe("event handling", () => {
    it("should emit events in the correct order", () => {
      const events: string[] = [];
      service.on("sessionStarted", () => events.push("sessionStarted"));
      service.on("shotProcessed", () => events.push("shotProcessed"));
      service.on("exerciseCompleted", () => events.push("exerciseCompleted"));
      service.on("sessionCompleted", () => events.push("sessionCompleted"));
      service.on("sessionEnded", () => events.push("sessionEnded"));
      service.startSession(mockExercises);
      service.processShot(mockShot);
      service.endSession();
      expect(events).toEqual([
        "sessionStarted",
        "shotProcessed",
        // Only sessionEnded is emitted on manual endSession
        "sessionEnded",
      ]);
    });

    it("should remove event listeners correctly", () => {
      const spy = jest.fn();
      service.on("sessionStarted", spy);
      service.removeAllListeners("sessionStarted");

      service.startSession(mockExercises);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("progress tracking", () => {
    let mockShots: ShotData[];

    beforeEach(() => {
      mockShots = [
        {
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
        },
        {
          timestamp: Date.now(),
          ballPositions: {
            cueBall: { x: 10, y: 20 },
            targetBall: { x: 30, y: 40 },
          },
          shotType: "straight",
          power: 0.8,
          spin: { top: 0.2, side: 0.1 },
          success: false,
          accuracy: 0.6,
        },
      ];
    });

    it("should update progress metrics correctly", () => {
      const spy = jest.fn();
      service.on("progressUpdated", spy);
      service.startSession(mockExercises);
      mockShots.forEach((shot) => service.processShot(shot));
      expect(spy).toHaveBeenCalled();
      const session = service["currentSession"];
      expect(session?.progress.successRate).toBeCloseTo(0.5, 2);
      expect(session?.progress.averageAccuracy).toBeCloseTo(0.775, 2);
    });

    it("should handle empty shot history", () => {
      service.startSession(mockExercises);
      const session = service["currentSession"];
      expect(session?.progress.successRate).toBe(0);
      expect(session?.progress.averageAccuracy).toBe(0);
    });
  });

  describe("exercise generation", () => {
    it("should generate spin exercises with correct metrics", () => {
      const weaknesses = ["Spin Control"];
      const exercises = service.generateExercises(weaknesses, 2);

      expect(exercises).toHaveLength(1);
      expect(exercises[0].type).toBe("spin");
      expect(exercises[0].targetMetrics.spin).toBeDefined();
      expect(exercises[0].targetMetrics.spin?.top).toBeGreaterThan(0);
      expect(exercises[0].targetMetrics.spin?.side).toBeGreaterThan(0);
    });

    it("should generate technique exercises with consecutive success criteria", () => {
      const weaknesses = ["Unknown Weakness"];
      const exercises = service.generateExercises(weaknesses, 3);

      expect(exercises).toHaveLength(1);
      expect(exercises[0].type).toBe("technique");
      expect(exercises[0].successCriteria.consecutiveSuccesses).toBeDefined();
      expect(exercises[0].successCriteria.consecutiveSuccesses).toBe(3);
    });

    it("should scale difficulty appropriately", () => {
      const weaknesses = ["Accuracy"];
      const easyExercises = service.generateExercises(weaknesses, 1);
      const hardExercises = service.generateExercises(weaknesses, 5);

      expect(easyExercises[0].targetMetrics.accuracy).toBeLessThan(
        hardExercises[0].targetMetrics.accuracy,
      );
      expect(easyExercises[0].successCriteria.requiredShots).toBeLessThan(
        hardExercises[0].successCriteria.requiredShots,
      );
      expect(easyExercises[0].successCriteria.successRate).toBeLessThan(
        hardExercises[0].successCriteria.successRate,
      );
    });
  });

  describe("error handling", () => {
    it("should handle invalid exercise data", () => {
      const invalidExercises = [
        {
          id: "invalid",
          type: "invalid" as any,
          difficulty: -1,
          description: "",
          targetMetrics: {
            accuracy: -0.1,
          },
          successCriteria: {
            requiredShots: 0,
            successRate: -0.1,
          },
        },
      ];

      expect(() => service.startSession(invalidExercises)).toThrow();
    });

    it("should handle invalid shot data", () => {
      const invalidShot: ShotData = {
        timestamp: Date.now(),
        ballPositions: {
          cueBall: { x: -1, y: -1 },
          targetBall: { x: -1, y: -1 },
        },
        shotType: "",
        power: -1,
        spin: { top: -1, side: -1 },
        success: false,
        accuracy: -1,
      };

      service.startSession(mockExercises);
      expect(() => service.processShot(invalidShot)).not.toThrow();
    });
  });
});
