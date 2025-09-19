import React from 'react';
import { PlayerPosition } from '@/services/WebSocketService';
import styles from './WorldHubMap.module.css';

interface PlayerInfoWindowProps {
  player: PlayerPosition;
  onClose: () => void;
  onChallenge: (playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

export const PlayerInfoWindow: React.FC<PlayerInfoWindowProps> = ({
  player,
  onClose,
  onChallenge,
  onViewProfile,
}) => {
  return (
    <div className={styles.infoWindowContent}>
      <h3 className={styles.infoWindowTitle}>{player.playerName}</h3>
      <div className={styles.infoWindowSection}>
        <strong>Status:</strong>{' '}
        <span
          className={
            player.isOnline
              ? styles.statusActive
              : styles.statusInactive
          }
        >
          {player.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      {player.clan && (
        <div className={styles.infoWindowSection}>
          <strong>Clan:</strong> {player.clan}
        </div>
      )}
      <div className={styles.infoWindowSection}>
        <strong>Coordinates:</strong> {player.lat.toFixed(4)}, {player.lng.toFixed(4)}
      </div>
      <div className={styles.infoWindowSection}>
        <strong>Last Update:</strong>{' '}
        {new Date(player.timestamp).toLocaleTimeString()}
      </div>
      <div className={styles.buttonRow}>
        <button
          onClick={() => onChallenge(player.playerId)}
          className={styles.challengeButton}
        >
          Challenge
        </button>
        <button
          onClick={() => onViewProfile(player.playerId)}
          className={styles.viewDetailsButton}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
