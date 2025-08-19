import { useState, useEffect } from 'react';
import { getRewards, claimReward } from '../api/rewards';
import { type RewardItem } from '../types/rewards';

export const useRewards = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const data = await getRewards();
        setRewards(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch rewards')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const claimRewardHandler = async (rewardId: string) => {
    try {
      await claimReward(rewardId);
      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === rewardId ? { ...reward, isClaimed: true } : reward
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to claim reward')
      );
    }
  };

  return {
    rewards,
    loading,
    error,
    claimReward: claimRewardHandler,
  };
};
