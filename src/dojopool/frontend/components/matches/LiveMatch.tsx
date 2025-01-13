import React, { useEffect, useState } from 'react';
import { LiveMatch } from '../../services/match-updates';
import matchUpdateService from '../../services/match-updates';
import { formatTimestamp } from '../../utils/date';
import './LiveMatch.css';

interface LiveMatchProps {
  matchId: string;
  onScoreUpdate?: (score: any) => void;
}

export const LiveMatchDisplay: React.FC<LiveMatchProps> = ({ matchId, onScoreUpdate }) => {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (matchId && !isWatching) {
      matchUpdateService.startWatchingMatch(matchId);
      setIsWatching(true);
    }

    const unsubscribe = matchUpdateService.subscribeToMatch(matchId, (updatedMatch) => {
      setMatch(updatedMatch);
      if (onScoreUpdate) {
        onScoreUpdate(updatedMatch.currentScore);
      }
    });

    return () => {
      unsubscribe();
      if (isWatching) {
        matchUpdateService.stopWatchingMatch(matchId);
        setIsWatching(false);
      }
    };
  }, [matchId, isWatching, onScoreUpdate]);

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
            <img src={match.player1.avatar} alt={match.player1.name} />
            <h3>{match.player1.name}</h3>
            <div className="score">{match.currentScore.player1}</div>
          </div>

          <div className="vs-indicator">VS</div>

          <div className="player player-two">
            <img src={match.player2.avatar} alt={match.player2.name} />
            <h3>{match.player2.name}</h3>
            <div className="score">{match.currentScore.player2}</div>
          </div>
        </div>

        <div className="match-status">
          <div className="status-indicator">
            {match.status === 'in_progress' && (
              <span className="badge badge-success">In Progress</span>
            )}
            {match.status === 'paused' && <span className="badge badge-warning">Paused</span>}
          </div>
          <div className="last-update">Last update: {formatTimestamp(match.lastUpdate)}</div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchDisplay;
