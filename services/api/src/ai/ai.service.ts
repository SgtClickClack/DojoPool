import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';
import {
  AiAnalysisService,
  MatchAnalysis,
  ShotData,
} from '../matches/ai-analysis.service';
import { JobProducer } from '../queue/producers/job.producer';

export interface AiServiceConfig {
  gemini: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  openai: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  opencv: {
    enabled: boolean;
    wasmPath?: string;
  };
  tensorflow: {
    enabled: boolean;
    modelPath?: string;
  };
}

export interface AiServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  fallback?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly config: AiServiceConfig;

  constructor(
    @Optional() private readonly configService: ConfigService,
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly arAnalysisService: ArAnalysisService,
    @Optional() private readonly jobProducer?: JobProducer
  ) {
    this.config = this.loadConfiguration();
  }

  /**
   * Load AI service configuration from environment
   */
  private loadConfiguration(): AiServiceConfig {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;

    return {
      gemini: {
        apiKey: (get?.<string>('GEMINI_API_KEY') as string) || '',
        model: (get?.<string>('GEMINI_MODEL') as string) || 'gemini-1.5-flash',
        enabled: !!(get?.<string>('GEMINI_API_KEY') as string),
      },
      openai: {
        apiKey: (get?.<string>('OPENAI_API_KEY') as string) || '',
        model: (get?.<string>('OPENAI_MODEL') as string) || 'gpt-4',
        enabled: !!(get?.<string>('OPENAI_API_KEY') as string),
      },
      opencv: {
        enabled: (get?.<boolean>('OPENCV_ENABLED') as boolean) ?? true,
        wasmPath: get?.<string>('OPENCV_WASM_PATH') as string | undefined,
      },
      tensorflow: {
        enabled: (get?.<boolean>('TENSORFLOW_ENABLED') as boolean) ?? false,
        modelPath: get?.<string>('TENSORFLOW_MODEL_PATH') as string | undefined,
      },
    };
  }

  /**
   * Generate match analysis using available AI providers
   * Use queue for async processing if available
   */
  async generateMatchAnalysis(
    matchData: {
      playerAName: string;
      playerBName: string;
      scoreA: number;
      scoreB: number;
      winner: string;
      shots?: any[];
      venue: string;
      round: number;
    },
    useQueue: boolean = false
  ): Promise<AiServiceResponse<MatchAnalysis>> {
    const providers = [
      {
        name: 'gemini',
        service: this.aiAnalysisService,
        enabled: this.config.gemini.enabled,
      },
      {
        name: 'openai',
        service: this.createOpenAIService(),
        enabled: this.config.openai.enabled,
      },
    ];

    for (const provider of providers) {
      if (!provider.enabled) continue;

      try {
        if (provider.name === 'gemini') {
          const result =
            await this.aiAnalysisService.generateMatchAnalysis(matchData);
          return {
            success: true,
            data: result,
            provider: 'gemini',
          };
        }

        // OpenAI provider logic - placeholder implementation
      } catch (error) {
        this.logger.warn(`AI provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // Fallback to basic analysis
    return {
      success: true,
      data: this.generateFallbackAnalysis(matchData),
      provider: 'fallback',
      fallback: true,
    };
  }

  /**
   * Enqueue match analysis job for async processing
   */
  async enqueueMatchAnalysis(
    matchId: string,
    matchData: {
      playerAName: string;
      playerBName: string;
      scoreA: number;
      scoreB: number;
      winner: string;
      shots?: any[];
      venue: string;
      round: number;
    }
  ): Promise<{ jobId: string; queued: boolean }> {
    if (!this.jobProducer) {
      this.logger.warn(
        'Job producer not available, falling back to sync processing'
      );
      return { jobId: '', queued: false };
    }

    try {
      const jobId = await this.jobProducer.enqueueMatchAnalysis({
        matchId,
        matchData,
      });

      this.logger.log(`Enqueued match analysis job for match ${matchId}`);
      return { jobId, queued: true };
    } catch (error) {
      this.logger.error(`Failed to enqueue match analysis job:`, error);
      return { jobId: '', queued: false };
    }
  }

  /**
   * Generate live commentary for shots
   * Use queue for async processing if available
   */
  async generateLiveCommentary(
    shotData: ShotData,
    useQueue: boolean = false
  ): Promise<AiServiceResponse<string>> {
    const providers = [
      {
        name: 'gemini',
        service: this.aiAnalysisService,
        enabled: this.config.gemini.enabled,
      },
      { name: 'openai', service: null, enabled: this.config.openai.enabled },
    ];

    for (const provider of providers) {
      if (!provider.enabled) continue;

      try {
        if (provider.name === 'gemini') {
          const result =
            await this.aiAnalysisService.getLiveCommentary(shotData);
          return {
            success: true,
            data: result,
            provider: 'gemini',
          };
        }

        // OpenAI provider logic - placeholder implementation
      } catch (error) {
        this.logger.warn(`AI provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // Fallback commentary
    return {
      success: true,
      data: this.generateFallbackCommentary(shotData),
      provider: 'fallback',
      fallback: true,
    };
  }

  /**
   * Enqueue live commentary job for async processing
   */
  async enqueueLiveCommentary(
    matchId: string,
    shotData: ShotData,
    sessionId: string
  ): Promise<{ jobId: string; queued: boolean }> {
    if (!this.jobProducer) {
      this.logger.warn(
        'Job producer not available, falling back to sync processing'
      );
      return { jobId: '', queued: false };
    }

    try {
      const jobId = await this.jobProducer.enqueueLiveCommentary({
        matchId,
        shotData,
        sessionId,
      });

      this.logger.log(`Enqueued live commentary job for match ${matchId}`);
      return { jobId, queued: true };
    } catch (error) {
      this.logger.error(`Failed to enqueue live commentary job:`, error);
      return { jobId: '', queued: false };
    }
  }

  /**
   * Analyze pool table image using computer vision
   * Use queue for async processing if available
   */
  async analyzeTableImage(
    buffer: Buffer,
    mimeType?: string,
    useQueue: boolean = false
  ): Promise<AiServiceResponse<{ tableBounds: any[]; balls: any[] }>> {
    if (!this.config.opencv.enabled) {
      return {
        success: false,
        error: 'OpenCV analysis is disabled',
        provider: 'opencv',
      };
    }

    try {
      const result = await this.arAnalysisService.analyzeTableImage(
        buffer,
        mimeType
      );
      return {
        success: true,
        data: result,
        provider: 'opencv',
        metadata: {
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error('OpenCV analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        provider: 'opencv',
      };
    }
  }

  /**
   * Enqueue table analysis job for async processing
   */
  async enqueueTableAnalysis(
    matchId: string,
    imageBuffer: Buffer,
    mimeType: string | undefined,
    sessionId: string
  ): Promise<{ jobId: string; queued: boolean }> {
    if (!this.jobProducer) {
      this.logger.warn(
        'Job producer not available, falling back to sync processing'
      );
      return { jobId: '', queued: false };
    }

    try {
      const jobId = await this.jobProducer.enqueueTableAnalysis({
        matchId,
        imageBuffer,
        mimeType,
        sessionId,
      });

      this.logger.log(`Enqueued table analysis job for match ${matchId}`);
      return { jobId, queued: true };
    } catch (error) {
      this.logger.error(`Failed to enqueue table analysis job:`, error);
      return { jobId: '', queued: false };
    }
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const status = {
      gemini: {
        enabled: this.config.gemini.enabled,
        configured: !!this.config.gemini.apiKey,
        status: 'unknown',
      },
      openai: {
        enabled: this.config.openai.enabled,
        configured: !!this.config.openai.apiKey,
        status: 'unknown',
      },
      opencv: {
        enabled: this.config.opencv.enabled,
        status: 'unknown',
      },
      tensorflow: {
        enabled: this.config.tensorflow.enabled,
        configured: !!this.config.tensorflow.modelPath,
        status: 'unknown',
      },
    };

    // Test Gemini connectivity
    if (status.gemini.enabled && status.gemini.configured) {
      try {
        await this.aiAnalysisService.generateMatchAnalysis({
          playerAName: 'Test',
          playerBName: 'Player',
          scoreA: 1,
          scoreB: 0,
          winner: 'Test',
          venue: 'Test Venue',
          round: 1,
        });
        status.gemini.status = 'healthy';
      } catch (error) {
        status.gemini.status = 'unhealthy';
      }
    }

    // Test OpenCV
    if (status.opencv.enabled) {
      try {
        // Simple test buffer
        const testBuffer = Buffer.from('test');
        await this.arAnalysisService.analyzeTableImage(testBuffer);
        status.opencv.status = 'healthy';
      } catch (error) {
        status.opencv.status = 'unhealthy';
      }
    }

    return status;
  }

  /**
   * Generate fallback analysis when AI services fail
   */
  private generateFallbackAnalysis(matchData: any): MatchAnalysis {
    return {
      keyMoments: [
        `The match between ${matchData.playerAName} and ${matchData.playerBName} was competitive`,
        `${matchData.winner} demonstrated strong fundamentals to win`,
      ],
      strategicInsights: [
        'Both players showed solid pool skills',
        'Consistent shot execution was key to success',
      ],
      playerPerformance: {
        playerA: `${matchData.playerAName} scored ${matchData.scoreA} points`,
        playerB: `${matchData.playerBName} scored ${matchData.scoreB} points`,
      },
      overallAssessment: `A competitive pool match with ${matchData.winner} emerging victorious`,
      recommendations: [
        'Focus on improving shot accuracy and positioning',
        'Practice defensive strategies for better table control',
      ],
    };
  }

  /**
   * Generate fallback commentary when AI services fail
   */
  private generateFallbackCommentary(shotData: ShotData): string {
    const playerName = shotData.playerName || 'The player';

    if (shotData.wasFoul) {
      return `${playerName} commits a foul on the digital table!`;
    }

    if (shotData.ballSunk) {
      return `${playerName} sinks a ball with precision!`;
    }

    return `${playerName} lines up their next shot!`;
  }

  /**
   * Get current AI configuration
   */
  getConfiguration(): AiServiceConfig {
    return { ...this.config };
  }

  /**
   * Create OpenAI service instance
   */
  private createOpenAIService(): any {
    // Placeholder implementation for OpenAI service
    return {
      analyzeMatch: async (matchData: any) => {
        return {
          analysis: 'OpenAI analysis placeholder',
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        };
      },
    };
  }
}
