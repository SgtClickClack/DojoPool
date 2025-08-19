import { type RewardItem } from '../types/rewards';
import axiosInstance from './axiosInstance';

export const getRewards = async (): Promise<RewardItem[]> => {
  try {
    const response = await axiosInstance.get('/api/rewards');
    return response.data;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
};

export const claimReward = async (rewardId: string): Promise<boolean> => {
  try {
    await axiosInstance.post(`/api/rewards/${rewardId}/claim`);
    return true;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
};
