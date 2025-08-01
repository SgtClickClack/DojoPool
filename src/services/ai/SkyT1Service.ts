import { OpenAI } from 'openai';
import { config } from '';
import { logger } from '';
import { GameEvent, GameState, RuleViolation } from '.js';

export class SkyT1Service {
  private openai: OpenAI;
  private readonly model = 'gpt-4-turbo-preview';
  private readonly maxTokens = 1000;
  private readonly temperature = 0.7;

  constructor() {
    if (!config.openai?.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Analyze game events for rule violations
   */
  async analyzeGameEvents(
    gameState: GameState,
    events: GameEvent[]
  ): Promise<RuleViolation[]> {
    if (!gameState || !events || events.length === 0) {
      logger.warn('Sky-T1: Invalid input data for analysis');
      return [];
    }

    try {
      const prompt = this.buildAnalysisPrompt(gameState, events);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are Sky-T1, an AI referee for 3v3 basketball games. 
            Your role is to analyze game events and detect rule violations.
            You must be precise, fair, and consistent in your rulings.
            Consider the following rules:
            1. No physical contact that impedes movement
            2. No offensive fouls (charging, illegal screens)
            3. No defensive fouls (blocking, holding)
            4. No technical fouls (unsportsmanlike conduct)
            5. No violations (traveling, double dribble)
            
            For each violation, provide:
            - Type of violation
            - Player(s) involved
            - Severity (minor/major)
            - Recommended action
            - Rule reference`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      if (!response.choices || response.choices.length === 0) {
        logger.warn('Sky-T1: No response from OpenAI');
        return [];
      }

      const violations = this.parseViolations(response.choices[0].message.content || '');
      logger.info('Sky-T1 analysis complete', { 
        violationsCount: violations.length,
        eventsAnalyzed: events.length 
      });
      return violations;
    } catch (error) {
      logger.error('Error in Sky-T1 analysis', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        gameStateId: gameState.id,
        eventsCount: events.length
      });
      return [];
    }
  }

  /**
   * Interpret a specific rule or situation
   */
  async interpretRule(
    rule: string,
    context: GameState
  ): Promise<{ interpretation: string; examples: string[] }> {
    if (!rule || !context) {
      logger.warn('Sky-T1: Invalid input for rule interpretation');
      return { interpretation: '', examples: [] };
    }

    try {
      const prompt = this.buildRuleInterpretationPrompt(rule, context);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are Sky-T1, an AI referee for 3v3 basketball games.
            Your role is to interpret rules and provide clear explanations.
            Be specific and provide relevant examples.
            Consider the current game context in your interpretation.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      if (!response.choices || response.choices.length === 0) {
        logger.warn('Sky-T1: No response from OpenAI for rule interpretation');
        return { interpretation: '', examples: [] };
      }

      const interpretation = this.parseRuleInterpretation(
        response.choices[0].message.content || ''
      );
      logger.info('Sky-T1 rule interpretation complete', { 
        rule: rule.substring(0, 50),
        interpretationLength: interpretation.interpretation.length
      });
      return interpretation;
    } catch (error) {
      logger.error('Error in Sky-T1 rule interpretation', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        rule: rule.substring(0, 50),
        gameStateId: context.id
      });
      return { interpretation: '', examples: [] };
    }
  }

  /**
   * Build prompt for game event analysis
   */
  private buildAnalysisPrompt(
    gameState: GameState,
    events: GameEvent[]
  ): string {
    return `
    Current Game State:
    - Score: ${gameState.score}
    - Time: ${gameState.time}
    - Possession: ${gameState.possession}
    - Players: ${JSON.stringify(gameState.players)}
    
    Recent Events:
    ${events.map((event) => `- ${event.type}: ${event.description}`).join('\n')}
    
    Please analyze these events for any rule violations.
    `;
  }

  /**
   * Build prompt for rule interpretation
   */
  private buildRuleInterpretationPrompt(
    rule: string,
    context: GameState
  ): string {
    return `
    Rule to Interpret: ${rule}
    
    Current Game Context:
    - Score: ${context.score}
    - Time: ${context.time}
    - Possession: ${context.possession}
    - Players: ${JSON.stringify(context.players)}
    
    Please provide a clear interpretation of this rule in the current context.
    Include specific examples of how it applies.
    `;
  }

  /**
   * Parse violations from AI response
   */
  private parseViolations(content: string): RuleViolation[] {
    if (!content || content.trim().length === 0) {
      logger.warn('Sky-T1: Empty content for violation parsing');
      return [];
    }

    try {
      const violations: RuleViolation[] = [];
      const lines = content.split('\n');

      let currentViolation: Partial<RuleViolation> = {};
      for (const line of lines) {
        if (line.startsWith('- Type:')) {
          if (Object.keys(currentViolation).length > 0) {
            violations.push(currentViolation as RuleViolation);
          }
          currentViolation = {
            type: line.replace('- Type:', '').trim(),
          };
        } else if (line.startsWith('- Players:')) {
          currentViolation.players = line
            .replace('- Players:', '')
            .trim()
            .split(',');
        } else if (line.startsWith('- Severity:')) {
          currentViolation.severity = line
            .replace('- Severity:', '')
            .trim() as 'minor' | 'major';
        } else if (line.startsWith('- Action:')) {
          currentViolation.action = line.replace('- Action:', '').trim();
        } else if (line.startsWith('- Rule:')) {
          currentViolation.rule = line.replace('- Rule:', '').trim();
        }
      }

      if (Object.keys(currentViolation).length > 0) {
        violations.push(currentViolation as RuleViolation);
      }

      return violations;
    } catch (error) {
      logger.error('Error parsing violations', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length
      });
      return [];
    }
  }

  /**
   * Parse rule interpretation from AI response
   */
  private parseRuleInterpretation(content: string): {
    interpretation: string;
    examples: string[];
  } {
    if (!content || content.trim().length === 0) {
      logger.warn('Sky-T1: Empty content for rule interpretation parsing');
      return { interpretation: '', examples: [] };
    }

    try {
      const lines = content.split('\n');
      const interpretation = lines[0].trim();
      const examples = lines
        .slice(1)
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace('- ', '').trim());

      return { interpretation, examples };
    } catch (error) {
      logger.error('Error parsing rule interpretation', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length
      });
      return { interpretation: '', examples: [] };
    }
  }
} 
