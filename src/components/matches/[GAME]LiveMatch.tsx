import React, { useEffect, useState } from 'react';
import './LiveMatch.css';

// Simple date formatting utility
const formatTimestamp = (timestamp: Date | number | string): string => {
  if (!timestamp) return 'Unknown';
  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString();
};

// Define the interfaces locally to avoid import issues
interface MatchScore {
  player1: number;
  player2: number;
}

interface LiveMatch {
  id: string;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentScore: MatchScore;
  spectatorCount: number;
  lastUpdate: string;
}

interface LiveMatchProps {
  matchId: string;
  onScoreUpdate?: (score: any) => void;
}

export const LiveMatchDisplay: React.FC<LiveMatchProps> = ({
  matchId,
  onScoreUpdate,
}) => {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    // Mock data for now - replace with actual service integration later
    const mockMatch: LiveMatch = {
      id: matchId,
      state: 'IN_PROGRESS',
      currentScore: { player1: 3, player2: 2 },
      spectatorCount: 12,
      lastUpdate: new Date().toISOString(),
    };
    setMatch(mockMatch);
  }, [matchId]);

  if (!match) {
    return (
      <div className="live-match-loading">
        <div className="spinner" data-testid="spinner"></div>
        <p>Loading match data...</p>
      </div>
    );
  }

  return (
    <div className="live-match-container">
      <div className="live-match-header">
        <div className="live-indicator">LIVE</div>
        <div className="spectator-count">
          <i className="bi bi-eye"></i>
          <span>{match.spectatorCount}</span>
        </div>
      </div>

      <div className="match-details">
        <div className="player-info">
          <div className="player player-one">
            <img src="/static/images/avatar/default.jpg" alt="Player 1" />
            <h3>Player 1</h3>
            <div className="score">{match.currentScore.player1}</div>
          </div>

          <div className="vs-indicator">VS</div>

          <div className="player player-two">
            <img src="/static/images/avatar/default.jpg" alt="Player 2" />
            <h3>Player 2</h3>
            <div className="score">{match.currentScore.player2}</div>
          </div>
        </div>

        <div className="match-status">
          <div className="status-indicator">
            {match.state === 'IN_PROGRESS' && (
              <span className="badge badge-success">In Progress</span>
            )}
            {match.state === 'SCHEDULED' && (
              <span className="badge badge-warning">Scheduled</span>
            )}
          </div>
          <div className="last-update">
            Last update: {formatTimestamp(match.lastUpdate)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchDisplay;
