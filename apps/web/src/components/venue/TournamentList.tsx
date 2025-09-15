import React from 'react';
import styles from './TournamentList.module.css';

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

interface TournamentListProps {
  tournaments: Tournament[];
  onEdit: (tournament: Tournament) => void;
  onStart: (tournamentId: string) => void;
  onDelete: (tournamentId: string) => void;
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments, onEdit, onStart, onDelete }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'UPCOMING':
        return styles.badgeUpcoming;
      case 'REGISTRATION':
        return styles.badgeRegistration;
      case 'ACTIVE':
        return styles.badgeActive;
      case 'COMPLETED':
        return styles.badgeCompleted;
      default:
        return styles.badgeDefault;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFormat = (format: string) => {
    return format.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (tournaments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Tournaments Yet</h3>
        <p>Create your first tournament to get started!</p>
      </div>
    );
  }

  return (
    <div className={styles.tournamentGrid}>
      {tournaments.map((tournament) => (
        <div key={tournament.id} className={styles.tournamentCard}>
          <div className={styles.cardHeader}>
            <h3>{tournament.name}</h3>
            <span className={`${styles.badge} ${getStatusBadgeClass(tournament.status)}`}>
              {tournament.status}
            </span>
          </div>

          {tournament.description && (
            <p className={styles.description}>{tournament.description}</p>
          )}

          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Start Time:</span>
              <span className={styles.value}>{formatDateTime(tournament.startTime)}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Format:</span>
              <span className={styles.value}>{formatFormat(tournament.format)}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Players:</span>
              <span className={styles.value}>
                {tournament._count?.participants || 0} / {tournament.maxPlayers}
              </span>
            </div>

            {tournament.entryFee > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Entry Fee:</span>
                <span className={styles.value}>{tournament.entryFee} Dojo Coins</span>
              </div>
            )}

            {tournament.prizePool > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Prize Pool:</span>
                <span className={styles.value}>{tournament.prizePool} Dojo Coins</span>
              </div>
            )}
          </div>

          <div className={styles.cardActions}>
            {tournament.status === 'UPCOMING' && (
              <>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(tournament)}
                >
                  Edit
                </button>
                <button
                  className={styles.startButton}
                  onClick={() => onStart(tournament.id)}
                  disabled={(tournament._count?.participants || 0) < 2}
                >
                  Start
                </button>
              </>
            )}
            
            {tournament.status === 'REGISTRATION' && (
              <button
                className={styles.startButton}
                onClick={() => onStart(tournament.id)}
                disabled={(tournament._count?.participants || 0) < 2}
              >
                Start Tournament
              </button>
            )}

            {tournament.status === 'ACTIVE' && (
              <button className={styles.viewButton}>
                View Matches
              </button>
            )}

            {tournament.status === 'COMPLETED' && (
              <button className={styles.viewButton}>
                View Results
              </button>
            )}

            {(tournament.status === 'UPCOMING' || tournament.status === 'COMPLETED') && (
              <button
                className={styles.deleteButton}
                onClick={() => onDelete(tournament.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TournamentList;
