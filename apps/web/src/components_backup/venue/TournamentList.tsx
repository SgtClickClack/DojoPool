import { Tournament } from '@/services/ApiService';
import { useRouter } from 'next/router';
import React from 'react';
import styles from './TournamentList.module.css';

interface TournamentListProps {
  tournaments: Tournament[];
  isLoading?: boolean;
  onTournamentClick?: (tournament: Tournament) => void;
}

const TournamentList: React.FC<TournamentListProps> = ({
  tournaments,
  isLoading = false,
  onTournamentClick,
}) => {
  const router = useRouter();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading tournaments...</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏆</div>
        <h3>No Tournaments Yet</h3>
        <p>Create your first tournament to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Venue Tournaments</h3>
        <span className={styles.count}>
          {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.tournamentGrid}>
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className={`${styles.tournamentCard} ${styles.clickable}`}
            onClick={() => {
              onTournamentClick?.(tournament);
              router.push(`/tournaments/${tournament.id}`);
            }}
          >
            <div className={styles.tournamentHeader}>
              <div className={styles.tournamentName}>
                <h4>{tournament.name}</h4>
                <span
                  className={`${styles.status} ${getStatusColor(
                    tournament.status
                  )}`}
                >
                  {getStatusIcon(tournament.status)} {tournament.status}
                </span>
              </div>
              <div className={styles.tournamentType}>
                {tournament.tournamentType.replace('_', ' ')}
              </div>
            </div>

            <div className={styles.tournamentDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Game:</span>
                <span className={styles.detailValue}>
                  {getGameTypeLabel(tournament.gameType)}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Start:</span>
                <span className={styles.detailValue}>
                  {tournament.startDate
                    ? formatDate(tournament.startDate)
                    : 'TBD'}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>End:</span>
                <span className={styles.detailValue}>
                  {tournament.endDate ? formatDate(tournament.endDate) : 'TBD'}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Participants:</span>
                <span className={styles.detailValue}>
                  {tournament.participants.length} /{' '}
                  {tournament.maxParticipants}
                </span>
              </div>

              {tournament.entryFee > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Entry Fee:</span>
                  <span className={styles.detailValue}>
                    {tournament.entryFee} Dojo Coins
                  </span>
                </div>
              )}
            </div>

            {tournament.description && (
              <div className={styles.description}>
                <p>{tournament.description}</p>
              </div>
            )}

            <div className={styles.tournamentFooter}>
              <div className={styles.participantProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${
                        (tournament.participants.length /
                          tournament.maxParticipants) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className={styles.progressText}>
                  {Math.round(
                    (tournament.participants.length /
                      tournament.maxParticipants) *
                      100
                  )}
                  % Full
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
