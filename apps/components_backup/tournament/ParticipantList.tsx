import { TournamentParticipant } from '@/services/ApiService';
import React from 'react';
import styles from './ParticipantList.module.css';

interface ParticipantListProps {
  participants: TournamentParticipant[];
  maxParticipants: number;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  maxParticipants,
}) => {
  const getParticipantDisplayName = (participant: TournamentParticipant) => {
    return (
      participant.user?.username ||
      participant.user?.email ||
      `Player ${participant.id.slice(0, 8)}`
    );
  };

  const getParticipantAvatar = (participant: TournamentParticipant) => {
    // For now, generate a simple avatar based on the participant ID
    const colors = [
      '#00ff9d',
      '#00a8ff',
      '#ff4081',
      '#ffc107',
      '#4caf50',
      '#9c27b0',
    ];
    const colorIndex = participant.id.charCodeAt(0) % colors.length;
    const initials = getParticipantDisplayName(participant)
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={styles.avatar}
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials}
      </div>
    );
  };

  const getParticipantStatus = (participant: TournamentParticipant) => {
    switch (participant.status) {
      case 'ACTIVE':
        return { label: 'Active', color: styles.statusActive, icon: '🟢' };
      case 'ELIMINATED':
        return {
          label: 'Eliminated',
          color: styles.statusEliminated,
          icon: '🔴',
        };
      case 'WINNER':
        return { label: 'Winner', color: styles.statusWinner, icon: '🏆' };
      default:
        return {
          label: 'Registered',
          color: styles.statusRegistered,
          icon: '📝',
        };
    }
  };

  if (participants.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👥</div>
        <h3>No Participants Yet</h3>
        <p>Be the first to register for this tournament!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.participantCount}>
          <span className={styles.count}>{participants.length}</span>
          <span className={styles.maxCount}>/ {maxParticipants}</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${(participants.length / maxParticipants) * 100}%`,
            }}
          ></div>
        </div>
        <div className={styles.progressText}>
          {Math.round((participants.length / maxParticipants) * 100)}% Full
        </div>
      </div>

      <div className={styles.participantsGrid}>
        {participants.map((participant, index) => {
          const status = getParticipantStatus(participant);
          return (
            <div key={participant.id} className={styles.participantCard}>
              <div className={styles.participantHeader}>
                <div className={styles.rank}>#{index + 1}</div>
                <span className={`${styles.status} ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>

              <div className={styles.participantInfo}>
                {getParticipantAvatar(participant)}
                <div className={styles.participantDetails}>
                  <h4 className={styles.participantName}>
                    {getParticipantDisplayName(participant)}
                  </h4>
                  {participant.user?.email && (
                    <p className={styles.participantEmail}>
                      {participant.user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.participantFooter}>
                <div className={styles.joinDate}>
                  Joined:{' '}
                  {new Date(participant.joinedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {participants.length < maxParticipants && (
        <div className={styles.registrationNote}>
          <p>
            📝 {maxParticipants - participants.length} spot
            {maxParticipants - participants.length !== 1 ? 's' : ''} remaining.
            Registration is still open!
          </p>
        </div>
      )}

      {participants.length === maxParticipants && (
        <div className={styles.fullNote}>
          <p>🎯 Tournament is full! Registration is now closed.</p>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
