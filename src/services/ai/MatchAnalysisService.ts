import { EventEmitter } from 'events';

export interface ShotAnalysis {
  id: string;
  timestamp: number;
  shotType: 'break' | 'safety' | 'pot' | 'defensive';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  success: boolean;
  position: { x: number; y: number };
  target: { x: number; y: number };
  power: number;
  spin: number;
  accuracy: number;
  aiScore: number;
  recommendations: string[];
}

export interface PlayerPerformance {
  playerId: string;
  matchId: string;
  totalShots: number;
  successfulShots: number;
  shotAccuracy: number;
  averagePower: number;
  averageSpin: number;
  positionControl: number;
  safetySuccess: number;
  breakSuccess: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
}

export interface TrainingProgram {
  id: string;
  playerId: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // minutes
  exercises: TrainingExercise[];
  progress: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingExercise {
  id: string;
  name: string;
  description: string;
  type: 'accuracy' | 'power' | 'position' | 'safety' | 'break' | 'strategy';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // minutes
  instructions: string[];
  targetMetrics: {
    accuracy: number;
    power: number;
    position: number;
    speed: number;
  };
  completed: boolean;
  score: number;
}

export interface CoachingRecommendation {
  id: string;
  playerId: string;
  type: 'shot' | 'strategy' | 'position' | 'mental' | 'physical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  expectedImprovement: number;
  timeframe: string;
  completed: boolean;
}

class MatchAnalysisService extends EventEmitter {
  private static instance: MatchAnalysisService;
  private shotAnalyses: Map<string, ShotAnalysis[]> = new Map();
  private playerPerformances: Map<string, PlayerPerformance[]> = new Map();
  private trainingPrograms: Map<string, TrainingProgram[]> = new Map();
  private coachingRecommendations: Map<string, CoachingRecommendation[]> = new Map();

  private constructor() {
    super();
    this.initializeMockData();
  }

  public static getInstance(): MatchAnalysisService {
    if (!MatchAnalysisService.instance) {
      MatchAnalysisService.instance = new MatchAnalysisService();
    }
    return MatchAnalysisService.instance;
  }

