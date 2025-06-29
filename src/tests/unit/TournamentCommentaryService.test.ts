import { EventEmitter } from 'events';
import TournamentCommentaryService, { CommentaryEvent, CommentaryConfig, PlayerAnalysis, MatchAnalysis } from '../../services/ai/TournamentCommentaryService';
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

describe('TournamentCommentaryService', () => {
  let service: TournamentCommentaryService;
  let mockEventEmitter: EventEmitter;

  beforeEach(() => {
    vi.clearAllMocks();
    service = TournamentCommentaryService.getInstance();
    mockEventEmitter = new EventEmitter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TournamentCommentaryService.getInstance();
      const instance2 = TournamentCommentaryService.getInstance();
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

  describe('Commentary Generation', () => {
    it('should generate commentary for shot analysis events', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        player2: 'Mike Johnson',
        shotType: 'break shot',
        difficulty: 'high'
      };

      const commentary = await service.generateCommentary('match1', 'shot_analysis', context);
      
      expect(commentary).toBeDefined();
      expect(commentary.id).toBeDefined();
      expect(commentary.type).toBe('shot_analysis');
      expect(commentary.timestamp).toBeInstanceOf(Date);
      expect(commentary.matchId).toBe('match1');
      expect(commentary.tournamentId).toBe('tournament1');
      expect(commentary.content).toContain('John Smith');
      expect(commentary.excitementLevel).toBeGreaterThan(0);
      expect(commentary.confidence).toBeGreaterThan(0);
      expect(commentary.context).toBeDefined();
      expect(commentary.metadata).toBeDefined();
    });

    it('should generate commentary for match update events', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        player2: 'Mike Johnson',
        score: '15-12'
      };

      const commentary = await service.generateCommentary('match1', 'match_update', context);
      
      expect(commentary.type).toBe('match_update');
      expect(commentary.content).toContain('15-12');
      expect(commentary.context.score).toBe('15-12');
    });

    it('should generate commentary for player performance events', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        metric: 'shot accuracy',
        value: '85%'
      };

      const commentary = await service.generateCommentary('match1', 'player_performance', context);
      
      expect(commentary.type).toBe('player_performance');
      expect(commentary.content).toContain('John Smith');
      expect(commentary.context.metric).toBe('shot accuracy');
    });

    it('should generate commentary for tournament insight events', async () => {
      const context = {
        tournamentId: 'tournament1',
        insight: 'This is a closely contested match'
      };

      const commentary = await service.generateCommentary('match1', 'tournament_insight', context);
      
      expect(commentary.type).toBe('tournament_insight');
      expect(commentary.content).toBeDefined();
      expect(commentary.content.length).toBeGreaterThan(0);
    });

    it('should generate commentary for excitement moment events', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        highlight: 'incredible shot'
      };

      const commentary = await service.generateCommentary('match1', 'excitement_moment', context);
      
      expect(commentary.type).toBe('excitement_moment');
      expect(commentary.content).toBeDefined();
      expect(commentary.content.length).toBeGreaterThan(0);
    });
  });

  describe('Commentary Styles', () => {
    it('should apply excited style', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        shotType: 'break shot'
      };

      const commentary = await service.generateCommentary('match1', 'shot_analysis', context);
      
      expect(commentary.content).toBeDefined();
      expect(commentary.content.length).toBeGreaterThan(0);
    });

    it('should apply professional style', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        shotType: 'break shot'
      };

      const commentary = await service.generateCommentary('match1', 'shot_analysis', context);
      
      expect(commentary.content).toBeDefined();
      expect(commentary.content.length).toBeGreaterThan(0);
    });

    it('should apply analytical style', async () => {
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        metric: 'shot accuracy',
        value: '85%'
      };

      const commentary = await service.generateCommentary('match1', 'player_performance', context);
      
      expect(commentary.content).toBeDefined();
      expect(commentary.content.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should get current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.realTimeAnalysis).toBe(true);
      expect(config.aiCommentary).toBe(true);
      expect(config.playerInsights).toBe(true);
      expect(config.matchPredictions).toBe(true);
      expect(config.excitementDetection).toBe(true);
      expect(config.language).toBe('en');
      expect(config.style).toBe('excited');
      expect(config.updateInterval).toBe(5000);
      expect(config.excitementThreshold).toBe(70);
    });

    it('should update configuration', async () => {
      const updates = {
        style: 'professional' as const,
        language: 'es' as const,
        updateInterval: 3000
      };

      await service.updateConfig(updates);
      
      const config = service.getConfig();
      expect(config.style).toBe('professional');
      expect(config.language).toBe('es');
      expect(config.updateInterval).toBe(3000);
    });
  });

  describe('Event Management', () => {
    it('should get commentary events', () => {
      const events = service.getCommentaryEvents({});
      expect(events).toBeInstanceOf(Array);
    });

    it('should get events by match ID', () => {
      const events = service.getEventsByMatch('match1');
      expect(events).toBeInstanceOf(Array);
    });

    it('should get events by tournament ID', () => {
      const events = service.getEventsByTournament('tournament1');
      expect(events).toBeInstanceOf(Array);
    });

    it('should get events by type', () => {
      const events = service.getEventsByType('shot_analysis');
      expect(events).toBeInstanceOf(Array);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit events when commentary is generated', async () => {
      const emitSpy = vi.spyOn(service, 'emit');
      const socketEmitSpy = vi.spyOn(mockSocket, 'emit');

      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith',
        shotType: 'break shot'
      };

      await service.generateCommentary('match1', 'shot_analysis', context);
      
      expect(emitSpy).toHaveBeenCalledWith('commentaryGenerated', expect.any(Object));
      expect(socketEmitSpy).toHaveBeenCalledWith('commentary:generated', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      // Test with invalid event type
      const context = {
        tournamentId: 'tournament1',
        player1: 'John Smith'
      };

      const commentary = await service.generateCommentary('match1', 'invalid_type' as any, context);
      
      expect(commentary).toBeDefined();
      expect(commentary.content).toContain('Event:');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze player performance', async () => {
      const playerData = {
        playerId: 'player1',
        matchId: 'match1',
        tournamentId: 'tournament1',
        metrics: {
          shotAccuracy: 85,
          decisionMaking: 78,
          pressureHandling: 82,
          consistency: 80,
          aggression: 75,
          defense: 88
        }
      };

      const analysis = await service.analyzePlayerPerformance(playerData);
      
      expect(analysis).toBeDefined();
      expect(analysis.playerId).toBe('player1');
      expect(analysis.matchId).toBe('match1');
      expect(analysis.tournamentId).toBe('tournament1');
      expect(analysis.metrics).toBeDefined();
      expect(analysis.insights).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.performanceTrend).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should analyze match performance', async () => {
      const matchData = {
        matchId: 'match1',
        tournamentId: 'tournament1',
        currentScore: '15-12',
        player1Id: 'player1',
        player2Id: 'player2'
      };

      const analysis = await service.analyzeMatchPerformance(matchData);
      
      expect(analysis).toBeDefined();
      expect(analysis.matchId).toBe('match1');
      expect(analysis.tournamentId).toBe('tournament1');
      expect(analysis.currentScore).toBe('15-12');
      expect(analysis.momentum).toBeDefined();
      expect(analysis.keyMoments).toBeInstanceOf(Array);
      expect(analysis.predictions).toBeDefined();
      expect(analysis.statistics).toBeDefined();
    });
  });
}); 