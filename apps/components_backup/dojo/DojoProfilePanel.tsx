import React, { useState } from 'react';
import { type DojoData } from '../../services/LivingWorldHubService';
import { ChallengeService } from '../../services/ChallengeService';

interface DojoProfilePanelProps {
  dojo: DojoData | null;
  onClose: () => void;
  isLocked?: boolean;
}

const DojoProfilePanel: React.FC<DojoProfilePanelProps> = ({
  dojo,
  onClose,
  isLocked = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // The component should render nothing if no dojo is selected.
  if (!dojo) {
    return null;
  }

  const handleChallenge = async (type: 'pilgrimage' | 'gauntlet') => {
    // Use the clan leader as the defender since we don't have a leaderboard
    const defenderId = dojo.clanLeader || 'dojo-master';

    setIsLoading(true);
    setMessage(null);

    try {
      await ChallengeService.createChallenge({
        type,
        defenderId,
        dojoId: dojo.id,
      });

      setMessage(
        `Challenge sent! ${type === 'pilgrimage' ? 'Pilgrimage' : 'Gauntlet'} challenge created.`
      );
    } catch (error) {
      console.error('Error creating challenge:', error);
      setMessage('Failed to create challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Main container for the slide-up panel.
  // The 'animate-slide-up' class is crucial for the animation.
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 border-t-4 border-cyan-400 p-6 z-[1000] animate-slide-up">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold"
      >
        &times;
      </button>

      {/* Dojo Name and Address */}
      <h2 className="text-3xl font-bold text-cyan-400">{dojo.name}</h2>
      <p className="text-gray-400 mb-2">
        {dojo.clan} • {dojo.distance} away
      </p>

      {/* Territory Ownership Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-800 border-l-4 border-cyan-400">
        {dojo.controllingClan ? (
          <div className="flex items-center space-x-3">
            {dojo.controllingClan.avatar && (
              <img
                src={dojo.controllingClan.avatar}
                alt={`${dojo.controllingClan.name} emblem`}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="text-white font-bold">
                Controlled by: {dojo.controllingClan.name}
              </p>
              {dojo.controllingClan.tag && (
                <p className="text-gray-400 text-sm">
                  [{dojo.controllingClan.tag}]
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-gray-400 text-xs">?</span>
            </div>
            <p className="text-yellow-400 font-bold">Unclaimed Territory</p>
          </div>
        )}
      </div>

      {/* Conditional content: Locked vs. Unlocked */}
      {isLocked ? (
        <div className="text-center py-8">
          <p className="text-2xl text-yellow-400">🔒 TERRITORY LOCKED</p>
          <p className="text-gray-300 mt-2">
            You must increase your influence in the current zone to challenge
            Dojos here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Leaderboard */}
          <div>
            <h3 className="font-bold text-lg mb-2">Top Ten Leaderboard</h3>
            <ul className="space-y-1 text-sm">
              {/* Mock leaderboard data since it's not in DojoData */}
              <li className="flex justify-between p-2 rounded bg-gray-800">
                <span>1. {dojo.clanLeader}</span>
                <span>Lv. 25</span>
              </li>
              <li className="flex justify-between p-2 rounded bg-gray-800">
                <span>2. Player Two</span>
                <span>Lv. 22</span>
              </li>
              <li className="flex justify-between p-2 rounded bg-gray-800">
                <span>3. Player Three</span>
                <span>Lv. 20</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Influence and Actions */}
          <div>
            <h3 className="font-bold text-lg mb-2">Clan Influence</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{dojo.clan}</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-cyan-400 h-2.5 rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 mt-4">Challenge Options</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleChallenge('gauntlet')}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Challenge for Title (Gauntlet)'}
              </button>
              <button
                onClick={() => handleChallenge('pilgrimage')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Challenge for Badge (Pilgrimage)'}
              </button>
            </div>

            {message && (
              <div className="mt-3 p-2 rounded bg-gray-800 text-sm">
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DojoProfilePanel;