  private initializeMockData(): void {
    // Mock shot analyses
    const mockShots: ShotAnalysis[] = [
      {
        id: 'shot-1',
        timestamp: Date.now() - 300000,
        shotType: 'break',
        difficulty: 'medium',
        success: true,
        position: { x: 0.2, y: 0.8 },
        target: { x: 0.8, y: 0.2 },
        power: 0.7,
        spin: 0.3,
        accuracy: 0.85,
        aiScore: 8.5,
        recommendations: ['Increase follow-through', 'Adjust stance for better balance']
      },
      {
        id: 'shot-2',
        timestamp: Date.now() - 240000,
        shotType: 'safety',
        difficulty: 'hard',
        success: false,
        position: { x: 0.5, y: 0.5 },
        target: { x: 0.3, y: 0.7 },
        power: 0.4,
        spin: 0.6,
        accuracy: 0.45,
        aiScore: 4.2,
        recommendations: ['Practice defensive positioning', 'Work on cue ball control']
      }
    ];

    // Mock player performance
    const mockPerformance: PlayerPerformance = {
      playerId: 'player-1',
      matchId: 'match-1',
      totalShots: 24,
      successfulShots: 18,
      shotAccuracy: 0.75,
      averagePower: 0.65,
      averageSpin: 0.45,
      positionControl: 0.72,
      safetySuccess: 0.68,
      breakSuccess: 0.82,
      overallScore: 7.8,
      strengths: ['Strong break shots', 'Good position play'],
      weaknesses: ['Defensive shots', 'Spin control'],
      improvementAreas: ['Safety shot accuracy', 'Cue ball control']
    };

    // Mock training program
    const mockTrainingProgram: TrainingProgram = {
      id: 'program-1',
      playerId: 'player-1',
      name: 'Advanced Position Play',
      description: 'Improve cue ball control and position play for better shot opportunities',
      difficulty: 'advanced',
      duration: 45,
      exercises: [
        {
          id: 'exercise-1',
          name: 'Position Control Drills',
          description: 'Practice controlling cue ball position after potting',
          type: 'position',
          difficulty: 'medium',
          duration: 15,
          instructions: [
            'Set up 3 balls in a line',
            'Pot the first ball and control position for the second',
            'Focus on cue ball placement',
            'Repeat 10 times'
          ],
          targetMetrics: {
            accuracy: 0.8,
            power: 0.6,
            position: 0.85,
            speed: 0.7
          },
          completed: false,
          score: 0
        }
      ],
      progress: 0,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock coaching recommendations
    const mockRecommendations: CoachingRecommendation[] = [
      {
        id: 'rec-1',
        playerId: 'player-1',
        type: 'shot',
        priority: 'high',
        title: 'Improve Safety Shot Accuracy',
        description: 'Your safety shots are missing the target by 15% on average',
        actionItems: [
          'Practice defensive positioning drills',
          'Work on cue ball control exercises',
          'Focus on target selection'
        ],
        expectedImprovement: 0.15,
        timeframe: '2 weeks',
        completed: false
      }
    ];

    this.shotAnalyses.set('match-1', mockShots);
    this.playerPerformances.set('player-1', [mockPerformance]);
    this.trainingPrograms.set('player-1', [mockTrainingProgram]);
    this.coachingRecommendations.set('player-1', mockRecommendations);
  }

  // Shot Analysis Methods
  public analyzeShot(shotData: Partial<ShotAnalysis>): ShotAnalysis {
    const shot: ShotAnalysis = {
      id: `shot-${Date.now()}`,
      timestamp: Date.now(),
      shotType: 'break',
      difficulty: 'medium',
      success: true,
      position: { x: 0.5, y: 0.5 },
      target: { x: 0.8, y: 0.2 },
      power: 0.7,
      spin: 0.3,
      accuracy: 0.85,
      aiScore: 8.5,
      recommendations: [],
      ...shotData
    };

    // AI analysis logic
    shot.aiScore = this.calculateAIScore(shot);
    shot.recommendations = this.generateRecommendations(shot);

    this.emit('shotAnalyzed', shot);
    return shot;
  }

  public getShotAnalyses(matchId: string): ShotAnalysis[] {
    return this.shotAnalyses.get(matchId) || [];
  }

  public getShotAnalysis(shotId: string): ShotAnalysis | null {
    for (const shots of this.shotAnalyses.values()) {
      const shot = shots.find(s => s.id === shotId);
      if (shot) return shot;
    }
    return null;
  }

  // Performance Analysis Methods
  public analyzePlayerPerformance(playerId: string, matchId: string): PlayerPerformance {
    const shots = this.shotAnalyses.get(matchId) || [];
    const performance = this.calculatePerformance(shots, playerId, matchId);
    
    this.playerPerformances.set(playerId, [
      ...(this.playerPerformances.get(playerId) || []),
      performance
    ]);

    this.emit('performanceAnalyzed', performance);
    return performance;
  }

  public getPlayerPerformance(playerId: string): PlayerPerformance[] {
    return this.playerPerformances.get(playerId) || [];
  }

  public getLatestPerformance(playerId: string): PlayerPerformance | null {
    const performances = this.playerPerformances.get(playerId) || [];
    return performances.length > 0 ? performances[performances.length - 1] : null;
  }

  // Training Program Methods
  public createTrainingProgram(playerId: string, performance: PlayerPerformance): TrainingProgram {
    const program = this.generatePersonalizedProgram(playerId, performance);
    
    this.trainingPrograms.set(playerId, [
      ...(this.trainingPrograms.get(playerId) || []),
      program
    ]);

    this.emit('trainingProgramCreated', program);
    return program;
  }

  public getTrainingPrograms(playerId: string): TrainingProgram[] {
    return this.trainingPrograms.get(playerId) || [];
  }

  public updateTrainingProgress(programId: string, progress: number): TrainingProgram | null {
    for (const programs of this.trainingPrograms.values()) {
      const program = programs.find(p => p.id === programId);
      if (program) {
        program.progress = progress;
        program.updatedAt = new Date();
        if (progress >= 100) {
          program.completed = true;
        }
        this.emit('trainingProgressUpdated', program);
        return program;
      }
    }
    return null;
  }

  public completeExercise(programId: string, exerciseId: string, score: number): boolean {
    for (const programs of this.trainingPrograms.values()) {
      const program = programs.find(p => p.id === programId);
      if (program) {
        const exercise = program.exercises.find(e => e.id === exerciseId);
        if (exercise) {
          exercise.completed = true;
          exercise.score = score;
          this.updateTrainingProgress(programId, this.calculateProgramProgress(program));
          return true;
        }
      }
    }
    return false;
  }

  // Coaching Recommendations Methods
  public generateCoachingRecommendations(playerId: string, performance: PlayerPerformance): CoachingRecommendation[] {
    const recommendations = this.analyzePerformanceForRecommendations(performance);
    
    this.coachingRecommendations.set(playerId, recommendations);
    this.emit('recommendationsGenerated', recommendations);
    return recommendations;
  }

  public getCoachingRecommendations(playerId: string): CoachingRecommendation[] {
    return this.coachingRecommendations.get(playerId) || [];
  }

  public markRecommendationComplete(recommendationId: string): boolean {
    for (const recommendations of this.coachingRecommendations.values()) {
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        recommendation.completed = true;
        this.emit('recommendationCompleted', recommendation);
        return true;
      }
    }
    return false;
  }

