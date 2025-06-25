import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  size = 'medium',
  color = 'primary',
  showPercentage = false,
  animated = false,
}) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`progress-bar-wrapper ${size}`}>
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showPercentage && (
            <span className="progress-percentage">{Math.round(clampedPercentage)}%</span>
          )}
        </div>
      )}
      <div className={`progress-bar ${color}`}>
        <div 
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};