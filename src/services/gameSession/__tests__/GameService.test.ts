/// <reference types="jest" />
import { PrismaClient } from '@prisma/client';
import { GameService } from '../GameService';
import { Game, GameState, GameType } from '../../../types/game';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    game: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('GameService', () => {
  const mockGame: Game = {
    id: '1',
    type: GameType.EIGHT_BALL,
    players: ['player1', 'player2'],
    venueId: 'venue1',
    tableId: 'table1',
    state: GameState.PENDING,
    currentPlayer: 'player1',
    score: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const result = await GameService.createGame(
        GameType.EIGHT_BALL,
        ['player1', 'player2'],
        'venue1',
        'table1'
      );

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: {
          type: GameType.EIGHT_BALL,
          players: ['player1', 'player2'],
          venueId: 'venue1',
          tableId: 'table1',
          state: GameState.PENDING,
          currentPlayer: 'player1',
          score: {},
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockGame);
    });

    it('should handle errors during game creation', async () => {
      const error = new Error('Database error');
      (prisma.game.create as jest.Mock).mockRejectedValue(error);

      await expect(
        GameService.createGame(GameType.EIGHT_BALL, ['player1', 'player2'], 'venue1', 'table1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getGame', () => {
    it('should get a game by id', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(mockGame);

      const result = await GameService.getGame('1');

      expect(prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockGame);
    });

    it('should return null when game is not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await GameService.getGame('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    it('should update game state', async () => {
      const updatedGame = { ...mockGame, state: GameState.IN_PROGRESS };
      (prisma.game.update as jest.Mock).mockResolvedValue(updatedGame);

      const result = await GameService.updateGameState('1', GameState.IN_PROGRESS);

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          state: GameState.IN_PROGRESS,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedGame);
    });

    it('should handle errors during game state update', async () => {
      const error = new Error('Database error');
      (prisma.game.update as jest.Mock).mockRejectedValue(error);

      await expect(GameService.updateGameState('1', GameState.IN_PROGRESS)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateScore', () => {
    it('should update game score', async () => {
      const newScore = { player1: 5, player2: 3 };
      const updatedGame = { ...mockGame, score: newScore };
      (prisma.game.update as jest.Mock).mockResolvedValue(updatedGame);

      const result = await GameService.updateScore('1', newScore);

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          score: newScore,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedGame);
    });

    it('should handle errors during score update', async () => {
      const error = new Error('Database error');
      (prisma.game.update as jest.Mock).mockRejectedValue(error);

      await expect(GameService.updateScore('1', {})).rejects.toThrow('Database error');
    });
  });

  describe('updateCurrentPlayer', () => {
    it('should update current player', async () => {
      const updatedGame = { ...mockGame, currentPlayer: 'player2' };
      (prisma.game.update as jest.Mock).mockResolvedValue(updatedGame);

      const result = await GameService.updateCurrentPlayer('1', 'player2');

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          currentPlayer: 'player2',
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedGame);
    });

    it('should handle errors during current player update', async () => {
      const error = new Error('Database error');
      (prisma.game.update as jest.Mock).mockRejectedValue(error);

      await expect(GameService.updateCurrentPlayer('1', 'player2')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('endGame', () => {
    it('should end a game', async () => {
      const endedGame = {
        ...mockGame,
        state: GameState.COMPLETED,
        winnerId: 'player1',
        endedAt: new Date(),
      };
      (prisma.game.update as jest.Mock).mockResolvedValue(endedGame);

      const result = await GameService.endGame('1', 'player1');

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          state: GameState.COMPLETED,
          winnerId: 'player1',
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(endedGame);
    });

    it('should handle errors during game ending', async () => {
      const error = new Error('Database error');
      (prisma.game.update as jest.Mock).mockRejectedValue(error);

      await expect(GameService.endGame('1', 'player1')).rejects.toThrow('Database error');
    });
  });

  describe('getActiveGames', () => {
    it('should get active games for a venue', async () => {
      const activeGames = [mockGame];
      (prisma.game.findMany as jest.Mock).mockResolvedValue(activeGames);

      const result = await GameService.getActiveGames('venue1');

      expect(prisma.game.findMany).toHaveBeenCalledWith({
        where: {
          venueId: 'venue1',
          state: {
            in: [GameState.IN_PROGRESS, GameState.PENDING],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(activeGames);
    });

    it('should handle errors during active games retrieval', async () => {
      const error = new Error('Database error');
      (prisma.game.findMany as jest.Mock).mockRejectedValue(error);

      await expect(GameService.getActiveGames('venue1')).rejects.toThrow('Database error');
    });
  });

  describe('getPlayerGames', () => {
    it('should get games for a player', async () => {
      const playerGames = [mockGame];
      (prisma.game.findMany as jest.Mock).mockResolvedValue(playerGames);

      const result = await GameService.getPlayerGames('player1');

      expect(prisma.game.findMany).toHaveBeenCalledWith({
        where: {
          players: {
            has: 'player1',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(playerGames);
    });

    it('should handle errors during player games retrieval', async () => {
      const error = new Error('Database error');
      (prisma.game.findMany as jest.Mock).mockRejectedValue(error);

      await expect(GameService.getPlayerGames('player1')).rejects.toThrow('Database error');
    });
  });
}); 