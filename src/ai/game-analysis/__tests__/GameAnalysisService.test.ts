import { GameAnalysisService } from "../GameAnalysisService";
import { GameEvent } from "../../types/game";

describe("GameAnalysisService", () => {
  let service: GameAnalysisService;
  let mockEvent: GameEvent;

  beforeEach(() => {
    service = new GameAnalysisService();
    mockEvent = {
      playerId: "player1",
      shotType: "straight",
      success: true,
      accuracy: 0.85,
      duration: 2000,
      timestamp: Date.now(),
    };
  });

  describe("Game Initialization", () => {
    it("should initialize game with two players", () => {
      service.initializeGame("player1", "player2");
      const gameState = service.getGameState();

      expect(gameState.currentPlayer).toBe("player1");
      expect(gameState.status).toBe("in_progress");
      expect(gameState.score).toEqual({ player1: 0, player2: 0 });
    });

    it("should create initial player stats for both players", () => {
      service.initializeGame("player1", "player2");
      const player1Stats = service.getPlayerStats("player1");
      const player2Stats = service.getPlayerStats("player2");

      expect(player1Stats).toBeDefined();
      expect(player2Stats).toBeDefined();
      expect(player1Stats?.shotsTaken).toBe(0);
      expect(player1Stats?.successfulShots).toBe(0);
      expect(player1Stats?.averageAccuracy).toBe(0);
    });
  });

  describe("Game State Updates", () => {
    beforeEach(() => {
      service.initializeGame("player1", "player2");
    });

    it("should update game state after successful shot", () => {
      service.updateGameState(mockEvent);
      const gameState = service.getGameState();

      expect(gameState.turn).toBe(1);
      expect(gameState.score.player1).toBe(1);
      expect(gameState.currentPlayer).toBe("player2");
    });

    it("should update game state after failed shot", () => {
      const failedEvent = { ...mockEvent, success: false };
      service.updateGameState(failedEvent);
      const gameState = service.getGameState();

      expect(gameState.turn).toBe(1);
      expect(gameState.score.player1).toBe(0);
      expect(gameState.currentPlayer).toBe("player2");
    });

    it("should end game when score reaches 8", () => {
      // Simulate player1 scoring 8 times
      for (let i = 0; i < 8; i++) {
        service.updateGameState(mockEvent);
        // Alternate players
        mockEvent.playerId =
          mockEvent.playerId === "player1" ? "player2" : "player1";
      }

      const gameState = service.getGameState();
      expect(gameState.status).toBe("completed");
    });
  });

  describe("Player Statistics", () => {
    beforeEach(() => {
      service.initializeGame("player1", "player2");
    });

    it("should track successful shots", () => {
      service.updateGameState(mockEvent);
      const stats = service.getPlayerStats("player1");

      expect(stats?.successfulShots).toBe(1);
      expect(stats?.shotsTaken).toBe(1);
    });

    it("should track shot streaks", () => {
      // Three successful shots
      for (let i = 0; i < 3; i++) {
        service.updateGameState(mockEvent);
      }

      const stats = service.getPlayerStats("player1");
      expect(stats?.currentStreak).toBe(3);
      expect(stats?.longestStreak).toBe(3);

      // One failed shot
      const failedEvent = { ...mockEvent, success: false };
      service.updateGameState(failedEvent);

      const updatedStats = service.getPlayerStats("player1");
      expect(updatedStats?.currentStreak).toBe(0);
      expect(updatedStats?.longestStreak).toBe(3);
    });

    it("should track preferred shot types", () => {
      // Two straight shots
      service.updateGameState(mockEvent);
      service.updateGameState(mockEvent);

      // One cut shot
      const cutShot = { ...mockEvent, shotType: "cut" };
      service.updateGameState(cutShot);

      const stats = service.getPlayerStats("player1");
      expect(stats?.preferredShotTypes.get("straight")).toBe(2);
      expect(stats?.preferredShotTypes.get("cut")).toBe(1);
    });

    it("should identify weaknesses", () => {
      const poorShot = { ...mockEvent, success: false, accuracy: 0.3 };
      service.updateGameState(poorShot);

      const stats = service.getPlayerStats("player1");
      expect(stats?.weaknesses.has("straight")).toBe(true);
    });
  });

  describe("Match Statistics", () => {
    beforeEach(() => {
      service.initializeGame("player1", "player2");
    });

    it("should track total shots and success rate", () => {
      // Two successful shots
      service.updateGameState(mockEvent);
      service.updateGameState(mockEvent);

      // One failed shot
      const failedEvent = { ...mockEvent, success: false };
      service.updateGameState(failedEvent);

      const matchStats = service.getMatchStats();
      expect(matchStats.totalShots).toBe(3);
      expect(matchStats.successfulShots).toBe(2);
    });

    it("should calculate average shot time", () => {
      const shortShot = { ...mockEvent, duration: 1000 };
      const longShot = { ...mockEvent, duration: 3000 };

      service.updateGameState(shortShot);
      service.updateGameState(longShot);

      const matchStats = service.getMatchStats();
      expect(matchStats.averageShotTime).toBe(2000);
    });

    it("should track match streaks", () => {
      // Three successful shots
      for (let i = 0; i < 3; i++) {
        service.updateGameState(mockEvent);
        mockEvent.playerId =
          mockEvent.playerId === "player1" ? "player2" : "player1";
      }

      const matchStats = service.getMatchStats();
      expect(matchStats.currentStreak).toBe(3);
      expect(matchStats.longestStreak).toBe(3);

      // One failed shot
      const failedEvent = { ...mockEvent, success: false };
      service.updateGameState(failedEvent);

      const updatedStats = service.getMatchStats();
      expect(updatedStats.currentStreak).toBe(0);
      expect(updatedStats.longestStreak).toBe(3);
    });
  });

  describe("Event History", () => {
    beforeEach(() => {
      service.initializeGame("player1", "player2");
    });

    it("should maintain event history", () => {
      service.updateGameState(mockEvent);
      const failedEvent = { ...mockEvent, success: false };
      service.updateGameState(failedEvent);

      const history = service.getEventHistory();
      expect(history.length).toBe(2);
      expect(history[0].success).toBe(true);
      expect(history[1].success).toBe(false);
    });

    it("should preserve event order", () => {
      const events = [
        { ...mockEvent, timestamp: 1000 },
        { ...mockEvent, timestamp: 2000 },
        { ...mockEvent, timestamp: 3000 },
      ];

      events.forEach((event) => service.updateGameState(event));
      const history = service.getEventHistory();

      expect(history[0].timestamp).toBe(1000);
      expect(history[1].timestamp).toBe(2000);
      expect(history[2].timestamp).toBe(3000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid player IDs", () => {
      service.initializeGame("player1", "player2");
      const invalidEvent = { ...mockEvent, playerId: "invalid" };

      service.updateGameState(invalidEvent);
      const stats = service.getPlayerStats("invalid");
      expect(stats).toBeUndefined();
    });

    it("should handle game updates before initialization", () => {
      service.updateGameState(mockEvent);
      const gameState = service.getGameState();

      expect(gameState.status).toBe("waiting");
      expect(gameState.turn).toBe(0);
    });

    it("should handle multiple consecutive shots by same player", () => {
      service.initializeGame("player1", "player2");

      // Two shots by player1
      service.updateGameState(mockEvent);
      service.updateGameState(mockEvent);

      const gameState = service.getGameState();
      expect(gameState.currentPlayer).toBe("player2");
    });
  });
});
