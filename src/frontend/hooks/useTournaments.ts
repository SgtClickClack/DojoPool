import { useState, useEffect } from 'react';
import { getTournaments } from '../api/tournaments';

interface Tournament {
  id: string;
  name: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  matches: {
    id: string;
    player1: string | null;
    player2: string | null;
    score1: number;
    score2: number;
    winner: string | null;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  registrationDeadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  entryFee: number;
  divisions: string[];
}

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
