import React, { useState, useEffect } from 'react';
import './NarrativeDisplay.css';

interface NarrativeDisplayProps {
  intro: string;
  outro?: string;
  onDismiss: () => void;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  intro,
  outro,
  onDismiss,
}) => {
  const [currentView, setCurrentView] = useState<'intro' | 'outro'>('intro');
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show intro animation on mount
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  const handleToggleView = () => {
    if (outro) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentView(current => current === 'intro' ? 'outro' : 'intro');
        setIsAnimating(false);
      }, 200);
    }
  };

  const formatNarrative = (text: string) => {
    // Split narrative into paragraphs and add dialogue styling
    return text.split('\n\n').map((paragraph, index) => {
      const isDialogue = paragraph.includes('"');
      return (
        <p 
          key={index} 
          className={`narrative-paragraph ${isDialogue ? 'dialogue' : ''}`}
        >
          {paragraph}
        </p>
      );
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`narrative-overlay ${!isVisible ? 'fade-out' : ''}`}>
      <div className={`narrative-modal ${isAnimating ? 'animating' : ''}`}>
        <div className="narrative-header">
          <div className="narrative-type">
            {currentView === 'intro' ? '📜 Quest Introduction' : '🏆 Quest Completion'}
          </div>
          <div className="narrative-controls">
            {outro && (
              <button 
                onClick={handleToggleView}
                className="toggle-narrative-button"
                title={currentView === 'intro' ? 'View completion story' : 'View introduction'}
              >
                {currentView === 'intro' ? '📖 Show Ending' : '📜 Show Beginning'}
              </button>
            )}
            <button 
              onClick={handleDismiss}
              className="close-narrative-button"
              title="Close narrative"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="narrative-content">
          <div className={`narrative-text ${currentView}`}>
            {currentView === 'intro' ? (
              <>
                <div className="narrative-title">The Path Begins...</div>
                <div className="narrative-body">
                  {formatNarrative(intro)}
                </div>
              </>
            ) : (
              <>
                <div className="narrative-title">The Tale Concludes...</div>
                <div className="narrative-body">
                  {formatNarrative(outro || '')}
                </div>
              </>
            )}
          </div>

          {outro && (
            <div className="narrative-indicators">
              <div 
                className={`indicator ${currentView === 'intro' ? 'active' : ''}`}
                onClick={() => setCurrentView('intro')}
                title="Introduction"
              >
                📜
              </div>
              <div 
                className={`indicator ${currentView === 'outro' ? 'active' : ''}`}
                onClick={() => setCurrentView('outro')}
                title="Completion"
              >
                🏆
              </div>
            </div>
          )}
        </div>

        <div className="narrative-footer">
          <div className="narrative-ambiance">
            <span className="ambiance-element">✨</span>
            <span className="ambiance-element">🕯️</span>
            <span className="ambiance-element">📖</span>
            <span className="ambiance-element">⚔️</span>
            <span className="ambiance-element">✨</span>
          </div>
          
          <div className="narrative-actions">
            <button 
              onClick={handleDismiss}
              className="continue-button"
            >
              {currentView === 'intro' ? 'Begin Quest' : 'Close Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};