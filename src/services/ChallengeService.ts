import { api } from './api';

export interface ChallengeRequirements {
  minLevel: number;
  minWins: number;
  minTopTenDefeats: number;
  minMasterDefeats: number;
  requiredClanMembership?: string;
  requiredTerritoryControl?: boolean;
  maxActiveChallenges: number;
  cooldownPeriod: number;
}

export interface PlayerEligibility {
  isEligible: boolean;
  reasons: string[];
  missingRequirements: Partial<ChallengeRequirements>;
}

export interface Challenge {
  id: string;
  type: 'pilgrimage' | 'gauntlet' | 'duel' | 'clan_war';
  challengerId: string;
  defenderId: string;
  dojoId: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  expiredAt?: string;
  winnerId?: string;
  requirements: ChallengeRequirements;
  eligibility?: {
    challenger: PlayerEligibility;
    defender: PlayerEligibility;
  };
  matchData?: any;
}

export interface CreateChallengeRequest {
  type: 'pilgrimage' | 'gauntlet' | 'duel' | 'clan_war';
  defenderId: string;
  dojoId: string;
  challengerId?: string;
}

export interface CompleteChallengeRequest {
  winnerId: string;
  matchData?: any;
}

export interface ChallengeStats {
  totalChallenges: number;
  pendingChallenges: number;
  acceptedChallenges: number;
  declinedChallenges: number;
  expiredChallenges: number;
  completedChallenges: number;
  challengesByType: Record<string, number>;
  recentChallenges: Challenge[];
}

