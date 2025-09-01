import React from 'react';
import styles from './WorldHubMap.module.css';

interface ConnectionStatusBarProps {
  isWebSocketConnected: boolean;
  messageActivity: boolean;
  playerCount: number;
}

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  isWebSocketConnected,
  messageActivity,
  playerCount,
}) => {
  return (
    <div className={styles.connectionStatusBar}>
      <span
        className={`${styles.statusDot} ${
          isWebSocketConnected ? styles.connected : styles.disconnected
        } ${messageActivity ? styles.heartbeat : ''}`}
      />
      {isWebSocketConnected ? 'Live Updates Active' : 'Connecting...'}
      <span className={styles.playerCount}>
        {playerCount} players online
      </span>
    </div>
  );
};
