import {
  TrainingService,
  TrainingExercise,
  TrainingSession,
} from "./TrainingService";
import { ShotPerformanceAnalyzer } from "./ShotPerformanceAnalyzer";
import { ShotData } from "./ShotAnalysisService";

describe("TrainingService", () => {
  let trainingService: TrainingService;
  let mockAnalyzer: jest.Mocked<ShotPerformanceAnalyzer>;
  let mockExercises: TrainingExercise[];
  let mockShot: ShotData;

  beforeEach(() => {
    mockAnalyzer = {
      addShot: jest.fn(),
      getAnalysis: jest.fn(),
      getWeaknesses: jest.fn(),
      getStrengths: jest.fn(),
      getPatterns: jest.fn(),
      getMetrics: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<ShotPerformanceAnalyzer>;

    trainingService = new TrainingService();
    (trainingService as any).analyzer = mockAnalyzer;

    mockExercises = [
      {
        id: "exercise-1",
        type: "accuracy",
        difficulty: 1,
        description: "Test accuracy exercise",
        targetMetrics: {
          accuracy: 0.7,
        },
        successCriteria: {
          requiredShots: 5,
          successRate: 0.6,
        },
      },
    ];

    mockShot = {
      timestamp: Date.now(),
      ballPositions: {
        cueBall: { x: 0, y: 0 },
        targetBall: { x: 0, y: 0 },
      },
      shotType: "test",
      power: 0.5,
      spin: { top: 0, side: 0 },
      success: true,
      accuracy: 0.8,
    };
  });

  describe("Session Management", () => {
    test("should start a new training session", () => {
      const session = trainingService.startSession(mockExercises);

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session-\d+$/);
      expect(session.exercises).toEqual(mockExercises);
      expect(session.currentExerciseIndex).toBe(0);
      expect(session.progress.completedExercises).toBe(0);
      expect(session.progress.totalExercises).toBe(mockExercises.length);
    });

    test("should throw error when starting session while one is in progress", () => {
      trainingService.startSession(mockExercises);
      expect(() => trainingService.startSession(mockExercises)).toThrow(
        "A training session is already in progress",
      );
    });

    test("should end the current training session", () => {
      trainingService.startSession(mockExercises);
      const session = trainingService.endSession();

      expect(session.endTime).toBeDefined();
      expect(session.endTime).toBeGreaterThan(session.startTime);
    });

    test("should throw error when ending session with none in progress", () => {
      expect(() => trainingService.endSession()).toThrow(
        "No training session in progress",
      );
    });
  });

  describe("Shot Processing", () => {
    test("should process a shot and update session", () => {
      trainingService.startSession(mockExercises);
      trainingService.processShot(mockShot);

      expect(mockAnalyzer.addShot).toHaveBeenCalledWith(mockShot);
      const session = (trainingService as any).currentSession;
      expect(session.shots).toContain(mockShot);
    });

    test("should throw error when processing shot with no session", () => {
      expect(() => trainingService.processShot(mockShot)).toThrow(
        "No training session in progress",
      );
    });
  });

  describe("Exercise Management", () => {
    test("should get current exercise", () => {
      trainingService.startSession(mockExercises);
      const exercise = trainingService.getCurrentExercise();

      expect(exercise).toEqual(mockExercises[0]);
    });

    test("should return null when getting current exercise with no session", () => {
      expect(trainingService.getCurrentExercise()).toBeNull();
    });
  });

  describe("Exercise Generation", () => {
    test("should generate exercises based on weaknesses", () => {
      const weaknesses = ["long distance shots", "power control"];
      const exercises = trainingService.generateExercises(weaknesses, 2);

      expect(exercises.length).toBe(weaknesses.length);
      exercises.forEach((exercise) => {
        expect(exercise).toHaveProperty("id");
        expect(exercise).toHaveProperty("type");
        expect(exercise).toHaveProperty("difficulty", 2);
        expect(exercise).toHaveProperty("description");
        expect(exercise).toHaveProperty("targetMetrics");
        expect(exercise).toHaveProperty("successCriteria");
      });
    });

    test("should determine correct exercise type from weakness", () => {
      const weaknessToType = {
        "long distance shots": "accuracy",
        "power control": "power",
        "spin control": "spin",
        "unknown weakness": "technique",
      };

      Object.entries(weaknessToType).forEach(([weakness, expectedType]) => {
        const type = (trainingService as any).determineExerciseType(weakness);
        expect(type).toBe(expectedType);
      });
    });
  });

  describe("Event Emission", () => {
    test("should emit sessionStarted event", () => {
      const listener = jest.fn();
      trainingService.on("sessionStarted", listener);

      trainingService.startSession(mockExercises);

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0]).toMatchObject({
        id: expect.any(String),
        exercises: mockExercises,
      });
    });

    test("should emit sessionEnded event", () => {
      const listener = jest.fn();
      trainingService.on("sessionEnded", listener);

      trainingService.startSession(mockExercises);
      trainingService.endSession();

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0]).toHaveProperty("endTime");
    });

    test("should emit shotProcessed event", () => {
      const listener = jest.fn();
      trainingService.on("shotProcessed", listener);

      trainingService.startSession(mockExercises);
      trainingService.processShot(mockShot);

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0]).toMatchObject({
        shot: mockShot,
        session: expect.any(Object),
        currentExercise: mockExercises[0],
      });
    });
  });
});
