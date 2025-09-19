import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/APIService';
import TournamentForm from '@/components/venue/TournamentForm';
import TournamentList from '@/components/venue/TournamentList';
import styles from './tournaments.module.css';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: string;
  startTime: string;
  endTime?: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  format: string;
  _count?: {
    participants: number;
    matches: number;
  };
}

export default function VenuePortalTournaments() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTournaments();
    }
  }, [user, authLoading, router]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/venues/me/tournaments');
      setTournaments(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (tournamentData: any) => {
    try {
      const response = await apiClient.post('/venues/me/tournaments', tournamentData);
      setTournaments([response.data, ...tournaments]);
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create tournament:', err);
      setError('Failed to create tournament. Please try again.');
    }
  };

  const handleUpdateTournament = async (tournamentId: string, updateData: any) => {
    try {
      const response = await apiClient.patch(`/venues/me/tournaments/${tournamentId}`, updateData);
      setTournaments(tournaments.map(t => t.id === tournamentId ? response.data : t));
      setSelectedTournament(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update tournament:', err);
      setError('Failed to update tournament. Please try again.');
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      const response = await apiClient.post(`/venues/me/tournaments/${tournamentId}/start`, {
        shuffleParticipants: true
      });
      await fetchTournaments(); // Refresh the list
      setError(null);
      alert(response.data.message);
    } catch (err) {
      console.error('Failed to start tournament:', err);
      setError('Failed to start tournament. Please check if there are enough participants.');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/venues/me/tournaments/${tournamentId}`);
      setTournaments(tournaments.filter(t => t.id !== tournamentId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete tournament:', err);
      setError('Failed to delete tournament. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tournament Management</h1>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Create New Tournament
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Tournament</h2>
            <TournamentForm
              onSubmit={handleCreateTournament}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {selectedTournament && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Edit Tournament</h2>
            <TournamentForm
              tournament={selectedTournament}
              onSubmit={(data) => handleUpdateTournament(selectedTournament.id, data)}
              onCancel={() => setSelectedTournament(null)}
            />
          </div>
        </div>
      )}

      <TournamentList
        tournaments={tournaments}
        onEdit={setSelectedTournament}
        onStart={handleStartTournament}
        onDelete={handleDeleteTournament}
      />
    </div>
  );
}
