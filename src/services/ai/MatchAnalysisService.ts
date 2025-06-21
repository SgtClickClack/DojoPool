import { io, Socket } from 'socket.io-client';

export interface PlayerPerformance {
  playerId: string;
  matchId: string;
  accuracy: number;
  speed: number;
  consistency: number;
  strategy: number;
  pressureHandling: number;
  shotSelection: number;
  positioning: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MatchAnalysis {
  matchId: string;
  player1Performance: PlayerPerformance;
  player2Performance: PlayerPerformance;
  keyMoments: KeyMoment[];
  matchSummary: string;
  improvementAreas: string[];
  nextMatchPredictions: MatchPrediction[];
}

export interface KeyMoment {
  timestamp: number;
  type: 'break' | 'safety' | 'foul' | 'clutch' | 'mistake';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  playerId: string;
  recommendation?: string;
}

export interface MatchPrediction {
  opponentId: string;
  winProbability: number;
  predictedScore: string;
  keyFactors: string[];
  recommendedStrategy: string;
}

export interface TrainingProgram {
  playerId: string;
  programId: string;
  name: string;
  description: string;
  duration: number; // days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  exercises: TrainingExercise[];
  progress: number; // 0-100
  completed: boolean;
}

export interface TrainingExercise {
  id: string;
  name: string;
  description: string;
  type: 'drill' | 'game' | 'analysis' | 'practice';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusArea: string;
  instructions: string[];
  metrics: string[];
  targetScore?: number;
}

class MatchAnalysisService {
  private socket: Socket | null = null;
  private static instance: MatchAnalysisService;

  private constructor() {
    this.initializeSocket();
  }

  public static getInstance(): MatchAnalysisService {
    if (!MatchAnalysisService.instance) {
      MatchAnalysisService.instance = new MatchAnalysisService();
    }
    return MatchAnalysisService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('MatchAnalysisService connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('MatchAnalysisService disconnected from server');
    });
  }

