/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';
import { GameService } from '../GameService';
import { Game, GameState, GameType } from '../../../types/game';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      game: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe('GameService', () => {
  let gameService: GameService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockGame: Game = {
    id: 'game-1',
    player1Id: 'player-1',
    player2Id: 'player-2',
    type: GameType.SINGLES,
    tableId: 'table-1',
    venueId: 'venue-1',
    state: GameState.SCHEDULED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    gameService = new GameService(mockPrisma);
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      mockPrisma.game.create.mockResolvedValue(mockGame);

      const result = await gameService.createGame({
        player1Id: 'player-1',
        player2Id: 'player-2',
        type: GameType.SINGLES,
        tableId: 'table-1',
        venueId: 'venue-1',
      });

      expect(result).toEqual(mockGame);
      expect(mockPrisma.game.create).toHaveBeenCalledWith({
        data: {
          player1Id: 'player-1',
          player2Id: 'player-2',
          type: GameType.SINGLES,
          tableId: 'table-1',
          venueId: 'venue-1',
          state: GameState.SCHEDULED,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getGame', () => {
    it('should return a game by id', async () => {
      mockPrisma.game.findUnique.mockResolvedValue(mockGame);

      const result = await gameService.getGame('game-1');

      expect(result).toEqual(mockGame);
      expect(mockPrisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: 'game-1' },
      });
    });

    it('should return null if game not found', async () => {
      mockPrisma.game.findUnique.mockResolvedValue(null);

      const result = await gameService.getGame('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    it('should update game state', async () => {
      const updatedGame = { ...mockGame, state: GameState.IN_PROGRESS };
      mockPrisma.game.update.mockResolvedValue(updatedGame);

      const result = await gameService.updateGameState(
        'game-1',
        GameState.IN_PROGRESS
      );

      expect(result).toEqual(updatedGame);
      expect(mockPrisma.game.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: {
          state: GameState.IN_PROGRESS,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateGameScore', () => {
    it('should update game score and set winner', async () => {
      const updatedGame = {
        ...mockGame,
        player1Score: 5,
        player2Score: 3,
        winnerId: 'player-1',
        state: GameState.COMPLETED,
        endedAt: new Date(),
      };
      mockPrisma.game.update.mockResolvedValue(updatedGame);

      const result = await gameService.updateGameScore('game-1', {
        player1Score: 5,
        player2Score: 3,
        winnerId: 'player-1',
      });

      expect(result).toEqual(updatedGame);
      expect(mockPrisma.game.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: {
          player1Score: 5,
          player2Score: 3,
          winnerId: 'player-1',
          state: GameState.COMPLETED,
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getPlayerGames', () => {
    it('should return games for a player', async () => {
      const playerGames = [mockGame];
      mockPrisma.game.findMany.mockResolvedValue(playerGames);

      const result = await gameService.getPlayerGames('player-1');

      expect(result).toEqual(playerGames);
      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { player1Id: 'player-1' },
            { player2Id: 'player-1' },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('getActiveGames', () => {
    it('should return active games for a venue', async () => {
      const activeGames = [mockGame];
      mockPrisma.game.findMany.mockResolvedValue(activeGames);

      const result = await gameService.getActiveGames('venue-1');

      expect(result).toEqual(activeGames);
      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: {
          state: {
            in: [GameState.SCHEDULED, GameState.IN_PROGRESS],
          },
          venueId: 'venue-1',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });
  });

  describe('getTableGames', () => {
    it('should return games for a table', async () => {
      const tableGames = [mockGame];
      mockPrisma.game.findMany.mockResolvedValue(tableGames);

      const result = await gameService.getTableGames('table-1');

      expect(result).toEqual(tableGames);
      expect(mockPrisma.game.findMany).toHaveBeenCalledWith({
        where: { tableId: 'table-1' },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
}); 