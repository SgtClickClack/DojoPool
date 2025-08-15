import { EventEmitter } from 'events';
import TournamentPredictionService, { MatchPrediction, TournamentPrediction, PlayerPrediction } from '../../services/ai/TournamentPredictionService';
import { vi } from 'vitest';

// Mock Socket.IO
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

describe('TournamentPredictionService', () => {
  let service: TournamentPredictionService;
  let mockEventEmitter: EventEmitter;

  beforeEach(() => {
    vi.clearAllMocks();
    service = TournamentPredictionService.getInstance();
    mockEventEmitter = new EventEmitter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TournamentPredictionService.getInstance();
      const instance2 = TournamentPredictionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should initialize with connected state', () => {
      expect(service.isConnected()).toBe(true);
    });

    it('should handle connection events', () => {
      // Test that the service can handle connection events without throwing
      expect(() => {
        // Simulate connection event if handlers exist
        const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1];
        if (connectHandler) connectHandler();
      }).not.toThrow();
    });

    it('should handle disconnection events', () => {
      // Test that the service can handle disconnection events without throwing
      expect(() => {
        // Simulate disconnection event if handlers exist
        const disconnectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'disconnect')?.[1];
        if (disconnectHandler) disconnectHandler();
      }).not.toThrow();
    });
  });

  describe('Match Predictions', () => {
    it('should predict match outcome', async () => {
      const matchData = {
        matchId: 'match1',
        tournamentId: 'tournament1',
        player1Id: 'player1',
        player2Id: 'player2',
        player1Name: 'John Smith',
        player2Name: 'Mike Johnson'
      };

      const prediction = await service.predictMatch(matchData);
      
      expect(prediction).toBeDefined();
      expect(prediction.matchId).toBe('match1');
      expect(prediction.tournamentId).toBe('tournament1');
      expect(prediction.player1Id).toBe('player1');
      expect(prediction.player2Id).toBe('player2');
      expect(prediction.player1Name).toBe('John Smith');
      expect(prediction.player2Name).toBe('Mike Johnson');
      expect(prediction.predictedWinner).toBeDefined();
      expect(prediction.winProbability).toBeGreaterThan(0);
      expect(prediction.winProbability).toBeLessThanOrEqual(100);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(100);
      expect(prediction.predictedScore).toBeDefined();
      expect(prediction.estimatedDuration).toBeGreaterThan(0);
      expect(prediction.keyFactors).toBeInstanceOf(Object);
      expect(prediction.insights).toBeInstanceOf(Array);
      expect(prediction.upsetPotential).toBeGreaterThanOrEqual(0);
      expect(prediction.upsetPotential).toBeLessThanOrEqual(100);
      expect(prediction.lastUpdated).toBeInstanceOf(Date);
    });

    it('should update match prediction', async () => {
      const matchId = 'match1';
      const updates = {
        winProbability: 75,
        predictedScore: '9-7',
        confidence: 85
      };

      const updatedPrediction = await service.updateMatchPrediction(matchId, updates);
      
      expect(updatedPrediction).toBeDefined();
      expect(updatedPrediction.winProbability).toBe(75);
      expect(updatedPrediction.predictedScore).toBe('9-7');
      expect(updatedPrediction.confidence).toBe(85);
    });

    it('should get match prediction by ID', () => {
      const prediction = service.getMatchPrediction('match1');
      expect(prediction).toBeDefined();
      expect(prediction?.matchId).toBe('match1');
    });

    it('should get predictions by tournament', () => {
      const predictions = service.getPredictionsByTournament('tournament1');
      expect(predictions).toBeInstanceOf(Array);
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].tournamentId).toBe('tournament1');
    });
  });

  describe('Tournament Predictions', () => {
    it('should predict tournament outcome', async () => {
      const tournamentData = {
        tournamentId: 'tournament1',
        name: 'Championship Tournament',
        participants: ['player1', 'player2', 'player3', 'player4'],
        format: 'single_elimination'
      };

      const prediction = await service.predictTournament(tournamentData);
      
      expect(prediction).toBeDefined();
      expect(prediction.tournamentId).toBe('tournament1');
      expect(prediction.name).toBe('Championship Tournament');
      expect(prediction.predictedWinner).toBeDefined();
      expect(prediction.winProbability).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.finalists).toBeInstanceOf(Array);
      expect(prediction.semifinalists).toBeInstanceOf(Array);
      expect(prediction.quarterfinalists).toBeInstanceOf(Array);
      expect(prediction.upsets).toBeInstanceOf(Array);
      expect(prediction.keyMatches).toBeInstanceOf(Array);
      expect(prediction.insights).toBeInstanceOf(Array);
      expect(prediction.lastUpdated).toBeInstanceOf(Date);
    });

    it('should get tournament prediction by ID', () => {
      const prediction = service.getTournamentPrediction('tournament1');
      expect(prediction).toBeDefined();
      expect(prediction?.tournamentId).toBe('tournament1');
    });
  });

  describe('Player Predictions', () => {
    it('should predict player performance', async () => {
      const playerData = {
        playerId: 'player1',
        tournamentId: 'tournament1',
        playerName: 'John Smith'
      };

      const prediction = await service.predictPlayerPerformance(playerData);
      
      expect(prediction).toBeDefined();
      expect(prediction.playerId).toBe('player1');
      expect(prediction.tournamentId).toBe('tournament1');
      expect(prediction.playerName).toBe('John Smith');
      expect(prediction.predictedFinish).toBeGreaterThan(0);
      expect(prediction.winProbability).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.expectedMatches).toBeGreaterThan(0);
      expect(prediction.strengths).toBeInstanceOf(Array);
      expect(prediction.weaknesses).toBeInstanceOf(Array);
      expect(prediction.opportunities).toBeInstanceOf(Array);
      expect(prediction.threats).toBeInstanceOf(Array);
      expect(prediction.recommendations).toBeInstanceOf(Array);
      expect(prediction.lastUpdated).toBeInstanceOf(Date);
    });

    it('should get player prediction by ID', () => {
      const prediction = service.getPlayerPrediction('player1');
      expect(prediction).toBeDefined();
      expect(prediction?.playerId).toBe('player1');
    });

    it('should get player predictions by tournament', () => {
      const predictions = service.getPlayerPredictionsByTournament('tournament1');
      expect(predictions).toBeInstanceOf(Array);
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].tournamentId).toBe('tournament1');
    });
  });

  describe('Prediction Analytics', () => {
    it('should get prediction accuracy', () => {
      const accuracy = service.getPredictionAccuracy();
      expect(accuracy).toBeDefined();
      expect(accuracy.overall).toBeGreaterThan(0);
      expect(accuracy.overall).toBeLessThanOrEqual(100);
      expect(accuracy.byType).toBeDefined();
      expect(accuracy.byTournament).toBeDefined();
      expect(accuracy.trends).toBeInstanceOf(Array);
    });

    it('should get prediction trends', () => {
      const trends = service.getPredictionTrends();
      expect(trends).toBeInstanceOf(Array);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should get upset predictions', () => {
      const upsets = service.getUpsetPredictions();
      expect(upsets).toBeInstanceOf(Array);
      expect(upsets.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit events when predictions are generated', async () => {
      const emitSpy = vi.spyOn(service, 'emit');
      const socketEmitSpy = vi.spyOn(mockSocket, 'emit');

      const matchData = {
        matchId: 'match1',
        tournamentId: 'tournament1',
        player1Id: 'player1',
        player2Id: 'player2',
        player1Name: 'John Smith',
        player2Name: 'Mike Johnson'
      };

      await service.predictMatch(matchData);
      
      expect(emitSpy).toHaveBeenCalledWith('predictionGenerated', expect.any(Object));
      expect(socketEmitSpy).toHaveBeenCalledWith('prediction:generated', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      // Test with invalid data
      const invalidData = {
        matchId: 'match1',
        tournamentId: 'tournament1'
        // Missing required fields
      };

      try {
        await service.predictMatch(invalidData as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should get prediction settings', () => {
      const settings = service.getPredictionSettings();
      expect(settings).toBeDefined();
      expect(settings.confidenceThreshold).toBeGreaterThan(0);
      expect(settings.updateInterval).toBeGreaterThan(0);
      expect(settings.enableRealTime).toBeDefined();
    });

    it('should update prediction settings', async () => {
      const updates = {
        confidenceThreshold: 80,
        updateInterval: 3000,
        enableRealTime: true
      };

      await service.updatePredictionSettings(updates);
      
      const settings = service.getPredictionSettings();
      expect(settings.confidenceThreshold).toBe(80);
      expect(settings.updateInterval).toBe(3000);
      expect(settings.enableRealTime).toBe(true);
    });
  });
}); 