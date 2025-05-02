import { useState, useEffect } from 'react';
import { getTournament } from '../api/tournaments';

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

export const useTournament = (tournamentId: string) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const data = await getTournament(tournamentId);
        setTournament(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tournament'));
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId]);

  return {
    tournament: tournament || {
      id: '',
      name: 'Loading...',
      type: 'single_elimination',
      matches: [],
      registrationDeadline: '',
      status: 'pending',
      entryFee: 0,
      divisions: ['open'],
    },
    loading,
    error,
  };
};
