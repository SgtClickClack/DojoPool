import AdvancedMatchAnalysisService from '../../services/ai/AdvancedMatchAnalysisService';
import { vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe('AdvancedMatchAnalysisService', () => {
  let service: AdvancedMatchAnalysisService;

  beforeEach(() => {
    service = AdvancedMatchAnalysisService.getInstance();
  });

  it('should be a singleton', () => {
    const s2 = AdvancedMatchAnalysisService.getInstance();
    expect(service).toBe(s2);
  });

  it('should perform advanced analysis', async () => {
    const matchId = 'match-123';
    const analysis = await service.performAdvancedAnalysis(matchId);

    expect(analysis).toBeDefined();
    expect(analysis.matchId).toBe(matchId);
    expect(analysis.player1Performance).toBeDefined();
    expect(analysis.player2Performance).toBeDefined();
    expect(analysis.keyMoments).toBeDefined();
    expect(analysis.matchSummary).toBeDefined();
  });

  it('should provide real-time coaching', async () => {
    const matchId = 'match-123';
    const playerId = 'player-1';
    const currentSituation = 'difficult safety shot';

    const coaching = await service.provideRealTimeCoaching(
      matchId,
      playerId,
      currentSituation
    );

    expect(coaching).toBeDefined();
    expect(coaching.matchId).toBe(matchId);
    expect(coaching.playerId).toBe(playerId);
    expect(typeof coaching.recommendation).toBe('string');
    expect(typeof coaching.confidence).toBe('number');
    expect(typeof coaching.reasoning).toBe('string');
    expect(Array.isArray(coaching.alternatives)).toBe(true);
  });

  it('should generate personalized training program', async () => {
    const playerId = 'player-1';
    const performance = {
      playerId,
      matchId: 'match-123',
      accuracy: 75,
      speed: 80,
      consistency: 70,
      strategy: 85,
      pressureHandling: 65,
      shotSelection: 75,
      positioning: 80,
      overallScore: 75,
      shotPatterns: [],
      decisionMaking: {} as any,
      mentalGame: {} as any,
      physicalMetrics: {} as any,
      tacticalAnalysis: {} as any,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      improvementPriority: [],
      skillGaps: [],
    };

    const program = await service.generatePersonalizedTrainingProgram(
      playerId,
      performance
    );

    expect(program).toBeDefined();
    expect(program.playerId).toBe(playerId);
    expect(typeof program.name).toBe('string');
    expect(typeof program.description).toBe('string');
    expect(typeof program.duration).toBe('number');
    expect(Array.isArray(program.focusAreas)).toBe(true);
    expect(Array.isArray(program.exercises)).toBe(true);
  });

  it('should analyze mental game', async () => {
    const playerId = 'player-1';
    const matchData = { shots: [], events: [] };

    const mentalGame = await service.analyzeMentalGame(playerId, matchData);

    expect(mentalGame).toBeDefined();
    expect(typeof mentalGame.focus).toBe('number');
    expect(typeof mentalGame.confidence).toBe('number');
    expect(typeof mentalGame.pressureResistance).toBe('number');
    expect(typeof mentalGame.emotionalControl).toBe('number');
    expect(typeof mentalGame.mentalEndurance).toBe('number');
    expect(typeof mentalGame.clutchPerformance).toBe('number');
  });

  it('should analyze tactics', async () => {
    const playerId = 'player-1';
    const matchData = { shots: [], events: [] };

    const tactics = await service.analyzeTactics(playerId, matchData);

    expect(tactics).toBeDefined();
    expect(typeof tactics.breakShotEffectiveness).toBe('number');
    expect(typeof tactics.safetyPlayQuality).toBe('number');
    expect(typeof tactics.offensiveStrategy).toBe('number');
    expect(typeof tactics.defensiveStrategy).toBe('number');
    expect(typeof tactics.endGameExecution).toBe('number');
    expect(typeof tactics.patternPlay).toBe('number');
  });

  it('should predict performance', async () => {
    const playerId = 'player-1';
    const upcomingMatch = {
      opponentId: 'opponent-1',
      tournamentId: 'tournament-1',
    };

    const prediction = await service.predictPerformance(
      playerId,
      upcomingMatch
    );

    expect(prediction).toBeDefined();
    expect(typeof prediction.winProbability).toBe('number');
    expect(typeof prediction.predictedScore).toBe('string');
    expect(Array.isArray(prediction.keyFactors)).toBe(true);
    expect(typeof prediction.recommendedStrategy).toBe('string');
    expect(Array.isArray(prediction.tacticalAdvice)).toBe(true);
    expect(Array.isArray(prediction.mentalPreparation)).toBe(true);
  });

  it('should get analysis by match ID', () => {
    const matchId = 'match-123';
    const analysis = service.getAnalysisByMatchId(matchId);

    // Should return the analysis that was performed earlier in the test
    expect(analysis).toBeDefined();
    expect(analysis?.matchId).toBe(matchId);
  });

  it('should get coaching sessions by match ID', () => {
    const matchId = 'match-123';
    const sessions = service.getCoachingSessionsByMatchId(matchId);

    // Should return the coaching sessions that were created earlier in the test
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it('should check connection status', () => {
    const connected = service.isConnected();
    expect(typeof connected).toBe('boolean');
  });

  it('should disconnect from socket', () => {
    // Should not throw an error
    expect(() => service.disconnect()).not.toThrow();
  });
});
