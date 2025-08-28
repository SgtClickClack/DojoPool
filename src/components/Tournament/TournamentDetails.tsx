import React, { useEffect, useState } from 'react';
import tournamentService from '../../services/TournamentService';
import { Tournament } from '../../types/tournament';
import TournamentBracket from '../tournament/TournamentBracket';
import styles from './TournamentDetails.module.css';

interface TournamentDetailsProps {
  tournamentId: string;
  onBack: () => void;
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({
  tournamentId,
  onBack,
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const tournament =
        await tournamentService.getTournamentById(tournamentId);
      if (tournament) {
        setTournament(tournament);
      } else {
        setError('Tournament not found');
      }
    } catch (err) {
      setError('Failed to load tournament details. Please try again later.');
      console.error('Error fetching tournament details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!tournament) return;

    try {
      setIsRegistering(true);
      // TODO: Replace with actual registration API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setRegistrationSuccess(true);

      // Update local tournament data
      setTournament((prev) =>
        prev
          ? {
              ...prev,
              currentParticipants: prev.currentParticipants + 1,
            }
          : null
      );

      // Show success message for 3 seconds
      setTimeout(() => setRegistrationSuccess(false), 3000);
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Error registering for tournament:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#00ff88';
      case 'in_progress':
        return '#0088ff';
      case 'completed':
        return '#888888';
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

  if (loading) {
    return (
      <div className="tournament-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading tournament details...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-details-error">
        <h3>Error Loading Tournament</h3>
        <p>{error || 'Tournament not found'}</p>
        <button onClick={onBack} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  const isRegistrationOpen = tournament.status === 'upcoming';
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const canRegister = isRegistrationOpen && !isFull;

  return (
    <div className="tournament-details">
      {/* Header */}
      <div className="tournament-details-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Tournaments
        </button>
        <div className="tournament-status">
          <div
            className={`status-badge ${styles.statusBadge}`}
            data-status={tournament.status}
          >
            {getStatusText(tournament.status)}
          </div>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="tournament-info-section">
        <h1 className="tournament-title">{tournament.name}</h1>
        <p className="tournament-description">{tournament.description}</p>

        <div className="tournament-meta">
          <div className="meta-item">
            <span className="meta-label">Venue:</span>
            <span className="meta-value">{tournament.venue.name}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Format:</span>
            <span className="meta-value">
              {tournament.format.replace('_', ' ')}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Start Date:</span>
            <span className="meta-value">
              {formatDate(tournament.startDate)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">End Date:</span>
            <span className="meta-value">{formatDate(tournament.endDate)}</span>
          </div>
        </div>
      </div>

      {/* Registration Section */}
      <div className="registration-section">
        <div className="registration-header">
          <h2>Tournament Registration</h2>
          <div className="participant-count">
            {tournament.currentParticipants} / {tournament.maxParticipants}{' '}
            Players
          </div>
        </div>

        <div className="registration-details">
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

          <div className="detail-row">
            <span className="detail-label">Registration Status:</span>
            <span className={`detail-value status-${tournament.status}`}>
              {isFull
                ? 'Tournament Full'
                : isRegistrationOpen
                  ? 'Open'
                  : 'Closed'}
            </span>
          </div>
        </div>

        {registrationSuccess && (
          <div className="registration-success">
            <p>✅ Successfully registered for tournament!</p>
          </div>
        )}

        <div className="registration-actions">
          {canRegister ? (
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="register-btn"
            >
              {isRegistering ? 'Registering...' : 'Register Now'}
            </button>
          ) : (
            <div className="registration-disabled">
              {isFull ? (
                <p>This tournament is full. Check back for cancellations.</p>
              ) : (
                <p>Registration is not currently open for this tournament.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prize Pool Section */}
      <div className="prize-pool-section">
        <h2>Prize Pool</h2>
        <div className="prize-pool-grid">
          {tournament.prizePools.map((prize, index) => (
            <div key={index} className="prize-item">
              <div className="prize-rank">{prize.rank}</div>
              <div className="prize-amount">{formatCurrency(prize.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Section */}
      <div className="rules-section">
        <h2>Tournament Rules</h2>
        <ul className="rules-list">
          {tournament.rules.map((rule, index) => (
            <li key={index} className="rule-item">
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Tournament Bracket */}
      <div className="bracket-section">
        <h2>Tournament Bracket</h2>
        <TournamentBracket tournamentId={tournament.id} />
      </div>
    </div>
  );
};

export default TournamentDetails;
