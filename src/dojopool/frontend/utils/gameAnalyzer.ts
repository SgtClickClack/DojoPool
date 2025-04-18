import { GooseAI } from "./gooseAI";

interface ShotAnalysis {
  difficulty: number;
  recommendations: string[];
  risks: string[];
  alternativeShots: string[];
}

export class GameAnalyzer {
  private goose: GooseAI;

  constructor() {
    this.goose = GooseAI.getInstance();
  }

  public async analyzeShotPattern(shot: {
    type: string;
    angle: number;
    force: number;
    spin: number;
    distance: number;
  }): Promise<ShotAnalysis> {
    const prompt = `
      Analyze this pool shot and provide detailed feedback:
      Shot Type: ${shot.type}
      Angle: ${shot.angle} degrees
      Force: ${shot.force}%
      Spin: ${shot.spin} (range -1 to 1)
      Distance: ${shot.distance} inches

      Provide analysis in this format:
      Difficulty: [0-10]
      Recommendations:
      - [recommendation 1]
      - [recommendation 2]
      Risks:
      - [risk 1]
      - [risk 2]
      Alternative Shots:
      - [alternative 1]
      - [alternative 2]
    `;

    try {
      const response = await this.goose.generateCompletion(prompt, {
        maxTokens: 200,
        temperature: 0.7,
      });

      // Parse the response
      const analysis = this.parseAnalysisResponse(response.choices[0].text);
      return analysis;
    } catch (error) {
      console.error("Error analyzing shot:", error);
      throw error;
    }
  }

  public async getPositionalAdvice(tableState: {
    ballPositions: Array<{ x: number; y: number; number: number }>;
    nextShot: string;
  }): Promise<string> {
    const prompt = `
      Analyze this pool table state and provide positional play advice:
      Ball Positions: ${JSON.stringify(tableState.ballPositions)}
      Next Shot: ${tableState.nextShot}

      Consider:
      1. Optimal cue ball position
      2. Available angles
      3. Safety options
      4. Strategic advantages
    `;

    try {
      const response = await this.goose.generateCompletion(prompt, {
        maxTokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].text.trim();
    } catch (error) {
      console.error("Error getting positional advice:", error);
      throw error;
    }
  }

  public async getShotRecommendations(
    playerSkillLevel: number,
    gameState: {
      remainingBalls: number[];
      difficulty: number;
      isDefensive: boolean;
    },
  ): Promise<string[]> {
    const prompt = `
      Recommend pool shots for this situation:
      Player Skill Level: ${playerSkillLevel}/10
      Remaining Balls: ${gameState.remainingBalls.join(", ")}
      Current Difficulty: ${gameState.difficulty}/10
      Defensive Situation: ${gameState.isDefensive}

      Provide 3 shot recommendations in order of preference, considering:
      1. Player skill level
      2. Risk vs reward
      3. Strategic position
      4. Game situation
    `;

    try {
      const response = await this.goose.generateCompletion(prompt, {
        maxTokens: 200,
        temperature: 0.8,
      });

      return response.choices[0].text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.trim());
    } catch (error) {
      console.error("Error getting shot recommendations:", error);
      throw error;
    }
  }

  private parseAnalysisResponse(text: string): ShotAnalysis {
    const analysis: ShotAnalysis = {
      difficulty: 0,
      recommendations: [],
      risks: [],
      alternativeShots: [],
    };

    const lines = text.split("\n");
    let currentSection = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("Difficulty:")) {
        analysis.difficulty = parseInt(trimmedLine.split(":")[1]) || 0;
      } else if (trimmedLine === "Recommendations:") {
        currentSection = "recommendations";
      } else if (trimmedLine === "Risks:") {
        currentSection = "risks";
      } else if (trimmedLine === "Alternative Shots:") {
        currentSection = "alternativeShots";
      } else if (trimmedLine.startsWith("- ")) {
        const item = trimmedLine.substring(2).trim();
        if (currentSection && item) {
          analysis[currentSection].push(item);
        }
      }
    }

    return analysis;
  }
}
