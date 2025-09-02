import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MatchAnalysis {
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformance: {
    playerA: string;
    playerB: string;
  };
  overallAssessment: string;
  recommendations: string[];
}

export interface ShotData {
  matchId: string;
  playerId: string;
  ballSunk?: string | number | boolean | null;
  wasFoul?: boolean;
  [key: string]: any;
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private genAI?: GoogleGenerativeAI;

  constructor(@Optional() private configService?: ConfigService) {
    const apiKey = this.configService?.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateMatchAnalysis(matchData: {
    playerAName: string;
    playerBName: string;
    scoreA: number;
    scoreB: number;
    winner: string;
    shots?: any[];
    venue: string;
    round: number;
  }): Promise<MatchAnalysis> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not configured');
      }

      const prompt = this.buildAnalysisPrompt(matchData);
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text);
    } catch (error) {
      this.logger.error('Failed to generate AI analysis:', error);
      return this.generateFallbackAnalysis(matchData);
    }
  }

  async getLiveCommentary(shotData: ShotData): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not configured');
      }
      const prompt = this.buildLiveCommentaryPrompt(shotData);
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      // Add a short timeout to keep broadcasts responsive
      const timeoutMs = 3500;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      } as any);

      clearTimeout(timer);
      const text = result.response.text().trim();

      // Ensure single short sentence output
      const firstLine = text.split(/\r?\n/)[0];
      const clipped = firstLine.replace(/\s+/g, ' ').trim();
      return clipped.length > 140 ? clipped.slice(0, 137) + '...' : clipped;
    } catch (error) {
      this.logger.warn(
        'Live commentary generation failed, using fallback:',
        error
      );
      return this.generateFallbackCommentary(shotData);
    }
  }

  private buildAnalysisPrompt(matchData: any): string {
    return `You are an expert pool coach analyzing a completed match. Please provide a brief, insightful analysis of this pool game.

Match Details:
- Player A: ${matchData.playerAName} (Score: ${matchData.scoreA})
- Player B: ${matchData.playerBName} (Score: ${matchData.scoreB})
- Winner: ${matchData.winner}
- Venue: ${matchData.venue}
- Round: ${matchData.round}

Please provide your analysis in the following JSON format:
{
  "keyMoments": ["2-3 key moments or turning points in the match"],
  "strategicInsights": ["2-3 strategic observations about the gameplay"],
  "playerPerformance": {
    "playerA": "Brief assessment of Player A's performance",
    "playerB": "Brief assessment of Player B's performance"
  },
  "overallAssessment": "Overall match summary and quality assessment",
  "recommendations": ["2-3 specific improvement suggestions for both players"]
}

Keep each response concise (1-2 sentences max) and focus on actionable insights.`;
  }

  private parseAnalysisResponse(response: string): MatchAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          keyMoments: parsed.keyMoments || [],
          strategicInsights: parsed.strategicInsights || [],
          playerPerformance: {
            playerA: parsed.playerPerformance?.playerA || '',
            playerB: parsed.playerPerformance?.playerB || '',
          },
          overallAssessment: parsed.overallAssessment || '',
          recommendations: parsed.recommendations || [],
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON:', error);
    }

    // Fallback parsing for non-JSON responses
    return this.parseTextResponse(response);
  }

  private parseTextResponse(response: string): MatchAnalysis {
    const lines = response.split('\n').filter((line) => line.trim());

    return {
      keyMoments: [lines[0] || 'Key moment analysis unavailable'],
      strategicInsights: [lines[1] || 'Strategic insights unavailable'],
      playerPerformance: {
        playerA: lines[2] || 'Player A performance analysis unavailable',
        playerB: lines[3] || 'Player B performance analysis unavailable',
      },
      overallAssessment: lines[4] || 'Overall assessment unavailable',
      recommendations: [lines[5] || 'Recommendations unavailable'],
    };
  }

  private generateFallbackAnalysis(matchData: any): MatchAnalysis {
    return {
      keyMoments: [
        `The match between ${matchData.playerAName} and ${matchData.playerBName} was closely contested`,
        `${matchData.winner} demonstrated strong strategic play to secure victory`,
      ],
      strategicInsights: [
        'Both players showed solid fundamentals throughout the match',
        'The winning strategy involved consistent shot selection and positioning',
      ],
      playerPerformance: {
        playerA: `${matchData.playerAName} played well with a score of ${matchData.scoreA}`,
        playerB: `${matchData.playerBName} put up a strong fight with a score of ${matchData.scoreB}`,
      },
      overallAssessment: `A competitive match that showcased good pool skills from both players`,
      recommendations: [
        'Focus on consistent shot execution and table positioning',
        'Practice break shots and safety play for future matches',
      ],
    };
  }

  private buildLiveCommentaryPrompt(shotData: any): string {
    const playerName = shotData.playerName || 'The player';
    const shotType = shotData.shotType || 'shot';

    return `You are a witty, cyberpunk pool commentator. Generate a single, short sentence of commentary for this pool shot.

Shot Details:
- Player: ${playerName}
- Ball Sunk: ${shotData.ballSunk ? 'Yes' : 'No'}
- Foul: ${shotData.wasFoul ? 'Yes' : 'No'}
- Shot Type: ${shotType}

Generate ONE sentence of commentary that is:
- Witty and entertaining
- Cyberpunk-themed (use terms like "neural networks", "digital precision", "matrix", "cyber", etc.)
- Relevant to the shot outcome
- Maximum 15 words
- No quotes or special formatting

Example style: "The neural networks align as digital precision meets the green felt matrix!"`;
  }

  private generateFallbackCommentary(shotData: any): string {
    const playerName = shotData.playerName || 'The player';

    if (shotData.wasFoul) {
      return `${playerName} commits a cyber-foul in the digital arena!`;
    }

    if (shotData.ballSunk) {
      return `${playerName} executes a perfect neural network shot!`;
    }

    return `${playerName} takes aim at the digital precision target!`;
  }
}
