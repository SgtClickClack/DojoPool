import * as tf from "@tensorflow/tfjs";
import { ShotData } from "./ShotAnalysisService";
import * as fs from "fs";
import * as path from "path";

interface ModelMetadata {
  version: string;
  inputShape: number[];
  numClasses: number;
  validationMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } | null;
  createdAt: string;
  lastUpdated: string;
  trainingHistory: {
    epochs: number;
    batchSize: number;
    validationSplit: number;
  };
}

export class ShotAnalysisModel {
  private model: tf.LayersModel;
  private readonly inputShape = [10]; // Number of features
  private readonly numClasses = 2; // Success/Failure
  private validationMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } | null = null;
  private metadata: ModelMetadata;

  constructor() {
    this.model = this.buildModel();
    this.metadata = this.initializeMetadata();
  }

  private initializeMetadata(): ModelMetadata {
    return {
      version: "1.0.0",
      inputShape: this.inputShape,
      numClasses: this.numClasses,
      validationMetrics: null,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      trainingHistory: {
        epochs: 0,
        batchSize: 0,
        validationSplit: 0,
      },
    };
  }

  private buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
        inputShape: [this.inputShape[0]],
      }),
    );

    // Hidden layers
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output layer
    model.add(
      tf.layers.dense({
        units: this.numClasses,
        activation: "softmax",
      }),
    );

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  public async train(
    trainingData: ShotData[],
    labels: number[][],
    epochs: number = 100,
    batchSize: number = 32,
    validationSplit: number = 0.2,
  ): Promise<tf.History> {
    const features = this.preprocessData(trainingData);
    const oneHotLabels = tf.tensor2d(labels, [labels.length, this.numClasses]);

    // Split data into training and validation sets
    const splitIndex = Math.floor(features.shape[0] * (1 - validationSplit));
    const trainFeatures = features.slice([0, 0], [splitIndex, -1]);
    const trainLabels = oneHotLabels.slice([0, 0], [splitIndex, -1]);
    const valFeatures = features.slice([splitIndex, 0], [-1, -1]);
    const valLabels = oneHotLabels.slice([splitIndex, 0], [-1, -1]);

    const history = await this.model.fit(trainFeatures, trainLabels, {
      epochs,
      batchSize,
      validationData: [valFeatures, valLabels],
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          console.log(
            `Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`,
          );
        },
      },
    });

    // Calculate validation metrics
    const valPredictions = this.model.predict(valFeatures) as tf.Tensor;
    const valTrueLabels = valLabels;
    this.validationMetrics = await this.evaluateModel(
      valPredictions,
      valTrueLabels,
    );

    // Update metadata
    this.metadata.lastUpdated = new Date().toISOString();
    this.metadata.validationMetrics = this.validationMetrics;
    this.metadata.trainingHistory = {
      epochs,
      batchSize,
      validationSplit,
    };

    return history;
  }

  public async evaluateModel(
    features: tf.Tensor,
    labels: tf.Tensor,
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    const predictions = this.model.predict(features) as tf.Tensor;
    const predictedClasses = tf.argMax(predictions, 1);
    const trueClasses = tf.argMax(labels, 1);

    // Calculate confusion matrix
    const confusionMatrix = await this.calculateConfusionMatrix(
      predictedClasses,
      trueClasses,
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(confusionMatrix);
    this.validationMetrics = metrics;

    return metrics;
  }

  private async calculateConfusionMatrix(
    predicted: tf.Tensor,
    trueLabels: tf.Tensor,
  ): Promise<number[][]> {
    const numClasses = this.numClasses;
    const matrix = Array(numClasses)
      .fill(0)
      .map(() => Array(numClasses).fill(0));

    const predictedData = await predicted.data();
    const trueData = await trueLabels.data();
    const predictedArray = Array.from(predictedData as Float32Array);
    const trueArray = Array.from(trueData as Float32Array);

    for (let i = 0; i < predictedArray.length; i++) {
      matrix[trueArray[i]][predictedArray[i]]++;
    }

    return matrix;
  }

  private calculateMetrics(confusionMatrix: number[][]): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    const numClasses = this.numClasses;
    let totalCorrect = 0;
    let totalPredictions = 0;
    const precisions: number[] = [];
    const recalls: number[] = [];

    for (let i = 0; i < numClasses; i++) {
      const truePositives = confusionMatrix[i][i];
      let falsePositives = 0;
      let falseNegatives = 0;

      for (let j = 0; j < numClasses; j++) {
        if (j !== i) {
          falsePositives += confusionMatrix[j][i];
          falseNegatives += confusionMatrix[i][j];
        }
      }

      totalCorrect += truePositives;
      totalPredictions += truePositives + falsePositives;

      const precision = truePositives / (truePositives + falsePositives) || 0;
      const recall = truePositives / (truePositives + falseNegatives) || 0;

      precisions.push(precision);
      recalls.push(recall);
    }

    const accuracy = totalCorrect / totalPredictions;
    const avgPrecision = precisions.reduce((a, b) => a + b, 0) / numClasses;
    const avgRecall = recalls.reduce((a, b) => a + b, 0) / numClasses;
    const f1Score =
      (2 * (avgPrecision * avgRecall)) / (avgPrecision + avgRecall) || 0;

    return {
      accuracy,
      precision: avgPrecision,
      recall: avgRecall,
      f1Score,
    };
  }

  public getValidationMetrics(): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } | null {
    return this.validationMetrics;
  }

  public async predict(shotData: ShotData): Promise<{
    success: boolean;
    confidence: number;
    accuracy: number;
  }> {
    const features = this.preprocessData([shotData]);
    const prediction = this.model.predict(features) as tf.Tensor;
    const result = await prediction.data();

    return {
      success: result[1] > result[0],
      confidence: Math.max(...result),
      accuracy: this.calculateAccuracy(shotData),
    };
  }

  private preprocessData(shots: ShotData[]): tf.Tensor {
    const features = shots.map((shot) => {
      // Use ballPositions or fallback to optional properties
      const cueBall = shot.ballPositions?.cueBall || shot.cueBall || { x: 0, y: 0 };
      const targetBall = shot.ballPositions?.targetBall || shot.targetBall || { x: 0, y: 0 };
      const english = shot.english || shot.spin || { top: 0, side: 0 };
      
      const distance = this.calculateDistance(cueBall, targetBall);
      const angle = this.calculateAngle(cueBall, targetBall);
      const accuracy = this.calculateAccuracy(shot);

      return [
        cueBall.x,
        cueBall.y,
        targetBall.x,
        targetBall.y,
        english.top,
        english.side,
        distance,
        angle,
        accuracy,
        shot.success ? 1 : 0,
      ];
    });

    return tf.tensor2d(features, [features.length, this.inputShape[0]]);
  }

  private calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
  ): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2),
    );
  }

  private calculateAngle(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
  ): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  private calculateAccuracy(shot: ShotData): number {
    // Use ballPositions or fallback to optional properties
    const cueBall = shot.ballPositions?.cueBall || shot.cueBall || { x: 0, y: 0 };
    const targetBall = shot.ballPositions?.targetBall || shot.targetBall || { x: 0, y: 0 };
    const english = shot.english || shot.spin || { top: 0, side: 0 };
    
    // Calculate accuracy based on multiple factors
    const distanceFactor =
      1 - this.calculateDistance(cueBall, targetBall) / 100; // Normalize to table size

    const spinFactor =
      1 - (Math.abs(english.top) + Math.abs(english.side)) / 2;
    const powerFactor = 1 - Math.abs(shot.power - 0.5); // Ideal power is 0.5

    // Weighted average of factors
    return distanceFactor * 0.4 + spinFactor * 0.3 + powerFactor * 0.3;
  }

  public async saveModel(modelPath: string): Promise<void> {
    // Create model directory if it doesn't exist
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }

    // Save model weights and topology
    await this.model.save(`file://${modelPath}/model`);

    // Save metadata
    const metadataPath = path.join(modelPath, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  public async loadModel(modelPath: string): Promise<void> {
    // Load model weights and topology
    this.model = await tf.loadLayersModel(
      `file://${modelPath}/model/model.json`,
    );

    // Load metadata
    const metadataPath = path.join(modelPath, "metadata.json");
    if (fs.existsSync(metadataPath)) {
      const metadataJson = fs.readFileSync(metadataPath, "utf-8");
      this.metadata = JSON.parse(metadataJson);
      this.validationMetrics = this.metadata.validationMetrics;
    } else {
      this.metadata = this.initializeMetadata();
    }
  }

  public getMetadata(): ModelMetadata {
    return this.metadata;
  }
}
