import React, { useState } from 'react';
import { SponsorshipBracket, PlayerSponsorshipProgress } from '../../types/sponsorship';
import { RewardPreview } from './RewardPreview';
import './RewardClaim.css';

interface RewardClaimProps {
  bracket: SponsorshipBracket;
  progress?: PlayerSponsorshipProgress;
  onRewardClaimed: () => void;
}

export const RewardClaim: React.FC<RewardClaimProps> = ({
  bracket,
  progress,
  onRewardClaimed,
}) => {
  const [claimingDigital, setClaimingDigital] = useState(false);
  const [claimingPhysical, setClaimingPhysical] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isQuestCompleted = (): boolean => {
    if (!progress) return false;
    return bracket.challenges.every(
      challenge => progress.challengeProgress[challenge.challengeId]?.isCompleted
    );
  };

  const canClaimDigital = (): boolean => {
    return isQuestCompleted() && !progress?.digitalRewardClaimed;
  };

  const canClaimPhysical = (): boolean => {
    return isQuestCompleted() && !progress?.physicalRewardRedeemed;
  };

  const handleClaimDigitalReward = async () => {
    if (!canClaimDigital()) return;

    try {
      setClaimingDigital(true);
      setError(null);

      const response = await fetch(`/api/sponsorship/player/claim-digital/${bracket.bracketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim digital reward');
      }

      // Show success animation
      showRewardClaimedAnimation('digital');
      
      // Refresh progress
      onRewardClaimed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim digital reward');
    } finally {
      setClaimingDigital(false);
    }
  };

  const handleClaimPhysicalReward = async () => {
    if (!canClaimPhysical()) return;

    try {
      setClaimingPhysical(true);
      setError(null);

      const response = await fetch(`/api/sponsorship/player/redeem-physical/${bracket.bracketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem physical reward');
      }

      const data = await response.json();
      setRedemptionCode(data.data.redemptionCode);
      
      // Show success animation
      showRewardClaimedAnimation('physical');
      
      // Refresh progress
      onRewardClaimed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem physical reward');
    } finally {
      setClaimingPhysical(false);
    }
  };

  const showRewardClaimedAnimation = (type: 'digital' | 'physical') => {
    // Create a visual celebration effect
    const event = new CustomEvent('dojopool:reward_claimed', {
      detail: { type, bracket: bracket.inGameTitle }
    });
    window.dispatchEvent(event);
  };

  const copyRedemptionCode = () => {
    if (redemptionCode) {
      navigator.clipboard.writeText(redemptionCode);
      // Show copied feedback
      const button = document.querySelector('.copy-code-button') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
  };

  if (!progress) {
    return (
      <div className="reward-claim">
        <div className="reward-preview-container">
          <RewardPreview
            digitalReward={bracket.digitalReward}
            physicalReward={bracket.physicalReward}
            compact={false}
          />
        </div>
        <div className="claim-locked">
          <p>🔒 Complete the quest to claim your rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reward-claim">
      <div className="reward-preview-container">
        <RewardPreview
          digitalReward={bracket.digitalReward}
          physicalReward={bracket.physicalReward}
          compact={false}
        />
      </div>

      {error && (
        <div className="reward-error">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-error">
            Dismiss
          </button>
        </div>
      )}

      <div className="reward-actions">
        {/* Digital Reward Section */}
        <div className="reward-section digital">
          <h4>💎 Digital Reward</h4>
          {progress.digitalRewardClaimed ? (
            <div className="reward-claimed">
              <span className="claimed-icon">✅</span>
              <p>Digital reward claimed!</p>
              <div className="claimed-item">
                <strong>{bracket.digitalReward.itemName}</strong>
                <p>Check your inventory to use this item</p>
              </div>
            </div>
          ) : isQuestCompleted() ? (
            <div className="reward-available">
              <p>Your digital reward is ready to claim!</p>
              <button
                onClick={handleClaimDigitalReward}
                disabled={claimingDigital}
                className="claim-button digital"
              >
                {claimingDigital ? '⏳ Claiming...' : '🎁 Claim Digital Reward'}
              </button>
            </div>
          ) : (
            <div className="reward-locked">
              <p>Complete all challenges to unlock</p>
              <div className="progress-summary">
                {bracket.challenges.filter(c => progress.challengeProgress[c.challengeId]?.isCompleted).length} / {bracket.challenges.length} challenges completed
              </div>
            </div>
          )}
        </div>

        {/* Physical Reward Section */}
        <div className="reward-section physical">
          <h4>📦 Physical Reward</h4>
          {progress.physicalRewardRedeemed ? (
            <div className="reward-claimed">
              <span className="claimed-icon">📋</span>
              <p>Physical reward redeemed!</p>
              {progress.redemptionCode && (
                <div className="redemption-details">
                  <p>Your redemption code:</p>
                  <div className="redemption-code">
                    <code>{progress.redemptionCode}</code>
                    <button 
                      onClick={copyRedemptionCode}
                      className="copy-code-button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="redemption-instructions">
                    <p>{bracket.physicalReward.redemptionInstructions}</p>
                  </div>
                </div>
              )}
            </div>
          ) : isQuestCompleted() ? (
            <div className="reward-available">
              <p>Generate your redemption code for the physical reward!</p>
              <div className="physical-reward-warning">
                <p>⚠️ <strong>Important:</strong> Physical rewards require shipping information and are handled directly by the sponsor.</p>
              </div>
              <button
                onClick={handleClaimPhysicalReward}
                disabled={claimingPhysical}
                className="claim-button physical"
              >
                {claimingPhysical ? '⏳ Generating Code...' : '📦 Get Redemption Code'}
              </button>
            </div>
          ) : (
            <div className="reward-locked">
              <p>Complete all challenges to unlock</p>
              <div className="estimated-value">
                Estimated value: ${bracket.physicalReward.estimatedValue || 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>

      {redemptionCode && (
        <div className="redemption-success">
          <div className="success-animation">🎉</div>
          <h3>Redemption Code Generated!</h3>
          <div className="new-redemption-code">
            <code>{redemptionCode}</code>
            <button onClick={copyRedemptionCode} className="copy-code-button">
              Copy Code
            </button>
          </div>
          <p>Follow the redemption instructions to claim your physical reward.</p>
        </div>
      )}

      {isQuestCompleted() && (
        <div className="completion-celebration">
          <div className="celebration-content">
            <h3>🏆 Quest Complete!</h3>
            <p>You have proven yourself worthy of {bracket.sponsorName}'s patronage.</p>
            <div className="narrative-outro">
              <p>{bracket.narrativeOutro}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};