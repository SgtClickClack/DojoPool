import { SocketIOService } from '../services/network/WebSocketService';
import { useEffect, useState } from 'react';
import { type Tournament } from '../types/tournament';
import { getTournaments } from '../api/tournaments';

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
        setError(
          err instanceof Error ? err : new Error('Failed to fetch tournaments')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();

    // Real-time updates
    const socket = SocketIOService;
    const handleTournamentUpdate = (notification: any) => {
      // notification: { type, tournament_id, update_type, data }
      // For simplicity, refetch the list on any update
      fetchTournaments();
    };
    socket.subscribe('tournament_update', handleTournamentUpdate);
    return () => {
      // Cleanup is handled by the subscribe method
    };
  }, []);

  return {
    tournaments,
    loading,
    error,
  };
};
