import { PrismaClient } from '@prisma/client';
import { TournamentService } from '../TournamentService';
import { Tournament, TournamentState, TournamentType } from '../../../types/tournament';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    tournament: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('TournamentService', () => {
  let prisma: jest.Mocked<PrismaClient>;
  let service: TournamentService;
  let mockTournament: Tournament;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    service = new TournamentService(prisma);

    mockTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      type: TournamentType.SINGLES,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      venueId: 'venue-1',
      organizerId: 'user-1',
      maxParticipants: 16,
      entryFee: 50,
      state: TournamentState.REGISTRATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('createTournament', () => {
    it('should create a new tournament', async () => {
      prisma.tournament.create.mockResolvedValue(mockTournament);

      const result = await service.createTournament({
        name: 'Test Tournament',
        type: TournamentType.SINGLES,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        venueId: 'venue-1',
        organizerId: 'user-1',
        maxParticipants: 16,
        entryFee: 50,
      });

      expect(result).toEqual(mockTournament);
      expect(prisma.tournament.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Tournament',
          type: TournamentType.SINGLES,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          venueId: 'venue-1',
          organizerId: 'user-1',
          maxParticipants: 16,
          entryFee: 50,
          state: TournamentState.REGISTRATION,
        },
      });
    });
  });

  describe('getTournament', () => {
    it('should return a tournament by id', async () => {
      prisma.tournament.findUnique.mockResolvedValue(mockTournament);

      const result = await service.getTournament('tournament-1');

      expect(result).toEqual(mockTournament);
      expect(prisma.tournament.findUnique).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
      });
    });

    it('should return null if tournament not found', async () => {
      prisma.tournament.findUnique.mockResolvedValue(null);

      const result = await service.getTournament('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateTournamentState', () => {
    it('should update tournament state', async () => {
      const updatedTournament = { ...mockTournament, state: TournamentState.IN_PROGRESS };
      prisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await service.updateTournamentState('tournament-1', TournamentState.IN_PROGRESS);

      expect(result).toEqual(updatedTournament);
      expect(prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        data: { state: TournamentState.IN_PROGRESS },
      });
    });
  });

  describe('getActiveTournaments', () => {
    it('should return active tournaments', async () => {
      const activeTournaments = [mockTournament];
      prisma.tournament.findMany.mockResolvedValue(activeTournaments);

      const result = await service.getActiveTournaments();

      expect(result).toEqual(activeTournaments);
      expect(prisma.tournament.findMany).toHaveBeenCalledWith({
        where: {
          state: {
            in: [TournamentState.REGISTRATION, TournamentState.IN_PROGRESS],
          },
        },
      });
    });
  });

  describe('updateTournamentResults', () => {
    it('should update tournament results', async () => {
      const completedTournament = {
        ...mockTournament,
        state: TournamentState.COMPLETED,
        winnerId: 'winner-1',
        runnerUpId: 'runner-up-1',
        endedAt: new Date(),
      };
      prisma.tournament.update.mockResolvedValue(completedTournament);

      const result = await service.updateTournamentResults('tournament-1', 'winner-1', 'runner-up-1');

      expect(result).toEqual(completedTournament);
      expect(prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        data: {
          state: TournamentState.COMPLETED,
          winnerId: 'winner-1',
          runnerUpId: 'runner-up-1',
          endedAt: expect.any(Date),
        },
      });
    });
  });
}); 