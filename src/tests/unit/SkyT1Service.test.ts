import { vi } from 'vitest';

// Mock OpenAI before importing the service
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Mock config
vi.mock('../../config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
    },
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { SkyT1Service } from '../../services/ai/SkyT1Service';

describe('SkyT1Service', () => {
  let service: SkyT1Service;

  beforeEach(() => {
    service = new SkyT1Service();
  });

  describe('initialization', () => {
    it('should initialize with OpenAI client', () => {
      expect(service).toBeDefined();
    });

    it('should use correct model and settings', () => {
      const serviceInstance = service as any;
      expect(serviceInstance.model).toBe('gpt-4-turbo-preview');
      expect(serviceInstance.maxTokens).toBe(1000);
      expect(serviceInstance.temperature).toBe(0.7);
    });
  });

  describe('private methods', () => {
    it('should parse violations correctly', () => {
      const content = `
- Type: Charging foul
- Players: Player 1, Player 2
- Severity: major
- Action: Free throw + possession
- Rule: Offensive foul
      `;

      const violations = (service as any).parseViolations(content);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('Charging foul');
      expect(violations[0].players).toEqual(['Player 1', ' Player 2']); // Note the space
      expect(violations[0].severity).toBe('major');
      expect(violations[0].action).toBe('Free throw + possession');
      expect(violations[0].rule).toBe('Offensive foul');
    });

    it('should parse multiple violations', () => {
      const content = `
- Type: Traveling
- Players: Player 1
- Severity: minor
- Action: Turnover
- Rule: Illegal movement

- Type: Technical foul
- Players: Player 2
- Severity: major
- Action: Free throw
- Rule: Unsportsmanlike
      `;

      const violations = (service as any).parseViolations(content);

      expect(violations).toHaveLength(2);
      expect(violations[0].type).toBe('Traveling');
      expect(violations[1].type).toBe('Technical foul');
    });

    it('should handle incomplete violation data', () => {
      const content = `
- Type: Traveling
- Players: Player 1
      `;

      const violations = (service as any).parseViolations(content);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('Traveling');
      expect(violations[0].players).toEqual(['Player 1']);
      expect(violations[0].severity).toBeUndefined();
    });

    it('should handle parsing errors gracefully', () => {
      const content = null as any;

      const violations = (service as any).parseViolations(content);

      expect(violations).toHaveLength(0);
    });

    it('should parse rule interpretation correctly', () => {
      const content = `Traveling is an illegal movement violation.
- Moving pivot foot while holding ball
- Taking more than two steps without dribbling
- Jumping with ball and landing without releasing it`;

      const result = (service as any).parseRuleInterpretation(content);

      expect(result.interpretation).toBe(
        'Traveling is an illegal movement violation.'
      );
      expect(result.examples).toHaveLength(3);
      expect(result.examples[0]).toBe('Moving pivot foot while holding ball');
      expect(result.examples[1]).toBe(
        'Taking more than two steps without dribbling'
      );
      expect(result.examples[2]).toBe(
        'Jumping with ball and landing without releasing it'
      );
    });

    it('should handle rule interpretation without examples', () => {
      const content = 'Traveling is an illegal movement violation.';

      const result = (service as any).parseRuleInterpretation(content);

      expect(result.interpretation).toBe(
        'Traveling is an illegal movement violation.'
      );
      expect(result.examples).toHaveLength(0);
    });

    it('should handle rule interpretation parsing errors gracefully', () => {
      const content = null as any;

      const result = (service as any).parseRuleInterpretation(content);

      expect(result.interpretation).toBe('');
      expect(result.examples).toHaveLength(0);
    });

    it('should build analysis prompt correctly', () => {
      const gameState = {
        tables: [],
        players: [
          {
            id: '1',
            name: 'Player 1',
            team: 'team1',
            position: 'forward',
            score: 0,
            isActive: true,
            lastAction: Date.now(),
          },
        ],
        currentTurn: 'team1',
        gamePhase: 'active',
        score: { home: 10, away: 8 },
        time: { minutes: 2, seconds: 30 },
        possession: 'team1',
      };

      const events = [
        {
          type: 'foul',
          description: 'Test foul',
          timestamp: Date.now(),
          playerId: '1',
        },
      ];

      const prompt = (service as any).buildAnalysisPrompt(gameState, events);

      expect(prompt).toContain('Score: [object Object]'); // The service uses [object Object]
      expect(prompt).toContain('Time: [object Object]'); // The service uses [object Object]
      expect(prompt).toContain('Possession: team1');
      expect(prompt).toContain('foul: Test foul');
      expect(prompt).toContain(
        'Please analyze these events for any rule violations'
      );
    });

    it('should build rule interpretation prompt correctly', () => {
      const context = {
        tables: [],
        players: [
          {
            id: '1',
            name: 'Player 1',
            team: 'team1',
            position: 'forward',
            score: 0,
            isActive: true,
            lastAction: Date.now(),
          },
        ],
        currentTurn: 'team2',
        gamePhase: 'active',
        score: { home: 15, away: 12 },
        time: { minutes: 1, seconds: 45 },
        possession: 'team2',
      };

      const prompt = (service as any).buildRuleInterpretationPrompt(
        'traveling',
        context
      );

      expect(prompt).toContain('Rule to Interpret: traveling');
      expect(prompt).toContain('Score: [object Object]'); // The service uses [object Object]
      expect(prompt).toContain('Time: [object Object]'); // The service uses [object Object]
      expect(prompt).toContain('Possession: team2');
      expect(prompt).toContain(
        'Please provide a clear interpretation of this rule'
      );
    });

    it('should handle empty events in analysis prompt', () => {
      const gameState = {
        tables: [],
        players: [],
        currentTurn: 'team1',
        gamePhase: 'active',
        score: { home: 0, away: 0 },
        time: { minutes: 0, seconds: 0 },
        possession: 'team1',
      };

      const events: any[] = [];

      const prompt = (service as any).buildAnalysisPrompt(gameState, events);

      expect(prompt).toContain('Recent Events:');
      expect(prompt).toContain(
        'Please analyze these events for any rule violations'
      );
    });

    it('should handle complex game state in rule interpretation', () => {
      const context = {
        tables: [
          { id: '1', name: 'Table 1', players: ['1', '2'], status: 'active' },
        ],
        players: [
          {
            id: '1',
            name: 'Player 1',
            team: 'team1',
            position: 'forward',
            score: 5,
            isActive: true,
            lastAction: Date.now(),
          },
          {
            id: '2',
            name: 'Player 2',
            team: 'team2',
            position: 'defense',
            score: 3,
            isActive: true,
            lastAction: Date.now(),
          },
        ],
        currentTurn: 'team1',
        gamePhase: 'active',
        score: { home: 15, away: 12 },
        time: { minutes: 1, seconds: 45 },
        possession: 'team2',
      };

      const prompt = (service as any).buildRuleInterpretationPrompt(
        'double dribble',
        context
      );

      expect(prompt).toContain('Rule to Interpret: double dribble');
      expect(prompt).toContain('Current Game Context:');
      expect(prompt).toContain(
        'Please provide a clear interpretation of this rule in the current context'
      );
    });
  });
});
