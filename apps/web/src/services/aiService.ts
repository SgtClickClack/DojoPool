import axios, { type AxiosResponse } from 'axios';
import type { TableBounds, BallPosition, ShotData, MatchData, AiConfiguration } from '@/types/ai';

// AI Service for DojoPool platform

export interface MatchAnalysis {
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformance: {
    playerA: string;
    playerB: string;
  };
  overallAssessment: string;
  recommendations: string[];
}

export interface AiServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  fallback?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AiHealthStatus {
  gemini: {
    enabled: boolean;
    configured: boolean;
    status: string;
  };
  openai: {
    enabled: boolean;
    configured: boolean;
    status: string;
  };
  opencv: {
    enabled: boolean;
    status: string;
  };
  tensorflow: {
    enabled: boolean;
    configured: boolean;
    status: string;
  };
}

class AiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus(): Promise<AiHealthStatus> {
    try {
      const response: AxiosResponse<AiHealthStatus> = await axios.get(
        `${this.baseUrl}/ai/health`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get AI health status:', error);
      throw error;
    }
  }

  /**
   * Generate match analysis
   */
  async generateMatchAnalysis(matchData: MatchData): Promise<AiServiceResponse<MatchAnalysis>> {
    try {
      const response: AxiosResponse<AiServiceResponse<MatchAnalysis>> =
        await axios.post(`${this.baseUrl}/ai/analyze/match`, matchData);
      return response.data;
    } catch (error) {
      console.error('Failed to generate match analysis:', error);
      throw error;
    }
  }

  /**
   * Generate live commentary for shots
   */
  async generateLiveCommentary(shotData: ShotData): Promise<AiServiceResponse<string>> {
    try {
      const response: AxiosResponse<AiServiceResponse<string>> =
        await axios.post(`${this.baseUrl}/ai/analyze/shot`, shotData);
      return response.data;
    } catch (error) {
      console.error('Failed to generate live commentary:', error);
      throw error;
    }
  }

  /**
   * Analyze pool table image
   */
  async analyzeTableImage(
    imageFile: File
  ): Promise<AiServiceResponse<{ tableBounds: TableBounds[]; balls: BallPosition[] }>> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response: AxiosResponse<
        AiServiceResponse<{ tableBounds: TableBounds[]; balls: BallPosition[] }>
      > = await axios.post(`${this.baseUrl}/ai/analyze/table`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to analyze table image:', error);
      throw error;
    }
  }

  /**
   * Get AI configuration
   */
  async getConfiguration(): Promise<AiConfiguration> {
    try {
      const response: AxiosResponse<AiConfiguration> = await axios.get(
        `${this.baseUrl}/ai/config`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get AI configuration:', error);
      throw error;
    }
  }

  /**
   * Utility method to check if AI services are available
   */
  async isAiAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.gemini.enabled || health.openai.enabled;
    } catch (error) {
      return false;
    }
  }

  /**
   * Utility method to get preferred AI provider
   */
  async getPreferredProvider(): Promise<string | null> {
    try {
      const health = await this.getHealthStatus();
      if (health.gemini.enabled && health.gemini.status === 'healthy') {
        return 'gemini';
      }
      if (health.openai.enabled && health.openai.status === 'healthy') {
        return 'openai';
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const aiService = new AiService();
export default aiService;
