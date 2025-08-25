import { apiClient } from './apiClient';

export interface Challenge {
  id: string;
  challengerId: string;
  challengerUsername: string;
  challengedId: string;
  challengedUsername: string;
  wagerAmount?: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface ChallengeRequest {
  challengedPlayerId: string;
  wagerAmount?: number;
}

export interface ChallengeResponse {
  success: boolean;
  message: string;
  challenge?: Challenge;
}

class ChallengeService {
  async sendChallenge(request: ChallengeRequest): Promise<ChallengeResponse> {
    try {
      const response = await apiClient.post('/challenges/send', request);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send challenge';
      throw new Error(message);
    }
  }

  async acceptChallenge(challengeId: string): Promise<ChallengeResponse> {
    try {
      const response = await apiClient.post(
        `/challenges/${challengeId}/accept`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to accept challenge';
      throw new Error(message);
    }
  }

  async declineChallenge(challengeId: string): Promise<ChallengeResponse> {
    try {
      const response = await apiClient.post(
        `/challenges/${challengeId}/decline`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to decline challenge';
      throw new Error(message);
    }
  }

  async getPendingChallenges(): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
      return [];
    }
  }

  async getChallengeHistory(): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching challenge history:', error);
      return [];
    }
  }

  // Mock function for development - remove when backend is ready
  async sendMockChallenge(
    request: ChallengeRequest
  ): Promise<ChallengeResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockChallenge: Challenge = {
      id: `challenge_${Date.now()}`,
      challengerId: 'current_user',
      challengerUsername: 'CurrentUser',
      challengedId: request.challengedPlayerId,
      challengedUsername: `Player_${request.challengedPlayerId}`,
      wagerAmount: request.wagerAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    return {
      success: true,
      message: 'Challenge sent successfully!',
      challenge: mockChallenge,
    };
  }

  async acceptMockChallenge(challengeId: string): Promise<ChallengeResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Challenge accepted! Match will be created.',
    };
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
