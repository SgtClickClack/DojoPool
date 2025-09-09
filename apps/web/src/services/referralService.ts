import { apiClient } from './APIService';

export interface ReferralCodeResponse {
  referralCode: string;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
  totalEarned: number;
}

export interface ReferralDetails {
  id: string;
  referralCode: string;
  inviteeId?: string;
  inviteeUsername?: string;
  status: ReferralStatus;
  rewardStatus: RewardStatus;
  rewardAmount: number;
  inviteeReward: number;
  invitedAt?: Date;
  rewardClaimedAt?: Date;
  createdAt: Date;
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum RewardStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
}

class ReferralService {
  /**
   * Get user's referral code
   */
  async getReferralCode(): Promise<ReferralCodeResponse> {
    try {
      const response = await apiClient.get('/api/v1/referral/code');
      return {
        referralCode: response.data.referralCode,
        createdAt: new Date(response.data.createdAt),
      };
    } catch (error) {
      console.error('Error fetching referral code:', error);
      throw error;
    }
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const response = await apiClient.get('/api/v1/referral/status');
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed referral information
   */
  async getReferralDetails(): Promise<ReferralDetails[]> {
    try {
      const response = await apiClient.get('/api/v1/referral/status');
      return response.data.details.map((detail: any) => ({
        id: detail.id,
        referralCode: detail.referralCode,
        inviteeId: detail.inviteeId,
        inviteeUsername: detail.inviteeUsername,
        status: detail.status as ReferralStatus,
        rewardStatus: detail.rewardStatus as RewardStatus,
        rewardAmount: detail.rewardAmount,
        inviteeReward: detail.inviteeReward,
        invitedAt: detail.invitedAt ? new Date(detail.invitedAt) : undefined,
        rewardClaimedAt: detail.rewardClaimedAt
          ? new Date(detail.rewardClaimedAt)
          : undefined,
        createdAt: new Date(detail.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching referral details:', error);
      throw error;
    }
  }

  /**
   * Validate referral code
   */
  async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/v1/referral/validate', {
        referralCode,
      });
      return response.data.valid;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  /**
   * Process referral during signup
   */
  async processReferralSignup(referralCode: string): Promise<void> {
    try {
      await apiClient.post('/api/v1/referral/process-signup', {
        referralCode,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to process referral';
      throw new Error(message);
    }
  }
}

export const referralService = new ReferralService();
export default referralService;
