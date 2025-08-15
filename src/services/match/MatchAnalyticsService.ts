import { MatchData, MatchEvent, MatchAnalytics, PlayerPerformance, GameFlowData } from '.js';

export class MatchAnalyticsService {
  async analyzeShot(shotData: any): Promise<any> {
    // AI analysis of shot data
    const analysis = {
      difficulty: this.calculateShotDifficulty(shotData),
      skill: this.calculateShotSkill(shotData),
      luck: this.calculateShotLuck(shotData),
      impact: this.calculateShotImpact(shotData),
    };

    return {
      ...analysis,
      timestamp: new Date(),
      confidence: 0.85, // Mock confidence score
    };
  }

  async analyzeFoul(foulData: any): Promise<any> {
    // AI analysis of foul data
    const analysis = {
      severity: this.calculateFoulSeverity(foulData),
      intent: this.calculateFoulIntent(foulData),
      impact: this.calculateFoulImpact(foulData),
    };

    return {
      ...analysis,
      timestamp: new Date(),
      confidence: 0.90, // Mock confidence score
    };
  }

  updateMatchAnalytics(matchId: string, match: MatchData): void {
    const analytics = this.generateAnalytics(match);
    match.matchAnalytics = analytics;
  }

  async generateFinalAnalytics(match: MatchData): Promise<MatchAnalytics> {
    return this.generateAnalytics(match);
  }

  private generateAnalytics(match: MatchData): MatchAnalytics {
    const shots = match.events.filter(e => e.type === 'shot');
    const fouls = match.events.filter(e => e.type === 'foul');
    const breaks = match.events.filter(e => e.type === 'break');

    const totalShots = shots.length;
    const successfulShots = shots.filter(s => s.data?.success).length;
    const averageShotTime = this.calculateAverageShotTime(match);
    const playerPerformance = this.calculatePlayerPerformance(match);
    const gameFlow = this.calculateGameFlow(match);
    const skillGap = this.calculateSkillGap(match);
    const excitementLevel = this.calculateExcitementLevel(match);

    return {
      totalShots,
      successfulShots,
      fouls: fouls.length,
      breaks: breaks.length,
      averageShotTime,
      playerPerformance,
      gameFlow,
      skillGap,
      excitementLevel,
    };
  }

  private calculateAverageShotTime(match: MatchData): number {
    const shots = match.events.filter(e => e.type === 'shot');
    if (shots.length === 0) return 0;

    const totalTime = shots.reduce((acc, shot, index) => {
      if (index === 0) return 0;
      const prevShot = shots[index - 1];
      return acc + (shot.timestamp.getTime() - prevShot.timestamp.getTime());
    }, 0);

    return totalTime / (shots.length - 1);
  }

  private calculatePlayerPerformance(match: MatchData): { player1: PlayerPerformance; player2: PlayerPerformance } {
    const player1Events = match.events.filter(e => e.playerId === match.player1Id);
    const player2Events = match.events.filter(e => e.playerId === match.player2Id);

    return {
      player1: this.calculateIndividualPerformance(player1Events),
      player2: this.calculateIndividualPerformance(player2Events),
    };
  }

  private calculateIndividualPerformance(events: MatchEvent[]): PlayerPerformance {
    const shots = events.filter(e => e.type === 'shot');
    const fouls = events.filter(e => e.type === 'foul');
    const breaks = events.filter(e => e.type === 'break');

    const successfulShots = shots.filter(s => s.data?.success).length;
    const accuracy = shots.length > 0 ? successfulShots / shots.length : 0;
    const consistency = this.calculateConsistency(shots);
    const pressureHandling = this.calculatePressureHandling(events);

    return {
      shots: shots.length,
      successfulShots,
      fouls: fouls.length,
      breaks: breaks.length,
      averageShotTime: this.calculateAverageShotTimeForPlayer(shots),
      accuracy,
      consistency,
      pressureHandling,
    };
  }

  private calculateConsistency(shots: MatchEvent[]): number {
    if (shots.length < 2) return 1.0;

    const accuracies = shots.map(shot => shot.data?.accuracy || 0);
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // Higher consistency = lower standard deviation
    return Math.max(0, 1 - (stdDev / mean));
  }

  private calculatePressureHandling(events: MatchEvent[]): number {
    const pressureEvents = events.filter(e => 
      e.type === 'shot' && e.data?.pressureLevel > 0.7
    );

    if (pressureEvents.length === 0) return 1.0;

    const pressureAccuracy = pressureEvents.filter(e => e.data?.success).length / pressureEvents.length;
    return pressureAccuracy;
  }

  private calculateGameFlow(match: MatchData): GameFlowData[] {
    const flowData: GameFlowData[] = [];
    const events = match.events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    events.forEach((event, index) => {
      const score = this.getScoreAtTime(match, event.timestamp);
      const momentum = this.calculateMomentum(match, index);
      const excitement = this.calculateExcitementAtTime(match, event.timestamp);

      flowData.push({
        timestamp: event.timestamp,
        score,
        momentum,
        excitement,
      });
    });

    return flowData;
  }

