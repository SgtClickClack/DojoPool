import { useState, useEffect } from 'react';
import { getRewards, claimReward } from '../api/rewards';

interface Reward {
  id: string;
  name: string;
  type: 'dojo_coins' | 'nft' | 'achievement' | 'boost';
  description: string;
  value: number;
  claimed: boolean;
  tournamentId: string;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
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

  const claimReward = async (rewardId: string) => {
    try {
      await claimReward(rewardId);
      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === rewardId ? { ...reward, claimed: true } : reward
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
    claimReward,
  };
};
