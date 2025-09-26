import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TournamentList from '@/components/Tournament/TournamentList';
import { useAuth } from '@/hooks/useAuth';
import { getTournaments, registerForTournament } from '@/services/APIService';
import type { Tournament as APITournament } from '@/services/APIService';
import type { Tournament } from '@/types/tournament';

// Type adapter to convert APIService Tournament to component Tournament
const adaptTournament = (apiTournament: APITournament): Tournament => ({
  id: apiTournament.id,
  name: apiTournament.name,
  description: apiTournament.description,
  venueId: apiTournament.venue?.id,
  startDate: apiTournament.startDate,
  endDate: apiTournament.endDate,
  status: apiTournament.status as any, // Map to TournamentStatus as needed
  maxPlayers: apiTournament.maxPlayers || 0,
  entryFee: apiTournament.entryFee || 0,
  prizePool: apiTournament.prizePool || 0,
  participants: [], // API doesn't provide participant list; fetch separately if needed
  createdAt: apiTournament.createdAt,
  updatedAt: apiTournament.updatedAt,
});

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        if (user) {
          // Use APIService to fetch tournaments
          const apiTournaments: APITournament[] = await getTournaments();
          // Adapt the API tournaments to component format
          const adaptedTournaments = apiTournaments.map(adaptTournament);
          setTournaments(adaptedTournaments);
        } else {
          setTournaments([]);
        }
      } catch (err) {
        setError('Failed to load tournaments');
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [user]);

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await registerForTournament(tournamentId, user.id);
      // Refresh tournaments list
      const apiTournaments: APITournament[] = await getTournaments();
      const adaptedTournaments = apiTournaments.map(adaptTournament);
      setTournaments(adaptedTournaments);
    } catch (err) {
      setError('Failed to join tournament');
      console.error('Error joining tournament:', err);
    }
  };

  const handleViewTournament = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  const handleFilterTournaments = (filter: string) => {
    // Implement filtering logic
    console.log('Filtering tournaments by:', filter);
  };

  if (loading) {
    return <div>Loading tournaments...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Tournaments</h1>
      <TournamentList
        tournaments={tournaments}
        onJoin={handleJoinTournament}
        onView={handleViewTournament}
        onFilter={handleFilterTournaments}
        loading={loading}
        error={error}
      />
    </div>
  );
}
