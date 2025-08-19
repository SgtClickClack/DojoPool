import React from 'react';
import { useEnhancedTournamentAPI } from '../../frontend/hooks/useEnhancedTournamentAPI';
import TournamentCard from './TournamentCard';

const TournamentList: React.FC = () => {
  const {
    tournaments,
    loading,
    error,
    loadTournaments,
    clearError,
    realTimeConnected,
    lastUpdate,
  } = useEnhancedTournamentAPI();

  const handleViewDetails = (tournamentId: string) => {
    // Navigate to tournament details page
    window.location.href = `/tournament/${tournamentId}`;
  };

  const handleRetry = () => {
    clearError();
    loadTournaments();
  };

  if (loading) {
    return (
      <div className="tournament-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading tournaments...</p>
        {realTimeConnected && (
          <div className="real-time-indicator">
            <span className="status-dot connected"></span>
            Live updates enabled
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-list-error">
        <h3>Error Loading Tournaments</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="tournament-list-empty">
        <h3>No Tournaments Available</h3>
        <p>Check back later for upcoming tournaments!</p>
        {realTimeConnected && (
          <div className="real-time-indicator">
            <span className="status-dot connected"></span>
            Live updates enabled
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tournament-list">
      <div className="tournament-list-header">
        <h2>Available Tournaments</h2>
        <div className="tournament-header-info">
          <p className="tournament-count">
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}{' '}
            found
          </p>
          {realTimeConnected && (
            <div className="real-time-status">
              <span className="status-dot connected"></span>
              Live updates
              {lastUpdate && (
                <span className="last-update">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="tournament-grid">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
