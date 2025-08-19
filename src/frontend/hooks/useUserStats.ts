import { useState, useEffect } from 'react';
import { getUserStats } from '../api/user';

interface UserStats {
  wins: number;
  losses: number;
  tournamentsJoined: number;
  tournamentWins: number;
  achievementProgress: {
    [key: string]: number;
  };
}

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
      wins: 0,
      losses: 0,
      tournamentsJoined: 0,
      tournamentWins: 0,
      achievementProgress: {},
    },
    loading,
    error,
  };
};
