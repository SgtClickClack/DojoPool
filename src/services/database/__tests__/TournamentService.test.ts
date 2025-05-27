import { PrismaClient } from "@prisma/client";
import { TournamentService } from "../TournamentService";
import { Tournament, TournamentFormat, TournamentStatus } from '../../../types/tournament';

jest.mock("@prisma/client", () => {
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

describe("TournamentService", () => {
  const actualPrisma = jest.requireActual("@prisma/client") as any;
  const { TournamentState, TournamentType } = actualPrisma;

  let prisma: jest.Mocked<PrismaClient>;
  let mockTournament: Tournament;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

    mockTournament = {
      id: "tournament-1",
      name: "Test Tournament",
      format: TournamentFormat.SINGLE_ELIMINATION,
      startDate: new Date('2024-01-01T10:00:00Z'),
      endDate: new Date('2024-01-02T10:00:00Z'),
      venueId: "venue-1",
      organizerId: "user-1",
      maxParticipants: 16,
      entryFee: 50,
      status: TournamentStatus.OPEN,
      createdAt: new Date('2024-01-01T09:00:00Z'),
      updatedAt: new Date('2024-01-01T09:00:00Z'),
      participants: 0,
      matches: [],
      prizePool: 500,
    } as Tournament;
  });

  describe("createTournament", () => {
    it("should create a new tournament", async () => {
      prisma.tournament.create.mockResolvedValue(mockTournament);

      const result = await TournamentService.createTournament(
        mockTournament.name,
        mockTournament.format,
        mockTournament.startDate,
        mockTournament.endDate!,
        mockTournament.venueId!,
        mockTournament.organizerId,
        mockTournament.maxParticipants,
        mockTournament.entryFee!
      );

      expect(result).toEqual(mockTournament);
      expect(prisma.tournament.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Tournament",
          format: TournamentFormat.SINGLE_ELIMINATION,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          venueId: "venue-1",
          organizerId: "user-1",
          maxParticipants: 16,
          entryFee: 50,
          status: TournamentStatus.OPEN,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getTournament", () => {
    it("should return a tournament by id", async () => {
      prisma.tournament.findUnique.mockResolvedValue(mockTournament);

      const result = await TournamentService.getTournament("tournament-1");

      expect(result).toEqual(mockTournament);
      expect(prisma.tournament.findUnique).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
      });
    });

    it("should return null if tournament not found", async () => {
      prisma.tournament.findUnique.mockResolvedValue(null);

      const result = await TournamentService.getTournament("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("updateTournamentState", () => {
    it("should update tournament state", async () => {
      const updatedTournament = {
        ...mockTournament,
        status: TournamentStatus.ACTIVE,
      };
      prisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await TournamentService.updateTournamentState(
        "tournament-1",
        TournamentStatus.ACTIVE,
      );

      expect(result).toEqual(updatedTournament);
      expect(prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: expect.objectContaining({
          status: TournamentStatus.ACTIVE,
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getActiveTournaments", () => {
    it("should return active tournaments", async () => {
      const activeTournaments = [mockTournament];
      prisma.tournament.findMany.mockResolvedValue(activeTournaments);

      const result = await TournamentService.getActiveTournaments(mockTournament.venueId!);

      expect(result).toEqual(activeTournaments);
      expect(prisma.tournament.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [TournamentStatus.OPEN, TournamentStatus.ACTIVE],
          },
          venueId: "venue-1",
        },
        orderBy: { startDate: "asc" },
      });
    });
  });

  describe("updateTournamentResults", () => {
    it("should update tournament results", async () => {
      const completedTournament = {
        ...mockTournament,
        status: TournamentStatus.COMPLETED,
        winnerId: "winner-1",
        runnerUpId: "runner-up-1",
        endedAt: new Date(),
      };
      prisma.tournament.update.mockResolvedValue(completedTournament);

      const result = await TournamentService.updateTournamentResults(
        "tournament-1",
        "winner-1",
        "runner-up-1",
      );

      expect(result).toEqual(completedTournament);
      expect(prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: expect.objectContaining({
          status: TournamentStatus.COMPLETED,
          winnerId: "winner-1",
          runnerUpId: "runner-up-1",
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
    });
  });
});