export class ChallengeService {
  /**
   * Check player eligibility for a challenge type
   */
  static async checkEligibility(playerId: string, challengeType: string): Promise<{
    eligibility: PlayerEligibility;
    requirements: ChallengeRequirements;
  }> {
    try {
      const response = await api.post('/api/challenge/check-eligibility', {
        playerId,
        challengeType
      });
      return response.data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  }

  /**
   * Create a new challenge
   */
  static async createChallenge(challenge: CreateChallengeRequest): Promise<Challenge> {
    try {
      const response = await api.post('/api/challenge/create', challenge);
      return response.data.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  /**
   * Get active challenges for current user
   */
  static async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const response = await api.get('/api/challenge/active');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      return [];
    }
  }

  /**
   * Respond to a challenge (accept/decline)
   */
  static async respondToChallenge(challengeId: string, response: 'accept' | 'decline'): Promise<Challenge> {
    try {
      const apiResponse = await api.post(`/api/challenge/${challengeId}/respond`, { response });
      return apiResponse.data.data;
    } catch (error) {
      console.error('Error responding to challenge:', error);
      throw error;
    }
  }

  /**
   * Accept a challenge
   */
  static async acceptChallenge(challengeId: string): Promise<Challenge> {
    return this.respondToChallenge(challengeId, 'accept');
  }

  /**
   * Decline a challenge
   */
  static async declineChallenge(challengeId: string): Promise<Challenge> {
    return this.respondToChallenge(challengeId, 'decline');
  }

  /**
   * Complete a challenge with match result
   */
  static async completeChallenge(challengeId: string, result: CompleteChallengeRequest): Promise<Challenge> {
    try {
      const response = await api.post(`/api/challenge/${challengeId}/complete`, result);
      return response.data.data;
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  }

  /**
   * Get challenge details by ID
   */
  static async getChallengeDetails(challengeId: string): Promise<Challenge> {
    try {
      const response = await api.get(`/api/challenge/${challengeId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      throw error;
    }
  }

  /**
   * Get challenges for a specific dojo
   */
  static async getDojoChallenges(dojoId: string): Promise<Challenge[]> {
    try {
      const response = await api.get(`/api/challenge/dojo/${dojoId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching dojo challenges:', error);
      return [];
    }
  }

  /**
   * Get challenge history for current user
   */
  static async getChallengeHistory(): Promise<Challenge[]> {
    try {
      const response = await api.get('/api/challenge/history');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching challenge history:', error);
      return [];
    }
  }

  /**
   * Get challenge statistics for a player
   */
  static async getChallengeStats(playerId: string): Promise<ChallengeStats> {
    try {
      const response = await api.get(`/api/challenge/stats/${playerId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      throw error;
    }
  }

  /**
   * Get expired challenges
   */
  static async getExpiredChallenges(): Promise<Challenge[]> {
    try {
      const response = await api.get('/api/challenge/expired');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching expired challenges:', error);
      return [];
    }
  }

  /**
   * Clean up expired challenges
   */
  static async cleanupExpiredChallenges(): Promise<{ cleanedCount: number }> {
    try {
      const response = await api.post('/api/challenge/cleanup-expired');
      return response.data;
    } catch (error) {
      console.error('Error cleaning up expired challenges:', error);
      throw error;
    }
  }

  /**
   * Check if user can create a challenge against a specific player
   */
  static async canChallengePlayer(playerId: string, dojoId: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/challenge/can-challenge`, {
        params: { playerId, dojoId }
      });
      return response.data.canChallenge;
    } catch (error) {
      console.error('Error checking challenge eligibility:', error);
      return false;
    }
  }

  /**
   * Get challenge requirements for a specific type
   */
  static getChallengeRequirements(type: 'pilgrimage' | 'gauntlet' | 'duel' | 'clan_war') {
    const requirements = {
      pilgrimage: {
        minLevel: 5,
        minWins: 10,
        minTopTenDefeats: 3,
        minMasterDefeats: 1,
        maxActiveChallenges: 2,
        cooldownPeriod: 24 * 60 * 60 * 1000,
        description: 'Defeat 2 Top Ten players and the Dojo Master to claim the venue'
      },
      gauntlet: {
        minLevel: 10,
        minWins: 25,
        minTopTenDefeats: 5,
        minMasterDefeats: 2,
        requiredClanMembership: 'active',
        maxActiveChallenges: 1,
        cooldownPeriod: 48 * 60 * 60 * 1000,
        description: 'Complete a series of matches against the venue\'s best players'
      },
      duel: {
        minLevel: 1,
        minWins: 0,
        minTopTenDefeats: 0,
        minMasterDefeats: 0,
        maxActiveChallenges: 5,
        cooldownPeriod: 2 * 60 * 60 * 1000,
        description: 'Direct challenge against a specific player'
      },
      clan_war: {
        minLevel: 15,
        minWins: 50,
        minTopTenDefeats: 10,
        minMasterDefeats: 3,
        requiredClanMembership: 'leader',
        requiredTerritoryControl: true,
        maxActiveChallenges: 1,
        cooldownPeriod: 168 * 60 * 60 * 1000,
        description: 'Clan vs clan battle with territory stakes'
      }
    };

    return requirements[type];
  }

  /**
   * Format challenge status for display
   */
  static formatChallengeStatus(status: string): string {
    const statusMap = {
      pending: 'Pending Response',
      accepted: 'Accepted',
      declined: 'Declined',
      completed: 'Completed',
      expired: 'Expired'
    };

    return statusMap[status as keyof typeof statusMap] || status;
  }

  /**
   * Get challenge type display name
   */
  static getChallengeTypeName(type: string): string {
    const typeMap = {
      pilgrimage: 'Pilgrimage',
      gauntlet: 'Gauntlet',
      duel: 'Duel',
      clan_war: 'Clan War'
    };

    return typeMap[type as keyof typeof typeMap] || type;
  }

  /**
   * Get challenge type description
   */
  static getChallengeTypeDescription(type: string): string {
    const requirements = this.getChallengeRequirements(type as any);
    return requirements?.description || 'Challenge another player';
  }

  /**
   * Check if challenge is expired
   */
  static isChallengeExpired(challenge: Challenge): boolean {
    if (!challenge.expiresAt) return false;
    return new Date() > new Date(challenge.expiresAt);
  }

  /**
   * Get time remaining until challenge expires
   */
  static getTimeUntilExpiration(challenge: Challenge): number {
    if (!challenge.expiresAt) return 0;
    const expirationDate = new Date(challenge.expiresAt);
    const now = new Date();
    return Math.max(0, expirationDate.getTime() - now.getTime());
  }

  /**
   * Format time remaining as human readable string
   */
  static formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
} 