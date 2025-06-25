import React from 'react';
import { DigitalReward, PhysicalReward } from '../../types/sponsorship';
import './RewardPreview.css';

interface RewardPreviewProps {
  digitalReward: DigitalReward;
  physicalReward: PhysicalReward;
  compact?: boolean;
}

export const RewardPreview: React.FC<RewardPreviewProps> = ({
  digitalReward,
  physicalReward,
  compact = false,
}) => {
  const getRarityColor = (rarity?: string): string => {
    switch (rarity) {
      case 'common':
        return '#9CA3AF'; // Gray
      case 'rare':
        return '#3B82F6'; // Blue
      case 'epic':
        return '#8B5CF6'; // Purple
      case 'legendary':
        return '#F59E0B'; // Orange
      default:
        return '#6B7280'; // Default gray
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'cue':
        return '🎱';
      case 'title':
        return '🏅';
      case 'avatar_item':
        return '👤';
      case 'boost':
        return '⚡';
      case 'currency':
        return '💰';
      default:
        return '🎁';
    }
  };

  if (compact) {
    return (
      <div className="reward-preview compact">
        <div className="rewards-compact">
          <div className="reward-item digital">
            <span className="reward-icon">{getTypeIcon(digitalReward.type)}</span>
            <span className="reward-name">{digitalReward.itemName}</span>
            {digitalReward.rarity && (
              <span 
                className={`rarity-badge ${digitalReward.rarity}`}
                style={{ backgroundColor: getRarityColor(digitalReward.rarity) }}
              >
                {digitalReward.rarity}
              </span>
            )}
          </div>
          <div className="reward-divider">+</div>
          <div className="reward-item physical">
            <span className="reward-icon">📦</span>
            <span className="reward-name">{physicalReward.rewardName}</span>
            {physicalReward.estimatedValue && (
              <span className="reward-value">
                ${physicalReward.estimatedValue}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reward-preview full">
      <div className="digital-reward">
        <h4 className="reward-category">
          <span className="category-icon">💎</span>
          Digital Reward
        </h4>
        <div className="reward-card digital">
          {digitalReward.itemAssetUrl && (
            <img 
              src={digitalReward.itemAssetUrl} 
              alt={digitalReward.itemName}
              className="reward-image"
            />
          )}
          <div className="reward-info">
            <div className="reward-header">
              <span className="reward-type-icon">{getTypeIcon(digitalReward.type)}</span>
              <h5 className="reward-title">{digitalReward.itemName}</h5>
              {digitalReward.rarity && (
                <span 
                  className={`rarity-badge ${digitalReward.rarity}`}
                  style={{ backgroundColor: getRarityColor(digitalReward.rarity) }}
                >
                  {digitalReward.rarity}
                </span>
              )}
            </div>
            <p className="reward-description">{digitalReward.itemDescription}</p>
            {digitalReward.value && (
              <div className="reward-stats">
                <span className="stat-label">Value:</span>
                <span className="stat-value">{digitalReward.value}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="physical-reward">
        <h4 className="reward-category">
          <span className="category-icon">📦</span>
          Physical Reward
        </h4>
        <div className="reward-card physical">
          <div className="reward-info">
            <div className="reward-header">
              <span className="reward-type-icon">🎁</span>
              <h5 className="reward-title">{physicalReward.rewardName}</h5>
              {physicalReward.estimatedValue && (
                <span className="reward-value">
                  ${physicalReward.estimatedValue}
                </span>
              )}
            </div>
            <p className="reward-description">{physicalReward.rewardDescription}</p>
            <div className="shipping-info">
              <span className="shipping-label">📋 Redemption Process:</span>
              <p className="shipping-text">{physicalReward.redemptionInstructions}</p>
            </div>
            {physicalReward.redemptionDeadline && (
              <div className="deadline-info">
                <span className="deadline-label">⏰ Redemption Deadline:</span>
                <span className="deadline-date">
                  {new Date(physicalReward.redemptionDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};