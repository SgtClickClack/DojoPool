import * as tf from '@tensorflow/tfjs';
import { EventEmitter } from 'events';
import { type ShotData } from './shot-analytics';

interface PredictionResult {
  position: { x: number; y: number };
  confidence: number;
  timestamp: number;
}

interface ModelMetrics {
  accuracy: number;
  loss: number;
  predictions: number;
}

class ShotPredictor extends EventEmitter {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;
  private readonly sequenceLength = 10;
  private readonly featureCount = 5; // x, y, confidence, time delta, verified
  private readonly predictionThreshold = 0.7;
  private metrics: ModelMetrics = {
    accuracy: 0,
    loss: 0,
    predictions: 0,
  };

  constructor() {
    super();
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      // Try to load existing model
      this.model = await tf.loadLayersModel(
        'indexeddb://shot-prediction-model'
      );
      console.log('Loaded existing model');
    } catch {
      // Create new model if none exists
      this.model = this.createModel();
      console.log('Created new model');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // LSTM layer for sequence processing
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [this.sequenceLength, this.featureCount],
      })
    );

    // Additional LSTM layer
    model.add(
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
      })
    );

    // Dense layers for position prediction
    model.add(
      tf.layers.dense({
        units: 32,
        activation: 'relu',
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output layer for x, y coordinates and confidence
    model.add(
      tf.layers.dense({
        units: 3,
        activation: 'sigmoid',
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy'],
    });

    return model;
  }

  private preprocessShots(shots: ShotData[]): {
    sequences: tf.Tensor3D;
    targets: tf.Tensor2D;
  } {
    const sequences: number[][][] = [];
    const targets: number[][] = [];

    // Create sequences of shots
    for (let i = this.sequenceLength; i < shots.length; i++) {
      const sequence: number[][] = [];

      // Build sequence from previous shots
      for (let j = i - this.sequenceLength; j < i; j++) {
        const timeDelta =
          j > 0 ? shots[j].timestamp - shots[j - 1].timestamp : 0;
        sequence.push([
          shots[j].position.x / 100, // Normalize coordinates
          shots[j].position.y / 100,
          shots[j].confidence,
          Math.min(timeDelta / 5000, 1), // Normalize time delta
          shots[j].verified ? 1 : 0,
        ]);
      }

      sequences.push(sequence);
      targets.push([
        shots[i].position.x / 100,
        shots[i].position.y / 100,
        shots[i].confidence,
      ]);
    }

    return {
      sequences: tf.tensor3d(sequences),
      targets: tf.tensor2d(targets),
    };
  }

  public async train(shots: ShotData[]): Promise<void> {
    if (
      this.isTraining ||
      !this.model ||
      shots.length < this.sequenceLength + 1
    ) {
      return;
    }

    this.isTraining = true;
    this.emit('trainingStart');

    try {
      const { sequences, targets } = this.preprocessShots(shots);

      const history = await this.model.fit(sequences, targets, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.emit('trainingProgress', {
              epoch,
              ...logs,
            });
          },
        },
      });

      // Update metrics
      this.metrics = {
        accuracy: history.history.accuracy[history.history.accuracy.length - 1],
        loss: history.history.loss[history.history.loss.length - 1],
        predictions: this.metrics.predictions,
      };

      // Save model
      await this.model.save('indexeddb://shot-prediction-model');

      this.emit('trainingComplete', this.metrics);

      // Cleanup
      sequences.dispose();
      targets.dispose();
    } catch (error) {
      console.error('Training error:', error);
      this.emit('trainingError', error);
    } finally {
      this.isTraining = false;
    }
  }

  public async predict(
    recentShots: ShotData[]
  ): Promise<PredictionResult | null> {
    if (!this.model || recentShots.length < this.sequenceLength) {
      return null;
    }

    // Prepare input sequence
    const sequence = recentShots.slice(-this.sequenceLength).map((shot) => {
      const timeDelta =
        shot.timestamp - (recentShots[recentShots.length - 2]?.timestamp || 0);
      return [
        shot.position.x / 100,
        shot.position.y / 100,
        shot.confidence,
        Math.min(timeDelta / 5000, 1),
        shot.verified ? 1 : 0,
      ];
    });

    // Make prediction
    const input = tf.tensor3d([sequence]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const [x, y, confidence] = await prediction.data();

    // Cleanup tensors
    input.dispose();
    prediction.dispose();

    this.metrics.predictions++;

    // Only return prediction if confidence is high enough
    if (confidence < this.predictionThreshold) {
      return null;
    }

    return {
      position: {
        x: x * 100, // Denormalize coordinates
        y: y * 100,
      },
      confidence,
      timestamp: Date.now(),
    };
  }

  public getMetrics(): ModelMetrics {
    return { ...this.metrics };
  }

  public async evaluateModel(testShots: ShotData[]): Promise<{
    accuracy: number;
    loss: number;
    predictions: PredictionResult[];
  }> {
    if (!this.model || testShots.length < this.sequenceLength) {
      throw new Error('Model not ready or insufficient test data');
    }

    const { sequences, targets } = this.preprocessShots(testShots);
    const evaluation = (await this.model.evaluate(
      sequences,
      targets
    )) as tf.Scalar[];

    const predictions: PredictionResult[] = [];
    const testSequences = testShots.slice(this.sequenceLength);

    // Generate predictions for each test sequence
    for (let i = 0; i < testSequences.length; i++) {
      const prediction = await this.predict(
        testShots.slice(i, i + this.sequenceLength)
      );
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Cleanup
    sequences.dispose();
    targets.dispose();

    return {
      loss: await evaluation[0].data()[0],
      accuracy: await evaluation[1].data()[0],
      predictions,
    };
  }
}

// Export singleton instance
const shotPredictor = new ShotPredictor();
export default shotPredictor;
