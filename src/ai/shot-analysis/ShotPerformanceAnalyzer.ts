import { ShotData } from "./ShotAnalysisService";

export interface ShotAnalysis {
  strength: number;
  technique: string;
  recommendations: string[];
  patterns: {
    accuracy: number;
    consistency: number;
    powerControl: number;
    spinControl: number;
  };
  metrics: {
    averageAccuracy: number;
    successRate: number;
    preferredShots: string[];
    weaknesses: string[];
  };
}

export class ShotPerformanceAnalyzer {
  private shotHistory: ShotData[] = [];
  private readonly HISTORY_LIMIT = 50;

  /**
   * Add a shot to the history for analysis
   */
  public addShot(shot: ShotData): void {
    this.shotHistory.unshift(shot);
    if (this.shotHistory.length > this.HISTORY_LIMIT) {
      this.shotHistory.pop();
    }
  }

  /**
   * Analyze a specific shot and provide feedback
   */
  public analyzeSingleShot(shot: ShotData): ShotAnalysis {
    const strength = this.calculateShotStrength(shot);
    const technique = this.analyzeTechnique(shot);
    const recommendations = this.generateRecommendations(shot);
    const patterns = this.analyzePatterns(shot);
    const metrics = this.calculateMetrics();

    return {
      strength,
      technique,
      recommendations,
      patterns,
      metrics,
    };
  }

  /**
   * Calculate shot strength based on power and accuracy
   */
  private calculateShotStrength(shot: ShotData): number {
    const powerFactor = shot.power * 0.4;
    const accuracyFactor = shot.accuracy * 0.6;
    return (powerFactor + accuracyFactor) * 100;
  }

  /**
   * Analyze shot technique based on ball positions and spin
   */
  private analyzeTechnique(shot: ShotData): string {
    const { ballPositions, spin } = shot;
    const distance = this.calculateDistance(
      ballPositions.cueBall,
      ballPositions.targetBall,
    );

    if (distance < 50) {
      return spin.top > 0.5 ? "Follow Shot" : "Stop Shot";
    } else if (distance < 150) {
      return spin.side > 0.3 ? "Cut Shot with English" : "Cut Shot";
    } else {
      return "Power Shot";
    }
  }

  /**
   * Generate recommendations based on shot analysis
   */
  private generateRecommendations(shot: ShotData): string[] {
    const recommendations: string[] = [];

    if (shot.power > 0.8 && shot.accuracy < 0.7) {
      recommendations.push("Consider reducing power for better accuracy");
    }

    if (Math.abs(shot.spin.side) > 0.7) {
      recommendations.push("High side spin may reduce consistency");
    }

    if (shot.accuracy < 0.6) {
      recommendations.push("Focus on fundamental stance and alignment");
    }

    return recommendations;
  }

  /**
   * Analyze shot patterns based on current shot and history
   */
  private analyzePatterns(shot: ShotData): {
    accuracy: number;
    consistency: number;
    powerControl: number;
    spinControl: number;
  } {
    const recentShots = this.shotHistory.slice(0, 10);

    const accuracy = this.calculateAverageAccuracy(recentShots);
    const consistency = this.calculateConsistency(recentShots);
    const powerControl = this.calculatePowerControl(recentShots);
    const spinControl = this.calculateSpinControl(recentShots);

    return {
      accuracy,
      consistency,
      powerControl,
      spinControl,
    };
  }

  /**
   * Calculate overall performance metrics
   */
  private calculateMetrics(): {
    averageAccuracy: number;
    successRate: number;
    preferredShots: string[];
    weaknesses: string[];
  } {
    const averageAccuracy =
      this.shotHistory.reduce((sum, shot) => sum + shot.accuracy, 0) /
      (this.shotHistory.length || 1);

    const successRate =
      this.shotHistory.filter((shot) => shot.success).length /
      (this.shotHistory.length || 1);

    const shotTypes = this.shotHistory.map((shot) =>
      this.analyzeTechnique(shot),
    );
    const preferredShots = this.findMostCommon(shotTypes, 3);

    const weaknesses = this.identifyWeaknesses();

    return {
      averageAccuracy,
      successRate,
      preferredShots,
      weaknesses,
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
  ): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate average accuracy from a set of shots
   */
  private calculateAverageAccuracy(shots: ShotData[]): number {
    return (
      shots.reduce((sum, shot) => sum + shot.accuracy, 0) / (shots.length || 1)
    );
  }

  /**
   * Calculate shot consistency based on accuracy variation
   */
  private calculateConsistency(shots: ShotData[]): number {
    const accuracies = shots.map((shot) => shot.accuracy);
    const mean =
      accuracies.reduce((sum, acc) => sum + acc, 0) / (accuracies.length || 1);
    const variance =
      accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) /
      (accuracies.length || 1);
    return 1 - Math.sqrt(variance);
  }

  /**
   * Calculate power control based on power variation
   */
  private calculatePowerControl(shots: ShotData[]): number {
    const powers = shots.map((shot) => shot.power);
    const mean =
      powers.reduce((sum, power) => sum + power, 0) / (powers.length || 1);
    const variance =
      powers.reduce((sum, power) => sum + Math.pow(power - mean, 2), 0) /
      (powers.length || 1);
    return 1 - Math.sqrt(variance);
  }

  /**
   * Calculate spin control based on spin variation
   */
  private calculateSpinControl(shots: ShotData[]): number {
    const spins = shots.map(
      (shot) => Math.abs(shot.spin.top) + Math.abs(shot.spin.side),
    );
    const mean =
      spins.reduce((sum, spin) => sum + spin, 0) / (spins.length || 1);
    const variance =
      spins.reduce((sum, spin) => sum + Math.pow(spin - mean, 2), 0) /
      (spins.length || 1);
    return 1 - Math.sqrt(variance);
  }

  /**
   * Find most common elements in an array
   */
  private findMostCommon(arr: string[], count: number): string[] {
    const frequency = new Map<string, number>();
    arr.forEach((item) => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([item]) => item);
  }

  /**
   * Identify player weaknesses based on shot history
   */
  private identifyWeaknesses(): string[] {
    const weaknesses: string[] = [];
    const metrics = {
      longShots: this.analyzeSuccessRate(
        (shot) =>
          this.calculateDistance(
            shot.ballPositions.cueBall,
            shot.ballPositions.targetBall,
          ) > 150,
      ),
      powerShots: this.analyzeSuccessRate((shot) => shot.power > 0.8),
      spinShots: this.analyzeSuccessRate(
        (shot) =>
          Math.abs(shot.spin.top) > 0.5 || Math.abs(shot.spin.side) > 0.5,
      ),
    };

    if (metrics.longShots < 0.6) weaknesses.push("Long Distance Shots");
    if (metrics.powerShots < 0.5) weaknesses.push("Power Control");
    if (metrics.spinShots < 0.6) weaknesses.push("Spin Control");

    return weaknesses;
  }

  /**
   * Calculate success rate for shots matching a condition
   */
  private analyzeSuccessRate(condition: (shot: ShotData) => boolean): number {
    const matchingShots = this.shotHistory.filter(condition);
    if (matchingShots.length === 0) return 0;

    return (
      matchingShots.filter((shot) => shot.success).length / matchingShots.length
    );
  }
}
