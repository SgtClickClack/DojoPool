import { PrismaClient } from "@prisma/client";
import { Game, GameType } from "../../types/game";

export class GameService {
  static async createGame(
    player1Id: string,
    player2Id: string,
    type: GameType,
    tableId: string,
    venueId: string,
  ): Promise<Game> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.create({
        data: {
          player1Id,
          player2Id,
          type,
          tableId,
          venueId,
          state: "SCHEDULED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getGame(id: string): Promise<Game | null> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.findUnique({
        where: { id },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updateGameState(id: string, state: string): Promise<Game> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.update({
        where: { id },
        data: {
          state,
          updatedAt: new Date(),
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updateGameScore(
    id: string,
    player1Score: number,
    player2Score: number,
    winnerId: string,
  ): Promise<Game> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.update({
        where: { id },
        data: {
          player1Score,
          player2Score,
          winnerId,
          state: "COMPLETED",
          endedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getPlayerGames(playerId: string): Promise<Game[]> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.findMany({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getActiveGames(venueId: string): Promise<Game[]> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.findMany({
        where: {
          state: {
            in: ["SCHEDULED", "IN_PROGRESS"],
          },
          venueId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getTableGames(tableId: string): Promise<Game[]> {
    const prisma = new PrismaClient();
    try {
      return await prisma.game.findMany({
        where: { tableId },
        orderBy: {
          createdAt: "desc",
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }
}
