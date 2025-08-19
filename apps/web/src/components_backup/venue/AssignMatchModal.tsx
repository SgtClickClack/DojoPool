import { ActiveMatch } from '@/hooks/useVenueData';
import React, { useState } from 'react';
import styles from './AssignMatchModal.module.css';

interface AssignMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignMatch: (matchId: string) => void;
  activeMatches: ActiveMatch[];
  tableId: string;
}

const AssignMatchModal: React.FC<AssignMatchModalProps> = ({
  isOpen,
  onClose,
  onAssignMatch,
  activeMatches,
  tableId,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  if (!isOpen) return null;

  const handleAssignMatch = () => {
    if (selectedMatchId) {
      onAssignMatch(selectedMatchId);
      onClose();
      setSelectedMatchId('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedMatchId('');
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Assign Match to Table {tableId}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {activeMatches.length === 0 ? (
            <div className={styles.noMatches}>
              <p>No active matches available for assignment.</p>
            </div>
          ) : (
            <>
              <p className={styles.instruction}>
                Select a match to assign to this table:
              </p>
              <div className={styles.matchesList}>
                {activeMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`${styles.matchOption} ${
                      selectedMatchId === match.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    <div className={styles.matchInfo}>
                      <div className={styles.matchHeader}>
                        <span className={styles.gameType}>
                          {match.gameType}
                        </span>
                        <span className={styles.matchTime}>
                          Started: {formatTime(match.startTime)}
                        </span>
                      </div>
                      <div className={styles.players}>
                        <span className={styles.player}>{match.player1}</span>
                        <span className={styles.vs}>VS</span>
                        <span className={styles.player}>{match.player2}</span>
                      </div>
                      <div className={styles.score}>
                        {match.score[0]} - {match.score[1]}
                      </div>
                    </div>
                    <div className={styles.radioButton}>
                      <div
                        className={`${styles.radio} ${
                          selectedMatchId === match.id
                            ? styles.radioSelected
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.assignButton}
            onClick={handleAssignMatch}
            disabled={!selectedMatchId}
          >
            Assign Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMatchModal;
