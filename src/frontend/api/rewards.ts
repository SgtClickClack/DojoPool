import { type RewardItem } from '../../../packages/types/src/types/rewards';
import apiClient from './axiosInstance';

export const getRewards = async (): Promise<RewardItem[]> => {
  try {
    const response = await apiClient.get('/api/rewards');
    return response.data;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
};

export const claimReward = async (rewardId: string): Promise<boolean> => {
  try {
    await apiClient.post(`/api/rewards/${rewardId}/claim`);
    return true;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
};