  // AI Analysis Methods
  private calculateAIScore(shot: ShotAnalysis): number {
    let score = 0;
    
    // Base score from success
    score += shot.success ? 5 : 2;
    
    // Difficulty bonus
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.5,
      'expert': 2.0
    };
    score *= difficultyMultiplier[shot.difficulty];
    
    // Accuracy bonus
    score += shot.accuracy * 3;
    
    // Position control bonus
    const positionAccuracy = this.calculatePositionAccuracy(shot.position, shot.target);
    score += positionAccuracy * 2;
    
    return Math.min(10, Math.max(0, score));
  }

  private generateRecommendations(shot: ShotAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (shot.accuracy < 0.7) {
      recommendations.push('Focus on aiming fundamentals');
      recommendations.push('Practice sighting techniques');
    }
    
    if (shot.power > 0.8) {
      recommendations.push('Reduce power for better control');
    }
    
    if (shot.spin > 0.6) {
      recommendations.push('Work on cue ball control');
    }
    
    if (!shot.success && shot.difficulty === 'hard') {
      recommendations.push('Consider a safety shot instead');
    }
    
    return recommendations;
  }

  private calculatePerformance(shots: ShotAnalysis[], playerId: string, matchId: string): PlayerPerformance {
    const playerShots = shots.filter(s => s.id.includes(playerId));
    const totalShots = playerShots.length;
    const successfulShots = playerShots.filter(s => s.success).length;
    
    const performance: PlayerPerformance = {
      playerId,
      matchId,
      totalShots,
      successfulShots,
      shotAccuracy: totalShots > 0 ? successfulShots / totalShots : 0,
      averagePower: playerShots.reduce((sum, s) => sum + s.power, 0) / totalShots,
      averageSpin: playerShots.reduce((sum, s) => sum + s.spin, 0) / totalShots,
      positionControl: this.calculatePositionControl(playerShots),
      safetySuccess: this.calculateSafetySuccess(playerShots),
      breakSuccess: this.calculateBreakSuccess(playerShots),
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      improvementAreas: []
    };
    
    performance.overallScore = this.calculateOverallScore(performance);
    performance.strengths = this.identifyStrengths(performance);
    performance.weaknesses = this.identifyWeaknesses(performance);
    performance.improvementAreas = this.identifyImprovementAreas(performance);
    
    return performance;
  }

  private generatePersonalizedProgram(playerId: string, performance: PlayerPerformance): TrainingProgram {
    const exercises: TrainingExercise[] = [];
    
    // Generate exercises based on weaknesses
    if (performance.safetySuccess < 0.7) {
      exercises.push({
        id: `exercise-${Date.now()}-1`,
        name: 'Safety Shot Mastery',
        description: 'Improve defensive shot accuracy and positioning',
        type: 'safety',
        difficulty: 'medium',
        duration: 20,
        instructions: [
          'Set up defensive scenarios',
          'Practice cue ball placement',
          'Focus on target selection',
          'Work on shot power control'
        ],
        targetMetrics: {
          accuracy: 0.8,
          power: 0.5,
          position: 0.75,
          speed: 0.6
        },
        completed: false,
        score: 0
      });
    }
    
    if (performance.positionControl < 0.7) {
      exercises.push({
        id: `exercise-${Date.now()}-2`,
        name: 'Position Play Excellence',
        description: 'Master cue ball control for better position play',
        type: 'position',
        difficulty: 'expert',
        duration: 25,
        instructions: [
          'Practice position drills',
          'Work on cue ball control',
          'Focus on shot selection',
          'Improve planning ahead'
        ],
        targetMetrics: {
          accuracy: 0.75,
          power: 0.65,
          position: 0.85,
          speed: 0.7
        },
        completed: false,
        score: 0
      });
    }
    
    return {
      id: `program-${Date.now()}`,
      playerId,
      name: 'Personalized Improvement Program',
      description: 'Custom training program based on your performance analysis',
      difficulty: this.determineProgramDifficulty(performance),
      duration: exercises.reduce((sum, e) => sum + e.duration, 0),
      exercises,
      progress: 0,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private analyzePerformanceForRecommendations(performance: PlayerPerformance): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    if (performance.safetySuccess < 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        playerId: performance.playerId,
        type: 'shot',
        priority: 'high',
        title: 'Improve Safety Shot Accuracy',
        description: `Your safety shots are successful only ${(performance.safetySuccess * 100).toFixed(1)}% of the time`,
        actionItems: [
          'Practice defensive positioning drills',
          'Work on cue ball control exercises',
          'Focus on target selection'
        ],
        expectedImprovement: 0.15,
        timeframe: '2 weeks',
        completed: false
      });
    }
    
