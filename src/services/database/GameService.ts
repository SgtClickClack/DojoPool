import { PrismaClient } from "@prisma/client";
import { Game, GameState, GameType } from "../../types/game";

const prisma = new PrismaClient();

export class GameService {
  static async createGame(
    player1Id: string,
    player2Id: string,
    type: GameType,
    tableId: string,
    venueId: string,
  ): Promise<Game> {
    return prisma.game.create({
      data: {
        player1Id,
        player2Id,
        type,
        tableId,
        venueId,
        state: GameState.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getGame(id: string): Promise<Game | null> {
    return prisma.game.findUnique({
      where: { id },
    });
  }

  static async updateGameState(id: string, state: GameState): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        state,
        updatedAt: new Date(),
      },
    });
  }

  static async updateGameScore(
    id: string,
    player1Score: number,
    player2Score: number,
    winnerId: string,
  ): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        player1Score,
        player2Score,
        winnerId,
        state: GameState.COMPLETED,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getPlayerGames(playerId: string): Promise<Game[]> {
    return prisma.game.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getActiveGames(venueId: string): Promise<Game[]> {
    return prisma.game.findMany({
      where: {
        state: {
          in: [GameState.SCHEDULED, GameState.IN_PROGRESS],
        },
        venueId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async getTableGames(tableId: string): Promise<Game[]> {
    return prisma.game.findMany({
      where: { tableId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
