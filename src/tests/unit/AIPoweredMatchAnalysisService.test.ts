import { AIPoweredMatchAnalysisService, ShotType } from '../../services/ai/AIPoweredMatchAnalysisService';
import { vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })
}));

describe('AIPoweredMatchAnalysisService', () => {
  let service: AIPoweredMatchAnalysisService;

  beforeEach(() => {
    service = AIPoweredMatchAnalysisService.getInstance();
  });

  it('should be a singleton', () => {
    const s2 = AIPoweredMatchAnalysisService.getInstance();
    expect(service).toBe(s2);
  });

  it('should start match analysis and store initial state', async () => {
    await service.startMatchAnalysis('match1', 'p1', 'p2');
    const analysis = service.getAnalysisByMatchId('match1');
    expect(analysis).toBeDefined();
    expect(analysis?.matchId).toBe('match1');
    expect(analysis?.player1Id).toBe('p1');
    expect(analysis?.player2Id).toBe('p2');
  });

  it('should process shot data and update shot history', async () => {
    await service.startMatchAnalysis('match2', 'p1', 'p2');
    const shotData = {
      shotId: 'shot1',
      timestamp: Date.now(),
      playerId: 'p1',
      matchId: 'match2',
      ballPositions: {
        cueBall: { x: 0, y: 0 },
        targetBall: { x: 1, y: 1 },
      },
      success: true
    };
    const analysis = await service.processShotData(shotData);
    expect(analysis).toBeDefined();
    expect(analysis.shotId).toBe('shot1');
    expect(analysis.playerId).toBe('p1');
    expect(analysis.matchId).toBe('match2');
    expect(typeof analysis.power).toBe('number');
    expect(Object.values(ShotType)).toContain(analysis.shotType);
  });

  it('should provide real-time coaching for a match', async () => {
    await service.startMatchAnalysis('match3', 'p1', 'p2');
    const coaching = await service.provideRealTimeCoaching('match3', 'p1', 'test situation');
    expect(coaching).toBeDefined();
    expect(coaching.matchId).toBe('match3');
    expect(coaching.playerId).toBe('p1');
    expect(typeof coaching.recommendation).toBe('string');
    expect(typeof coaching.confidence).toBe('number');
    expect(Array.isArray(coaching.alternatives)).toBe(true);
  });
}); 