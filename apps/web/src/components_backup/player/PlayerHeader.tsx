import { PlayerProfile } from '@/services/ApiService';
import React from 'react';
import styles from './PlayerHeader.module.css';
import FriendRequestButton from '@/components/friends/FriendRequestButton';

interface PlayerHeaderProps {
  player: PlayerProfile;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ player }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSkillLevel = (rating: number) => {
    if (rating >= 2000) return { level: 'Master', color: '#ffd700' };
    if (rating >= 1800) return { level: 'Expert', color: '#c0c0c0' };
    if (rating >= 1600) return { level: 'Advanced', color: '#cd7f32' };
    if (rating >= 1400) return { level: 'Intermediate', color: '#4CAF50' };
    if (rating >= 1200) return { level: 'Beginner', color: '#2196F3' };
    return { level: 'Novice', color: '#9E9E9E' };
  };

  const skillLevel = getSkillLevel(player.profile?.skillRating || 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerContent}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            {player.profile?.avatarUrl ? (
              <img
                src={player.profile.avatarUrl}
                alt={`${player.username}'s avatar`}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.defaultAvatar}>
                {player.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.onlineIndicator}></div>
          </div>

          <div className={styles.playerInfo}>
            <div className={styles.nameAndActions}>
              <h1 className={styles.username}>
                {player.profile?.displayName || player.username}
              </h1>
              <FriendRequestButton targetUserId={player.id} />
            </div>
            <div className={styles.userDetails}>
              <span className={styles.email}>{player.email}</span>
              {player.profile?.location && (
                <span className={styles.location}>
                  📍 {player.profile.location}
                </span>
              )}
            </div>
            <div className={styles.skillLevel}>
              <span
                className={styles.skillBadge}
                style={{ backgroundColor: skillLevel.color }}
              >
                {skillLevel.level}
              </span>
              <span className={styles.skillRating}>
                Rating: {player.profile?.skillRating || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{player.stats.totalMatches}</div>
            <div className={styles.statLabel}>Total Matches</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{player.stats.wins}</div>
            <div className={styles.statLabel}>Wins</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{player.stats.losses}</div>
            <div className={styles.statLabel}>Losses</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {Math.round(player.stats.winRate * 100)}%
            </div>
            <div className={styles.statLabel}>Win Rate</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{player.stats.currentStreak}</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{player.stats.longestStreak}</div>
            <div className={styles.statLabel}>Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className={styles.additionalInfo}>
        {player.profile?.bio && (
          <div className={styles.bio}>
            <h3>About</h3>
            <p>{player.profile.bio}</p>
          </div>
        )}

        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Member since:</span>
            <span className={styles.metaValue}>
              {formatDate(player.profile?.joinDate)}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tournaments:</span>
            <span className={styles.metaValue}>
              {player.stats.totalTournaments} ({player.stats.tournamentWins}{' '}
              wins)
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Best finish:</span>
            <span className={styles.metaValue}>
              {player.stats.highestFinish === 1
                ? '🥇 1st'
                : player.stats.highestFinish === 2
                ? '🥈 2nd'
                : player.stats.highestFinish === 3
                ? '🥉 3rd'
                : `${player.stats.highestFinish}th place`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHeader;
