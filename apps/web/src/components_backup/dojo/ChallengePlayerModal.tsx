import React, { useState } from 'react';
import { ChallengeService, CreateChallengeRequest } from '../../services/ChallengeService';
import { PresenceUser } from '../../services/DojoPresenceService';
import styles from './DojoInterior.module.css';

interface ChallengePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dojoId: string;
  dojoName: string;
  activePlayers: PresenceUser[];
  currentUserId: string;
}

interface ChallengeType {
  id: 'duel' | 'pilgrimage' | 'gauntlet';
  name: string;
  description: string;
  requirements: string;
}

const challengeTypes: ChallengeType[] = [
  {
    id: 'duel',
    name: 'Duel',
    description: 'Direct challenge against a specific player',
    requirements: 'No special requirements - available to all players',
  },
  {
    id: 'pilgrimage',
    name: 'Pilgrimage',
    description:
      'Defeat Top Ten players and the Dojo Master to claim the venue',
    requirements: 'Level 5+, 10+ wins, 3+ Top Ten defeats, 1+ Master defeat',
  },
  {
    id: 'gauntlet',
    name: 'Gauntlet',
    description:
      "Complete a series of matches against the venue's best players",
    requirements:
      'Level 10+, 25+ wins, 5+ Top Ten defeats, 2+ Master defeats, Clan membership',
  },
];

const ChallengePlayerModal: React.FC<ChallengePlayerModalProps> = ({
  isOpen,
  onClose,
  dojoId,
  dojoName,
  activePlayers,
  currentUserId,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedChallengeType, setSelectedChallengeType] =
    useState<string>('duel');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filter out current user from available players
  const availablePlayers = activePlayers.filter(
    (player) => player.id !== currentUserId
  );

  const handleChallenge = async () => {
    if (!selectedPlayer) {
      setError('Please select a player to challenge');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const challengeRequest: CreateChallengeRequest = {
        type: selectedChallengeType as 'duel' | 'pilgrimage' | 'gauntlet',
        defenderId: selectedPlayer,
        dojoId,
      };

      // Create the challenge using the ChallengeService
      await ChallengeService.createChallenge(challengeRequest)

      setSuccess(
        `Challenge sent to ${
          availablePlayers.find((p) => p.id === selectedPlayer)?.username
        }!`
      );

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Failed to send challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayer('');
    setSelectedChallengeType('duel');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Challenge Player</h2>
          <button onClick={handleClose} className={styles.modalCloseButton}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {availablePlayers.length === 0 ? (
            <div className={styles.noPlayersMessage}>
              <p>No other players are currently checked in to challenge.</p>
              <p>Check back later when more players arrive!</p>
            </div>
          ) : (
            <>
              {/* Player Selection */}
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  Select Player to Challenge:
                </label>
                <div className={styles.playerSelection}>
                  {availablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.id)}
                      className={`${styles.playerOption} ${
                        selectedPlayer === player.id
                          ? styles.playerOptionSelected
                          : ''
                      }`}
                    >
                      <img
                        src={player.avatarUrl}
                        alt={player.username}
                        className={styles.playerOptionAvatar}
                      />
                      <span className={styles.playerOptionName}>
                        {player.username}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Challenge Type Selection */}
              <div className={styles.formSection}>
                <label className={styles.formLabel}>Challenge Type:</label>
                <div className={styles.challengeTypeSelection}>
                  {challengeTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedChallengeType(type.id)}
                      className={`${styles.challengeTypeOption} ${
                        selectedChallengeType === type.id
                          ? styles.challengeTypeOptionSelected
                          : ''
                      }`}
                    >
                      <div className={styles.challengeTypeHeader}>
                        <h4 className={styles.challengeTypeName}>
                          {type.name}
                        </h4>
                        <p className={styles.challengeTypeDescription}>
                          {type.description}
                        </p>
                      </div>
                      <div className={styles.challengeTypeRequirements}>
                        <strong>Requirements:</strong> {type.requirements}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && (
                <div className={styles.successMessage}>{success}</div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={handleClose} className={styles.modalButtonSecondary}>
            Cancel
          </button>
          {availablePlayers.length > 0 && (
            <button
              onClick={handleChallenge}
              disabled={!selectedPlayer || isLoading}
              className={styles.modalButtonPrimary}
            >
              {isLoading ? 'Sending Challenge...' : 'Send Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengePlayerModal;