  // Analyze a completed match and generate performance insights
  public async analyzeMatch(matchId: string): Promise<MatchAnalysis> {
    try {
      // Simulate AI analysis with mock data
      const analysis: MatchAnalysis = {
        matchId,
        player1Performance: this.generatePlayerPerformance('player1', matchId),
        player2Performance: this.generatePlayerPerformance('player2', matchId),
        keyMoments: this.generateKeyMoments(matchId),
        matchSummary: this.generateMatchSummary(matchId),
        improvementAreas: this.generateImprovementAreas(),
        nextMatchPredictions: this.generateMatchPredictions()
      };

      // Emit analysis results
      this.socket?.emit('match-analysis-complete', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing match:', error);
      throw error;
    }
  }

  // Generate personalized training program based on performance analysis
  public async generateTrainingProgram(playerId: string, performance: PlayerPerformance): Promise<TrainingProgram> {
    try {
      const program: TrainingProgram = {
        playerId,
        programId: `program_${Date.now()}`,
        name: this.generateProgramName(performance),
        description: this.generateProgramDescription(performance),
        duration: this.calculateProgramDuration(performance),
        difficulty: this.determineDifficulty(performance),
        focusAreas: this.identifyFocusAreas(performance),
        exercises: this.generateExercises(performance),
        progress: 0,
        completed: false
      };

      // Emit training program generated
      this.socket?.emit('training-program-generated', program);
      
      return program;
    } catch (error) {
      console.error('Error generating training program:', error);
      throw error;
    }
  }

  // Real-time performance tracking during matches
  public async trackPerformance(matchId: string, shotData: any): Promise<Partial<PlayerPerformance>> {
    try {
      // Analyze shot data in real-time
      const performance = this.analyzeShotData(shotData);
      
      // Emit real-time performance update
      this.socket?.emit('performance-update', { matchId, performance });
      
      return performance;
    } catch (error) {
      console.error('Error tracking performance:', error);
      throw error;
    }
  }

  // Get coaching recommendations based on current performance
  public async getCoachingRecommendations(playerId: string, currentPerformance: PlayerPerformance): Promise<string[]> {
    try {
      const recommendations = this.generateRecommendations(currentPerformance);
      
      // Emit coaching recommendations
      this.socket?.emit('coaching-recommendations', { playerId, recommendations });
      
      return recommendations;
    } catch (error) {
      console.error('Error getting coaching recommendations:', error);
      throw error;
    }
  }

  // Update training program progress
  public async updateTrainingProgress(programId: string, progress: number): Promise<void> {
    try {
      this.socket?.emit('training-progress-update', { programId, progress });
    } catch (error) {
      console.error('Error updating training progress:', error);
      throw error;
    }
  }

  // Private helper methods for generating mock data
  private generatePlayerPerformance(playerId: string, matchId: string): PlayerPerformance {
    const accuracy = Math.random() * 40 + 60; // 60-100%
    const speed = Math.random() * 30 + 70; // 70-100%
    const consistency = Math.random() * 35 + 65; // 65-100%
    const strategy = Math.random() * 40 + 60; // 60-100%
    const pressureHandling = Math.random() * 45 + 55; // 55-100%
    const shotSelection = Math.random() * 35 + 65; // 65-100%
    const positioning = Math.random() * 30 + 70; // 70-100%
    
    const overallScore = (accuracy + speed + consistency + strategy + pressureHandling + shotSelection + positioning) / 7;

    return {
      playerId,
      matchId,
      accuracy: Math.round(accuracy * 10) / 10,
      speed: Math.round(speed * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      strategy: Math.round(strategy * 10) / 10,
      pressureHandling: Math.round(pressureHandling * 10) / 10,
      shotSelection: Math.round(shotSelection * 10) / 10,
      positioning: Math.round(positioning * 10) / 10,
      overallScore: Math.round(overallScore * 10) / 10,
      strengths: this.generateStrengths(overallScore),
      weaknesses: this.generateWeaknesses(overallScore),
      recommendations: this.generateRecommendations({ overallScore } as PlayerPerformance)
    };
  }

  private generateKeyMoments(matchId: string): KeyMoment[] {
    const moments: KeyMoment[] = [];
    const types: KeyMoment['type'][] = ['break', 'safety', 'foul', 'clutch', 'mistake'];
    
    for (let i = 0; i < 8; i++) {
      moments.push({
        timestamp: Math.random() * 1800, // 0-30 minutes
        type: types[Math.floor(Math.random() * types.length)],
        description: this.generateMomentDescription(),
        impact: Math.random() > 0.5 ? 'positive' : 'negative',
        playerId: Math.random() > 0.5 ? 'player1' : 'player2',
        recommendation: Math.random() > 0.3 ? this.generateMomentRecommendation() : undefined
      });
    }
    
    return moments.sort((a, b) => a.timestamp - b.timestamp);
  }

  private generateMatchSummary(matchId: string): string {
    const summaries = [
      "A closely contested match with excellent shot-making from both players. Key turning point was a clutch safety shot in the 8th frame.",
      "Dominant performance with consistent break-building. Player demonstrated excellent cue ball control throughout the match.",
      "Comeback victory after being down early. Showed great mental toughness and strategic thinking in the later frames.",
      "Technical match with focus on safety play. Both players showed strong defensive skills and tactical awareness."
    ];
    
    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  private generateImprovementAreas(): string[] {
    const areas = [
      "Break shot consistency",
      "Safety shot selection",
      "Pressure handling in clutch situations",
      "Cue ball positioning",
      "Shot speed control",
      "Strategic thinking",
      "Mental game focus",
      "Pattern recognition"
    ];
    
    return areas.slice(0, 3);
  }

  private generateMatchPredictions(): MatchPrediction[] {
    const predictions: MatchPrediction[] = [];
    
    for (let i = 0; i < 3; i++) {
      predictions.push({
        opponentId: `opponent_${i + 1}`,
        winProbability: Math.random() * 40 + 30, // 30-70%
        predictedScore: `${Math.floor(Math.random() * 5) + 3}-${Math.floor(Math.random() * 5) + 3}`,
        keyFactors: ["Break consistency", "Safety play", "Mental game"],
        recommendedStrategy: "Focus on controlled break shots and maintain defensive pressure"
      });
    }
    
    return predictions;
  }

  private generateStrengths(overallScore: number): string[] {
    const strengths = [
      "Excellent break shot consistency",
      "Strong safety game",
      "Good cue ball control",
      "Strategic thinking",
      "Mental toughness",
      "Shot selection",
      "Position play",
      "Pressure handling"
    ];
    
    return strengths.slice(0, 3);
  }

  private generateWeaknesses(overallScore: number): string[] {
    const weaknesses = [
      "Inconsistent break shots",
      "Poor safety selection",
      "Weak cue ball control",
      "Lack of strategic planning",
      "Mental game issues",
      "Poor shot selection",
      "Positioning problems",
      "Pressure handling"
    ];
    
    return weaknesses.slice(0, 2);
  }

  private generateRecommendations(performance: PlayerPerformance): string[] {
    return [
      "Practice break shot consistency with focus on cue ball positioning",
      "Work on safety shot selection and execution",
      "Develop mental game strategies for pressure situations",
      "Improve pattern recognition and shot planning",
      "Focus on cue ball control exercises"
    ];
  }

  private generateProgramName(performance: PlayerPerformance): string {
    const names = [
      "Elite Performance Program",
      "Advanced Skills Development",
      "Championship Training Program",
      "Pro-Level Improvement Plan",
      "Master Class Training"
    ];
    
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateProgramDescription(performance: PlayerPerformance): string {
    return `Personalized training program designed to improve your overall game performance. Focus areas include break consistency, safety play, and mental game development.`;
  }

  private calculateProgramDuration(performance: PlayerPerformance): number {
    return Math.floor(Math.random() * 14) + 7; // 7-21 days
  }

  private determineDifficulty(performance: PlayerPerformance): 'beginner' | 'intermediate' | 'advanced' {
    if (performance.overallScore >= 85) return 'advanced';
    if (performance.overallScore >= 70) return 'intermediate';
    return 'beginner';
  }

  private identifyFocusAreas(performance: PlayerPerformance): string[] {
    return performance.weaknesses.slice(0, 3);
  }

  private generateExercises(performance: PlayerPerformance): TrainingExercise[] {
    const exercises: TrainingExercise[] = [];
    
    for (let i = 0; i < 5; i++) {
      exercises.push({
        id: `exercise_${i + 1}`,
        name: `Training Exercise ${i + 1}`,
        description: `Focused training exercise to improve specific skills`,
        type: ['drill', 'game', 'analysis', 'practice'][Math.floor(Math.random() * 4)] as any,
        duration: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
        difficulty: this.determineDifficulty(performance),
        focusArea: performance.weaknesses[0] || "General improvement",
        instructions: [
          "Set up the practice scenario",
          "Focus on proper technique",
          "Maintain consistent speed",
          "Track your progress"
        ],
        metrics: ["Accuracy", "Speed", "Consistency"],
        targetScore: Math.floor(Math.random() * 20) + 80
      });
    }
    
    return exercises;
  }

  private analyzeShotData(shotData: any): Partial<PlayerPerformance> {
    // Mock shot analysis
    return {
      accuracy: Math.random() * 40 + 60,
      speed: Math.random() * 30 + 70,
      consistency: Math.random() * 35 + 65
    };
  }

  private generateMomentDescription(): string {
    const descriptions = [
      "Excellent break shot with perfect cue ball positioning",
      "Strategic safety shot forcing opponent into difficult position",
      "Clutch shot under pressure to win the frame",
      "Mistake in shot selection leading to opponent opportunity",
      "Foul shot giving opponent ball in hand"
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateMomentRecommendation(): string {
    const recommendations = [
      "Practice similar break shots to improve consistency",
      "Work on safety shot selection and execution",
      "Develop mental strategies for pressure situations",
      "Focus on shot planning and pattern recognition",
      "Improve cue ball control exercises"
    ];
    
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}

export default MatchAnalysisService; 