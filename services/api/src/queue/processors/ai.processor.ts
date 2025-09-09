import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../../ai/ai.service';
import { ArAnalysisService } from '../../ar-analysis/ar-analysis.service';
import { MatchesService } from '../../matches/matches.service';

export interface AIAnalysisJobData {
  id: string;
  type:
    | 'match-analysis'
    | 'live-commentary'
    | 'table-analysis'
    | 'batch-analysis';
  payload: any;
  metadata?: Record<string, any>;
}

@Injectable()
@Processor('ai-analysis')
export class AIProcessor extends WorkerHost {
  private readonly logger = new Logger(AIProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly arAnalysisService: ArAnalysisService,
    private readonly matchesService: MatchesService
  ) {
    super();
  }

  async process(job: Job<AIAnalysisJobData>): Promise<any> {
    const { type, payload, metadata } = job.data;

    this.logger.log(`Processing AI job ${job.id} of type: ${type}`);

    try {
      switch (type) {
        case 'match-analysis':
          return await this.processMatchAnalysis(payload, metadata);

        case 'live-commentary':
          return await this.processLiveCommentary(payload, metadata);

        case 'table-analysis':
          return await this.processTableAnalysis(payload, metadata);

        case 'batch-analysis':
          return await this.processBatchAnalysis(payload, metadata);

        default:
          throw new Error(`Unknown AI job type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`AI job ${job.id} failed:`, error);
      throw error;
    }
  }

  private async processMatchAnalysis(
    payload: any,
    metadata?: Record<string, any>
  ) {
    const { matchId, matchData } = payload;

    this.logger.log(`Analyzing match ${matchId}`);

    // Generate comprehensive match analysis
    const analysis = await this.aiService.generateMatchAnalysis(matchData);

    // Store analysis results in database
    await this.matchesService.updateMatchAnalysis(matchId, analysis);

    this.logger.log(`Match analysis completed for ${matchId}`);

    return {
      matchId,
      analysis,
      processedAt: new Date().toISOString(),
      metadata,
    };
  }

  private async processLiveCommentary(
    payload: any,
    metadata?: Record<string, any>
  ) {
    const { matchId, shotData, sessionId } = payload;

    this.logger.log(`Generating live commentary for match ${matchId}`);

    // Generate live commentary
    const commentary = await this.aiService.generateLiveCommentary(shotData);

    // Store commentary in database or cache
    await this.matchesService.addLiveCommentary(matchId, {
      commentary,
      shotData,
      timestamp: new Date().toISOString(),
      sessionId,
    });

    this.logger.log(`Live commentary generated for match ${matchId}`);

    return {
      matchId,
      commentary,
      shotData,
      processedAt: new Date().toISOString(),
      metadata,
    };
  }

  private async processTableAnalysis(
    payload: any,
    metadata?: Record<string, any>
  ) {
    const { matchId, imageBuffer, mimeType, sessionId } = payload;

    this.logger.log(`Analyzing table image for match ${matchId}`);

    // Analyze table image using computer vision
    const analysis = await this.aiService.analyzeTableImage(
      imageBuffer,
      mimeType
    );

    if (analysis.success) {
      // Update match with table analysis results
      await this.matchesService.updateTableAnalysis(matchId, {
        tableBounds: analysis.data.tableBounds,
        balls: analysis.data.balls,
        analyzedAt: new Date().toISOString(),
        sessionId,
      });

      this.logger.log(`Table analysis completed for match ${matchId}`);

      return {
        matchId,
        analysis: analysis.data,
        processedAt: new Date().toISOString(),
        metadata,
      };
    } else {
      throw new Error(`Table analysis failed: ${analysis.error}`);
    }
  }

  private async processBatchAnalysis(
    payload: any,
    metadata?: Record<string, any>
  ) {
    const { matchIds, analysisType } = payload;

    this.logger.log(`Processing batch analysis for ${matchIds.length} matches`);

    const results = [];

    for (const matchId of matchIds) {
      try {
        // Get match data
        const matchData = await this.matchesService.getMatchData(matchId);

        if (analysisType === 'full') {
          const analysis =
            await this.aiService.generateMatchAnalysis(matchData);
          await this.matchesService.updateMatchAnalysis(matchId, analysis);
          results.push({ matchId, success: true, analysis });
        } else if (analysisType === 'commentary') {
          // Generate commentary for key shots
          const keyShots = await this.matchesService.getKeyShots(matchId);
          for (const shot of keyShots) {
            const commentary =
              await this.aiService.generateLiveCommentary(shot);
            await this.matchesService.addLiveCommentary(matchId, {
              commentary,
              shotData: shot,
              timestamp: new Date().toISOString(),
            });
          }
          results.push({
            matchId,
            success: true,
            commentaryGenerated: keyShots.length,
          });
        }
      } catch (error) {
        this.logger.error(`Batch analysis failed for match ${matchId}:`, error);
        results.push({ matchId, success: false, error: error.message });
      }
    }

    this.logger.log(`Batch analysis completed for ${matchIds.length} matches`);

    return {
      totalMatches: matchIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      processedAt: new Date().toISOString(),
      metadata,
    };
  }
}
