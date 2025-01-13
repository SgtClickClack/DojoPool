import axios from 'axios';
import { API_BASE_URL } from '../config';

export class MLService {
  private readonly baseUrl = `${API_BASE_URL}/api/ml`;

  async getModels() {
    const response = await axios.get(`${this.baseUrl}/models`);
    return response.data;
  }

  async getModelMetrics(modelId: string) {
    const response = await axios.get(`${this.baseUrl}/models/${modelId}/metrics`);
    return response.data;
  }

  async trainShotPredictionModel(trainingData: any[], modelType: string = 'random_forest') {
    const response = await axios.post(`${this.baseUrl}/models/shot-prediction`, {
      training_data: trainingData,
      model_type: modelType,
    });
    return response.data;
  }

  async trainPatternRecognitionModel(trainingData: any[], sequenceLength: number = 10) {
    const response = await axios.post(`${this.baseUrl}/models/pattern-recognition`, {
      training_data: trainingData,
      sequence_length: sequenceLength,
    });
    return response.data;
  }

  async trainPerformancePredictionModel(
    trainingData: any[],
    targetMetric: string,
    lookbackPeriod: number = 5
  ) {
    const response = await axios.post(`${this.baseUrl}/models/performance-prediction`, {
      training_data: trainingData,
      target_metric: targetMetric,
      lookback_period: lookbackPeriod,
    });
    return response.data;
  }

  async predictShotSuccess(modelId: string, shotData: any) {
    const response = await axios.post(`${this.baseUrl}/predict/shot-success/${modelId}`, shotData);
    return response.data;
  }

  async predictNextPattern(modelId: string, sequenceData: any[]) {
    const response = await axios.post(
      `${this.baseUrl}/predict/next-pattern/${modelId}`,
      sequenceData
    );
    return response.data;
  }

  async detectAnomalies(data: any[], contamination: number = 0.1) {
    const response = await axios.post(`${this.baseUrl}/detect/anomalies`, data, {
      params: { contamination },
    });
    return response.data;
  }

  async deleteModel(modelId: string) {
    const response = await axios.delete(`${this.baseUrl}/models/${modelId}`);
    return response.data;
  }

  // Helper methods for data transformation
  transformTrainingData(rawData: any[]) {
    return rawData.map((item) => ({
      shot_type: item.type,
      position_x: item.position?.x || 0,
      position_y: item.position?.y || 0,
      speed: item.speed || 0,
      spin: item.spin || 0,
      timestamp: item.timestamp,
      shot_success: item.success ? 1 : 0,
    }));
  }

  transformShotData(rawShot: any) {
    return {
      shot_type: rawShot.type,
      position_x: rawShot.position?.x || 0,
      position_y: rawShot.position?.y || 0,
      speed: rawShot.speed || 0,
      spin: rawShot.spin || 0,
    };
  }

  transformSequenceData(rawSequence: any[]) {
    return rawSequence.map((item) => ({
      shot_type: item.type,
      position_x: item.position?.x || 0,
      position_y: item.position?.y || 0,
      speed: item.speed || 0,
      spin: item.spin || 0,
      timestamp: item.timestamp,
    }));
  }

  // Error handling wrapper
  private async handleRequest<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`ML Service Error: ${message}`);
      }
      throw error;
    }
  }
}
