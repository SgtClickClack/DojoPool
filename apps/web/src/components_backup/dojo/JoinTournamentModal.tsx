import React, { useEffect, useState } from 'react';
import styles from './DojoInterior.module.css';

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePools: {
    rank: number;
    amount: number;
  }[];
  rules: string[];
  format: TournamentFormat;
}

type TournamentStatus =
  | 'registration'
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'cancelled';
type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss';

interface JoinTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dojoId: string;
  dojoName: string;
  currentUserId: string;
}

const JoinTournamentModal: React.FC<JoinTournamentModalProps> = ({
  isOpen,
  onClose,
  dojoId,
  dojoName,
  currentUserId,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Sample tournament data for demonstration
  const sampleTournaments: Tournament[] = [
    {
      id: 'tournament1',
      name: 'Dojo Masters Championship',
      description:
        'The ultimate test of skill for Dojo Masters and aspiring champions. Single elimination format with prestigious rewards.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'registration',
      maxParticipants: 32,
      currentParticipants: 18,
      entryFee: 100,
      prizePools: [
        { rank: 1, amount: 2000 },
        { rank: 2, amount: 1000 },
        { rank: 3, amount: 500 },
      ],
      rules: [
        'Standard 8-ball pool rules apply',
        'Best of 3 matches in early rounds',
        'Best of 5 matches in semifinals and finals',
        'No coaching or outside assistance allowed',
      ],
      format: 'single_elimination',
    },
    {
      id: 'tournament2',
      name: 'Weekend Warriors',
      description:
        'Casual weekend tournament for players of all skill levels. Great for practice and meeting new players.',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'registration',
      maxParticipants: 16,
      currentParticipants: 12,
      entryFee: 25,
      prizePools: [
        { rank: 1, amount: 300 },
        { rank: 2, amount: 150 },
        { rank: 3, amount: 75 },
      ],
      rules: [
        'Standard 8-ball pool rules apply',
        'Single elimination format',
        'All skill levels welcome',
        'Friendly atmosphere encouraged',
      ],
      format: 'single_elimination',
    },
    {
      id: 'tournament3',
      name: 'Clan Wars Qualifier',
      description:
        "Qualifying tournament for the upcoming Clan Wars season. Top performers earn spots in their clan's elite team.",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming',
      maxParticipants: 64,
      currentParticipants: 0,
      entryFee: 50,
      prizePools: [
        { rank: 1, amount: 1000 },
        { rank: 2, amount: 500 },
        { rank: 3, amount: 250 },
        { rank: 4, amount: 100 },
      ],
      rules: [
        'Must be a member of an active clan',
        'Standard 8-ball pool rules apply',
        'Double elimination format',
        'Clan affiliation displayed on brackets',
      ],
      format: 'double_elimination',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      // In production, this would fetch from the API
      setTournaments(sampleTournaments);
    }
  }, [isOpen]);

  const handleJoinTournament = async () => {
    if (!selectedTournament) {
      setError('Please select a tournament to join');
      return;
    }

    const tournament = tournaments.find((t) => t.id === selectedTournament);
    if (!tournament) {
      setError('Tournament not found');
      return;
    }

    if (tournament.status !== 'registration') {
      setError('This tournament is not open for registration');
      return;
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      setError('This tournament is full');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call for tournament registration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(`Successfully registered for ${tournament.name}!`);

      // Update the tournament participant count
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === selectedTournament
            ? { ...t, currentParticipants: t.currentParticipants + 1 }
            : t
        )
      );

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Failed to join tournament. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTournament('');
    setError('');
    setSuccess('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'registration':
        return '#4ecdc4';
      case 'upcoming':
        return '#ffd93d';
      case 'live':
        return '#ff6b6b';
      case 'completed':
        return '#45b7d1';
      case 'cancelled':
        return '#888';
      default:
        return '#888';
    }
  };

  const getStatusText = (status: TournamentStatus) => {
    switch (status) {
      case 'registration':
        return 'Open for Registration';
      case 'upcoming':
        return 'Upcoming';
      case 'live':
        return 'Live Now';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusClass = (status: TournamentStatus) => {
    switch (status) {
      case 'registration':
        return styles.statusRegistration;
      case 'upcoming':
        return styles.statusUpcoming;
      case 'live':
        return styles.statusLive;
      case 'completed':
        return styles.statusCompleted;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Join Tournament</h2>
          <button onClick={handleClose} className={styles.modalCloseButton}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {tournaments.length === 0 ? (
            <div className={styles.noTournamentsMessage}>
              <p>No tournaments are currently available at this Dojo.</p>
              <p>Check back later for upcoming events!</p>
            </div>
          ) : (
            <>
              {/* Tournament Selection */}
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  Select Tournament to Join:
                </label>
                <div className={styles.tournamentSelection}>
                  {tournaments.map((tournament) => (
                    <button
                      key={tournament.id}
                      onClick={() => setSelectedTournament(tournament.id)}
                      className={`${styles.tournamentOption} ${
                        selectedTournament === tournament.id
                          ? styles.tournamentOptionSelected
                          : ''
                      }`}
                    >
                      <div className={styles.tournamentHeader}>
                        <div className={styles.tournamentTitleRow}>
                          <h4 className={styles.tournamentName}>
                            {tournament.name}
                          </h4>
                          <span
                            className={`${styles.tournamentStatus} ${getStatusClass(tournament.status)}`}
                          >
                            {getStatusText(tournament.status)}
                          </span>
                        </div>
                        <p className={styles.tournamentDescription}>
                          {tournament.description}
                        </p>
                      </div>

                      <div className={styles.tournamentDetails}>
                        <div className={styles.tournamentInfo}>
                          <div className={styles.tournamentInfoItem}>
                            <strong>Date:</strong>{' '}
                            {formatDate(tournament.startDate)}
                          </div>
                          <div className={styles.tournamentInfoItem}>
                            <strong>Format:</strong>{' '}
                            {tournament.format.replace('_', ' ')}
                          </div>
                          <div className={styles.tournamentInfoItem}>
                            <strong>Entry Fee:</strong> {tournament.entryFee}{' '}
                            Dojo Coins
                          </div>
                          <div className={styles.tournamentInfoItem}>
                            <strong>Participants:</strong>{' '}
                            {tournament.currentParticipants}/
                            {tournament.maxParticipants}
                          </div>
                        </div>

                        <div className={styles.tournamentPrizes}>
                          <strong>Prize Pool:</strong>
                          <div className={styles.prizeList}>
                            {tournament.prizePools.map((prize) => (
                              <span
                                key={prize.rank}
                                className={styles.prizeItem}
                              >
                                {prize.rank === 1
                                  ? '🥇'
                                  : prize.rank === 2
                                  ? '🥈'
                                  : '🥉'}{' '}
                                {prize.amount} Coins
                              </span>
                            ))}
                          </div>
                        </div>
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
          {tournaments.length > 0 && (
            <button
              onClick={handleJoinTournament}
              disabled={!selectedTournament || isLoading}
              className={styles.modalButtonPrimary}
            >
              {isLoading ? 'Joining Tournament...' : 'Join Tournament'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinTournamentModal;
