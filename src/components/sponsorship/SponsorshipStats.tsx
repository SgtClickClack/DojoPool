import React from 'react';
import type { SponsorshipStats as SponsorshipStatsType } from '../../types/sponsorship';
import './SponsorshipStats.css';

interface SponsorshipStatsProps {
  stats: SponsorshipStatsType;
}

export const SponsorshipStats: React.FC<SponsorshipStatsProps> = ({ stats }) => {
  const getCompletionRate = (): number => {
    if (stats.totalBrackets === 0) return 0;
    return (stats.completedBrackets / stats.totalBrackets) * 100;
  };

  const getRedemptionRate = (): number => {
    if (stats.totalRewardsEarned === 0) return 0;
    return (stats.physicalRewardsRedeemed / stats.totalRewardsEarned) * 100;
  };

  return (
    <div className="sponsorship-stats">
      <h2 className="stats-title">Your Patronage Journey</h2>
      
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completedBrackets}</div>
            <div className="stat-label">Paths Completed</div>
            <div className="stat-subtitle">
              {getCompletionRate().toFixed(1)}% completion rate
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeBrackets}</div>
            <div className="stat-label">Active Quests</div>
            <div className="stat-subtitle">Currently in progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <div className="stat-value">{stats.unlockedBrackets}</div>
            <div className="stat-label">Available Paths</div>
            <div className="stat-subtitle">Ready to begin</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRewardsEarned}</div>
            <div className="stat-label">Digital Rewards</div>
            <div className="stat-subtitle">Earned and claimed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.physicalRewardsRedeemed}</div>
            <div className="stat-label">Physical Rewards</div>
            <div className="stat-subtitle">
              {getRedemptionRate().toFixed(1)}% redemption rate
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBrackets}</div>
            <div className="stat-label">Total Discovered</div>
            <div className="stat-subtitle">Paths encountered</div>
          </div>
        </div>
      </div>

      {stats.totalBrackets > 0 && (
        <div className="stats-summary">
          <div className="summary-item">
            <div className="summary-label">Journey Progress</div>
            <div className="summary-progress-bar">
              <div 
                className="summary-progress-fill"
                style={{ width: `${getCompletionRate()}%` }}
              />
            </div>
            <div className="summary-text">
              {stats.completedBrackets} of {stats.totalBrackets} paths completed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};