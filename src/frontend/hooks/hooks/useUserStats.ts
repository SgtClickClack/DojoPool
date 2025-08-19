import { useState, useEffect } from 'react';
import { getUserStats, type UserStats } from '../api/user';

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUserStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    stats: stats || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageScore: 0,
      totalPoints: 0,
    },
    loading,
    error,
  };
};
