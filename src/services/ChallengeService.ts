import { api } from './api';

export interface Challenge {
  id: string;
  type: 'pilgrimage' | 'gauntlet' | 'duel';
  challengerId: string;
  defenderId: string;
  dojoId: string;
  status: 'active' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  winnerId?: string;
  requirements: {
    wins: number;
    topTenDefeats: number;
    masterDefeat: number;
  };
  matchData?: any;
}

export interface CreateChallengeRequest {
  type: 'pilgrimage' | 'gauntlet' | 'duel';
  defenderId: string;
  dojoId: string;
  requirements?: {
    wins: number;
    topTenDefeats: number;
    masterDefeat: number;
  };
}

export interface CompleteChallengeRequest {
  winnerId: string;
  matchData?: any;
}

export class ChallengeService {
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
   * Accept a challenge
   */
  static async acceptChallenge(challengeId: string): Promise<Challenge> {
    try {
      const response = await api.post(`/api/challenge/${challengeId}/accept`);
      return response.data.data;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  /**
   * Decline a challenge
   */
  static async declineChallenge(challengeId: string): Promise<Challenge> {
    try {
      const response = await api.post(`/api/challenge/${challengeId}/decline`);
      return response.data.data;
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
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
  static getChallengeRequirements(type: 'pilgrimage' | 'gauntlet' | 'duel') {
    const requirements = {
      pilgrimage: {
        wins: 2,
        topTenDefeats: 2,
        masterDefeat: 1,
        description: 'Defeat 2 Top Ten players and the Dojo Master to claim the venue'
      },
      gauntlet: {
        wins: 5,
        topTenDefeats: 3,
        masterDefeat: 1,
        description: 'Complete a series of matches against the venue\'s best players'
      },
      duel: {
        wins: 1,
        topTenDefeats: 0,
        masterDefeat: 0,
        description: 'Direct challenge against a specific player'
      }
    };

    return requirements[type];
  }

  /**
   * Format challenge status for display
   */
  static formatChallengeStatus(status: string): string {
    const statusMap = {
      active: 'Pending Response',
      accepted: 'Accepted',
      declined: 'Declined',
      completed: 'Completed'
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
      duel: 'Duel'
    };

    return typeMap[type as keyof typeof typeMap] || type;
  }
} 