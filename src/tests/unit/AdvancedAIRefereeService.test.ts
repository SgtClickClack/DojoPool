import AdvancedAIRefereeService, {
  AIRefereeDecision,
  AIRefereeAnalysis,
  type AIRefereeConfig,
} from '../../services/ai/AdvancedAIRefereeService';
import { vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe('AdvancedAIRefereeService', () => {
  let service: AdvancedAIRefereeService;

  beforeEach(() => {
    service = AdvancedAIRefereeService.getInstance();
  });

  it('should be a singleton', () => {
    const s2 = AdvancedAIRefereeService.getInstance();
    expect(service).toBe(s2);
  });

  it('should make a decision', async () => {
    const decisionData = {
      matchId: 'match1',
      decisionType: 'foul' as const,
      severity: 'medium' as const,
      description: 'Cue ball scratched',
      ruleReference: 'Rule 6.3',
      confidence: 85,
      evidence: ['Video analysis'],
      playerId: 'player1',
      explanation: 'Cue ball entered pocket',
      appealable: true,
    };

    const decision = await service.makeDecision(decisionData);
    expect(decision).toBeDefined();
    expect(decision.matchId).toBe('match1');
    expect(decision.decisionType).toBe('foul');
    expect(decision.status).toBe('pending');
    expect(decision.id).toBeDefined();
    expect(decision.timestamp).toBeInstanceOf(Date);
  });

  it('should generate analysis', async () => {
    const analysisData = {
      matchId: 'match1',
      analysisType: 'shot_analysis' as const,
      content: 'Break shot analysis',
      insights: ['Optimal break speed'],
      recommendations: ['Increase break speed'],
      confidence: 90,
      context: { frame: 1 },
    };

    const analysis = await service.generateAnalysis(analysisData);
    expect(analysis).toBeDefined();
    expect(analysis.matchId).toBe('match1');
    expect(analysis.analysisType).toBe('shot_analysis');
    expect(analysis.id).toBeDefined();
    expect(analysis.timestamp).toBeInstanceOf(Date);
  });

  it('should update config', async () => {
    const newConfig: Partial<AIRefereeConfig> = {
      confidenceThreshold: 90,
      enableRealTimeAnalysis: false,
    };

    await service.updateConfig(newConfig);
    const config = service.getConfig();
    expect(config.confidenceThreshold).toBe(90);
    expect(config.enableRealTimeAnalysis).toBe(false);
  });

  it('should get decisions', () => {
    const decisions = service.getDecisions();
    expect(Array.isArray(decisions)).toBe(true);
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('should get analyses', () => {
    const analyses = service.getAnalyses();
    expect(Array.isArray(analyses)).toBe(true);
    expect(analyses.length).toBeGreaterThan(0);
  });

  it('should get metrics', () => {
    const metrics = service.getMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalDecisions).toBe('number');
    expect(typeof metrics.averageConfidence).toBe('number');
    expect(metrics.lastUpdated).toBeInstanceOf(Date);
  });

  it('should get connection status', () => {
    const status = service.getConnectionStatus();
    expect(typeof status).toBe('boolean');
  });

  it('should disconnect', () => {
    service.disconnect();
    const status = service.getConnectionStatus();
    expect(status).toBe(false);
  });
});
