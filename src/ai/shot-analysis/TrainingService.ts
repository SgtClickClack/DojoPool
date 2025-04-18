import { EventEmitter } from "events";
import { ShotData } from "./ShotAnalysisService";
import {
  ShotPerformanceAnalyzer,
  ShotAnalysis,
} from "./ShotPerformanceAnalyzer";

export interface TrainingExercise {
  id: string;
  type: "accuracy" | "power" | "spin" | "technique";
  difficulty: number;
  description: string;
  targetMetrics: {
    accuracy: number;
    power?: number;
    spin?: {
      top: number;
      side: number;
    };
  };
  successCriteria: {
    requiredShots: number;
    successRate: number;
    consecutiveSuccesses?: number;
  };
}

export interface TrainingSession {
  id: string;
  startTime: number;
  endTime?: number;
  exercises: TrainingExercise[];
  currentExerciseIndex: number;
  progress: {
    completedExercises: number;
    totalExercises: number;
    successRate: number;
    averageAccuracy: number;
  };
  shots: ShotData[];
}

export class TrainingService extends EventEmitter {
  private analyzer: ShotPerformanceAnalyzer;
  private currentSession: TrainingSession | null = null;
  private readonly EXERCISE_TYPES: TrainingExercise["type"][] = [
    "accuracy",
    "power",
    "spin",
    "technique",
  ];

  constructor() {
    super();
    this.analyzer = new ShotPerformanceAnalyzer();
  }

  /**
   * Start a new training session
   */
  public startSession(exercises: TrainingExercise[]): TrainingSession {
    if (this.currentSession) {
      throw new Error("A training session is already in progress");
    }

    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      exercises,
      currentExerciseIndex: 0,
      progress: {
        completedExercises: 0,
        totalExercises: exercises.length,
        successRate: 0,
        averageAccuracy: 0,
      },
      shots: [],
    };

