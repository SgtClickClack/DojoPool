/// <reference types="jest" />

// Remove duplicate import
// import { PrismaClient } from "@prisma/client";
import { TournamentDBService } from "../TournamentService";
import {
  Tournament,
  // Keep import of Tournament type from types file
  // TournamentStatus, // Remove import of enums from types file
  // TournamentFormat, // Remove import of enums from types file
} from "../../../types/tournament";

// Import actual enums from @prisma/client using jest.requireActual
const actualPrisma = jest.requireActual("@prisma/client") as any;
// Removed top-level destructuring
// const { TournamentType, MatchState, TournamentStatus, TournamentFormat } = actualPrisma;

// Mock the Prisma client
jest.mock("@prisma/client", () => {
  // Define mock methods and client inside the mock factory
  const mockTournamentMethods = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const mockPrismaClient = { tournament: mockTournamentMethods };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    // Do NOT export enums from the mock - access actual enums directly
  };
});

describe("TournamentDBService Static Methods", () => {
    // Access enums within the describe block
    const { TournamentType, MatchState, TournamentStatus, TournamentFormat } = actualPrisma;

    // Declare variables for mocked client instance outside beforeEach
    // let mockedPrismaClientInstance: any; // Use `any` for simplicity

  const mockTournamentData: Tournament = {
    id: "tournament-1",
    name: "Test Tournament",
    format: TournamentFormat.SINGLE_ELIMINATION, // Use actual enum
    venueId: "venue-1",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    status: TournamentStatus.REGISTRATION, // Corrected property name from state to status, Use actual enum
    organizerId: "user-1",
    participants: 0,
    maxParticipants: 16,
    matches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    entryFee: 50,
    prizePool: 500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTournament", () => {
    it("should create a new tournament", async () => {
      // Access mock methods directly from the mocked module
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;
      // const { TournamentStatus } = jest.requireMock("@prisma/client"); // No need to get enums from mock

      mockTournamentMethods.create.mockResolvedValue(mockTournamentData);

      const inputData = {
        name: "Test Tournament",
        format: TournamentFormat.SINGLE_ELIMINATION, // Use actual enum
        venueId: "venue-1",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        maxParticipants: 16,
        entryFee: 50,
        prizePool: 500,
      };

      const result = await TournamentDBService.createTournament(
        inputData.name,
        inputData.format,
        inputData.venueId,
        inputData.startDate as Date,
        inputData.endDate as Date,
        inputData.maxParticipants,
        inputData.entryFee,
        inputData.prizePool
      );

      expect(result).toEqual(mockTournamentData);
      expect(mockTournamentMethods.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...inputData,
          status: TournamentStatus.OPEN, // Use actual enum
          participants: [],
          matches: [],
        }),
      });
    });
  });

  describe("getTournament", () => {
    it("should return a tournament by id", async () => {
      // Access mock methods directly
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;

      mockTournamentMethods.findUnique.mockResolvedValue(mockTournamentData);

      const result = await TournamentDBService.getTournament("tournament-1");

      expect(result).toEqual(mockTournamentData);
      expect(mockTournamentMethods.findUnique).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
      });
    });

    it("should return null if tournament not found", async () => {
      // Access mock methods directly
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;

      mockTournamentMethods.findUnique.mockResolvedValue(null);
      const result = await TournamentDBService.getTournament("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("updateTournamentState", () => {
    it("should update tournament state", async () => {
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;
      // const { TournamentStatus } = jest.requireMock("@prisma/client"); // No need to get enums from mock
      const updatedTournament = { 
          ...mockTournamentData, 
          status: TournamentStatus.ACTIVE, // Use actual enum
          updatedAt: expect.any(Date),
      };
      // Access mock methods directly
      mockTournamentMethods.update.mockResolvedValue(updatedTournament);

      const result = await TournamentDBService.updateTournamentState(
        "tournament-1",
        TournamentStatus.ACTIVE,
      );

      expect(result).toEqual(updatedTournament);
      expect(mockTournamentMethods.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: { status: TournamentStatus.ACTIVE, updatedAt: expect.any(Date) },
      });
    });
  });

  describe("addParticipant", () => {
    it("should add a participant to the tournament", async () => {
        const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
        const mockTournamentMethods = mockPrismaClient.tournament;
        const updatedTournament = { 
            ...mockTournamentData, 
            participants: ["player-1"],
            updatedAt: expect.any(Date),
        };
        // Access mock methods directly
        mockTournamentMethods.update.mockResolvedValue(updatedTournament);

        const result = await TournamentDBService.addParticipant(
            "tournament-1",
            "player-1",
        );

        expect(result).toEqual(updatedTournament);
        expect(mockTournamentMethods.update).toHaveBeenCalledWith({
            where: { id: "tournament-1" },
            data: {
                participants: { push: "player-1" },
                updatedAt: expect.any(Date),
            },
        });
    });
  });

  describe("removeParticipant", () => {
    it("should remove a participant from the tournament", async () => {
        const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
        const mockTournamentMethods = mockPrismaClient.tournament;

        const initialTournament = { ...mockTournamentData, participants: ["player-1", "player-2"] };
        const updatedTournament = { 
            ...initialTournament, 
            participants: ["player-2"],
            updatedAt: expect.any(Date),
        };
        // Access mock methods directly
        mockTournamentMethods.findUnique.mockResolvedValue(initialTournament);
        mockTournamentMethods.update.mockResolvedValue(updatedTournament);

        const result = await TournamentDBService.removeParticipant(
            "tournament-1",
            "player-1",
        );

        expect(result).toEqual(updatedTournament);
        expect(mockTournamentMethods.findUnique).toHaveBeenCalledWith({ where: { id: "tournament-1" } });
        expect(mockTournamentMethods.update).toHaveBeenCalledWith({
            where: { id: "tournament-1" },
            data: {
                participants: ["player-2"],
                updatedAt: expect.any(Date),
            },
        });
    });
  });

  describe("addMatch", () => {
    it("should add a match to the tournament", async () => {
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;

      const updatedTournament = {
        ...mockTournamentData,
        matches: ["match-1"],
      };
      // Access mock methods directly
      mockTournamentMethods.update.mockResolvedValue(updatedTournament);

      const result = await TournamentDBService.addMatch(
        "tournament-1",
        "match-1",
      );

      expect(result).toEqual(updatedTournament);
      expect(mockTournamentMethods.update).toHaveBeenCalledWith({
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
    it("should return active tournaments for a specific venue", async () => {
      // Access enum from mocked module
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;
      const { TournamentStatus } = jest.requireMock("@prisma/client");
      const activeTournaments = [mockTournamentData];
      // Access mock methods directly
      mockTournamentMethods.findMany.mockResolvedValue(activeTournaments);

      const result = await TournamentDBService.getActiveTournaments("venue-1");

      expect(result).toEqual(activeTournaments);
      expect(mockTournamentMethods.findMany).toHaveBeenCalledWith({
        where: {
          venueId: "venue-1",
          status: {
            in: [TournamentStatus.OPEN, TournamentStatus.ACTIVE],
          },
        },
        orderBy: { startDate: "asc" },
      });
    });
  });

  describe("getPlayerTournaments", () => {
    it("should return tournaments for a player", async () => {
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;

      const playerTournaments = [mockTournamentData];
      // Access mock methods directly
      mockTournamentMethods.findMany.mockResolvedValue(playerTournaments);

      const result = await TournamentDBService.getPlayerTournaments("player-1");

      expect(result).toEqual(playerTournaments);
      expect(mockTournamentMethods.findMany).toHaveBeenCalledWith({
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
      // Access enum from mocked module
      const mockPrismaClient = jest.requireMock("@prisma/client").PrismaClient();
      const mockTournamentMethods = mockPrismaClient.tournament;
      const { TournamentStatus } = jest.requireMock("@prisma/client");
      const updatedTournament = {
        ...mockTournamentData,
        status: TournamentStatus.COMPLETED, // Use enum from mocked module
        winnerId: "player-1",
        finalStandings: ["player-1", "player-2"],
        endedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      // Access mock methods directly
      mockTournamentMethods.update.mockResolvedValue(updatedTournament);

      const result = await TournamentDBService.updateTournamentResults(
        "tournament-1",
        "player-1",
        ["player-1", "player-2"],
      );

      expect(result).toEqual(updatedTournament);
      expect(mockTournamentMethods.update).toHaveBeenCalledWith({
        where: { id: "tournament-1" },
        data: {
          status: TournamentStatus.COMPLETED,
          winnerId: "player-1",
          finalStandings: ["player-1", "player-2"],
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});
