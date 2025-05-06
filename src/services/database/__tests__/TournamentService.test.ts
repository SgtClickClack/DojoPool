import { PrismaClient } from "@prisma/client";
import { TournamentService } from "../TournamentService";
import { Tournament } from "../../../types/tournament";

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
      format: TournamentType.SINGLES,
      startDate: new Date('2024-01-01T10:00:00Z'),
      endDate: new Date('2024-01-02T10:00:00Z'),
      venueId: "venue-1",
      organizerId: "user-1",
      maxParticipants: 16,
      entryFee: 50,
      status: TournamentState.REGISTRATION,
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
        mockTournament.venueId!,
        new Date(mockTournament.startDate) as Date,
        new Date(mockTournament.endDate!) as Date,
        mockTournament.maxParticipants,
        mockTournament.entryFee!,
        mockTournament.prizePool!
      );

      expect(result).toEqual(mockTournament);
      expect(prisma.tournament.create).toHaveBeenCalledWith({
        data: {
          name: "Test Tournament",
          format: TournamentType.SINGLES,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          venueId: "venue-1",
          organizerId: "user-1",
          maxParticipants: 16,
          entryFee: 50,
          status: TournamentState.REGISTRATION,
          participants: 0,
          matches: [],
          prizePool: 500,
        },
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
        status: TournamentState.IN_PROGRESS,
      };
      prisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await TournamentService.updateTournamentState(
        "tournament-1",
        TournamentState.IN_PROGRESS,
      );

      expect(result).toEqual(updatedTournament);
      expect(prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          status: TournamentState.IN_PROGRESS,
        },
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
            in: [TournamentState.REGISTRATION, TournamentState.IN_PROGRESS],
          },
        },
      });
    });
  });

  describe("updateTournamentResults", () => {
    it("should update tournament results", async () => {
      const completedTournament = {
        ...mockTournament,
        status: TournamentState.COMPLETED,
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
        data: {
          status: TournamentState.COMPLETED,
          winnerId: "winner-1",
          runnerUpId: "runner-up-1",
          endedAt: expect.any(Date),
        },
      });
    });
  });
});