    this.emit("sessionStarted", this.currentSession);
    return this.currentSession;
  }

  /**
   * End the current training session
   */
  public endSession(): TrainingSession {
    if (!this.currentSession) {
      throw new Error("No training session in progress");
    }

    this.currentSession.endTime = Date.now();
    const completedSession = { ...this.currentSession };
    this.currentSession = null;

    this.emit("sessionEnded", completedSession);
    return completedSession;
  }

  /**
   * Process a shot during training
   */
  public processShot(shot: ShotData): void {
    if (!this.currentSession) {
      throw new Error("No training session in progress");
    }

    // Add shot to session history
    this.currentSession.shots.push(shot);
    this.analyzer.addShot(shot);

    // Check exercise completion
    this.checkExerciseCompletion();

    // Update session progress
    this.updateProgress();

    // Emit shot processed event
    this.emit("shotProcessed", {
      shot,
      session: this.currentSession,
      currentExercise: this.getCurrentExercise(),
    });
  }

  /**
   * Get the current exercise
   */
  public getCurrentExercise(): TrainingExercise | null {
    if (!this.currentSession) return null;
    return this.currentSession.exercises[
      this.currentSession.currentExerciseIndex
    ];
  }

  /**
   * Check if the current exercise is completed
   */
  private checkExerciseCompletion(): void {
    if (!this.currentSession) return;

    const currentExercise = this.getCurrentExercise();
    if (!currentExercise) return;

    const exerciseShots = this.currentSession.shots.slice(
      -currentExercise.successCriteria.requiredShots,
    );

    if (exerciseShots.length < currentExercise.successCriteria.requiredShots) {
      return;
    }

    const successRate =
      exerciseShots.filter((shot) => shot.success).length /
      exerciseShots.length;
    const averageAccuracy =
      exerciseShots.reduce((sum, shot) => sum + shot.accuracy, 0) /
      exerciseShots.length;

    if (
      successRate >= currentExercise.successCriteria.successRate &&
      averageAccuracy >= currentExercise.targetMetrics.accuracy
    ) {
      this.completeCurrentExercise();
    }
  }

  /**
   * Complete the current exercise and move to the next one
   */
  private completeCurrentExercise(): void {
    if (!this.currentSession) return;

    this.currentSession.currentExerciseIndex++;
    this.currentSession.progress.completedExercises++;

    if (
      this.currentSession.currentExerciseIndex >=
      this.currentSession.exercises.length
    ) {
      this.endSession();
    } else {
      this.emit("exerciseCompleted", {
        session: this.currentSession,
        nextExercise: this.getCurrentExercise(),
      });
    }
  }

  /**
   * Update session progress metrics
   */
  private updateProgress(): void {
    if (!this.currentSession) return;

    const shots = this.currentSession.shots;
    if (shots.length === 0) return;

    this.currentSession.progress.successRate =
      shots.filter((shot) => shot.success).length / shots.length;
    this.currentSession.progress.averageAccuracy =
      shots.reduce((sum, shot) => sum + shot.accuracy, 0) / shots.length;

    this.emit("progressUpdated", this.currentSession.progress);
  }

  /**
   * Generate training exercises based on player's weaknesses
   */
  public generateExercises(
    weaknesses: string[],
    difficulty: number = 1,
  ): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];

    // Generate exercises for each weakness
    weaknesses.forEach((weakness) => {
      const exerciseType = this.determineExerciseType(weakness);
      exercises.push(this.createExercise(exerciseType, difficulty));
    });

    return exercises;
  }

  /**
   * Determine exercise type based on weakness
   */
  private determineExerciseType(weakness: string): TrainingExercise["type"] {
    switch (weakness.toLowerCase()) {
      case "long distance shots":
      case "accuracy":
        return "accuracy";
      case "power control":
        return "power";
      case "spin control":
        return "spin";
      default:
        return "technique";
    }
  }

  /**
   * Create a training exercise
   */
  private createExercise(
    type: TrainingExercise["type"],
    difficulty: number,
  ): TrainingExercise {
    const baseMetrics = {
      accuracy: 0.7 + difficulty * 0.05,
      requiredShots: 5 + difficulty * 2,
      successRate: 0.6 + difficulty * 0.05,
    };

    switch (type) {
      case "power":
        return {
          id: `exercise-${Date.now()}-power`,
          type: "power",
          difficulty,
          description: "Practice power control with consistent accuracy",
          targetMetrics: {
            ...baseMetrics,
            power: 0.7 + difficulty * 0.1,
          },
          successCriteria: {
            requiredShots: baseMetrics.requiredShots,
            successRate: baseMetrics.successRate,
          },
        };
      case "spin":
        return {
          id: `exercise-${Date.now()}-spin`,
          type: "spin",
          difficulty,
          description: "Practice spin control with consistent accuracy",
          targetMetrics: {
            ...baseMetrics,
            spin: {
              top: 0.3 + difficulty * 0.1,
              side: 0.3 + difficulty * 0.1,
            },
          },
          successCriteria: {
            requiredShots: baseMetrics.requiredShots,
            successRate: baseMetrics.successRate,
          },
        };
      case "technique":
        return {
          id: `exercise-${Date.now()}-technique`,
          type: "technique",
          difficulty,
          description: "Practice fundamental techniques",
          targetMetrics: baseMetrics,
          successCriteria: {
            requiredShots: baseMetrics.requiredShots,
            successRate: baseMetrics.successRate,
            consecutiveSuccesses: 3,
          },
        };
      default: // accuracy
        return {
          id: `exercise-${Date.now()}-accuracy`,
          type: "accuracy",
          difficulty,
          description: "Practice shot accuracy",
          targetMetrics: baseMetrics,
          successCriteria: {
            requiredShots: baseMetrics.requiredShots,
            successRate: baseMetrics.successRate,
          },
        };
    }
  }
}
