import * as tf from '@tensorflow/tfjs';

interface PlayerStats {
  id: string;
  gamesPlayed: number;
  winRate: number;
  averageScore: number;
  preferredGameType: string;
  playStyle: string[];
  skillLevel: number;
  activeHours: string[];
  location: {
    lat: number;
    lng: number;
  };
}

interface MatchHistory {
  id: string;
  player1Id: string;
  player2Id: string;
  winner: string;
  score: {
    player1: number;
    player2: number;
  };
  gameType: string;
  timestamp: string;
  venue: string;
}

interface RecommendationCriteria {
  skillRange: number;
  locationRange: number;
  gameTypePreference?: string;
  availabilityMatch: boolean;
  minGamesPlayed: number;
}

interface PlayerRecommendation {
  playerId: string;
  matchScore: number;
  reasons: string[];
  skillDifference: number;
  distance: number;
  commonPlayTimes: string[];
  recommendedGameTypes: string[];
}

export class PlayerRecommender {
  private model: tf.LayersModel | null = null;
  private playerStats: Map<string, PlayerStats> = new Map();
  private matchHistory: MatchHistory[] = [];

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      this.model = await tf.loadLayersModel(
        '/models/player-recommender/model.json'
      );
    } catch (error) {
      console.error('Failed to load recommendation model:', error);
    }
  }

  public async updatePlayerStats(playerId: string, stats: PlayerStats) {
    this.playerStats.set(playerId, stats);
  }

  public async addMatchHistory(match: MatchHistory) {
    this.matchHistory.push(match);
  }

  private calculateSkillCompatibility(
    player1: PlayerStats,
    player2: PlayerStats
  ): number {
    const skillDiff = Math.abs(player1.skillLevel - player2.skillLevel);
    const maxSkillDiff = 10; // Assuming skill levels range from 0-100
    return 1 - skillDiff / maxSkillDiff;
  }

  private calculateLocationCompatibility(
    player1: PlayerStats,
    player2: PlayerStats
  ): number {
    const R = 6371; // Earth's radius in km
    const lat1 = (player1.location.lat * Math.PI) / 180;
    const lat2 = (player2.location.lat * Math.PI) / 180;
    const dLat =
      ((player2.location.lat - player1.location.lat) * Math.PI) / 180;
    const dLon =
      ((player2.location.lng - player1.location.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Convert distance to a 0-1 score (closer = higher score)
    const maxDistance = 50; // Maximum preferred distance in km
    return Math.max(0, 1 - distance / maxDistance);
  }

  private calculateScheduleCompatibility(
    player1: PlayerStats,
    player2: PlayerStats
  ): number {
    const commonHours = player1.activeHours.filter((hour) =>
      player2.activeHours.includes(hour)
    );
    return (
      commonHours.length /
      Math.max(player1.activeHours.length, player2.activeHours.length)
    );
  }

  private calculatePlayStyleCompatibility(
    player1: PlayerStats,
    player2: PlayerStats
  ): number {
    const commonStyles = player1.playStyle.filter((style) =>
      player2.playStyle.includes(style)
    );
    return (
      commonStyles.length /
      Math.max(player1.playStyle.length, player2.playStyle.length)
    );
  }

  private async predictMatchQuality(
    player1: PlayerStats,
    player2: PlayerStats
  ): Promise<number> {
    if (!this.model) return 0.5;

    // Prepare input features
    const features = tf.tensor2d([
      [
        player1.skillLevel,
        player2.skillLevel,
        player1.winRate,
        player2.winRate,
        this.calculateSkillCompatibility(player1, player2),
        this.calculateLocationCompatibility(player1, player2),
        this.calculateScheduleCompatibility(player1, player2),
        this.calculatePlayStyleCompatibility(player1, player2),
      ],
    ]);

    // Get prediction
    const prediction = (await this.model.predict(features)) as tf.Tensor;
    const score = (await prediction.data())[0];

    // Cleanup
    features.dispose();
    prediction.dispose();

    return score;
  }

  public async getRecommendations(
    playerId: string,
    criteria: RecommendationCriteria
  ): Promise<PlayerRecommendation[]> {
    const player = this.playerStats.get(playerId);
    if (!player) throw new Error('Player not found');

    const recommendations: PlayerRecommendation[] = [];

    // Calculate recommendations for each potential match
    for (const [candidateId, candidateStats] of this.playerStats.entries()) {
      if (candidateId === playerId) continue;
      if (candidateStats.gamesPlayed < criteria.minGamesPlayed) continue;

      const skillDifference = Math.abs(
        player.skillLevel - candidateStats.skillLevel
      );
      if (skillDifference > criteria.skillRange) continue;

      const locationCompatibility = this.calculateLocationCompatibility(
        player,
        candidateStats
      );
      if (locationCompatibility < 1 - criteria.locationRange) continue;

      const matchScore = await this.predictMatchQuality(player, candidateStats);
      const commonPlayTimes = player.activeHours.filter((hour) =>
        candidateStats.activeHours.includes(hour)
      );

      if (criteria.availabilityMatch && commonPlayTimes.length === 0) continue;

      const reasons: string[] = [];
      if (skillDifference <= 2) reasons.push('Similar skill level');
      if (locationCompatibility > 0.8) reasons.push('Nearby location');
      if (commonPlayTimes.length > 0) reasons.push('Compatible schedule');
      if (player.preferredGameType === candidateStats.preferredGameType) {
        reasons.push('Same game preference');
      }

      // Calculate recommended game types based on both players' stats
      const recommendedGameTypes = this.getRecommendedGameTypes(
        player,
        candidateStats
      );

      recommendations.push({
        playerId: candidateId,
        matchScore,
        reasons,
        skillDifference,
        distance: (1 - locationCompatibility) * 50, // Convert back to km
        commonPlayTimes,
        recommendedGameTypes,
      });
    }

    // Sort by match score and return top recommendations
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  private getRecommendedGameTypes(
    player1: PlayerStats,
    player2: PlayerStats
  ): string[] {
    const gameTypes = new Set<string>();

    // Add preferred game types from both players
    gameTypes.add(player1.preferredGameType);
    gameTypes.add(player2.preferredGameType);

    // Analyze match history for successful game types
    const commonMatches = this.matchHistory.filter(
      (match) =>
        (match.player1Id === player1.id && match.player2Id === player2.id) ||
        (match.player1Id === player2.id && match.player2Id === player1.id)
    );

    if (commonMatches.length > 0) {
      // Add game types from successful matches
      commonMatches.forEach((match) => {
        if (match.score.player1 > 0 && match.score.player2 > 0) {
          gameTypes.add(match.gameType);
        }
      });
    }

    return Array.from(gameTypes);
  }

  public async updateRecommendationModel(
    matches: MatchHistory[]
  ): Promise<void> {
    // This would typically be done on the server side
    // Here we're just simulating the model update process
    console.log('Updating recommendation model with new match data...');

    // In a real implementation, this would:
    // 1. Prepare training data from matches
    // 2. Retrain or fine-tune the model
    // 3. Save the updated model
    // 4. Update performance metrics
  }
}

export default PlayerRecommender;
