import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface MatchAnalysisJobData {
  jobId: string;
  matchId: string;
  playerAId: string;
  playerBId: string;
  priority?: 'low' | 'normal' | 'high';
  createdAt: number;
}

@Injectable()
export class MatchAnalysisProcessor {
  private readonly logger = new Logger(MatchAnalysisProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async processJob(job: MatchAnalysisJobData): Promise<any> {
    const { matchId, jobId } = job;

    this.logger.log(
      `Processing match analysis for match ${matchId} (job: ${jobId})`
    );

    try {
      // Check if analysis already exists
      const existing = await this.prisma.matchAnalysis.findUnique({
        where: { matchId },
      });

      if (existing) {
        this.logger.log(`Analysis already exists for match ${matchId}`);
        return existing;
      }

      // Fetch match data
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: true,
          venue: true,
          playerA: { select: { username: true, id: true } },
          playerB: { select: { username: true, id: true } },
        },
      });

      if (!match) {
        throw new Error(`Match ${matchId} not found`);
      }

      // Generate AI analysis
      const aiResponse = await this.aiService.generateMatchAnalysis({
        playerAName: match.playerA?.username || 'Player A',
        playerBName: match.playerB?.username || 'Player B',
        scoreA: match.scoreA ?? 0,
        scoreB: match.scoreB ?? 0,
        winner: match.winnerId === match.playerAId ? 'Player A' : 'Player B',
        shots: [],
        venue: match.venue?.name || 'Unknown',
        round: match.round ?? 1,
      });

      // Store analysis in database
      const analysis = await this.prisma.matchAnalysis.create({
        data: {
          matchId,
          playerId: match.winnerId, // Store winner's analysis
          provider: aiResponse.provider || 'gemini',
          fallback: !!aiResponse.fallback,
          keyMoments: aiResponse.data.keyMoments,
          strategicInsights: aiResponse.data.strategicInsights,
          playerPerformanceA: aiResponse.data.playerPerformance.playerA,
          playerPerformanceB: aiResponse.data.playerPerformance.playerB,
          overallAssessment: aiResponse.data.overallAssessment,
          recommendations: aiResponse.data.recommendations,
          metadata: {
            processingTime: Date.now() - job.createdAt,
            jobId: jobId,
            priority: job.priority,
          },
        },
      });

      // Cache the result for faster retrieval
      await this.redisService.set(
        `match-analysis:${matchId}`,
        JSON.stringify(analysis),
        3600 // 1 hour cache
      );

      this.logger.log(
        `Successfully processed match analysis for match ${matchId}`
      );
      return analysis;
    } catch (error) {
      this.logger.error(
        `Failed to process match analysis for ${matchId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if analysis exists in cache or database
   */
  async getExistingAnalysis(matchId: string): Promise<any | null> {
    // Check cache first
    const cached = await this.redisService.get(`match-analysis:${matchId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Check database
    const existing = await this.prisma.matchAnalysis.findUnique({
      where: { matchId },
    });

    if (existing) {
      // Cache for future requests
      await this.redisService.set(
        `match-analysis:${matchId}`,
        JSON.stringify(existing),
        3600
      );
    }

    return existing;
  }
}
