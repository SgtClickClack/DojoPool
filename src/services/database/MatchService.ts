import { PrismaClient } from "@prisma/client";
import { Match, MatchState, MatchType } from "../../types/match";

const prisma = new PrismaClient();

export class MatchService {
  static async createMatch(
    tournamentId: string,
    player1Id: string,
    player2Id: string,
    type: MatchType,
    startTime: Date,
    tableId: string,
  ): Promise<Match> {
    return prisma.match.create({
      data: {
        tournamentId,
        player1Id,
        player2Id,
        type,
        startTime,
        tableId,
        state: MatchState.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getMatch(id: string): Promise<Match | null> {
    return prisma.match.findUnique({
      where: { id },
    });
  }

  static async updateMatchState(id: string, state: MatchState): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data: {
        state,
        updatedAt: new Date(),
      },
    });
  }

  static async updateMatchScore(
    id: string,
    player1Score: number,
    player2Score: number,
    winnerId: string,
  ): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data: {
        player1Score,
        player2Score,
        winnerId,
        state: MatchState.COMPLETED,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: { tournamentId },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  static async getPlayerMatches(playerId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      orderBy: {
        startTime: "desc",
      },
    });
  }

  static async getActiveMatches(venueId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        state: {
          in: [MatchState.SCHEDULED, MatchState.IN_PROGRESS],
        },
        table: {
          venueId,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }
}
