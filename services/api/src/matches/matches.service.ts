import { Injectable, Logger } from '@nestjs/common';
import { MatchUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAnalysisService } from './ai-analysis.service';
import { MatchGateway } from './match.gateway';
import { MatchesGateway } from './matches.gateway';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private prisma: PrismaService,
    private aiAnalysisService: AiAnalysisService,
    private matchesGateway: MatchesGateway,
    private matchGateway: MatchGateway
  ) {}

  async getMatchById(matchId: string): Promise<any> {
    return MatchUtils.getMatchById(this.prisma, matchId);
  }

  /**
   * Create a match with optional wager and escrow funds from both players transactionally.
   */
  async createMatch(data: {
    tournamentId: string;
    venueId: string;
    playerAId: string;
    playerBId: string;
    round: number;
    status?:
      | 'PENDING'
      | 'IN_PROGRESS'
      | 'PAUSED'
      | 'COMPLETED'
      | 'CANCELLED'
      | string;
    tableId?: string | null;
    wager?: number;
  }): Promise<any> {
    const {
      tournamentId,
      venueId,
      playerAId,
      playerBId,
      round,
      status = 'IN_PROGRESS',
      tableId = null,
      wager = 0,
    } = data;

    const normalizedWager = Math.max(
      0,
      Math.floor(Number.isFinite(wager as number) ? (wager as number) : 0)
    );

    return this.prisma.$transaction(async (tx) => {
      if (normalizedWager > 0) {
        // Ensure both users exist and can afford the wager, then escrow funds.
        const [playerA, playerB] = await Promise.all([
          tx.user.findUnique({
            where: { id: playerAId },
            select: { dojoCoinBalance: true },
          }),
          tx.user.findUnique({
            where: { id: playerBId },
            select: { dojoCoinBalance: true },
          }),
        ]);

        if (!playerA || !playerB) {
          throw new Error('One or both players not found');
        }
        if (
          playerA.dojoCoinBalance < normalizedWager ||
          playerB.dojoCoinBalance < normalizedWager
        ) {
          throw new Error('Insufficient DojoCoin balance to cover the wager');
        }

        // Decrement balances with guard using updateMany to prevent going negative in concurrent scenarios
        const aUpdate = await tx.user.updateMany({
          where: { id: playerAId, dojoCoinBalance: { gte: normalizedWager } },
          data: { dojoCoinBalance: { decrement: normalizedWager } },
        });
        if (aUpdate.count !== 1) {
          throw new Error(
            'Failed to escrow wager from player A (insufficient funds)'
          );
        }
        const bUpdate = await tx.user.updateMany({
          where: { id: playerBId, dojoCoinBalance: { gte: normalizedWager } },
          data: { dojoCoinBalance: { decrement: normalizedWager } },
        });
        if (bUpdate.count !== 1) {
          throw new Error(
            'Failed to escrow wager from player B (insufficient funds)'
          );
        }
      }

      // Create the match with wager recorded
      const match = await tx.match.create({
        data: {
          tournamentId,
          venueId,
          playerAId,
          playerBId,
          round,
          status: status as any,
          tableId: tableId ?? undefined,
          wager: normalizedWager,
        },
      });

      return match;
    });
  }

  async finalizeMatch(
    matchId: string,
    winnerId: string,
    scoreA: number,
    scoreB: number
  ): Promise<any> {
    try {
      // Fetch existing match to determine loser safely and get wager
      const existing = await this.prisma.match.findUnique({
        where: { id: matchId },
        select: { playerAId: true, playerBId: true, wager: true },
      });
      if (!existing) {
        throw new Error('Match not found');
      }
      const computedLoserId =
        winnerId === existing.playerAId
          ? existing.playerBId
          : existing.playerAId;

      const COIN_REWARD = Number.parseInt(
        process.env.DOJO_WIN_REWARD || '50',
        10
      );
      const wager = Math.max(0, Math.floor(existing.wager ?? 0));
      const prize = wager > 0 ? wager * 2 : 0;

      // Update match and award coins transactionally (including wager payout)
      const updatedMatch = await this.prisma.$transaction(async (tx) => {
        const m = await tx.match.update({
          where: { id: matchId },
          data: {
            winnerId,
            loserId: computedLoserId,
            scoreA,
            scoreB,
            status: 'COMPLETED',
            endedAt: new Date(),
          },
          include: {
            playerA: { select: { username: true } },
            playerB: { select: { username: true } },
            venue: { select: { name: true } },
          },
        });

        if (winnerId) {
          const incrementBy = COIN_REWARD + (prize || 0);
          if (incrementBy > 0) {
            await tx.user.update({
              where: { id: winnerId },
              data: { dojoCoinBalance: { increment: incrementBy } },
            });
          }
        }

        return m;
      });

      if (prize > 0) {
        this.logger.log(
          `Awarded wager prize ${prize} DojoCoins to winner ${winnerId} for match ${matchId}`
        );
      }
      this.logger.log(
        `Awarded ${COIN_REWARD} DojoCoins to winner ${winnerId} for match ${matchId}`
      );

      // Generate AI analysis asynchronously
      this.generateAndStoreAnalysis(updatedMatch).catch((error) => {
        this.logger.error(
          'Failed to generate AI analysis for match:',
          matchId,
          error
        );
      });

      return updatedMatch;
    } catch (error) {
      this.logger.error('Failed to finalize match:', matchId, error);
      throw error;
    }
  }

  private async generateAndStoreAnalysis(match: any): Promise<void> {
    try {
      const matchData = {
        playerAName: match.playerA.username,
        playerBName: match.playerB.username,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        winner:
          match.winnerId === match.playerAId
            ? match.playerA.username
            : match.playerB.username,
        venue: match.venue.name,
        round: match.round,
      };

      const analysis =
        await this.aiAnalysisService.generateMatchAnalysis(matchData);

      // Store the analysis in the database
      await this.prisma.match.update({
        where: { id: match.id },
        data: {
          aiAnalysisJson: JSON.stringify(analysis),
        },
      });

      this.logger.log('AI analysis generated and stored for match:', match.id);
    } catch (error) {
      this.logger.error('Failed to generate and store AI analysis:', error);
    }
  }

  async pauseMatch(matchId: string, userId: string) {
    // Allow pause only from IN_PROGRESS to PAUSED
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new Error('Match not found');
    if (match.playerAId !== userId && match.playerBId !== userId) {
      throw new Error('Not authorized to pause this match');
    }
    if (match.status !== 'IN_PROGRESS') {
      throw new Error('Match is not in progress');
    }
    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'PAUSED' },
    });
    // Broadcast to both gateway room styles
    this.matchesGateway.broadcastMatchStatusUpdate(matchId, 'PAUSED');
    this.matchGateway.broadcastMatchStatusUpdate(matchId, 'PAUSED');
    return updated;
  }

  async resumeMatch(matchId: string, userId: string) {
    // Allow resume only from PAUSED to IN_PROGRESS
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new Error('Match not found');
    if (match.playerAId !== userId && match.playerBId !== userId) {
      throw new Error('Not authorized to resume this match');
    }
    if (match.status !== 'PAUSED') {
      throw new Error('Match is not paused');
    }
    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'IN_PROGRESS' },
    });
    this.matchesGateway.broadcastMatchStatusUpdate(matchId, 'IN_PROGRESS');
    this.matchGateway.broadcastMatchStatusUpdate(matchId, 'IN_PROGRESS');
    return updated;
  }

  async getMatchWithAnalysis(matchId: string): Promise<any> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: {
            include: {
              venue: true,
            },
          },
          playerA: {
            select: {
              id: true,
              username: true,
            },
          },
          playerB: {
            select: {
              id: true,
              username: true,
            },
          },
          venue: true,
          table: true,
        },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Parse AI analysis if available
      let aiAnalysis = null;
      if (match.aiAnalysisJson) {
        try {
          aiAnalysis = JSON.parse(match.aiAnalysisJson);
        } catch (error) {
          this.logger.warn(
            'Failed to parse AI analysis JSON for match:',
            matchId
          );
        }
      }

      return {
        ...match,
        aiAnalysis,
      };
    } catch (err) {
      this.logger.error('Failed to fetch match with analysis:', matchId, err);
      throw err;
    }
  }
}
