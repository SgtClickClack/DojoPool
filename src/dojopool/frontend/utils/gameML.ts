import * as tf from "@tensorflow/tfjs";
import { gameMetricsMonitor } from "./monitoring";

interface ShotData {
  angle: number;
  force: number;
  spin: number;
  distance: number;
  obstruction: number; // 0-1 scale of how obstructed the shot is
  difficulty: number; // 0-1 scale
  success: boolean;
}

interface PlayerSkillData {
  accuracyRate: number;
  averageShotDifficulty: number;
  consistencyScore: number;
  strategicScore: number;
  reactionTime: number;
  timestamp: number;
}

interface GamePrediction {
  shotSuccess: number; // Probability of success (0-1)
  difficulty: number; // Shot difficulty (0-1)
  recommendedForce: number; // Recommended force to apply
  recommendedSpin: number; // Recommended spin (-1 to 1)
  confidence: number; // Prediction confidence (0-1)
}

export class GameML {
  private static instance: GameML;
  private shotModel: tf.LayersModel | null = null;
  private skillModel: tf.LayersModel | null = null;
  private shotData: ShotData[] = [];
  private playerData: Map<string, PlayerSkillData[]> = new Map();

  private readonly SHOT_BUFFER_SIZE = 1000;
  private readonly SKILL_BUFFER_SIZE = 100;
  private readonly BATCH_SIZE = 32;

  private constructor() {
    this.initializeModels();
  }

  public static getInstance(): GameML {
    if (!GameML.instance) {
      GameML.instance = new GameML();
    }
    return GameML.instance;
  }

  private async initializeModels(): Promise<void> {
    try {
      // Try to load existing models
      this.shotModel = await tf.loadLayersModel(
        "indexeddb://dojopool-shot-model",
      );
      this.skillModel = await tf.loadLayersModel(
        "indexeddb://dojopool-skill-model",
      );
      console.log("Loaded existing game models");
    } catch (error) {
      console.log("Creating new game models");
      this.shotModel = this.createShotModel();
      this.skillModel = this.createSkillModel();
      await this.saveModels();
    }
  }

