import { PlayerProfile } from '@/services/ApiService';
import React from 'react';
import styles from './TournamentHistory.module.css';

interface TournamentHistoryProps {
  tournamentHistory: PlayerProfile['tournamentHistory'];
}

const TournamentHistory: React.FC<TournamentHistoryProps> = ({
  tournamentHistory,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFinishIcon = (finish: number) => {
    if (finish === 1) return '🥇';
    if (finish === 2) return '🥈';
    if (finish === 3) return '🥉';
    return `#${finish}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'registration':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  if (tournamentHistory.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🏆 Tournament History</h2>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏆</div>
          <p>No tournaments joined yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🏆 Tournament History</h2>
      <div className={styles.tournamentsList}>
        {tournamentHistory.map((tournament) => (
          <div key={tournament.tournamentId} className={styles.tournamentCard}>
            <div className={styles.tournamentHeader}>
              <div className={styles.tournamentInfo}>
                <h3 className={styles.tournamentName}>
                  {tournament.tournamentName}
                </h3>
                <div className={styles.tournamentMeta}>
                  <span className={styles.joinDate}>
                    Joined: {formatDate(tournament.joinedAt)}
                  </span>
                  <span
                    className={styles.status}
                    style={{ color: getStatusColor(tournament.status) }}
                  >
                    {tournament.status}
                  </span>
                </div>
              </div>

              <div className={styles.finishSection}>
                <div className={styles.finishIcon}>
                  {getFinishIcon(tournament.finish)}
                </div>
                <div className={styles.finishText}>
                  {tournament.finish === 1
                    ? '1st Place'
                    : tournament.finish === 2
                    ? '2nd Place'
                    : tournament.finish === 3
                    ? '3rd Place'
                    : `${tournament.finish}th Place`}
                </div>
              </div>
            </div>

            <div className={styles.tournamentFooter}>
              <div className={styles.tournamentId}>
                ID: {tournament.tournamentId.slice(-8)}
              </div>

              {tournament.finish <= 3 && (
                <div className={styles.achievement}>🎉 Top 3 Finish!</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {tournamentHistory.length > 5 && (
        <div className={styles.viewMore}>
          <button className={styles.viewMoreButton}>
            View All Tournaments ({tournamentHistory.length} total)
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentHistory;
