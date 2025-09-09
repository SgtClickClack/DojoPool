import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobProducer } from '../queue/producers/job.producer';
import { MatchInsightsResponseDto, PlayerInsightsSummaryDto } from './dto';
import { InsightsService } from './insights.service';

@Controller('api/v1/insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly jobProducer: JobProducer
  ) {}

  /**
   * Get detailed AI analysis for a specific match
   * @param matchId - Unique identifier for the match
   * @param asyncMode - Whether to process asynchronously
   * @returns MatchInsightsResponseDto containing AI-generated analysis or job status
   */
  @Get('match/:matchId')
  async getMatchInsights(
    @Param('matchId') matchId: string,
    @Query('async') asyncMode?: string
  ): Promise<MatchInsightsResponseDto | any> {
    // If async mode is requested, trigger background analysis
    if (asyncMode === 'true') {
      // Get match data for analysis
      const match = await this.insightsService.getMatchData(matchId);
      if (!match) {
        return { error: 'Match not found' };
      }

      const matchData = {
        playerAName: match.playerA?.username || 'Player A',
        playerBName: match.playerB?.username || 'Player B',
        scoreA: match.scoreA ?? 0,
        scoreB: match.scoreB ?? 0,
        winner: match.winnerId === match.playerAId ? 'Player A' : 'Player B',
        shots: [],
        venue: match.venue?.name || 'Unknown',
        round: match.round ?? 1,
      };

      const { jobId, queued } = await this.jobProducer.enqueueMatchAnalysis(
        matchId,
        matchData
      );

      if (queued) {
        return {
          success: true,
          jobId,
          status: 'queued',
          message: 'Match analysis has been queued for processing',
          estimatedTime: '30-120 seconds',
        };
      }
    }

    // Default: process synchronously
    return this.insightsService.getMatchInsights(matchId);
  }

  /**
   * Get personalized performance insights for a player
   * @param playerId - Unique identifier for the player
   * @returns PlayerInsightsSummaryDto containing performance summary and trends
   */
  @Get('player/:playerId')
  async getPlayerInsights(
    @Param('playerId') playerId: string
  ): Promise<PlayerInsightsSummaryDto> {
    return this.insightsService.getPlayerInsights(playerId);
  }
}
