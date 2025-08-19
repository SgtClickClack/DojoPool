import {
  Match,
  TournamentParticipant,
  apiService,
} from '@/services/ApiService';
import React, { useEffect, useState } from 'react';
import styles from './ReportScoreModal.module.css';

interface ReportScoreModalProps {
  match: Match;
  participants: TournamentParticipant[];
  isOpen: boolean;
  onClose: () => void;
  onScoreSubmitted: () => void;
}

const ReportScoreModal: React.FC<ReportScoreModalProps> = ({
  match,
  participants,
  isOpen,
  onClose,
  onScoreSubmitted,
}) => {
  const [scoreA, setScoreA] = useState(match.scoreA || 0);
  const [scoreB, setScoreB] = useState(match.scoreB || 0);
  const [winnerId, setWinnerId] = useState<string | null>(
    match.winnerId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScoreA(match.scoreA || 0);
      setScoreB(match.scoreB || 0);
      setWinnerId(match.winnerId || null);
      setError(null);
    }
  }, [isOpen, match]);

  const getParticipantName = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    return (
      participant?.user?.username ||
      participant?.user?.email ||
      'Unknown Player'
    );
  };

  const handleScoreChange = (player: 'A' | 'B', value: number) => {
    if (player === 'A') {
      setScoreA(value);
      // Auto-select winner based on higher score
      if (value > scoreB) {
        setWinnerId(match.playerAId);
      } else if (scoreB > value) {
        setWinnerId(match.playerBId);
      } else {
        setWinnerId(null);
      }
    } else {
      setScoreB(value);
      // Auto-select winner based on higher score
      if (value > scoreA) {
        setWinnerId(match.playerBId);
      } else if (scoreA > value) {
        setWinnerId(match.playerAId);
      } else {
        setWinnerId(null);
      }
    }
  };

  const handleWinnerSelect = (playerId: string) => {
    setWinnerId(playerId);
  };

  const validateScores = () => {
    if (scoreA < 0 || scoreB < 0) {
      setError('Scores cannot be negative');
      return false;
    }
    if (scoreA === scoreB) {
      setError('Scores cannot be tied in tournament play');
      return false;
    }
    if (!winnerId) {
      setError('Please select a winner');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateScores()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.updateMatch(match.id, {
        scoreA,
        scoreB,
        winnerId: winnerId!,
      });

      onScoreSubmitted();
      onClose();
    } catch (error) {
      console.error('Failed to submit match result:', error);
      setError('Failed to submit match result. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      data-testid="modal-overlay"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🏆 Report Match Score</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.matchInfo}>
            <div className={styles.roundInfo}>
              Round {match.round || 'Unknown'}
            </div>
            <div className={styles.matchId}>Match #{match.id.slice(-8)}</div>
          </div>

          <div className={styles.playersContainer}>
            {/* Player A */}
            <div className={styles.playerSection}>
              <div className={styles.playerHeader}>
                <h3>{getParticipantName(match.playerAId)}</h3>
                <button
                  className={`${styles.winnerButton} ${
                    winnerId === match.playerAId ? styles.selected : ''
                  }`}
                  onClick={() => handleWinnerSelect(match.playerAId)}
                  disabled={scoreA <= scoreB}
                >
                  {winnerId === match.playerAId ? '🏆 Winner' : 'Select Winner'}
                </button>
              </div>
              <div className={styles.scoreInput}>
                <label htmlFor={`score-a-${match.id}`}>Score:</label>
                <input
                  id={`score-a-${match.id}`}
                  type="number"
                  min="0"
                  value={scoreA}
                  onChange={(e) =>
                    handleScoreChange('A', parseInt(e.target.value) || 0)
                  }
                  className={styles.scoreField}
                  aria-label={`Score for ${getParticipantName(
                    match.playerAId
                  )}`}
                />
              </div>
            </div>

            <div className={styles.vs}>VS</div>

            {/* Player B */}
            <div className={styles.playerSection}>
              <div className={styles.playerHeader}>
                <h3>{getParticipantName(match.playerBId)}</h3>
                <button
                  className={`${styles.winnerButton} ${
                    winnerId === match.playerBId ? styles.selected : ''
                  }`}
                  onClick={() => handleWinnerSelect(match.playerBId)}
                  disabled={scoreB <= scoreA}
                >
                  {winnerId === match.playerBId ? '🏆 Winner' : 'Select Winner'}
                </button>
              </div>
              <div className={styles.scoreInput}>
                <label htmlFor={`score-b-${match.id}`}>Score:</label>
                <input
                  id={`score-b-${match.id}`}
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={(e) =>
                    handleScoreChange('B', parseInt(e.target.value) || 0)
                  }
                  className={styles.scoreField}
                  aria-label={`Score for ${getParticipantName(
                    match.playerBId
                  )}`}
                />
              </div>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={isSubmitting || !winnerId}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportScoreModal;
