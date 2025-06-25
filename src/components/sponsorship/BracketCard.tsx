import React from 'react';
import { SponsorshipBracket, PlayerSponsorshipProgress } from '../../types/sponsorship';
import { ProgressBar } from '../common/ProgressBar';
import { RewardPreview } from './RewardPreview';
import './BracketCard.css';

interface BracketCardProps {
  bracket: SponsorshipBracket;
  status: 'locked' | 'available' | 'unlocked' | 'in_progress' | 'completed' | 'redeemed';
  progress?: PlayerSponsorshipProgress;
  playerLevel: number;
  onUnlock: () => void;
}

export const BracketCard: React.FC<BracketCardProps> = ({
  bracket,
  status,
  progress,
  playerLevel,
  onUnlock,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return '🔒';
      case 'available':
        return '✨';
      case 'unlocked':
        return '📋';
      case 'in_progress':
        return '⚔️';
      case 'completed':
        return '✅';
      case 'redeemed':
        return '🏆';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'locked':
        return `Requires Level ${bracket.requiredLevel}`;
      case 'available':
        return 'Ready to Start';
      case 'unlocked':
        return 'Quest Available';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Quest Complete';
      case 'redeemed':
        return 'Fully Redeemed';
      default:
        return 'Unknown';
    }
  };

  const getCompletionPercentage = (): number => {
    if (!progress) return 0;
    
    const totalChallenges = bracket.challenges.length;
    const completedChallenges = bracket.challenges.filter(
      challenge => progress.challengeProgress[challenge.challengeId]?.isCompleted
    ).length;
    
    return (completedChallenges / totalChallenges) * 100;
  };

  const handleCardClick = () => {
    if (status === 'available') {
      onUnlock();
    } else if (status !== 'locked') {
      // Navigate to bracket detail view
      window.location.href = `/sponsorship/${bracket.bracketId}`;
    }
  };

  const isClickable = status !== 'locked';

  return (
    <div 
      className={`bracket-card ${status} ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable ? handleCardClick : undefined}
    >
      <div className="bracket-card-header">
        <div className="bracket-sponsor">
          {bracket.sponsorLogo && (
            <img 
              src={bracket.sponsorLogo} 
              alt={bracket.sponsorName}
              className="sponsor-logo"
            />
          )}
          <span className="sponsor-name">{bracket.sponsorName}</span>
        </div>
        <div className={`bracket-status ${status}`}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      <div className="bracket-content">
        <h3 className="bracket-title">{bracket.inGameTitle}</h3>
        
        <div className="bracket-narrative">
          <p className="narrative-intro">
            {bracket.narrativeIntro.length > 150 
              ? `${bracket.narrativeIntro.substring(0, 150)}...`
              : bracket.narrativeIntro
            }
          </p>
        </div>

        <div className="bracket-requirements">
          <div className="requirement-item">
            <span className="requirement-label">Required Level:</span>
            <span className={`requirement-value ${playerLevel >= bracket.requiredLevel ? 'met' : 'unmet'}`}>
              {bracket.requiredLevel}
            </span>
          </div>
          <div className="requirement-item">
            <span className="requirement-label">Challenges:</span>
            <span className="requirement-value">{bracket.challenges.length}</span>
          </div>
        </div>

        {progress && (
          <div className="bracket-progress">
            <ProgressBar 
              percentage={getCompletionPercentage()}
              label={`${bracket.challenges.filter(c => progress.challengeProgress[c.challengeId]?.isCompleted).length} / ${bracket.challenges.length} Complete`}
            />
          </div>
        )}

        <div className="bracket-rewards">
          <RewardPreview 
            digitalReward={bracket.digitalReward}
            physicalReward={bracket.physicalReward}
            compact={true}
          />
        </div>

        {status === 'locked' && (
          <div className="unlock-requirements">
            <p>Reach level {bracket.requiredLevel} to unlock this path</p>
            <div className="level-gap">
              You need {bracket.requiredLevel - playerLevel} more levels
            </div>
          </div>
        )}

        {status === 'available' && (
          <div className="unlock-prompt">
            <button className="unlock-button">
              Begin This Path
            </button>
          </div>
        )}
      </div>

      <div className="bracket-card-footer">
        <div className="bracket-meta">
          {bracket.maxParticipants && (
            <span className="participant-count">
              {bracket.currentParticipants || 0} / {bracket.maxParticipants} participants
            </span>
          )}
          {bracket.endDate && (
            <span className="end-date">
              Ends: {new Date(bracket.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};