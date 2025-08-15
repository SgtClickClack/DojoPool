import { EventEmitter } from 'events';
import AdvancedMatchCommentaryService, { CommentaryEvent, CommentaryMetrics } from '../../services/ai/AdvancedMatchCommentaryService';
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

describe('AdvancedMatchCommentaryService', () => {
  let service: AdvancedMatchCommentaryService;
  let mockEventEmitter: EventEmitter;

  beforeEach(() => {
    AdvancedMatchCommentaryService.resetInstance();
    vi.clearAllMocks();
    // Reset mockSocket spies before each test
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.connect.mockClear();
    mockSocket.disconnect.mockClear();
    service = AdvancedMatchCommentaryService.getInstance();
    mockEventEmitter = new EventEmitter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AdvancedMatchCommentaryService.getInstance();
      const instance2 = AdvancedMatchCommentaryService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should initialize with connected state', () => {
      expect(service.getConnectionStatus()).toBe(true);
    });

    it('should handle connection events', () => {
      const connectSpy = vi.spyOn(service, 'emit');
      // Find the handler registered for 'connect' and call it
      const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'connect')?.[1];
      if (connectHandler) connectHandler();
      expect(connectSpy).toHaveBeenCalledWith('connected');
    });

    it('should handle disconnection events', () => {
      const disconnectSpy = vi.spyOn(service, 'emit');
      // Find the handler registered for 'disconnect' and call it
      const disconnectHandler = mockSocket.on.mock.calls.find(([event]) => event === 'disconnect')?.[1];
      if (disconnectHandler) disconnectHandler();
      expect(disconnectSpy).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('Commentary Generation', () => {
    it('should generate commentary for shot events', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        style: 'professional',
        confidence: 85,
        context: { power: 95, accuracy: 88 }
      };

      const commentary = await service.generateCommentary(event, 'professional');
      
      expect(commentary).toBeDefined();
      expect(commentary.id).toBeDefined();
      expect(commentary.matchId).toBe('match1');
      expect(commentary.timestamp).toBeInstanceOf(Date);
      expect(commentary.eventType).toBe('shot');
      expect(commentary.playerId).toBe('player1');
      expect(commentary.playerName).toBe('John Smith');
      expect(commentary.description).toBe('Powerful break shot');
      expect(commentary.commentary).toContain('John Smith');
      expect(commentary.style).toBeDefined();
      expect(commentary.confidence).toBeGreaterThan(0);
      expect(commentary.confidence).toBeLessThanOrEqual(100);
      expect(commentary.context).toEqual({ power: 95, accuracy: 88 });
      expect(commentary.highlights).toBeInstanceOf(Array);
      expect(commentary.insights).toBeInstanceOf(Array);
      expect(commentary.reactions).toBeInstanceOf(Array);
    });

    it('should generate commentary for foul events', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'foul' as const,
        playerId: 'player2',
        playerName: 'Mike Johnson',
        description: 'Foul called',
        style: 'professional',
        confidence: 90,
        context: { reason: 'illegal shot' }
      };

      const commentary = await service.generateCommentary(event, 'professional');
      
      expect(commentary.eventType).toBe('foul');
      expect(commentary.playerName).toBe('Mike Johnson');
      expect(commentary.commentary).toContain('Mike Johnson');
      expect(commentary.context.reason).toBe('illegal shot');
    });

    it('should generate commentary for score events', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'score' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Point scored',
        style: 'professional',
        confidence: 88,
        context: { score: '15-12' }
      };

      const commentary = await service.generateCommentary(event, 'professional');
      
      expect(commentary.eventType).toBe('score');
      expect(commentary.commentary).toContain('John Smith');
      expect(commentary.context.score).toBe('15-12');
    });

    it('should generate commentary for highlight events', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'highlight' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Incredible play',
        style: 'professional',
        confidence: 92,
        context: { description: 'Amazing shot' }
      };

      const commentary = await service.generateCommentary(event, 'professional');
      
      expect(commentary.eventType).toBe('highlight');
      expect(commentary.commentary).toContain('Incredible play');
    });
  });

  describe('Commentary Styles', () => {
    it('should apply enthusiastic style', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'enthusiastic',
        confidence: 90
      };

      const commentary = await service.generateCommentary(event, 'enthusiastic');
      expect(commentary.style).toBe('enthusiastic');
      expect(commentary.commentary).toMatch(/🎯|🔥|WOW|AMAZING|INCREDIBLE/i);
    });

    it('should apply analytical style', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'analytical',
        confidence: 90
      };

      const commentary = await service.generateCommentary(event, 'analytical');
      expect(commentary.style).toBe('analytical');
      expect(commentary.commentary).toMatch(/📊|Analysis|statistics|data/i);
    });

    it('should apply professional style', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'professional',
        confidence: 90
      };

      const commentary = await service.generateCommentary(event, 'professional');
      expect(commentary.style).toBe('professional');
      expect(commentary.commentary).toMatch(/excellent|masterful|textbook/i);
    });
  });

  describe('Event Management', () => {
    it('should get events by match ID', () => {
      const events = service.getEventsByMatch('match1');
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].matchId).toBe('match1');
    });

    it('should get events by player ID', () => {
      const events = service.getEventsByPlayerId('player1');
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].playerId).toBe('player1');
    });

    it('should get events by type', () => {
      const events = service.getEventsByType('shot');
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('shot');
    });

    it('should get recent events', () => {
      const events = service.getRecentEvents(10);
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeLessThanOrEqual(10);
    });

    it('should get all events', () => {
      const events = service.getEvents();
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics and Analytics', () => {
    it('should get commentary metrics', () => {
      const metrics = service.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.eventsByType).toBeDefined();
      expect(metrics.averageConfidence).toBeGreaterThan(0);
      expect(metrics.reactionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.highlightRate).toBeGreaterThanOrEqual(0);
      expect(metrics.insightRate).toBeGreaterThanOrEqual(0);
      expect(metrics.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.lastEvent).toBeInstanceOf(Date);
      expect(metrics.activeMatches).toBeGreaterThanOrEqual(0);
      expect(metrics.popularStyles).toBeDefined();
    });

    it('should update metrics when new events are added', async () => {
      const initialMetrics = service.getMetrics();
      const initialTotalEvents = initialMetrics.totalEvents;

      const event = {
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Test shot',
        context: { power: 80, accuracy: 85 }
      };

      await service.generateCommentary(event);
      
      const updatedMetrics = service.getMetrics();
      expect(updatedMetrics.totalEvents).toBe(initialTotalEvents + 1);
    });
  });

  describe('Reactions and Engagement', () => {
    it('should add reactions to events', async () => {
      const eventId = 'event1';
      const reaction = {
        userId: 'user1',
        userName: 'Fan1',
        type: 'like' as const
      };

      await service.addReaction(eventId, reaction);
      
      const reactions = service.getReactions(eventId);
      expect(reactions).toContainEqual(expect.objectContaining(reaction));
    });

    it('should get popular events', () => {
      // Add events with reactions
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'professional',
        confidence: 90
      };
      service.generateCommentary(event, 'professional');
      const popularEvents = service.getPopularEvents(5);
      expect(popularEvents).toBeInstanceOf(Array);
      expect(popularEvents.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit events when commentary is generated', async () => {
      const emitSpy = vi.spyOn(service, 'emit');
      const socketEmitSpy = vi.spyOn(mockSocket, 'emit');
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'professional',
        confidence: 90
      };
      await service.generateCommentary(event, 'professional');
      expect(emitSpy).toHaveBeenCalledWith('commentaryGenerated', expect.any(Object));
      expect(socketEmitSpy).toHaveBeenCalledWith('commentary:generated', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const event = {
        matchId: 'match1',
        eventType: 'shot' as const,
        playerId: 'player1',
        playerName: 'John Smith',
        description: 'Powerful break shot',
        context: { power: 95, accuracy: 88 },
        style: 'professional',
        confidence: 90
      };
      await expect(service.generateCommentary(event, 'professional')).resolves.toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should update commentary style', () => {
      service.updateStyle('professional');
      expect(service.getCurrentStyle()).toBe('professional');
    });

    it('should update language', () => {
      service.updateLanguage('es');
      expect(service.getCurrentLanguage()).toBe('es');
    });

    it('should get styles', () => {
      const styles = service.getStyles();
      expect(styles).toBeInstanceOf(Array);
      expect(styles.length).toBeGreaterThan(0);
    });

    it('should get style by ID', () => {
      const style = service.getStyleById('professional');
      expect(style).toBeDefined();
      expect(style?.id).toBe('professional');
    });

    it('should get configuration', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
    });
  });
}); 