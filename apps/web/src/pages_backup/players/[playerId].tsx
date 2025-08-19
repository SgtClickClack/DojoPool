import MatchHistory from '@/components/player/MatchHistory';
import PlayerHeader from '@/components/player/PlayerHeader';
import TournamentHistory from '@/components/player/TournamentHistory';
import { PlayerProfile, apiService } from '@/services/ApiService';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import styles from './PlayerProfile.module.css';

const PlayerProfilePage: React.FC = () => {
  const router = useRouter();
  const { playerId } = router.query;

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId && typeof playerId === 'string') {
      fetchPlayerProfile(playerId);
    }
  }, [playerId]);

  const fetchPlayerProfile = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const playerData = await apiService.getPlayerProfile(id);
      setPlayer(playerData);
    } catch (error) {
      console.error('Failed to fetch player profile:', error);
      setError('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading player profile...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Player Profile</h2>
        <p>{error || 'Player not found'}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <button
            onClick={() => fetchPlayerProfile(player.id)}
            className={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Player Profile Content */}
      <main className={styles.main}>
        <PlayerHeader player={player} />

        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <MatchHistory matches={player.recentMatches} playerId={player.id} />
          </div>

          <div className={styles.rightColumn}>
            <TournamentHistory tournamentHistory={player.tournamentHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerProfilePage;
