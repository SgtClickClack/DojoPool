import { MatchData, MatchAnalytics } from '.js';

export interface MatchRewards {
  experience: number;
  achievements: string[];
  territoryControl?: boolean;
  clanInfluence?: number;
  dojoCoins?: number;
  skillPoints?: number;
  reputation?: number;
}

export interface MatchResult {
  matchId: string;
  challengeId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  matchDuration: number;
  analytics: MatchAnalytics;
  highlights: any[];
  rewards: MatchRewards;
}

export class MatchRewardsService {
  async calculateRewards(match: MatchData, winnerId: string): Promise<MatchRewards> {
    const baseExperience = this.calculateBaseExperience(match);
    const performanceBonus = this.calculatePerformanceBonus(match, winnerId);
    const skillBonus = this.calculateSkillBonus(match);
    const excitementBonus = this.calculateExcitementBonus(match);

    const totalExperience = baseExperience + performanceBonus + skillBonus + excitementBonus;
    const achievements = this.detectAchievements(match, winnerId);
    const territoryControl = this.checkTerritoryControl(match, winnerId);
    const clanInfluence = this.calculateClanInfluence(match, winnerId);
    const dojoCoins = this.calculateDojoCoins(match, winnerId);
    const skillPoints = this.calculateSkillPoints(match, winnerId);
    const reputation = this.calculateReputation(match, winnerId);

    return {
      experience: totalExperience,
      achievements,
      territoryControl,
      clanInfluence,
      dojoCoins,
      skillPoints,
      reputation,
    };
  }

  async completeMatch(match: MatchData, winnerId: string): Promise<MatchResult> {
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const winnerScore = winnerId === match.player1Id ? match.score.player1 : match.score.player2;
    const loserScore = winnerId === match.player1Id ? match.score.player2 : match.score.player1;
    const matchDuration = match.endTime ? match.endTime.getTime() - match.startTime.getTime() : 0;

    const rewards = await this.calculateRewards(match, winnerId);

    const result: MatchResult = {
      matchId: match.id,
      challengeId: match.challengeId,
      winnerId,
      loserId,
      winnerScore,
      loserScore,
      matchDuration,
      analytics: match.matchAnalytics!,
      highlights: match.highlights || [],
      rewards,
    };

    return result;
  }

  private calculateBaseExperience(match: MatchData): number {
    const baseExp = 100; // Base experience for completing a match
    const durationBonus = Math.floor(match.events.length * 5); // Bonus for longer matches
    return baseExp + durationBonus;
  }

  private calculatePerformanceBonus(match: MatchData, winnerId: string): number {
    const winnerEvents = match.events.filter(e => e.playerId === winnerId);
    const shots = winnerEvents.filter(e => e.type === 'shot');
    const successfulShots = shots.filter(s => s.data?.success).length;
    const accuracy = shots.length > 0 ? successfulShots / shots.length : 0;

    return Math.floor(accuracy * 200); // Up to 200 bonus for perfect accuracy
  }

  private calculateSkillBonus(match: MatchData): number {
    const analytics = match.matchAnalytics;
    if (!analytics) return 0;

    const skillGap = analytics.skillGap;
    const excitementLevel = analytics.excitementLevel;

    // Bonus for high-skill matches
    return Math.floor((skillGap + excitementLevel) * 150);
  }

  private calculateExcitementBonus(match: MatchData): number {
    const analytics = match.matchAnalytics;
    if (!analytics) return 0;

    const excitementLevel = analytics.excitementLevel;
    const amazingShots = match.events.filter(e => 
      e.type === 'shot' && e.data?.difficulty > 0.8
    ).length;

    return Math.floor(excitementLevel * 100 + amazingShots * 25);
  }

  private detectAchievements(match: MatchData, winnerId: string): string[] {
    const achievements: string[] = [];
    const winnerEvents = match.events.filter(e => e.playerId === winnerId);
    const analytics = match.matchAnalytics;

    // Perfect Game achievement
    const winnerShots = winnerEvents.filter(e => e.type === 'shot');
    const successfulShots = winnerShots.filter(s => s.data?.success).length;
    if (winnerShots.length > 0 && successfulShots === winnerShots.length) {
      achievements.push('Perfect Game');
    }

    // Comeback King achievement
    const finalScore = this.getFinalScore(match);
    const winnerScore = winnerId === match.player1Id ? finalScore.player1 : finalScore.player2;
    const loserScore = winnerId === match.player1Id ? finalScore.player2 : finalScore.player1;
    if (loserScore >= 3 && winnerScore > loserScore) {
      achievements.push('Comeback King');
    }

    // Skill Master achievement
    if (analytics && analytics.playerPerformance) {
      const winnerPerformance = winnerId === match.player1Id 
        ? analytics.playerPerformance.player1 
        : analytics.playerPerformance.player2;
      
      if (winnerPerformance.accuracy > 0.8 && winnerPerformance.consistency > 0.8) {
        achievements.push('Skill Master');
      }
    }

    // First Victory achievement (simplified)
    if (match.events.length < 20) { // Assuming first few matches
      achievements.push('First Victory');
    }

    return achievements;
  }

