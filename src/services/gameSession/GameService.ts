import { PrismaClient } from "@prisma/client";
import { Game, GameType } from "../../types/game";

const prisma = new PrismaClient();

export class GameService {
  static async createGame(
    type: GameType,
    players: string[],
    venueId: string,
    tableId: string,
  ): Promise<Game> {
    return prisma.game.create({
      data: {
        type,
        players,
        venueId,
        tableId,
        status: "PENDING",
        currentPlayer: players[0],
        score: {},
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

  static async updateGameState(id: string, state: string): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        status: state,
        updatedAt: new Date(),
      },
    });
  }

  static async updateScore(
    id: string,
    score: Record<string, number>,
  ): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        score,
        updatedAt: new Date(),
      },
    });
  }

  static async updateCurrentPlayer(
    id: string,
    playerId: string,
  ): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        currentPlayer: playerId,
        updatedAt: new Date(),
      },
    });
  }

  static async endGame(id: string, winnerId: string): Promise<Game> {
    return prisma.game.update({
      where: { id },
      data: {
        status: "COMPLETED",
        winnerId,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getActiveGames(venueId: string): Promise<Game[]> {
    return prisma.game.findMany({
      where: {
        venueId,
        status: {
          in: ["IN_PROGRESS", "PENDING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getPlayerGames(playerId: string): Promise<Game[]> {
    return prisma.game.findMany({
      where: {
        players: {
          has: playerId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
