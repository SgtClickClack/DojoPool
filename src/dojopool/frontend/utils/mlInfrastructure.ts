import * as tf from "@tensorflow/tfjs";
import { gameMetricsMonitor } from "./monitoring";
import { MetricData } from "../types/monitoring";

interface MLFeatures {
  timestamp: number;
  fps: number;
  inputLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  physicsTime: number;
}

interface MLPrediction {
  probability: number;
  confidence: number;
  features: string[];
  timestamp: number;
}

export class MLInfrastructure {
  private static instance: MLInfrastructure;
  private model: tf.LayersModel | null = null;
  private dataBuffer: MLFeatures[] = [];
  private readonly BUFFER_SIZE = 1000; // Keep last 1000 data points
  private readonly BATCH_SIZE = 32;
  private readonly WINDOW_SIZE = 10; // Look at last 10 data points for predictions

  private constructor() {
    this.initializeModel();
  }

  public static getInstance(): MLInfrastructure {
    if (!MLInfrastructure.instance) {
      MLInfrastructure.instance = new MLInfrastructure();
    }
    return MLInfrastructure.instance;
  }

  private async initializeModel(): Promise<void> {
    try {
      // Try to load existing model
      this.model = await tf.loadLayersModel(
        "indexeddb://dojopool-performance-model",
      );
      console.log("Loaded existing model from IndexedDB");
    } catch (error) {
      // Create new model if none exists
      console.log("Creating new model");
      this.model = this.createModel();
      await this.saveModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer for time series data
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [this.WINDOW_SIZE, 7], // 7 features
      }),
    );

    // Hidden layers
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
      }),
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output layer for performance predictions
    model.add(
      tf.layers.dense({
        units: 3, // Predict FPS, latency, and memory usage
        activation: "linear",
      }),
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["accuracy"],
    });

    return model;
  }

  private async saveModel(): Promise<void> {
    if (this.model) {
      await this.model.save("indexeddb://dojopool-performance-model");
    }
  }

  public async collectData(): Promise<void> {
    const metrics = await gameMetricsMonitor.getMetricsSnapshot();

    const features: MLFeatures = {
      timestamp: Date.now(),
      fps: this.getLastValue(gameMetricsMonitor.getFpsData()),
      inputLatency: this.getLastValue(gameMetricsMonitor.getInputLatencyData()),
      memoryUsage: metrics.current.memoryUsage,
      cpuUsage: metrics.current.cpuUsage,
      networkLatency: this.getLastValue(metrics.latencyData),
      renderTime: this.getLastValue(gameMetricsMonitor.getRenderTimeData()),
      physicsTime: this.getLastValue(gameMetricsMonitor.getPhysicsTimeData()),
    };

    this.dataBuffer.push(features);
    if (this.dataBuffer.length > this.BUFFER_SIZE) {
      this.dataBuffer.shift();
    }
  }

  private getLastValue(data: MetricData[]): number {
    return data.length > 0 ? data[data.length - 1].value : 0;
  }

  private normalizeFeatures(features: MLFeatures[]): tf.Tensor {
    const data = features.map((f) => [
      f.fps / 60, // Normalize to 0-1 range
      f.inputLatency / 100,
      f.memoryUsage / 100,
      f.cpuUsage / 100,
      f.networkLatency / 200,
      f.renderTime / 16,
      f.physicsTime / 16,
    ]);
    return tf.tensor2d(data);
  }

  public async trainModel(): Promise<tf.History> {
    if (!this.model || this.dataBuffer.length < this.WINDOW_SIZE * 2) {
      throw new Error("Model not ready or insufficient data");
    }

    // Prepare training data
    const sequences: number[][][] = [];
    const labels: number[][] = [];

    for (let i = 0; i < this.dataBuffer.length - this.WINDOW_SIZE; i++) {
      const sequence = this.dataBuffer.slice(i, i + this.WINDOW_SIZE);
      const label = this.dataBuffer[i + this.WINDOW_SIZE];

      sequences.push(
        sequence.map((f) => [
          f.fps / 60,
          f.inputLatency / 100,
          f.memoryUsage / 100,
          f.cpuUsage / 100,
          f.networkLatency / 200,
          f.renderTime / 16,
          f.physicsTime / 16,
        ]),
      );

      labels.push([
        label.fps / 60,
        label.inputLatency / 100,
        label.memoryUsage / 100,
      ]);
    }

    const xs = tf.tensor3d(sequences);
    const ys = tf.tensor2d(labels);

    // Train the model
    const history = await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: this.BATCH_SIZE,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}`);
        },
      },
    });

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    // Save updated model
    await this.saveModel();

    return history;
  }

  public async predict(): Promise<MLPrediction[]> {
    if (!this.model || this.dataBuffer.length < this.WINDOW_SIZE) {
      throw new Error("Model not ready or insufficient data");
    }

    // Prepare input sequence
    const sequence = this.dataBuffer.slice(-this.WINDOW_SIZE);
    const input = tf.tensor3d([
      sequence.map((f) => [
        f.fps / 60,
        f.inputLatency / 100,
        f.memoryUsage / 100,
        f.cpuUsage / 100,
        f.networkLatency / 200,
        f.renderTime / 16,
        f.physicsTime / 16,
      ]),
    ]);

    // Make prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    const values = (await prediction.array()) as number[][];

    // Clean up tensors
    input.dispose();
    prediction.dispose();

    // Format predictions
    return [
      {
        probability: values[0][0],
        confidence: 0.8, // TODO: Calculate actual confidence
        features: ["fps", "latency", "memory"],
        timestamp: Date.now(),
      },
    ];
  }

  public async startDataCollection(interval: number = 1000): Promise<void> {
    setInterval(() => {
      this.collectData().catch(console.error);
    }, interval);
  }

  public async startAutoTraining(interval: number = 3600000): Promise<void> {
    setInterval(() => {
      this.trainModel().catch(console.error);
    }, interval);
  }

  public getDataBuffer(): MLFeatures[] {
    return [...this.dataBuffer];
  }

  public async getModelSummary(): Promise<string[]> {
    if (!this.model) {
      return ["Model not initialized"];
    }
    const summary: string[] = [];
    this.model.summary(undefined, undefined, (line) => summary.push(line));
    return summary;
  }
}
