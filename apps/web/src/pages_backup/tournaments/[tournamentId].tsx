import ParticipantList from '@/components/tournament/ParticipantList';
import TournamentBracket from '@/components/tournament/TournamentBracket';
import { Tournament, apiService } from '@/services/ApiService';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './TournamentDetail.module.css';

const TournamentDetail: React.FC = () => {
  const router = useRouter();
  const { tournamentId } = router.query;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (tournamentId && typeof tournamentId === 'string') {
      fetchTournamentDetails(tournamentId);
      setupWebSocket(tournamentId);
    }

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [tournamentId]);

  const setupWebSocket = (id: string) => {
    try {
      const wsUrl = apiService.getWebSocketURL();
      const ws = new WebSocket(`${wsUrl}/tournaments/${id}`);

      ws.onopen = () => {
        console.log('WebSocket connected for tournament updates');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'tournamentUpdated') {
            console.log('Tournament updated via WebSocket:', data.payload);
            setTournament(data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      setWsConnection(ws);
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const fetchTournamentDetails = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const tournamentData = await apiService.getTournamentDetails(id);
      setTournament(tournamentData);
    } catch (error) {
      console.error('Failed to fetch tournament details:', error);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchUpdated = useCallback(() => {
    if (tournamentId && typeof tournamentId === 'string') {
      // Refresh tournament data to get updated bracket
      fetchTournamentDetails(tournamentId);
    }
  }, [tournamentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return styles.statusRegistration;
      case 'ACTIVE':
        return styles.statusActive;
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return '📝';
      case 'ACTIVE':
        return '🏆';
      case 'COMPLETED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getGameTypeLabel = (gameType: string) => {
    const gameTypeMap: Record<string, string> = {
      '8_BALL': '8-Ball',
      '9_BALL': '9-Ball',
      '10_BALL': '10-Ball',
      STRAIGHT_POOL: 'Straight Pool',
      ONE_POCKET: 'One Pocket',
      BANK_POOL: 'Bank Pool',
    };
    return gameTypeMap[gameType] || gameType;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading tournament details...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Tournament</h2>
        <p>{error || 'Tournament not found'}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tournament Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.tournamentInfo}>
            <h1 className={styles.tournamentName}>{tournament.name}</h1>
            <div className={styles.tournamentMeta}>
              <span
                className={`${styles.status} ${getStatusColor(
                  tournament.status
                )}`}
              >
                {getStatusIcon(tournament.status)} {tournament.status}
              </span>
              <span className={styles.gameType}>
                {getGameTypeLabel(tournament.gameType)}
              </span>
              <span className={styles.tournamentType}>
                {tournament.tournamentType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button onClick={() => router.back()} className={styles.backButton}>
              ← Back
            </button>
            <button
              onClick={() => fetchTournamentDetails(tournament.id)}
              className={styles.refreshButton}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tournament Details */}
      <section className={styles.detailsSection}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <h3>📅 Schedule</h3>
            <div className={styles.detailContent}>
              <div className={styles.detailRow}>
                <span>Start:</span>
                <span>
                  {tournament.startDate
                    ? formatDate(tournament.startDate)
                    : 'TBD'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span>End:</span>
                <span>
                  {tournament.endDate ? formatDate(tournament.endDate) : 'TBD'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>👥 Participants</h3>
            <div className={styles.detailContent}>
              <div className={styles.detailRow}>
                <span>Registered:</span>
                <span>{tournament.participants.length}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Capacity:</span>
                <span>{tournament.maxParticipants}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Progress:</span>
                <span>
                  {Math.round(
                    (tournament.participants.length /
                      tournament.maxParticipants) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>💰 Entry Fee</h3>
            <div className={styles.detailContent}>
              <div className={styles.detailRow}>
                <span>Fee:</span>
                <span>
                  {tournament.entryFee > 0
                    ? `${tournament.entryFee} Dojo Coins`
                    : 'Free'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {tournament.description && (
          <div className={styles.descriptionCard}>
            <h3>📝 Description</h3>
            <p>{tournament.description}</p>
          </div>
        )}

        {tournament.rules && (
          <div className={styles.rulesCard}>
            <h3>📋 Rules</h3>
            <p>{tournament.rules}</p>
          </div>
        )}
      </section>

      {/* Tournament Bracket */}
      <section className={styles.bracketSection}>
        <h2 className={styles.sectionTitle}>🏆 Tournament Bracket</h2>
        <TournamentBracket
          tournament={tournament}
          matches={tournament.matches}
          participants={tournament.participants}
          onMatchUpdated={handleMatchUpdated}
        />
      </section>

      {/* Participants List */}
      <section className={styles.participantsSection}>
        <h2 className={styles.sectionTitle}>👥 Participants</h2>
        <ParticipantList
          participants={tournament.participants}
          maxParticipants={tournament.maxParticipants}
        />
      </section>
    </div>
  );
};

export default TournamentDetail;
