/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';
import { MatchService } from '../MatchService';
import { Match, MatchState, MatchType } from '../../../types/match';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      match: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe('MatchService', () => {
  let matchService: MatchService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockMatch: Match = {
    id: 'match-1',
    tournamentId: 'tournament-1',
    player1Id: 'player-1',
    player2Id: 'player-2',
    type: MatchType.SINGLES,
    startTime: new Date(),
    tableId: 'table-1',
    state: MatchState.SCHEDULED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    matchService = new MatchService(mockPrisma);
  });

  describe('createMatch', () => {
    it('should create a new match', async () => {
      mockPrisma.match.create.mockResolvedValue(mockMatch);

      const result = await matchService.createMatch({
        tournamentId: 'tournament-1',
        player1Id: 'player-1',
        player2Id: 'player-2',
        type: MatchType.SINGLES,
        startTime: new Date(),
        tableId: 'table-1',
      });

      expect(result).toEqual(mockMatch);
      expect(mockPrisma.match.create).toHaveBeenCalledWith({
        data: {
          tournamentId: 'tournament-1',
          player1Id: 'player-1',
          player2Id: 'player-2',
          type: MatchType.SINGLES,
          startTime: expect.any(Date),
          tableId: 'table-1',
          state: MatchState.SCHEDULED,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getMatch', () => {
    it('should return a match by id', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await matchService.getMatch('match-1');

      expect(result).toEqual(mockMatch);
      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-1' },
      });
    });

    it('should return null if match not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      const result = await matchService.getMatch('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateMatchState', () => {
    it('should update match state', async () => {
      const updatedMatch = { ...mockMatch, state: MatchState.IN_PROGRESS };
      mockPrisma.match.update.mockResolvedValue(updatedMatch);

      const result = await matchService.updateMatchState(
        'match-1',
        MatchState.IN_PROGRESS
      );

      expect(result).toEqual(updatedMatch);
      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: {
          state: MatchState.IN_PROGRESS,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateMatchScore', () => {
    it('should update match score and set winner', async () => {
      const updatedMatch = {
        ...mockMatch,
        player1Score: 5,
        player2Score: 3,
        winnerId: 'player-1',
        state: MatchState.COMPLETED,
        endedAt: new Date(),
      };
      mockPrisma.match.update.mockResolvedValue(updatedMatch);

      const result = await matchService.updateMatchScore('match-1', {
        player1Score: 5,
        player2Score: 3,
        winnerId: 'player-1',
      });

      expect(result).toEqual(updatedMatch);
      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: {
          player1Score: 5,
          player2Score: 3,
          winnerId: 'player-1',
          state: MatchState.COMPLETED,
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getTournamentMatches', () => {
    it('should return matches for a tournament', async () => {
      const tournamentMatches = [mockMatch];
      mockPrisma.match.findMany.mockResolvedValue(tournamentMatches);

      const result = await matchService.getTournamentMatches('tournament-1');

      expect(result).toEqual(tournamentMatches);
      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: { tournamentId: 'tournament-1' },
        orderBy: {
          startTime: 'asc',
        },
      });
    });
  });

  describe('getPlayerMatches', () => {
    it('should return matches for a player', async () => {
      const playerMatches = [mockMatch];
      mockPrisma.match.findMany.mockResolvedValue(playerMatches);

      const result = await matchService.getPlayerMatches('player-1');

      expect(result).toEqual(playerMatches);
      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { player1Id: 'player-1' },
            { player2Id: 'player-1' },
          ],
        },
        orderBy: {
          startTime: 'desc',
        },
      });
    });
  });

  describe('getActiveMatches', () => {
    it('should return active matches for a venue', async () => {
      const activeMatches = [mockMatch];
      mockPrisma.match.findMany.mockResolvedValue(activeMatches);

      const result = await matchService.getActiveMatches('venue-1');

      expect(result).toEqual(activeMatches);
      expect(mockPrisma.match.findMany).toHaveBeenCalledWith({
        where: {
          state: {
            in: [MatchState.SCHEDULED, MatchState.IN_PROGRESS],
          },
          table: {
            venueId: 'venue-1',
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    });
  });
}); 