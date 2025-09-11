import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchInsightsResponseDto, PlayerInsightsSummaryDto } from './dto';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async getMatchData(matchId: string) {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        venue: true,
        playerA: { select: { username: true, id: true } },
        playerB: { select: { username: true, id: true } },
      },
    });
  }

  async getMatchInsights(matchId: string): Promise<MatchInsightsResponseDto> {
    const match = await this.getMatchData(matchId);
    if (!match) throw new NotFoundException('Match not found');

    const existing = await this.prisma.matchAnalysis.findUnique({
      where: { matchId },
    });
    if (existing) {
      return {
        ...existing,
        match,
      };
    }

    const ai = await this.aiService.generateMatchAnalysis({
      playerAName: match.playerA?.username || 'Player A',
      playerBName: match.playerB?.username || 'Player B',
      scoreA: match.scoreA ?? 0,
      scoreB: match.scoreB ?? 0,
      winner: match.winnerId === match.playerAId ? 'Player A' : 'Player B',
      shots: [],
      venue: match.venue?.name || 'Unknown',
      round: match.roundNumber ?? 1,
    });

    if (!ai.data) {
      this.logger.error(`AI analysis failed for match ${matchId}`);
      // Handle the case where AI analysis fails, maybe return a default structure
      // For now, we'll throw an error or return a specific response
      throw new NotFoundException('AI analysis could not be generated for this match.');
    }

    const created = await this.prisma.matchAnalysis.create({
      data: {
        matchId,
        userId: match.playerAId, // Or some other logic to determine the user
        provider: ai.provider || 'gemini',
        fallback: !!ai.fallback,
        keyMoments: ai.data.keyMoments,
        strategicInsights: ai.data.strategicInsights,
        playerPerformanceA: ai.data.playerPerformance.playerA,
        playerPerformanceB: ai.data.playerPerformance.playerB,
        overallAssessment: ai.data.overallAssessment,
        recommendations: ai.data.recommendations,
      },
    });
    return {
      ...created,
      match,
    };
  }

  async getPlayerInsights(playerId: string): Promise<PlayerInsightsSummaryDto> {
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ playerAId: playerId }, { playerBId: playerId }] },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    const total = matches.length;
    const wins = matches.filter((m) => m.winnerId === playerId).length;
    const losses = total - wins;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      playerId,
      summary: {
        totalMatches: total,
        wins,
        losses,
        winRate,
      },
      // Extend later with trend lines and shot stats
    };
  }
}