    if (performance.positionControl < 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        playerId: performance.playerId,
        type: 'position',
        priority: 'medium',
        title: 'Enhance Position Play',
        description: 'Improve your cue ball control for better shot opportunities',
        actionItems: [
          'Practice position control drills',
          'Work on shot planning',
          'Focus on cue ball placement'
        ],
        expectedImprovement: 0.12,
        timeframe: '3 weeks',
        completed: false
      });
    }
    
    return recommendations;
  }

  // Helper Methods
  private calculatePositionAccuracy(position: { x: number; y: number }, target: { x: number; y: number }): number {
    const distance = Math.sqrt(
      Math.pow(position.x - target.x, 2) + Math.pow(position.y - target.y, 2)
    );
    return Math.max(0, 1 - distance);
  }

  private calculatePositionControl(shots: ShotAnalysis[]): number {
    if (shots.length === 0) return 0;
    
    const positionScores = shots.map(shot => 
      this.calculatePositionAccuracy(shot.position, shot.target)
    );
    
    return positionScores.reduce((sum, score) => sum + score, 0) / shots.length;
  }

  private calculateSafetySuccess(shots: ShotAnalysis[]): number {
    const safetyShots = shots.filter(s => s.shotType === 'safety');
    if (safetyShots.length === 0) return 0;
    
    const successfulSafeties = safetyShots.filter(s => s.success).length;
    return successfulSafeties / safetyShots.length;
  }

  private calculateBreakSuccess(shots: ShotAnalysis[]): number {
    const breakShots = shots.filter(s => s.shotType === 'break');
    if (breakShots.length === 0) return 0;
    
    const successfulBreaks = breakShots.filter(s => s.success).length;
    return successfulBreaks / breakShots.length;
  }

  private calculateOverallScore(performance: PlayerPerformance): number {
    return (
      performance.shotAccuracy * 0.3 +
      performance.positionControl * 0.25 +
      performance.safetySuccess * 0.2 +
      performance.breakSuccess * 0.15 +
      (performance.averagePower + performance.averageSpin) / 2 * 0.1
    ) * 10;
  }

  private identifyStrengths(performance: PlayerPerformance): string[] {
    const strengths: string[] = [];
    
    if (performance.breakSuccess > 0.8) strengths.push('Strong break shots');
    if (performance.shotAccuracy > 0.8) strengths.push('High shot accuracy');
    if (performance.positionControl > 0.8) strengths.push('Excellent position play');
    if (performance.safetySuccess > 0.8) strengths.push('Solid defensive play');
    
    return strengths;
  }

  private identifyWeaknesses(performance: PlayerPerformance): string[] {
    const weaknesses: string[] = [];
    
    if (performance.safetySuccess < 0.6) weaknesses.push('Defensive shot accuracy');
    if (performance.positionControl < 0.6) weaknesses.push('Cue ball control');
    if (performance.shotAccuracy < 0.6) weaknesses.push('Shot accuracy');
    if (performance.breakSuccess < 0.6) weaknesses.push('Break shot consistency');
    
    return weaknesses;
  }

  private identifyImprovementAreas(performance: PlayerPerformance): string[] {
    const areas: string[] = [];
    
    if (performance.safetySuccess < 0.7) areas.push('Safety shot accuracy');
    if (performance.positionControl < 0.7) areas.push('Cue ball control');
    if (performance.shotAccuracy < 0.7) areas.push('Shot accuracy');
    if (performance.breakSuccess < 0.7) areas.push('Break shot consistency');
    
    return areas;
  }

  private determineProgramDifficulty(performance: PlayerPerformance): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (performance.overallScore < 5) return 'beginner';
    if (performance.overallScore < 7) return 'intermediate';
    if (performance.overallScore < 8.5) return 'advanced';
    return 'expert';
  }

  private calculateProgramProgress(program: TrainingProgram): number {
    if (program.exercises.length === 0) return 0;
    
    const completedExercises = program.exercises.filter(e => e.completed).length;
    return (completedExercises / program.exercises.length) * 100;
  }

  // Public API Methods
  public subscribeToUpdates(callback: (event: string, data: unknown) => void): void {
    this.on('shotAnalyzed', (data) => callback('shotAnalyzed', data));
    this.on('performanceAnalyzed', (data) => callback('performanceAnalyzed', data));
    this.on('trainingProgramCreated', (data) => callback('trainingProgramCreated', data));
    this.on('trainingProgressUpdated', (data) => callback('trainingProgressUpdated', data));
    this.on('recommendationsGenerated', (data) => callback('recommendationsGenerated', data));
    this.on('recommendationCompleted', (data) => callback('recommendationCompleted', data));
  }

  public unsubscribeFromUpdates(_callback: (event: string, data: unknown) => void): void {
    this.removeAllListeners();
  }
}

export default MatchAnalysisService; 