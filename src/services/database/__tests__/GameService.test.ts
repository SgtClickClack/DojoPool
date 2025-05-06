/// <reference types="jest" />

// Moved mock definitions inside the jest.mock factory to avoid ReferenceError
// const mockGameMethods = {
//   findUnique: jest.fn(),
//   findMany: jest.fn(),
//   create: jest.fn(),
//   update: jest.fn(),
//   delete: jest.fn(),
// };
// const mockPrismaClient = { game: mockGameMethods };

// let mockGameMethods: any; // Declare it here to be assigned later
// let mockPrismaClient: any; // Declare it here to be assigned later

jest.mock("@prisma/client", () => {
  // Define mock methods directly within the factory
  const mockGameMethods = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  // Define the mock client instance structure
  const mockPrismaClient = { game: mockGameMethods };

  // Return a mock class that returns the mock client instance when instantiated
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Now import other modules
import { GameService } from "../GameService";
// Import only types needed; GameState here is an interface, not the enum used by the service
import { Game, GameType } from "@/types/game";
// PrismaClient import is now effectively mocked
import { PrismaClient } from "@prisma/client"; // Import the mocked class type

// Mock data representing the *DATABASE* model structure
// Use string literals for state, matching likely DB values
const mockDbGameData = {
  id: "game-1",
  player1Id: "player-1",
  player2Id: "player-2",
  type: GameType.SINGLES,
  tableId: "table-1",
  venueId: "venue-1",
  state: "SCHEDULED", // Use string literal
  createdAt: new Date(),
  updatedAt: new Date(),
  player1Score: null,
  player2Score: null,
  winnerId: null,
  endedAt: null,
};

describe("GameService", () => {
  // let gameService: GameService; // Declare service instance - Removed
  let mockedPrismaClientInstance: any; // Declare variable for mocked client instance

  beforeEach(() => {
    jest.clearAllMocks();
    // Instantiate the service - Removed
    // gameService = new GameService();
    // Get the most recent instance of the mocked PrismaClient created by the service
    // This assumes GameService creates a new client in its constructor or method calls
    // This part might need adjustment depending on when the PrismaClient is instantiated in the service
    mockedPrismaClientInstance = (PrismaClient as jest.Mock).mock.instances[0];

    // Ensure the mock methods on this instance are correctly structured before clearing
    if (mockedPrismaClientInstance && mockedPrismaClientInstance.game) {
        mockedPrismaClientInstance.game.create.mockClear();
        mockedPrismaClientInstance.game.findUnique.mockClear();
        mockedPrismaClientInstance.game.findMany.mockClear();
        mockedPrismaClientInstance.game.update.mockClear();
        mockedPrismaClientInstance.game.delete.mockClear();
    } else {
        // Log a warning or throw an error if the mock structure is unexpected
        // This warning might be expected if PrismaClient is instantiated within static methods
        console.warn("Mocked Prisma client instance or game property is undefined.", mockedPrismaClientInstance);
    }
  });

  describe("createGame", () => {
    it("should create a new game with correct parameters", async () => {
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.create.mockResolvedValue(mockDbGameData);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.createGame(
        "player-1",
        "player-2",
        GameType.SINGLES,
        "table-1",
        "venue-1"
      );

      expect(result).toEqual(mockDbGameData);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          player1Id: "player-1",
          player2Id: "player-2",
          type: GameType.SINGLES,
          tableId: "table-1",
          venueId: "venue-1",
          state: "SCHEDULED", // Expect service to use string literal internally?
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getGame", () => {
    it("should return a game by id", async () => {
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.findUnique.mockResolvedValue(mockDbGameData);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.getGame("game-1");

      expect(result).toEqual(mockDbGameData);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.findUnique).toHaveBeenCalledWith({ where: { id: "game-1" } });
    });

    it("should return null if game not found", async () => {
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.findUnique.mockResolvedValue(null);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.getGame("not-found");

      expect(result).toBeNull();
    });
  });

  describe("updateGameState", () => {
    it("should update game state using string literals", async () => {
      const expectedState = "IN_PROGRESS"; // Use string literal
      const expectedGame = { ...mockDbGameData, state: expectedState };
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.update.mockResolvedValue(expectedGame);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.updateGameState("game-1", expectedState as any);

      expect(result).toEqual(expectedGame);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.update).toHaveBeenCalledWith({
        where: { id: "game-1" },
        data: {
          state: expectedState, // Expect string literal
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("updateGameScore", () => {
    it("should update game score, winner, and state", async () => {
      const expectedGame = {
        ...mockDbGameData,
        player1Score: 5,
        player2Score: 3,
        winnerId: "player-1",
        state: "COMPLETED", // Expect service to set this string literal state
        endedAt: expect.any(Date)
      };
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.update.mockResolvedValue(expectedGame);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.updateGameScore("game-1", 5, 3, "player-1");

      expect(result).toEqual(expectedGame);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.update).toHaveBeenCalledWith({
        where: { id: "game-1" },
        data: {
          player1Score: 5,
          player2Score: 3,
          winnerId: "player-1",
          state: "COMPLETED", // Expect service sets this string literal
          endedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("getPlayerGames", () => {
    it("should return games for a player based on player1Id or player2Id", async () => {
      const playerGames = [mockDbGameData];
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.findMany.mockResolvedValue(playerGames);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.getPlayerGames("player-1");

      expect(result).toEqual(playerGames);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ player1Id: "player-1" }, { player2Id: "player-1" }],
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getActiveGames", () => {
    it("should return active games for a venue based on state strings", async () => {
      const activeGames = [mockDbGameData];
      mockDbGameData.state = "IN_PROGRESS"; // Set state for mock data
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.findMany.mockResolvedValue(activeGames);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.getActiveGames("venue-1");

      expect(result).toEqual(activeGames);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.findMany).toHaveBeenCalledWith({
        where: {
          state: {
            in: ["SCHEDULED", "IN_PROGRESS"], // Use string literals
          },
          venueId: "venue-1",
        },
        orderBy: { createdAt: "asc" },
      });
      mockDbGameData.state = "SCHEDULED"; // Reset mock data state
    });
  });

  describe("getTableGames", () => {
    it("should return games for a table", async () => {
      const tableGames = [mockDbGameData];
      // Use the instance to mock the method
      mockedPrismaClientInstance.game.findMany.mockResolvedValue(tableGames);

      // Call the service method on the instantiated service - Corrected to static call
      const result = await GameService.getTableGames("table-1");

      expect(result).toEqual(tableGames);
      // Use the instance to check if the method was called
      expect(mockedPrismaClientInstance.game.findMany).toHaveBeenCalledWith({
        where: { tableId: "table-1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
