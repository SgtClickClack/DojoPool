import React from 'react';
import { Tournament } from '../../types/tournament';

interface TournamentCardProps {
  tournament: Tournament;
  onViewDetails: (tournamentId: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#00ff88'; // Green for upcoming
      case 'in_progress':
        return '#0088ff'; // Blue for in progress
      case 'completed':
        return '#888888'; // Gray for completed
      default:
        return '#888888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Registration Open';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <div className="tournament-card">
      <div className="tournament-header">
        <h3 className="tournament-name">{tournament.name}</h3>
        <div
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(tournament.status) }}
        >
          {getStatusText(tournament.status)}
        </div>
      </div>

      <p className="tournament-description">{tournament.description}</p>

      <div className="tournament-details">
        <div className="detail-row">
          <span className="detail-label">Venue:</span>
          <span className="detail-value">{tournament.venue?.name}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Format:</span>
          <span className="detail-value">
            {tournament.format.replace('_', ' ')}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Start:</span>
          <span className="detail-value">
            {formatDate(tournament.startDate)}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">End:</span>
          <span className="detail-value">{formatDate(tournament.endDate)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Participants:</span>
          <span className="detail-value">
            {tournament.currentParticipants}/{tournament.maxParticipants}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Entry Fee:</span>
          <span className="detail-value">
            {formatCurrency(tournament.entryFee)}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Prize Pool:</span>
          <span className="detail-value prize-pool">
            {formatCurrency(tournament.prizePools[0]?.amount || 0)}
          </span>
        </div>
      </div>

      <div className="tournament-actions">
        <button
          className="view-details-btn"
          onClick={() => onViewDetails(tournament.id)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;
