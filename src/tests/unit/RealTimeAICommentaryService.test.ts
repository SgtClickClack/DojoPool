import { realTimeAICommentaryService } from '../../services/ai/RealTimeAICommentaryService';
import { vi } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  }))
}));

describe('RealTimeAICommentaryService', () => {
  let service: typeof realTimeAICommentaryService;

  beforeEach(() => {
    service = realTimeAICommentaryService;
    // Clear events and state for isolation
    (service as any).events = [];
    (service as any).activeMatches = new Set();
    (service as any).matchCommentary = new Map();
    (service as any).metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsByGod: {},
      averageConfidence: 0,
      reactionRate: 0,
      highlightRate: 0,
      insightRate: 0,
      blessingRate: 0,
      responseTime: 0,
      accuracy: 0,
      lastEvent: new Date(),
      activeMatches: 0,
      popularStyles: {},
      audioGenerated: 0
    };
  });

  afterEach(() => {
    // Clear events and state for isolation
    (service as any).events = [];
    (service as any).activeMatches = new Set();
    (service as any).matchCommentary = new Map();
  });

  it('should initialize as singleton', () => {
    const instance1 = realTimeAICommentaryService;
    const instance2 = realTimeAICommentaryService;
    expect(instance1).toBe(instance2);
  });

  it('should handle shot events', async () => {
    await service.handleShotEvent({
      matchId: 'match-1',
      playerId: 'player-1',
      playerName: 'John Doe',
      shotType: 'bank',
      difficulty: 8,
      success: true
    });
    const events = service.getEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should handle foul events', async () => {
    await service.handleFoulEvent({
      matchId: 'match-2',
      playerId: 'player-2',
      playerName: 'Jane Smith',
      foulType: 'scratch',
      severity: 'minor'
    });
    const events = service.getEvents();
    expect(events.some(e => e.eventType === 'foul')).toBe(true);
  });

  it('should handle score events', async () => {
    await service.handleScoreEvent({
      matchId: 'match-3',
      playerId: 'player-3',
      playerName: 'Alice',
      points: 5,
      totalScore: 10,
      gameState: 'winning'
    });
    const events = service.getEvents();
    expect(events.some(e => e.eventType === 'score')).toBe(true);
  });

  it('should handle game end events', async () => {
    await service.handleGameEndEvent({
      matchId: 'match-4',
      winnerId: 'player-4',
      winnerName: 'Bob',
      finalScore: { 'player-4': 21, 'player-5': 19 },
      duration: 1200,
      highlights: ['clutch shot']
    });
    const events = service.getEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should handle general match events', async () => {
    await service.handleMatchEvent({
      matchId: 'match-5',
      eventType: 'turnover',
      playerId: 'player-5',
      description: 'Missed shot'
    });
    const events = service.getEvents();
    // The service does not generate events for generic match events
    expect(events.length).toBe(0);
  });

  it('should generate territory commentary', async () => {
    await service.generateTerritoryCommentary({
      territoryId: 'territory-1',
      territoryName: 'Jade Tiger',
      playerId: 'player-1',
      playerName: 'John Doe',
      action: 'captured'
    });
    const events = service.getEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should generate territory capture commentary', async () => {
    await service.generateTerritoryCaptureCommentary({
      territoryId: 'territory-2',
      territoryName: 'Emerald Dragon',
      previousOwner: 'player-2',
      newOwner: 'player-1',
      matchId: 'match-6'
    });
    const events = service.getEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should generate trophy commentary', async () => {
    await service.generateTrophyCommentary({
      trophyId: 'trophy-1',
      trophyName: 'Championship Trophy',
      playerId: 'player-1',
      playerName: 'John Doe',
      rarity: 'legendary'
    });
    const events = service.getEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should get events by match', async () => {
    await service.handleShotEvent({
      matchId: 'match-7',
      playerId: 'player-7',
      playerName: 'Eve',
      shotType: 'jump',
      difficulty: 7,
      success: true
    });
    const matchEvents = service.getEventsByMatch('match-7');
    expect(matchEvents.length).toBeGreaterThan(0);
    matchEvents.forEach(event => {
      expect(event.matchId).toBe('match-7');
    });
  });

  it('should get events by god', async () => {
    await service.handleFoulEvent({
      matchId: 'match-8',
      playerId: 'player-8',
      playerName: 'Frank',
      foulType: 'scratch',
      severity: 'major'
    });
    const godEvents = service.getEventsByGod('ai-umpire');
    expect(Array.isArray(godEvents)).toBe(true);
  });

  it('should return current configuration', () => {
    const config = service.getConfig();
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
    expect(config.poolGods.length).toBeGreaterThan(0);
  });

  it('should return metrics after events', async () => {
    await service.handleShotEvent({
      matchId: 'match-9',
      playerId: 'player-9',
      playerName: 'Grace',
      shotType: 'kick',
      difficulty: 6,
      success: true
    });
    const metrics = service.getMetrics();
    expect(metrics.totalEvents).toBeGreaterThan(0);
    expect(metrics.lastEvent).toBeInstanceOf(Date);
  });

  it('should return connection status', () => {
    const isConnected = service.getConnectionStatus();
    expect(typeof isConnected).toBe('boolean');
  });

  it('should not throw on disconnect', () => {
    expect(() => service.disconnect()).not.toThrow();
  });

  it('should handle invalid event data gracefully', async () => {
    await expect(service.handleMatchEvent(null)).resolves.not.toThrow();
  });

  it('should handle missing player info', async () => {
    await expect(service.handleMatchEvent({ matchId: 'match-10', eventType: 'shot' })).resolves.not.toThrow();
  });

  it('should calculate metadata correctly', () => {
    const poolGod = service.getPoolGods()[0];
    const metadata = (service as any).calculateMetadata({ difficulty: 8, success: true, impact: 'high', rarity: 'rare' }, poolGod);
    expect(metadata).toBeDefined();
    // The service uses a fallback value of 50 for difficulty if not mapped
    expect(metadata.difficulty).toBe(50);
    expect(metadata.rarity).toBeDefined();
  });
}); 