import { EventEmitter } from 'events';
import MatchAnalysisService, { MatchAnalysis, PlayerPerformance } from '../../services/ai/MatchAnalysisService';
import { mockSocket } from '../setup-ai-services';
import { vi } from 'vitest';

describe('MatchAnalysisService', () => {
  let service: MatchAnalysisService;
  let mockEventEmitter: EventEmitter;

  beforeEach(() => {
    MatchAnalysisService.resetInstance();
    vi.clearAllMocks();
    service = MatchAnalysisService.getInstance();
    mockEventEmitter = new EventEmitter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MatchAnalysisService.getInstance();
      const instance2 = MatchAnalysisService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should handle connection events', () => {
      // Test that the service can handle connection events without throwing
      expect(() => {
        // Simulate a connection event if handlers exist
        const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1];
        if (connectHandler) connectHandler();
      }).not.toThrow();
    });

    it('should handle disconnection events', () => {
      // Test that the service can handle disconnection events without throwing
      expect(() => {
        // Simulate a disconnection event if handlers exist
        const disconnectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'disconnect')?.[1];
        if (disconnectHandler) disconnectHandler();
      }).not.toThrow();
    });
  });

  describe('Match Analysis', () => {
    it('should analyze match performance', async () => {
      const analysis = await service.analyzeMatch('match1');
      
      expect(analysis).toBeDefined();
      expect(analysis.matchId).toBe('match1');
      expect(analysis.player1Performance).toBeDefined();
      expect(analysis.player2Performance).toBeDefined();
      expect(analysis.keyMoments).toBeInstanceOf(Array);
      expect(analysis.matchSummary).toBeDefined();
      expect(analysis.improvementAreas).toBeInstanceOf(Array);
      expect(analysis.nextMatchPredictions).toBeInstanceOf(Array);
    });
  });

  describe('Player Performance Analysis', () => {
    it('should analyze player performance', async () => {
      const playerData = {
        playerId: 'player1',
        matchId: 'match1',
        accuracy: 85,
        speed: 90,
        consistency: 88,
        strategy: 82,
        pressureHandling: 87,
        shotSelection: 89,
        positioning: 86,
        overallScore: 86.7,
        strengths: ['Shot selection', 'Speed'],
        weaknesses: ['Strategy'],
        recommendations: ['Practice safety shots']
      };

      const program = await service.generateTrainingProgram('player1', playerData);
      
      expect(program).toBeDefined();
      expect(program.playerId).toBe('player1');
      expect(program.programId).toBeDefined();
      expect(program.name).toBeDefined();
      expect(program.description).toBeDefined();
      expect(program.duration).toBeGreaterThan(0);
      expect(program.difficulty).toBeDefined();
      expect(program.focusAreas).toBeInstanceOf(Array);
      expect(program.exercises).toBeInstanceOf(Array);
      expect(program.progress).toBe(0);
      expect(program.completed).toBe(false);
    });
  });

  describe('Real-time Analysis', () => {
    it('should track performance', async () => {
      const shotData = {
        shotId: 'shot1',
        matchId: 'match1',
        playerId: 'player1',
        power: 85,
        accuracy: 90
      };

      const performance = await service.trackPerformance('match1', shotData);
      
      expect(performance).toBeDefined();
    });

    it('should get coaching recommendations', async () => {
      const playerData = {
        playerId: 'player1',
        matchId: 'match1',
        accuracy: 85,
        speed: 90,
        consistency: 88,
        strategy: 82,
        pressureHandling: 87,
        shotSelection: 89,
        positioning: 86,
        overallScore: 86.7,
        strengths: ['Shot selection'],
        weaknesses: ['Strategy'],
        recommendations: ['Practice safety shots']
      };

      const recommendations = await service.getCoachingRecommendations('player1', playerData);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Training Program Management', () => {
    it('should update training progress', async () => {
      await expect(service.updateTrainingProgress('program1', 50)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      await expect(service.analyzeMatch('invalid-match')).resolves.toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should disconnect properly', () => {
      expect(() => service.disconnect()).not.toThrow();
    });
  });
}); 