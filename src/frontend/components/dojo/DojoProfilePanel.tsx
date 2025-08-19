import React from 'react';
import './DojoProfilePanel.css';

interface DojoData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  controllingClanId?: string;
  controllingClan?: {
    name: string;
    tag?: string;
    avatar?: string;
  };
  isLocked?: boolean;
  clan?: string;
  distance?: string;
  clanLeader?: string;
}

interface DojoProfilePanelProps {
  dojo: DojoData;
  onClose: () => void;
  isLocked?: boolean;
}

const DojoProfilePanel: React.FC<DojoProfilePanelProps> = ({
  dojo,
  onClose,
  isLocked = false,
}) => {
  const handleChallenge = async (type: 'pilgrimage' | 'gauntlet') => {
    // Simplified challenge handling
    console.log(`Creating ${type} challenge for dojo:`, dojo.id);
  };

  return (
    <div className="dojo-profile-panel">
      {/* Close button */}
      <button
        onClick={onClose}
        className="close-button"
        aria-label="Close dojo profile"
      >
        &times;
      </button>

      {/* Dojo Name and Address */}
      <h2 className="dojo-name">{dojo.name}</h2>
      <p className="dojo-info">
        {dojo.clan} • {dojo.distance || 'Unknown distance'} away
      </p>

      {/* Territory Ownership Status */}
      <div className="ownership-status">
        {dojo.controllingClan ? (
          <div className="clan-info">
            {dojo.controllingClan.avatar && (
              <img
                src={dojo.controllingClan.avatar}
                alt={`${dojo.controllingClan.name} emblem`}
                className="clan-avatar"
              />
            )}
            <div>
              <p className="clan-name">
                Controlled by: {dojo.controllingClan.name}
              </p>
              {dojo.controllingClan.tag && (
                <p className="clan-tag">[{dojo.controllingClan.tag}]</p>
              )}
            </div>
          </div>
        ) : (
          <div className="clan-info">
            <div className="unclaimed-avatar">?</div>
            <p className="unclaimed-text">Unclaimed Territory</p>
          </div>
        )}
      </div>

      {/* Conditional content: Locked vs. Unlocked */}
      {isLocked ? (
        <div className="locked-message">
          <p>This territory is currently locked and cannot be challenged.</p>
        </div>
      ) : (
        <div className="challenge-options">
          <h3>Challenge Options</h3>
          <div className="challenge-buttons">
            <button
              onClick={() => handleChallenge('pilgrimage')}
              className="challenge-btn pilgrimage"
              aria-label="Challenge with pilgrimage"
            >
              Pilgrimage Challenge
            </button>
            <button
              onClick={() => handleChallenge('gauntlet')}
              className="challenge-btn gauntlet"
              aria-label="Challenge with gauntlet"
            >
              Gauntlet Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DojoProfilePanel;
