import { GameML } from "./gameML";

interface OptimizationSuggestion {
  type: "technique" | "strategy" | "practice";
  priority: number;
  title: string;
  description: string;
}

interface PerformanceMetrics {
  recentAccuracy: number;
  averageDifficulty: number;
  consistencyScore: number;
}

export class OptimizationEngine {
  private static instance: OptimizationEngine;
  private gameML: GameML;

  private constructor() {
    this.gameML = GameML.getInstance();
  }

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  public async generateSuggestions(
    playerId: string,
    metrics: PerformanceMetrics,
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const skillAssessment = await this.gameML.assessPlayerSkill(playerId);

    // Analyze accuracy
    if (metrics.recentAccuracy < 0.7) {
      suggestions.push({
        type: "technique",
        priority: 10,
        title: "Improve Shot Accuracy",
        description: "Focus on fundamental stance and cue alignment.",
      });
    }

    // Analyze consistency
    if (metrics.consistencyScore < 0.6) {
      suggestions.push({
        type: "technique",
        priority: 8,
        title: "Enhance Shot Consistency",
        description: "Practice repeatable pre-shot routines.",
      });
    }

    // Analyze difficulty management
    const difficultyGap = Math.abs(
      metrics.averageDifficulty - skillAssessment.recommendedDifficulty,
    );
    if (difficultyGap > 0.2) {
      suggestions.push({
        type: "strategy",
        priority: 7,
        title: "Adjust Shot Selection",
        description:
          metrics.averageDifficulty > skillAssessment.recommendedDifficulty
            ? "Focus on higher percentage shots"
            : "Gradually increase shot difficulty",
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  public async generateDrills(
    playerId: string,
    metrics: PerformanceMetrics,
  ): Promise<
    {
      drillType: string;
      difficulty: number;
      repetitions: number;
    }[]
  > {
    const skillAssessment = await this.gameML.assessPlayerSkill(playerId);
    const drills = [];

    if (metrics.recentAccuracy < 0.7) {
      drills.push({
        drillType: "Accuracy Focus",
        difficulty: Math.min(metrics.averageDifficulty + 0.1, 1),
        repetitions: 50,
      });
    }

    if (metrics.consistencyScore < 0.6) {
      drills.push({
        drillType: "Consistency Builder",
        difficulty: metrics.averageDifficulty,
        repetitions: 30,
      });
    }

    return drills;
  }
}
