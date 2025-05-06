import { useState, useEffect } from 'react';
import { getTournaments } from '../api/tournaments';
import { Tournament } from '@/types/tournament';

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments();
        setTournaments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tournaments'));
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    error,
  };
};
