/// <reference types="jest" />

import { PrismaClient } from "@prisma/client";
import { TournamentService } from "../TournamentService";
import {
  Tournament,
  TournamentState,
  TournamentType,
} from "../../../types/tournament";

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      tournament: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe("TournamentService", () => {
  let tournamentService: TournamentService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockTournament: Tournament = {
    id: "tournament-1",
    name: "Test Tournament",
    type: TournamentType.SINGLE_ELIMINATION,
    venueId: "venue-1",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // 1 day later
    maxParticipants: 16,
    entryFee: 50,
    prizePool: 500,
    state: TournamentState.REGISTRATION,
    participants: [],
    matches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    tournamentService = new TournamentService(mockPrisma);
  });

  describe("createTournament", () => {
    it("should create a new tournament", async () => {
      mockPrisma.tournament.create.mockResolvedValue(mockTournament);

      const result = await tournamentService.createTournament({
        name: "Test Tournament",
        type: TournamentType.SINGLE_ELIMINATION,
        venueId: "venue-1",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        maxParticipants: 16,
        entryFee: 50,
        prizePool: 500,
      });

      expect(result).toEqual(mockTournament);
      expect(mockPrisma.tournament.create).toHaveBeenCalledWith({
        data: {
          name: "Test Tournament",
          type: TournamentType.SINGLE_ELIMINATION,
          venueId: "venue-1",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          maxParticipants: 16,
          entryFee: 50,
          prizePool: 500,
          state: TournamentState.REGISTRATION,
          participants: [],
          matches: [],
        },
      });
    });
  });

  describe("getTournament", () => {
    it("should return a tournament by id", async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue(mockTournament);

      const result = await tournamentService.getTournament("tournament-1");

      expect(result).toEqual(mockTournament);
      expect(mockPrisma.tournament.findUnique).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
      });
    });

    it("should return null if tournament not found", async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue(null);

      const result = await tournamentService.getTournament("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("updateTournamentState", () => {
    it("should update tournament state", async () => {
      const updatedTournament = {
        ...mockTournament,
        state: TournamentState.IN_PROGRESS,
      };
      mockPrisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await tournamentService.updateTournamentState(
        "tournament-1",
        TournamentState.IN_PROGRESS,
      );

      expect(result).toEqual(updatedTournament);
      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: { state: TournamentState.IN_PROGRESS },
      });
    });
  });

  describe("addParticipant", () => {
    it("should add a participant to the tournament", async () => {
      const updatedTournament = {
        ...mockTournament,
        participants: ["player-1"],
      };
      mockPrisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await tournamentService.addParticipant(
        "tournament-1",
        "player-1",
      );

      expect(result).toEqual(updatedTournament);
      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          participants: {
            push: "player-1",
          },
        },
      });
    });
  });

  describe("removeParticipant", () => {
    it("should remove a participant from the tournament", async () => {
      const updatedTournament = {
        ...mockTournament,
        participants: [],
      };
      mockPrisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await tournamentService.removeParticipant(
        "tournament-1",
        "player-1",
      );

      expect(result).toEqual(updatedTournament);
      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          participants: {
            set: [],
          },
        },
      });
    });
  });

  describe("addMatch", () => {
    it("should add a match to the tournament", async () => {
      const updatedTournament = {
        ...mockTournament,
        matches: ["match-1"],
      };
      mockPrisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await tournamentService.addMatch(
        "tournament-1",
        "match-1",
      );

      expect(result).toEqual(updatedTournament);
      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          matches: {
            push: "match-1",
          },
        },
      });
    });
  });

  describe("getActiveTournaments", () => {
    it("should return active tournaments", async () => {
      const activeTournaments = [mockTournament];
      mockPrisma.tournament.findMany.mockResolvedValue(activeTournaments);

      const result = await tournamentService.getActiveTournaments();

      expect(result).toEqual(activeTournaments);
      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith({
        where: {
          state: {
            in: [TournamentState.REGISTRATION, TournamentState.IN_PROGRESS],
          },
        },
      });
    });
  });

  describe("getPlayerTournaments", () => {
    it("should return tournaments for a player", async () => {
      const playerTournaments = [mockTournament];
      mockPrisma.tournament.findMany.mockResolvedValue(playerTournaments);

      const result = await tournamentService.getPlayerTournaments("player-1");

      expect(result).toEqual(playerTournaments);
      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith({
        where: {
          participants: {
            has: "player-1",
          },
        },
      });
    });
  });

  describe("updateTournamentResults", () => {
    it("should update tournament results", async () => {
      const updatedTournament = {
        ...mockTournament,
        state: TournamentState.COMPLETED,
        winnerId: "player-1",
        finalStandings: ["player-1", "player-2"],
        endedAt: new Date(),
      };
      mockPrisma.tournament.update.mockResolvedValue(updatedTournament);

      const result = await tournamentService.updateTournamentResults(
        "tournament-1",
        {
          winnerId: "player-1",
          finalStandings: ["player-1", "player-2"],
        },
      );

      expect(result).toEqual(updatedTournament);
      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          state: TournamentState.COMPLETED,
          winnerId: "player-1",
          finalStandings: ["player-1", "player-2"],
          endedAt: expect.any(Date),
        },
      });
    });
  });
});
