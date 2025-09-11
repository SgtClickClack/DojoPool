import { ActivityType } from '@dojopool/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ReportMatchDto {
  playerAId: string;
  playerBId: string;
  winnerId: string;
  scoreA: number;
  scoreB: number;
  venueId?: string;
  tableId?: string;
}

interface MatchResult {
  id: string;
  winnerId: string;
  loserId: string;
  scoreA: number;
  scoreB: number;
  playerAStats: {
    totalWins: number;
    totalLosses: number;
    winStreak: number;
    longestWinStreak: number;
    totalMatches: number;
  };
  playerBStats: {
    totalWins: number;
    totalLosses: number;
    winStreak: number;
    longestWinStreak: number;
    totalMatches: number;
  };
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async isUserInMatch(userId: string, matchId: string): Promise<boolean> {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ playerAId: userId }, { playerBId: userId }],
      },
    });
    return !!match;
  }

  async getMatchById(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        playerA: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        playerB: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  async getMatchWithAnalysis(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
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
      },
    });
  }

  async reportMatch(
    reportData: ReportMatchDto,
    reporterId: string
  ): Promise<MatchResult> {
    // Validate input data
    await this.validateMatchReport(reportData, reporterId);

    // Check if match already exists or create new one
    let match = await this.prisma.match.findFirst({
      where: {
        playerAId: reportData.playerAId,
        playerBId: reportData.playerBId,
        status: 'IN_PROGRESS',
      },
    });

    if (!match) {
      // Create new match
      match = await this.prisma.match.create({
        data: {
          playerAId: reportData.playerAId,
          playerBId: reportData.playerBId,
          winnerId: reportData.winnerId,
          scoreA: reportData.scoreA,
          scoreB: reportData.scoreB,
          status: 'COMPLETED',
          endedAt: new Date(),
          venueId: reportData.venueId,
          tableId: reportData.tableId,
        },
      });
    } else {
      // Update existing match
      match = await this.prisma.match.update({
        where: { id: match.id },
        data: {
          winnerId: reportData.winnerId,
          scoreA: reportData.scoreA,
          scoreB: reportData.scoreB,
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });
    }

    // Update player statistics
    const result = await this.updatePlayerStats(match.id);

    // Create activity feed event
    await this.prisma.activity.create({
      data: {
        userId: reportData.winnerId,
        type: ActivityType.MATCH_WIN,
        details: JSON.stringify({
          opponentId:
            reportData.winnerId === reportData.playerAId
              ? reportData.playerBId
              : reportData.playerAId,
          scoreA: reportData.scoreA,
          scoreB: reportData.scoreB,
          matchId: match.id,
        }),
      },
    });

    return result;
  }

  private async validateMatchReport(
    reportData: ReportMatchDto,
    reporterId: string
  ): Promise<void> {
    // Check if players exist
    const [playerA, playerB] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: reportData.playerAId } }),
      this.prisma.user.findUnique({ where: { id: reportData.playerBId } }),
    ]);

    if (!playerA || !playerB) {
      throw new NotFoundException('One or both players not found');
    }

    // Check if reporter is one of the players
    if (
      reporterId !== reportData.playerAId &&
      reporterId !== reportData.playerBId
    ) {
      throw new ForbiddenException(
        'Only players in the match can report results'
      );
    }

    // Validate winner is one of the players
    if (
      reportData.winnerId !== reportData.playerAId &&
      reportData.winnerId !== reportData.playerBId
    ) {
      throw new BadRequestException(
        'Winner must be one of the players in the match'
      );
    }

    // Validate scores
    if (reportData.scoreA < 0 || reportData.scoreB < 0) {
      throw new BadRequestException('Scores cannot be negative');
    }

    // Validate venue and table if provided
    if (reportData.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: reportData.venueId },
      });
      if (!venue) {
        throw new NotFoundException('Venue not found');
      }
    }

    if (reportData.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: reportData.tableId },
      });
      if (!table) {
        throw new NotFoundException('Table not found');
      }
    }
  }

  private async updatePlayerStats(matchId: string): Promise<MatchResult> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: {
          select: {
            id: true,
            username: true,
            totalWins: true,
            totalLosses: true,
            winStreak: true,
            longestWinStreak: true,
            totalMatches: true,
          },
        },
        playerB: {
          select: {
            id: true,
            username: true,
            totalWins: true,
            totalLosses: true,
            winStreak: true,
            longestWinStreak: true,
            totalMatches: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const winnerId = match.winnerId;
    if (!winnerId) {
      throw new BadRequestException('Match does not have a winner');
    }
    const loserId =
      winnerId === match.playerAId ? match.playerBId : match.playerAId;

    // Update winner stats
    const winnerStats =
      winnerId === match.playerAId ? match.playerA : match.playerB;
    const updatedWinnerStats = await this.updateWinnerStats(
      winnerId,
      winnerStats
    );

    // Update loser stats
    const loserStats =
      winnerId === match.playerAId ? match.playerB : match.playerA;
    const updatedLoserStats = await this.updateLoserStats(loserId, loserStats);

    return {
      id: match.id,
      winnerId,
      loserId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      playerAStats:
        winnerId === match.playerAId ? updatedWinnerStats : updatedLoserStats,
      playerBStats:
        winnerId === match.playerAId ? updatedLoserStats : updatedWinnerStats,
    };
  }

  private async updateWinnerStats(playerId: string, currentStats: any) {
    const newWinStreak = currentStats.winStreak + 1;
    const newLongestWinStreak = Math.max(
      currentStats.longestWinStreak,
      newWinStreak
    );

    return await this.prisma.user.update({
      where: { id: playerId },
      data: {
        totalWins: { increment: 1 },
        totalMatches: { increment: 1 },
        winStreak: newWinStreak,
        longestWinStreak: newLongestWinStreak,
        dojoCoinBalance: { increment: 10 }, // Reward 10 Dojo Coins for a win
      },
      select: {
        totalWins: true,
        totalLosses: true,
        winStreak: true,
        longestWinStreak: true,
        totalMatches: true,
      },
    });
  }

  private async updateLoserStats(playerId: string, currentStats: any) {
    return await this.prisma.user.update({
      where: { id: playerId },
      data: {
        totalLosses: { increment: 1 },
        totalMatches: { increment: 1 },
        winStreak: 0, // Reset win streak
      },
      select: {
        totalWins: true,
        totalLosses: true,
        winStreak: true,
        longestWinStreak: true,
        totalMatches: true,
      },
    });
  }

  async finalizeMatch(
    matchId: string,
    winnerId: string,
    scoreA: number,
    scoreB: number
  ) {
    const match = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        scoreA,
        scoreB,
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    // Update player statistics
    await this.updatePlayerStats(matchId);

    return match;
  }
}
