import axios, { type AxiosResponse } from 'axios';

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

export interface AiServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  fallback?: boolean;
  metadata?: Record<string, any>;
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
  async generateMatchAnalysis(matchData: {
    playerAName: string;
    playerBName: string;
    scoreA: number;
    scoreB: number;
    winner: string;
    shots?: any[];
    venue: string;
    round: number;
  }): Promise<AiServiceResponse<MatchAnalysis>> {
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
  async generateLiveCommentary(shotData: {
    matchId: string;
    playerId: string;
    playerName?: string;
    ballSunk?: string | number | boolean | null;
    wasFoul?: boolean;
    shotType?: string;
  }): Promise<AiServiceResponse<string>> {
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
  ): Promise<AiServiceResponse<{ tableBounds: any[]; balls: any[] }>> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response: AxiosResponse<
        AiServiceResponse<{ tableBounds: any[]; balls: any[] }>
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
  async getConfiguration(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await axios.get(
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
