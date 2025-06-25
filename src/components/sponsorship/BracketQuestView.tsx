import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SponsorshipBracket, PlayerSponsorshipProgress } from '../../types/sponsorship';
import { ChallengeList } from './ChallengeList';
import { RewardClaim } from './RewardClaim';
import { NarrativeDisplay } from './NarrativeDisplay';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './BracketQuestView.css';

export const BracketQuestView: React.FC = () => {
  const { bracketId } = useParams<{ bracketId: string }>();
  const navigate = useNavigate();
  const [bracket, setBracket] = useState<SponsorshipBracket | null>(null);
  const [progress, setProgress] = useState<PlayerSponsorshipProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNarrative, setShowNarrative] = useState(true);

  useEffect(() => {
    if (bracketId) {
      loadBracketData(bracketId);
    }
  }, [bracketId]);

  const loadBracketData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const [bracketResponse, progressResponse] = await Promise.all([
        fetch(`/api/sponsorship/brackets/${id}`),
        fetch(`/api/sponsorship/player/progress`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (!bracketResponse.ok) {
        throw new Error('Bracket not found');
      }

      const bracketData = await bracketResponse.json();
      setBracket(bracketData.data);

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        const playerProgress = progressData.data.find((p: PlayerSponsorshipProgress) => p.bracketId === id);
        setProgress(playerProgress || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeUpdate = async () => {
    // Reload progress data when challenges are updated
    if (bracketId) {
      await loadBracketData(bracketId);
    }
  };

  const getCompletionPercentage = (): number => {
    if (!bracket || !progress) return 0;
    
    const completedChallenges = bracket.challenges.filter(
      challenge => progress.challengeProgress[challenge.challengeId]?.isCompleted
    ).length;
    
    return (completedChallenges / bracket.challenges.length) * 100;
  };

  const isQuestCompleted = (): boolean => {
    if (!bracket || !progress) return false;
    return bracket.challenges.every(
      challenge => progress.challengeProgress[challenge.challengeId]?.isCompleted
    );
  };

  if (loading) {
    return (
      <div className="bracket-quest-view">
        <LoadingSpinner message="Loading quest details..." />
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="bracket-quest-view">
        <ErrorMessage 
          message={error || 'Bracket not found'} 
          onRetry={() => bracketId && loadBracketData(bracketId)} 
        />
      </div>
    );
  }

  return (
    <div className="bracket-quest-view">
      <div className="quest-header">
        <button 
          className="back-button"
          onClick={() => navigate('/sponsorship')}
        >
          ← Back to Patronage Hub
        </button>
        
        <div className="quest-title-section">
          <div className="sponsor-info">
            {bracket.sponsorLogo && (
              <img 
                src={bracket.sponsorLogo} 
                alt={bracket.sponsorName}
                className="sponsor-logo-large"
              />
            )}
            <div className="sponsor-details">
              <h4 className="sponsor-name">{bracket.sponsorName}</h4>
              <span className="sponsor-label">Patron</span>
            </div>
          </div>
          
          <h1 className="quest-title">{bracket.inGameTitle}</h1>
          
          {progress && (
            <div className="quest-progress-header">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
              <span className="progress-text">
                {Math.round(getCompletionPercentage())}% Complete
              </span>
            </div>
          )}
        </div>
      </div>

      {showNarrative && (
        <NarrativeDisplay
          intro={bracket.narrativeIntro}
          outro={isQuestCompleted() ? bracket.narrativeOutro : undefined}
          onDismiss={() => setShowNarrative(false)}
        />
      )}

      <div className="quest-content">
        <div className="quest-main">
          <div className="challenges-section">
            <h2>The Trials</h2>
            <ChallengeList
              challenges={bracket.challenges}
              progress={progress}
              onChallengeUpdate={handleChallengeUpdate}
            />
          </div>

          {!progress && (
            <div className="quest-locked">
              <div className="locked-message">
                <h3>🔒 Path Not Yet Unlocked</h3>
                <p>You must first accept this patron's quest to begin the trials.</p>
                <button 
                  className="unlock-quest-button"
                  onClick={() => navigate('/sponsorship')}
                >
                  Return to Accept Quest
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="quest-sidebar">
          <div className="rewards-section">
            <h3>Rewards of the Path</h3>
            <RewardClaim
              bracket={bracket}
              progress={progress}
              onRewardClaimed={handleChallengeUpdate}
            />
          </div>

          <div className="quest-info">
            <h4>Quest Details</h4>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Required Level:</span>
                <span className="info-value">{bracket.requiredLevel}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Challenges:</span>
                <span className="info-value">{bracket.challenges.length}</span>
              </div>
              {bracket.maxParticipants && (
                <div className="info-item">
                  <span className="info-label">Participants:</span>
                  <span className="info-value">
                    {bracket.currentParticipants || 0} / {bracket.maxParticipants}
                  </span>
                </div>
              )}
              {bracket.endDate && (
                <div className="info-item">
                  <span className="info-label">Deadline:</span>
                  <span className="info-value">
                    {new Date(bracket.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};