  private getScoreAtTime(match: MatchData, timestamp: Date): { player1: number; player2: number } {
    const eventsBeforeTime = match.events.filter(e => e.timestamp <= timestamp);
    let player1Score = 0;
    let player2Score = 0;

    eventsBeforeTime.forEach(event => {
      if (event.type === 'shot' && event.data?.success) {
        if (event.playerId === match.player1Id) {
          player1Score++;
        } else if (event.playerId === match.player2Id) {
          player2Score++;
        }
      }
    });

    return { player1: player1Score, player2: player2Score };
  }

  private calculateMomentum(match: MatchData, eventIndex: number): number {
    const recentEvents = match.events.slice(Math.max(0, eventIndex - 5), eventIndex + 1);
    const successfulShots = recentEvents.filter(e => e.type === 'shot' && e.data?.success).length;
    const totalShots = recentEvents.filter(e => e.type === 'shot').length;

    return totalShots > 0 ? successfulShots / totalShots : 0.5;
  }

  private calculateExcitementAtTime(match: MatchData, timestamp: Date): number {
    const recentEvents = match.events.filter(e => 
      e.timestamp >= new Date(timestamp.getTime() - 60000) && // Last minute
      e.timestamp <= timestamp
    );

    const amazingShots = recentEvents.filter(e => 
      e.type === 'shot' && e.data?.difficulty > 0.8
    ).length;

    const comebacks = this.detectComebacks(match, timestamp);
    const clutchPlays = this.detectClutchPlays(match, timestamp);

    return Math.min(1, (amazingShots * 0.3 + comebacks * 0.4 + clutchPlays * 0.3));
  }

  private calculateSkillGap(match: MatchData): number {
    const player1Performance = this.calculateIndividualPerformance(
      match.events.filter(e => e.playerId === match.player1Id)
    );
    const player2Performance = this.calculateIndividualPerformance(
      match.events.filter(e => e.playerId === match.player2Id)
    );

    const skillDiff = Math.abs(player1Performance.accuracy - player2Performance.accuracy);
    return Math.min(1, skillDiff * 2); // Normalize to 0-1 range
  }

  private calculateExcitementLevel(match: MatchData): number {
    const totalEvents = match.events.length;
    const amazingShots = match.events.filter(e => 
      e.type === 'shot' && e.data?.difficulty > 0.8
    ).length;
    const fouls = match.events.filter(e => e.type === 'foul').length;
    const breaks = match.events.filter(e => e.type === 'break').length;

    const excitementScore = (amazingShots * 0.4 + fouls * 0.2 + breaks * 0.3) / totalEvents;
    return Math.min(1, excitementScore * 5); // Scale up and cap at 1
  }

  private calculateAverageShotTimeForPlayer(shots: MatchEvent[]): number {
    if (shots.length < 2) return 0;

    const totalTime = shots.reduce((acc, shot, index) => {
      if (index === 0) return 0;
      const prevShot = shots[index - 1];
      return acc + (shot.timestamp.getTime() - prevShot.timestamp.getTime());
    }, 0);

    return totalTime / (shots.length - 1);
  }

  private detectComebacks(match: MatchData, timestamp: Date): number {
    // Simplified comeback detection
    const eventsBeforeTime = match.events.filter(e => e.timestamp <= timestamp);
    if (eventsBeforeTime.length < 10) return 0;

    const recentScore = this.getScoreAtTime(match, timestamp);
    const scoreDiff = Math.abs(recentScore.player1 - recentScore.player2);
    
    return scoreDiff > 3 ? 0.5 : 0;
  }

  private detectClutchPlays(match: MatchData, timestamp: Date): number {
    // Simplified clutch play detection
    const recentEvents = match.events.filter(e => 
      e.timestamp >= new Date(timestamp.getTime() - 30000) && // Last 30 seconds
      e.timestamp <= timestamp
    );

    const clutchShots = recentEvents.filter(e => 
      e.type === 'shot' && e.data?.success && e.data?.pressureLevel > 0.8
    ).length;

    return Math.min(1, clutchShots * 0.3);
  }

  // Helper methods for shot analysis
  private calculateShotDifficulty(shotData: any): number {
    // Mock difficulty calculation
    return Math.random() * 0.5 + 0.3;
  }

  private calculateShotSkill(shotData: any): number {
    // Mock skill calculation
    return Math.random() * 0.4 + 0.4;
  }

  private calculateShotLuck(shotData: any): number {
    // Mock luck calculation
    return Math.random() * 0.3 + 0.1;
  }

  private calculateShotImpact(shotData: any): number {
    // Mock impact calculation
    return Math.random() * 0.5 + 0.3;
  }

  // Helper methods for foul analysis
  private calculateFoulSeverity(foulData: any): number {
    // Mock severity calculation
    return Math.random() * 0.5 + 0.3;
  }

  private calculateFoulIntent(foulData: any): number {
    // Mock intent calculation
    return Math.random() * 0.4 + 0.2;
  }

  private calculateFoulImpact(foulData: any): number {
    // Mock impact calculation
    return Math.random() * 0.5 + 0.3;
  }
} 
