import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

interface Reward {
  id: string;
  name: string;
  description: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requiredScore: number;
  expiryDate: string;
  claimed: boolean;
  claimedAt?: string;
}

interface PlayerStats {
  userId: string;
  username: string;
  score: number;
  totalValue: number;
  rewards: Reward[];
  teamName: string;
}

export interface TournamentRewards {
  availableRewards: Reward[];
  claimedRewards: Reward[];
  totalValue: number;
  ranking: number;
  userScore: number;
  leaderboard: PlayerStats[];
}

export const useTournamentRewards = (tournamentId: string) => {
  const [rewards, setRewards] = useState<TournamentRewards>({
    availableRewards: [],
    claimedRewards: [],
    totalValue: 0,
    ranking: 0,
    userScore: 0,
    leaderboard: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/tournaments/${tournamentId}/rewards`
      );
      const rawRewards = response.data;

      // Calculate total value of available rewards
      const totalValue = rawRewards.availableRewards.reduce(
        (sum, reward) => sum + reward.value,
        0
      );

      // Sort leaderboard by score and total value
      const leaderboard = rawRewards.leaderboard.sort((a, b) => {
        if (a.score === b.score) {
          return b.totalValue - a.totalValue;
        }
        return b.score - a.score;
      });

      // Find user's ranking
      const ranking =
        leaderboard.findIndex((player) => player.userId === rawRewards.userId) +
        1;

      setRewards({
        availableRewards: rawRewards.availableRewards,
        claimedRewards: rawRewards.claimedRewards,
        totalValue,
        ranking,
        userScore: rawRewards.userScore,
        leaderboard,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      await axiosInstance.post(
        `/api/tournaments/${tournamentId}/rewards/${rewardId}/claim`
      );
      fetchRewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [tournamentId]);

  return {
    rewards,
    claimReward,
    loading,
    error,
  };
};
