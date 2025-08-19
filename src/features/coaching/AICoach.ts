import * as tf from '@tensorflow/tfjs';
import { ShotAnalyzer } from '../vision/ShotAnalyzer';

interface Shot {
  type: 'pot' | 'miss' | 'foul';
  position: {
    x: number;
    y: number;
  };
  angle: number;
  power: number;
  english: 'left' | 'right' | 'center';
  result: 'success' | 'failure';
  timestamp: number;
}

interface GameAnalysis {
  id: string;
  playerId: string;
  shots: Shot[];
  accuracy: number;
  averageShotDifficulty: number;
  commonMistakes: string[];
  strengthAreas: string[];
  weaknessAreas: string[];
}

interface TrainingDrill {
  id: string;
  name: string;
  difficulty: number;
  focusArea: string;
  description: string;
  setupInstructions: string[];
  objectives: string[];
  expectedOutcomes: string[];
  videoUrl?: string;
}

interface CoachingSession {
  id: string;
  playerId: string;
  date: string;
  gameAnalysis: GameAnalysis;
  recommendations: TrainingDrill[];
  focusAreas: string[];
  progress: {
    [key: string]: number; // skill -> progress (0-1)
  };
}

export class AICoach {
  private model: tf.LayersModel | null = null;
  private shotAnalyzer: ShotAnalyzer;
  private gameHistory: Map<string, GameAnalysis[]> = new Map();
  private drills: TrainingDrill[] = [];

  constructor() {
    this.shotAnalyzer = new ShotAnalyzer();
    this.initializeModel();
    this.loadTrainingDrills();
  }

  private async initializeModel() {
    try {
      this.model = await tf.loadLayersModel('/models/ai-coach/model.json');
    } catch (error) {
      console.error('Failed to load coaching model:', error);
    }
  }

  private async loadTrainingDrills() {
    try {
      const response = await fetch('/api/drills');
      this.drills = await response.json();
    } catch (error) {
      console.error('Failed to load training drills:', error);
    }
  }

  public async analyzeGame(
    playerId: string,
    shots: Shot[]
  ): Promise<GameAnalysis> {
    const analysis: GameAnalysis = {
      id: Math.random().toString(36).substr(2, 9),
      playerId,
      shots,
      accuracy: this.calculateAccuracy(shots),
      averageShotDifficulty: this.calculateAverageDifficulty(shots),
      commonMistakes: this.identifyCommonMistakes(shots),
      strengthAreas: this.identifyStrengths(shots),
      weaknessAreas: this.identifyWeaknesses(shots),
    };

    // Store analysis in history
    const playerHistory = this.gameHistory.get(playerId) || [];
    playerHistory.push(analysis);
    this.gameHistory.set(playerId, playerHistory);

    return analysis;
  }

  private calculateAccuracy(shots: Shot[]): number {
    const successfulShots = shots.filter(
      (shot) => shot.result === 'success'
    ).length;
    return successfulShots / shots.length;
  }

  private calculateAverageDifficulty(shots: Shot[]): number {
    return (
      shots.reduce((sum, shot) => {
        // Calculate shot difficulty based on distance, angle, and obstacles
        const distance = Math.sqrt(
          Math.pow(shot.position.x, 2) + Math.pow(shot.position.y, 2)
        );
        const angleDifficulty = Math.abs(shot.angle) / Math.PI;
        return sum + (distance * 0.6 + angleDifficulty * 0.4);
      }, 0) / shots.length
    );
  }

  private identifyCommonMistakes(shots: Shot[]): string[] {
    const mistakes: string[] = [];
    const missedShots = shots.filter((shot) => shot.result === 'failure');

    // Analyze power control
    const powerIssues = missedShots.filter((shot) => shot.power > 0.8).length;
    if (powerIssues / missedShots.length > 0.3) {
      mistakes.push('Excessive power on difficult shots');
    }

    // Analyze english usage
    const englishIssues = missedShots.filter(
      (shot) => shot.english !== 'center'
    ).length;
    if (englishIssues / missedShots.length > 0.4) {
      mistakes.push('Unnecessary english application');
    }

    // Analyze angle selection
    const angleIssues = missedShots.filter(
      (shot) => Math.abs(shot.angle) > Math.PI / 3
    ).length;
    if (angleIssues / missedShots.length > 0.3) {
      mistakes.push('Challenging angle selection');
    }

    return mistakes;
  }

  private identifyStrengths(shots: Shot[]): string[] {
    const strengths: string[] = [];
    const successfulShots = shots.filter((shot) => shot.result === 'success');

    // Analyze long shots
    const longShots = successfulShots.filter((shot) => {
      const distance = Math.sqrt(
        Math.pow(shot.position.x, 2) + Math.pow(shot.position.y, 2)
      );
      return distance > 0.7; // 70% of table length
    });
    if (longShots.length / successfulShots.length > 0.3) {
      strengths.push('Long distance shots');
    }

    // Analyze spin control
    const spinShots = successfulShots.filter(
      (shot) => shot.english !== 'center'
    );
    if (spinShots.length / successfulShots.length > 0.4) {
      strengths.push('Spin control');
    }

    // Analyze angle shots
    const angleShots = successfulShots.filter(
      (shot) => Math.abs(shot.angle) > Math.PI / 4
    );
    if (angleShots.length / successfulShots.length > 0.3) {
      strengths.push('Angle shots');
    }

    return strengths;
  }

