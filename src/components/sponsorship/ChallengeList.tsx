import React from 'react';
import { SponsorshipChallenge, PlayerSponsorshipProgress } from '../../types/sponsorship';
import { ProgressBar } from '../common/ProgressBar';
import './ChallengeList.css';

interface ChallengeListProps {
  challenges: SponsorshipChallenge[];
  progress?: PlayerSponsorshipProgress;
  onChallengeUpdate: () => void;
}

export const ChallengeList: React.FC<ChallengeListProps> = ({
  challenges,
  progress,
  onChallengeUpdate,
}) => {
  const getChallengeTypeIcon = (type: string): string => {
    switch (type) {
      case 'game_win':
        return '🎱';
      case 'trick_shot':
        return '🎯';
      case 'streak':
        return '🔥';
      case 'tournament':
        return '🏆';
      case 'level_reach':
        return '⬆️';
      case 'venue_capture':
        return '🏢';
      default:
        return '⚡';
    }
  };

  const getChallengeStatus = (challenge: SponsorshipChallenge) => {
    if (!progress) return 'locked';
    
    const challengeProgress = progress.challengeProgress[challenge.challengeId];
    if (!challengeProgress) return 'available';
    
    return challengeProgress.isCompleted ? 'completed' : 'in_progress';
  };

  const getChallengeProgress = (challenge: SponsorshipChallenge): number => {
    if (!progress) return 0;
    
    const challengeProgress = progress.challengeProgress[challenge.challengeId];
    return challengeProgress?.progress || 0;
  };

  const getProgressPercentage = (challenge: SponsorshipChallenge): number => {
    const currentProgress = getChallengeProgress(challenge);
    const maxProgress = challenge.maxProgress || challenge.requirement.count || challenge.requirement.level || challenge.requirement.streak || 1;
    return Math.min((currentProgress / maxProgress) * 100, 100);
  };

  const getProgressText = (challenge: SponsorshipChallenge): string => {
    const currentProgress = getChallengeProgress(challenge);
    const maxProgress = challenge.maxProgress || challenge.requirement.count || challenge.requirement.level || challenge.requirement.streak || 1;
    
    switch (challenge.type) {
      case 'level_reach':
        return `Level ${Math.max(currentProgress, 0)} / ${maxProgress}`;
      case 'streak':
        return `${currentProgress} streak (need ${maxProgress})`;
      default:
        return `${currentProgress} / ${maxProgress}`;
    }
  };

  const formatRequirement = (challenge: SponsorshipChallenge): string => {
    const req = challenge.requirement;
    
    switch (challenge.type) {
      case 'game_win':
        return `Win ${req.count} games`;
      case 'trick_shot':
        return `Complete ${req.count} ${req.difficulty || ''} trick shots`.trim();
      case 'streak':
        return `Achieve ${req.streak}-game winning streak`;
      case 'tournament':
        return `Win ${req.count} ${req.venue_type || ''} tournaments`.trim();
      case 'level_reach':
        return `Reach level ${req.level}`;
      case 'venue_capture':
        return `Capture ${req.count} ${req.venue_type || 'venues'}`.trim();
      default:
        return challenge.description;
    }
  };

  return (
    <div className="challenge-list">
      {challenges.map((challenge, index) => {
        const status = getChallengeStatus(challenge);
        const progressPercentage = getProgressPercentage(challenge);
        const progressText = getProgressText(challenge);
        
        return (
          <div 
            key={challenge.challengeId} 
            className={`challenge-item ${status}`}
          >
            <div className="challenge-header">
              <div className="challenge-number">{index + 1}</div>
              <div className="challenge-icon">
                {getChallengeTypeIcon(challenge.type)}
              </div>
              <div className="challenge-info">
                <h4 className="challenge-title">{challenge.description}</h4>
                <p className="challenge-requirement">
                  {formatRequirement(challenge)}
                </p>
              </div>
              <div className={`challenge-status-badge ${status}`}>
                {status === 'completed' && '✅'}
                {status === 'in_progress' && '⏳'}
                {status === 'available' && '🔓'}
                {status === 'locked' && '🔒'}
              </div>
            </div>

            {progress && status !== 'locked' && (
              <div className="challenge-progress">
                <ProgressBar
                  percentage={progressPercentage}
                  label={progressText}
                  size="small"
                  color={status === 'completed' ? 'success' : 'primary'}
                  animated={status === 'in_progress'}
                />
                
                {status === 'completed' && progress.challengeProgress[challenge.challengeId]?.completedAt && (
                  <div className="completion-info">
                    <span className="completion-date">
                      Completed: {new Date(progress.challengeProgress[challenge.challengeId].completedAt!).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {status === 'locked' && (
              <div className="challenge-locked">
                <p>Complete previous challenges to unlock</p>
              </div>
            )}

            {status === 'available' && (
              <div className="challenge-available">
                <p>Challenge ready - start playing to make progress!</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};