  private checkTerritoryControl(match: MatchData, winnerId: string): boolean {
    // Simplified territory control logic
    const winnerEvents = match.events.filter(e => e.playerId === winnerId);
    const amazingShots = winnerEvents.filter(e => 
      e.type === 'shot' && e.data?.difficulty > 0.9
    ).length;

    return amazingShots >= 3; // Control territory with 3+ amazing shots
  }

  private calculateClanInfluence(match: MatchData, winnerId: string): number {
    // Simplified clan influence calculation
    const baseInfluence = 10;
    const performanceBonus = this.calculatePerformanceBonus(match, winnerId) / 10;
    const achievementBonus = this.detectAchievements(match, winnerId).length * 5;

    return Math.floor(baseInfluence + performanceBonus + achievementBonus);
  }

  private calculateDojoCoins(match: MatchData, winnerId: string): number {
    const baseCoins = 50;
    const performanceBonus = this.calculatePerformanceBonus(match, winnerId) / 5;
    const achievementBonus = this.detectAchievements(match, winnerId).length * 10;
    const excitementBonus = this.calculateExcitementBonus(match) / 10;

    return Math.floor(baseCoins + performanceBonus + achievementBonus + excitementBonus);
  }

  private calculateSkillPoints(match: MatchData, winnerId: string): number {
    const analytics = match.matchAnalytics;
    if (!analytics) return 0;

    const winnerPerformance = winnerId === match.player1Id 
      ? analytics.playerPerformance.player1 
      : analytics.playerPerformance.player2;

    const accuracyPoints = Math.floor(winnerPerformance.accuracy * 20);
    const consistencyPoints = Math.floor(winnerPerformance.consistency * 15);
    const pressurePoints = Math.floor(winnerPerformance.pressureHandling * 25);

    return accuracyPoints + consistencyPoints + pressurePoints;
  }

  private calculateReputation(match: MatchData, winnerId: string): number {
    const baseReputation = 5;
    const achievementBonus = this.detectAchievements(match, winnerId).length * 3;
    const skillBonus = this.calculateSkillBonus(match) / 20;
    const excitementBonus = this.calculateExcitementBonus(match) / 15;

    return Math.floor(baseReputation + achievementBonus + skillBonus + excitementBonus);
  }

  private getFinalScore(match: MatchData): { player1: number; player2: number } {
    let player1Score = 0;
    let player2Score = 0;

    match.events.forEach(event => {
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

  // Additional reward calculation methods
  calculateLoserRewards(match: MatchData, loserId: string): MatchRewards {
    const baseExperience = Math.floor(this.calculateBaseExperience(match) * 0.3);
    const participationBonus = 25;
    const learningBonus = this.calculateLearningBonus(match, loserId);

    return {
      experience: baseExperience + participationBonus + learningBonus,
      achievements: this.detectLoserAchievements(match, loserId),
      dojoCoins: Math.floor(this.calculateDojoCoins(match, loserId) * 0.2),
      skillPoints: Math.floor(this.calculateSkillPoints(match, loserId) * 0.5),
      reputation: Math.floor(this.calculateReputation(match, loserId) * 0.3),
    };
  }

  private calculateLearningBonus(match: MatchData, loserId: string): number {
    const loserEvents = match.events.filter(e => e.playerId === loserId);
    const shots = loserEvents.filter(e => e.type === 'shot');
    
    // Bonus for attempting difficult shots
    const difficultShots = shots.filter(s => s.data?.difficulty > 0.7).length;
    return difficultShots * 5;
  }

  private detectLoserAchievements(match: MatchData, loserId: string): string[] {
    const achievements: string[] = [];
    const loserEvents = match.events.filter(e => e.playerId === loserId);

    // Good Sport achievement
    const fouls = loserEvents.filter(e => e.type === 'foul');
    if (fouls.length === 0) {
      achievements.push('Good Sport');
    }

    // Determined achievement
    const shots = loserEvents.filter(e => e.type === 'shot');
    if (shots.length >= 10) {
      achievements.push('Determined');
    }

    return achievements;
  }
} 
