import React from 'react';
import { useEnhancedTournamentAPI } from '../../hooks/useEnhancedTournamentAPI';

const TournamentRealTimeStatus: React.FC = () => {
  const {
    realTimeConnected,
    lastUpdate,
    getRealTimeStatus,
    connectRealTime,
    disconnectRealTime,
  } = useEnhancedTournamentAPI();

  const stats = getRealTimeStatus();

  return (
    <div className="tournament-real-time-status">
      <h3>Real-Time Tournament Status</h3>

      <div className="status-indicators">
        <div className="status-item">
          <span
            className={`status-dot ${
              realTimeConnected ? 'connected' : 'disconnected'
            }`}
          ></span>
          <span className="status-label">
            {realTimeConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {lastUpdate && (
          <div className="status-item">
            <span className="status-label">
              Last Update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="connection-stats">
        <h4>Connection Statistics</h4>
        <ul>
          <li>
            WebSocket Status: {stats.isConnected ? 'Connected' : 'Disconnected'}
          </li>
          <li>Reconnect Attempts: {stats.reconnectAttempts}</li>
          <li>Active Listeners: {stats.listenerCount}</li>
        </ul>
      </div>

      <div className="connection-controls">
        <button
          onClick={connectRealTime}
          disabled={realTimeConnected}
          className="connect-btn"
        >
          Connect
        </button>
        <button
          onClick={disconnectRealTime}
          disabled={!realTimeConnected}
          className="disconnect-btn"
        >
          Disconnect
        </button>
      </div>

      <style jsx>{`
        .tournament-real-time-status {
          padding: 1rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a1a;
          color: #fff;
        }

        .status-indicators {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          align-items: center;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.connected {
          background-color: #00ff9d;
          box-shadow: 0 0 10px #00ff9d;
        }

        .status-dot.disconnected {
          background-color: #ff4757;
          box-shadow: 0 0 10px #ff4757;
        }

        .status-label {
          font-size: 0.9rem;
          color: #ccc;
        }

        .connection-stats {
          margin: 1rem 0;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 4px;
        }

        .connection-stats h4 {
          margin: 0 0 0.5rem 0;
          color: #00ff9d;
        }

        .connection-stats ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .connection-stats li {
          margin: 0.25rem 0;
          color: #ccc;
        }

        .connection-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .connect-btn,
        .disconnect-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        }

        .connect-btn {
          background-color: #00ff9d;
          color: #000;
        }

        .connect-btn:hover:not(:disabled) {
          background-color: #00cc7a;
          box-shadow: 0 0 10px #00ff9d;
        }

        .disconnect-btn {
          background-color: #ff4757;
          color: #fff;
        }

        .disconnect-btn:hover:not(:disabled) {
          background-color: #ff3742;
          box-shadow: 0 0 10px #ff4757;
        }

        .connect-btn:disabled,
        .disconnect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TournamentRealTimeStatus;
