import { Match } from '@/services/ApiService';
import React from 'react';
import styles from './MatchHistory.module.css';

interface MatchHistoryProps {
  matches: Match[];
  playerId: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, playerId }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMatchResult = (match: Match) => {
    if (match.status !== 'COMPLETED')
      return { result: 'Pending', class: 'pending' };

    if (match.winnerId === playerId) {
      return { result: 'Won', class: 'won' };
    } else if (match.loserId === playerId) {
      return { result: 'Lost', class: 'lost' };
    }

    return { result: 'Unknown', class: 'unknown' };
  };

  const getOpponentName = (match: Match) => {
    if (match.playerAId === playerId) {
      return match.playerBId;
    }
    return match.playerAId;
  };

  const getPlayerScore = (match: Match) => {
    if (match.playerAId === playerId) {
      return match.scoreA;
    }
    return match.scoreB;
  };

  const getOpponentScore = (match: Match) => {
    if (match.playerAId === playerId) {
      return match.scoreB;
    }
    return match.scoreA;
  };

  if (matches.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>📊 Match History</h2>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏓</div>
          <p>No matches played yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Match History</h2>
      <div className={styles.matchesList}>
        {matches.map((match) => {
          const result = getMatchResult(match);
          const opponentName = getOpponentName(match);
          const playerScore = getPlayerScore(match);
          const opponentScore = getOpponentScore(match);

          return (
            <div
              key={match.id}
              className={`${styles.matchCard} ${styles[result.class]}`}
            >
              <div className={styles.matchHeader}>
                <div className={styles.matchInfo}>
                  <span className={styles.matchId}>#{match.id.slice(-8)}</span>
                  <span className={styles.matchDate}>
                    {formatDate(match.startedAt || match.endedAt || '')}
                  </span>
                </div>
                <div className={styles.matchResult}>
                  <span
                    className={`${styles.resultBadge} ${styles[result.class]}`}
                  >
                    {result.result}
                  </span>
                </div>
              </div>

              <div className={styles.matchContent}>
                <div className={styles.playerSection}>
                  <div className={styles.playerName}>You</div>
                  <div className={styles.playerScore}>{playerScore}</div>
                </div>

                <div className={styles.vs}>VS</div>

                <div className={styles.opponentSection}>
                  <div className={styles.opponentName}>{opponentName}</div>
                  <div className={styles.opponentScore}>{opponentScore}</div>
                </div>
              </div>

              <div className={styles.matchFooter}>
                <div className={styles.matchStatus}>
                  <span className={styles.statusLabel}>Status:</span>
                  <span
                    className={`${styles.statusValue} ${
                      styles[match.status.toLowerCase()]
                    }`}
                  >
                    {match.status}
                  </span>
                </div>

                {match.round && (
                  <div className={styles.tournamentInfo}>
                    <span className={styles.roundLabel}>Round:</span>
                    <span className={styles.roundValue}>{match.round}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {matches.length > 5 && (
        <div className={styles.viewMore}>
          <button className={styles.viewMoreButton}>
            View All Matches ({matches.length} total)
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
