import { GameML } from "./gameML";

interface PatternData {
  shotType: string;
  position: { x: number; y: number };
  outcome: "success" | "miss" | "scratch";
  difficulty: number;
  timestamp: number;
}

interface PlayStyle {
  aggression: number; // 0-1 (defensive to aggressive)
  consistency: number; // 0-1 (erratic to consistent)
  complexity: number; // 0-1 (simple to complex shots)
  positioning: number; // 0-1 (random to strategic)
}

interface PatternInsight {
  playStyle: PlayStyle;
  preferredShots: string[];
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
}

export class PatternRecognition {
  private static instance: PatternRecognition;
  private gameML: GameML;
  private patternHistory: Map<string, PatternData[]> = new Map();
  private readonly HISTORY_LIMIT = 100;

  private constructor() {
    this.gameML = GameML.getInstance();
  }

  public static getInstance(): PatternRecognition {
    if (!PatternRecognition.instance) {
      PatternRecognition.instance = new PatternRecognition();
    }
    return PatternRecognition.instance;
  }

  public recordPattern(playerId: string, pattern: PatternData): void {
    const playerPatterns = this.patternHistory.get(playerId) || [];
    playerPatterns.push(pattern);

    // Keep history within limit
    if (playerPatterns.length > this.HISTORY_LIMIT) {
      playerPatterns.shift();
    }

    this.patternHistory.set(playerId, playerPatterns);
  }

  public async analyzePatterns(playerId: string): Promise<PatternInsight> {
    const patterns = this.patternHistory.get(playerId) || [];
    if (patterns.length < 10) {
      throw new Error("Insufficient data for pattern analysis");
    }

    // Analyze play style
    const playStyle = this.analyzePlayStyle(patterns);

    // Find preferred shots
    const preferredShots = this.findPreferredShots(patterns);

    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(patterns);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      playStyle,
      strengths,
      weaknesses,
    );

    return {
      playStyle,
      preferredShots,
      weaknesses,
      strengths,
      recommendations,
    };
  }

  private analyzePlayStyle(patterns: PatternData[]): PlayStyle {
    // Calculate aggression based on shot difficulty and type
    const aggression =
      patterns.reduce(
        (sum, p) =>
          sum + p.difficulty * (p.shotType.includes("bank") ? 1.2 : 1),
        0,
      ) / patterns.length;

    // Calculate consistency based on success rate
    const successRate =
      patterns.filter((p) => p.outcome === "success").length / patterns.length;
    const consistency =
      successRate * 0.7 + this.calculatePositionalConsistency(patterns) * 0.3;

    // Calculate complexity based on shot types
    const complexity =
      patterns.reduce((sum, p) => sum + this.getShotComplexity(p.shotType), 0) /
      patterns.length;

    // Calculate positioning based on follow-up shots
    const positioning = this.calculatePositioning(patterns);

    return {
      aggression: Math.min(1, aggression),
      consistency: Math.min(1, consistency),
      complexity: Math.min(1, complexity),
      positioning: Math.min(1, positioning),
    };
  }

  private findPreferredShots(patterns: PatternData[]): string[] {
    const shotTypes = new Map<string, number>();

    patterns.forEach((pattern) => {
      const count = shotTypes.get(pattern.shotType) || 0;
      shotTypes.set(pattern.shotType, count + 1);
    });

    return Array.from(shotTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([shotType]) => shotType);
  }

  private analyzeStrengthsWeaknesses(patterns: PatternData[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze success rates by shot type
    const shotTypeStats = new Map<
      string,
      { attempts: number; success: number }
    >();

    patterns.forEach((pattern) => {
      const stats = shotTypeStats.get(pattern.shotType) || {
        attempts: 0,
        success: 0,
      };
      stats.attempts++;
      if (pattern.outcome === "success") {
        stats.success++;
      }
      shotTypeStats.set(pattern.shotType, stats);
    });

    // Identify strengths and weaknesses
    shotTypeStats.forEach((stats, shotType) => {
      const successRate = stats.success / stats.attempts;
      if (stats.attempts >= 5) {
        // Only consider shots with enough attempts
        if (successRate >= 0.7) {
          strengths.push(
            `${shotType} shots (${(successRate * 100).toFixed(1)}% success)`,
          );
        } else if (successRate <= 0.4) {
          weaknesses.push(
            `${shotType} shots (${(successRate * 100).toFixed(1)}% success)`,
          );
        }
      }
    });

    return { strengths, weaknesses };
  }

  private async generateRecommendations(
    playStyle: PlayStyle,
    strengths: string[],
    weaknesses: string[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Style-based recommendations
    if (playStyle.aggression > 0.8) {
      recommendations.push(
        "Consider incorporating more safety plays in your strategy",
      );
    } else if (playStyle.aggression < 0.3) {
      recommendations.push(
        "Look for opportunities to take calculated aggressive shots",
      );
    }

    if (playStyle.consistency < 0.5) {
      recommendations.push("Focus on developing a consistent pre-shot routine");
    }

    if (playStyle.positioning < 0.4) {
      recommendations.push("Practice position play and cue ball control");
    }

    // Add specific practice recommendations based on weaknesses
    weaknesses.forEach((weakness) => {
      if (weakness.includes("bank")) {
        recommendations.push("Practice bank shots at various angles");
      } else if (weakness.includes("cut")) {
        recommendations.push("Work on cut shot accuracy at different angles");
      }
    });

    return recommendations;
  }

  private calculatePositionalConsistency(patterns: PatternData[]): number {
    // Calculate how consistently the player achieves good position
    let consistencyScore = 0;

    for (let i = 0; i < patterns.length - 1; i++) {
      const currentShot = patterns[i];
      const nextShot = patterns[i + 1];

      if (currentShot.outcome === "success") {
        // Check if next shot was in a favorable position
        const positionQuality = this.evaluatePosition(
          currentShot.position,
          nextShot.position,
        );
        consistencyScore += positionQuality;
      }
    }

    return consistencyScore / (patterns.length - 1);
  }

  private calculatePositioning(patterns: PatternData[]): number {
    let positioningScore = 0;
    let validShots = 0;

    for (let i = 0; i < patterns.length - 1; i++) {
      if (patterns[i].outcome === "success") {
        const positionQuality = this.evaluatePosition(
          patterns[i].position,
          patterns[i + 1].position,
        );
        positioningScore += positionQuality;
        validShots++;
      }
    }

    return validShots > 0 ? positioningScore / validShots : 0;
  }

  private evaluatePosition(
    currentPos: { x: number; y: number },
    nextPos: { x: number; y: number },
  ): number {
    // Calculate position quality based on:
    // 1. Distance to next shot
    // 2. Angle considerations
    // 3. Table position (center vs rails)

    const distance = Math.sqrt(
      Math.pow(nextPos.x - currentPos.x, 2) +
        Math.pow(nextPos.y - currentPos.y, 2),
    );

    // Normalize distance score (closer is better, but not too close)
    const distanceScore = Math.min(
      1,
      Math.max(0, 1 - Math.abs(distance - 20) / 40),
    );

    // Consider table position (center of table is generally better)
    const centerScore =
      1 - (Math.abs(nextPos.x - 50) / 50 + Math.abs(nextPos.y - 50) / 50) / 2;

    return distanceScore * 0.7 + centerScore * 0.3;
  }

  private getShotComplexity(shotType: string): number {
    const complexityScores: { [key: string]: number } = {
      straight: 0.2,
      cut: 0.4,
      bank: 0.6,
      kick: 0.7,
      combo: 0.8,
      carom: 0.9,
    };

    return complexityScores[shotType.toLowerCase()] || 0.5;
  }
}