  private identifyWeaknesses(shots: Shot[]): string[] {
    const weaknesses: string[] = [];
    const missedShots = shots.filter((shot) => shot.result === 'failure');

    // Analyze patterns in missed shots
    const patterns = {
      closeRange: 0,
      powerControl: 0,
      spinControl: 0,
      angleShots: 0,
    };

    missedShots.forEach((shot) => {
      const distance = Math.sqrt(
        Math.pow(shot.position.x, 2) + Math.pow(shot.position.y, 2)
      );

      if (distance < 0.3) patterns.closeRange++;
      if (shot.power > 0.8 || shot.power < 0.2) patterns.powerControl++;
      if (shot.english !== 'center') patterns.spinControl++;
      if (Math.abs(shot.angle) > Math.PI / 4) patterns.angleShots++;
    });

    // Identify significant weaknesses
    const threshold = missedShots.length * 0.3;
    if (patterns.closeRange > threshold)
      weaknesses.push('Close range accuracy');
    if (patterns.powerControl > threshold) weaknesses.push('Power control');
    if (patterns.spinControl > threshold) weaknesses.push('Spin control');
    if (patterns.angleShots > threshold) weaknesses.push('Angle shots');

    return weaknesses;
  }

  public async createCoachingSession(
    playerId: string,
    gameAnalysis: GameAnalysis
  ): Promise<CoachingSession> {
    // Get player's historical performance
    const playerHistory = this.gameHistory.get(playerId) || [];

    // Identify focus areas based on recent games
    const focusAreas = this.identifyFocusAreas(gameAnalysis, playerHistory);

    // Select appropriate drills
    const recommendations = this.recommendDrills(
      focusAreas,
      gameAnalysis.weaknessAreas
    );

    // Calculate progress in different areas
    const progress = this.calculateProgress(playerHistory);

    return {
      id: Math.random().toString(36).substr(2, 9),
      playerId,
      date: new Date().toISOString(),
      gameAnalysis,
      recommendations,
      focusAreas,
      progress,
    };
  }

  private identifyFocusAreas(
    currentGame: GameAnalysis,
    history: GameAnalysis[]
  ): string[] {
    const focusAreas = new Set<string>();

    // Add current weaknesses
    currentGame.weaknessAreas.forEach((weakness) => focusAreas.add(weakness));

    // Analyze historical trends
    if (history.length > 0) {
      const recentGames = history.slice(-5);
      const consistentWeaknesses = this.findConsistentWeaknesses(recentGames);
      consistentWeaknesses.forEach((weakness) => focusAreas.add(weakness));
    }

    return Array.from(focusAreas);
  }

  private findConsistentWeaknesses(games: GameAnalysis[]): string[] {
    const weaknessCounts = new Map<string, number>();

    games.forEach((game) => {
      game.weaknessAreas.forEach((weakness) => {
        weaknessCounts.set(weakness, (weaknessCounts.get(weakness) || 0) + 1);
      });
    });

    // Return weaknesses that appear in majority of games
    return Array.from(weaknessCounts.entries())
      .filter(([_, count]) => count >= games.length * 0.6)
      .map(([weakness]) => weakness);
  }

  private recommendDrills(
    focusAreas: string[],
    weaknesses: string[]
  ): TrainingDrill[] {
    const recommendations: TrainingDrill[] = [];

    // Prioritize drills that target multiple focus areas
    this.drills.forEach((drill) => {
      const relevanceScore = this.calculateDrillRelevance(
        drill,
        focusAreas,
        weaknesses
      );
      if (relevanceScore > 0.5) {
        recommendations.push(drill);
      }
    });

    // Sort by relevance and return top recommendations
    return recommendations
      .sort(
        (a, b) =>
          this.calculateDrillRelevance(b, focusAreas, weaknesses) -
          this.calculateDrillRelevance(a, focusAreas, weaknesses)
      )
      .slice(0, 5);
  }

  private calculateDrillRelevance(
    drill: TrainingDrill,
    focusAreas: string[],
    weaknesses: string[]
  ): number {
    let score = 0;

    // Check if drill focuses on current weaknesses
    if (weaknesses.includes(drill.focusArea)) {
      score += 0.6;
    }

    // Check if drill addresses focus areas
    if (focusAreas.includes(drill.focusArea)) {
      score += 0.4;
    }

    return score;
  }

  private calculateProgress(history: GameAnalysis[]): {
    [key: string]: number;
  } {
    const progress: { [key: string]: number } = {};
    const recentGames = history.slice(-10);

    if (recentGames.length === 0) return progress;

    // Calculate progress in different areas
    const areas = ['accuracy', 'power_control', 'spin_control', 'positioning'];

    areas.forEach((area) => {
      const scores = recentGames.map((game) => this.getAreaScore(game, area));
      const trend = this.calculateProgressTrend(scores);
      progress[area] = Math.max(0, Math.min(1, trend));
    });

    return progress;
  }

  private getAreaScore(game: GameAnalysis, area: string): number {
    switch (area) {
      case 'accuracy':
        return game.accuracy;
      case 'power_control':
        return (
          1 - game.shots.filter((s) => s.power > 0.8).length / game.shots.length
        );
      case 'spin_control':
        return (
          game.shots.filter(
            (s) => s.english !== 'center' && s.result === 'success'
          ).length / game.shots.length
        );
      case 'positioning':
        return (
          1 -
          game.commonMistakes.filter(
            (m) => m.includes('position') || m.includes('angle')
          ).length /
            game.commonMistakes.length
        );
      default:
        return 0;
    }
  }

  private calculateProgressTrend(scores: number[]): number {
    if (scores.length < 2) return scores[0] || 0;

    // Calculate weighted average of improvement
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 1; i < scores.length; i++) {
      const improvement = scores[i] - scores[i - 1];
      const weight = i / scores.length; // More recent improvements weighted higher
      weightedSum += improvement * weight;
      weightSum += weight;
    }

    return scores[scores.length - 1] + weightedSum / weightSum;
  }
}

export default AICoach;