  private createShotModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer for shot parameters
    model.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
        inputShape: [5], // angle, force, spin, distance, obstruction
      }),
    );

    // Hidden layers
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
      }),
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(
      tf.layers.dense({
        units: 16,
        activation: "relu",
      }),
    );

    // Output layer for shot success probability and recommendations
    model.add(
      tf.layers.dense({
        units: 4, // success probability, recommended force, spin, and difficulty
        activation: "sigmoid",
      }),
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  private createSkillModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer for player metrics
    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
        inputShape: [5], // accuracy, difficulty, consistency, strategy, reaction
      }),
    );

    // Hidden layers
    model.add(
      tf.layers.dense({
        units: 16,
        activation: "relu",
      }),
    );

    // Output layer for skill assessment
    model.add(
      tf.layers.dense({
        units: 3, // overall skill, potential, recommended difficulty
        activation: "sigmoid",
      }),
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["accuracy"],
    });

    return model;
  }

  private async saveModels(): Promise<void> {
    if (this.shotModel) {
      await this.shotModel.save("indexeddb://dojopool-shot-model");
    }
    if (this.skillModel) {
      await this.skillModel.save("indexeddb://dojopool-skill-model");
    }
  }

  public recordShot(shot: ShotData): void {
    this.shotData.push(shot);
    if (this.shotData.length > this.SHOT_BUFFER_SIZE) {
      this.shotData.shift();
    }
  }

  public recordPlayerMetrics(playerId: string, metrics: PlayerSkillData): void {
    const playerMetrics = this.playerData.get(playerId) || [];
    playerMetrics.push(metrics);

    if (playerMetrics.length > this.SKILL_BUFFER_SIZE) {
      playerMetrics.shift();
    }

    this.playerData.set(playerId, playerMetrics);
  }

  public async predictShot(shot: {
    angle: number;
    force: number;
    spin: number;
    distance: number;
    obstruction: number;
  }): Promise<GamePrediction> {
    if (!this.shotModel) {
      throw new Error("Shot model not initialized");
    }

    // Normalize input
    const input = tf.tensor2d([
      [
        shot.angle / 360,
        shot.force / 100,
        (shot.spin + 1) / 2, // Convert -1,1 to 0,1
        shot.distance / 100,
        shot.obstruction,
      ],
    ]);

    // Make prediction
    const prediction = this.shotModel.predict(input) as tf.Tensor;
    const values = (await prediction.array()) as number[][];

    // Clean up tensors
    input.dispose();
    prediction.dispose();

    return {
      shotSuccess: values[0][0],
      difficulty: values[0][1],
      recommendedForce: values[0][2] * 100,
      recommendedSpin: values[0][3] * 2 - 1, // Convert 0,1 to -1,1
      confidence: 0.8, // TODO: Calculate actual confidence
    };
  }

  public async assessPlayerSkill(playerId: string): Promise<{
    overallSkill: number;
    potential: number;
    recommendedDifficulty: number;
    confidence: number;
  }> {
    if (!this.skillModel) {
      throw new Error("Skill model not initialized");
    }

    const playerMetrics = this.playerData.get(playerId);
    if (!playerMetrics || playerMetrics.length === 0) {
      throw new Error("No data available for player");
    }

    // Calculate average metrics
    const avgMetrics = playerMetrics.reduce(
      (acc, curr) => ({
        accuracyRate: acc.accuracyRate + curr.accuracyRate,
        averageShotDifficulty:
          acc.averageShotDifficulty + curr.averageShotDifficulty,
        consistencyScore: acc.consistencyScore + curr.consistencyScore,
        strategicScore: acc.strategicScore + curr.strategicScore,
        reactionTime: acc.reactionTime + curr.reactionTime,
        timestamp: curr.timestamp,
      }),
      {
        accuracyRate: 0,
        averageShotDifficulty: 0,
        consistencyScore: 0,
        strategicScore: 0,
        reactionTime: 0,
        timestamp: Date.now(),
      },
    );

    const count = playerMetrics.length;
    Object.keys(avgMetrics).forEach((key) => {
      if (key !== "timestamp") {
        avgMetrics[key] /= count;
      }
    });

    // Normalize input
    const input = tf.tensor2d([
      [
        avgMetrics.accuracyRate,
        avgMetrics.averageShotDifficulty,
        avgMetrics.consistencyScore,
        avgMetrics.strategicScore,
        avgMetrics.reactionTime / 1000, // Convert to seconds
      ],
    ]);

    // Make prediction
    const prediction = this.skillModel.predict(input) as tf.Tensor;
    const values = (await prediction.array()) as number[][];

    // Clean up tensors
    input.dispose();
    prediction.dispose();

    return {
      overallSkill: values[0][0],
      potential: values[0][1],
      recommendedDifficulty: values[0][2],
      confidence: 0.8, // TODO: Calculate actual confidence
    };
  }

  public async trainModels(): Promise<{
    shotHistory: tf.History;
    skillHistory: tf.History;
  }> {
    if (!this.shotModel || !this.skillModel) {
      throw new Error("Models not initialized");
    }

    // Train shot model
    const shotHistory = await this.trainShotModel();

    // Train skill model
    const skillHistory = await this.trainSkillModel();

    // Save updated models
    await this.saveModels();

    return {
      shotHistory,
      skillHistory,
    };
  }

  private async trainShotModel(): Promise<tf.History> {
    if (!this.shotModel || this.shotData.length < this.BATCH_SIZE) {
      throw new Error("Shot model not ready or insufficient data");
    }

    const xs = tf.tensor2d(
      this.shotData.map((shot) => [
        shot.angle / 360,
        shot.force / 100,
        (shot.spin + 1) / 2,
        shot.distance / 100,
        shot.obstruction,
      ]),
    );

    const ys = tf.tensor2d(
      this.shotData.map((shot) => [
        shot.success ? 1 : 0,
        shot.difficulty,
        shot.force / 100,
        (shot.spin + 1) / 2,
      ]),
    );

    const history = await this.shotModel.fit(xs, ys, {
      epochs: 10,
      batchSize: this.BATCH_SIZE,
      validationSplit: 0.2,
    });

    xs.dispose();
    ys.dispose();

    return history;
  }

  private async trainSkillModel(): Promise<tf.History> {
    if (!this.skillModel) {
      throw new Error("Skill model not initialized");
    }

    // Combine all player data
    const allSkillData = Array.from(this.playerData.values()).flat();
    if (allSkillData.length < this.BATCH_SIZE) {
      throw new Error("Insufficient skill data");
    }

    const xs = tf.tensor2d(
      allSkillData.map((data) => [
        data.accuracyRate,
        data.averageShotDifficulty,
        data.consistencyScore,
        data.strategicScore,
        data.reactionTime / 1000,
      ]),
    );

    // For training, we'll use the actual performance as labels
    const ys = tf.tensor2d(
      allSkillData.map((data) => [
        (data.accuracyRate + data.consistencyScore) / 2, // overall skill
        Math.min(1, data.averageShotDifficulty * 1.2), // potential (slightly higher than current difficulty)
        data.averageShotDifficulty, // recommended difficulty
      ]),
    );

    const history = await this.skillModel.fit(xs, ys, {
      epochs: 10,
      batchSize: this.BATCH_SIZE,
      validationSplit: 0.2,
    });

    xs.dispose();
    ys.dispose();

    return history;
  }

  public getModelSummaries(): {
    shot: string[];
    skill: string[];
  } {
    const shotSummary: string[] = [];
    const skillSummary: string[] = [];

    if (this.shotModel) {
      this.shotModel.summary(undefined, undefined, (line) =>
        shotSummary.push(line),
      );
    }
    if (this.skillModel) {
      this.skillModel.summary(undefined, undefined, (line) =>
        skillSummary.push(line),
      );
    }

    return {
      shot: shotSummary,
      skill: skillSummary,
    };
  }
}
