import React, { useState, useEffect } from 'react';
import { DojoService, DojoCandidate, DojoLeaderboard } from '../../services/DojoService';

interface DojoProfilePanelProps {
  dojo: DojoCandidate;
  onClose: () => void;
  onChallenge: (dojoId: string) => void;
  onVisit: (dojoId: string) => void;
}

const DojoProfilePanel: React.FC<DojoProfilePanelProps> = ({
  dojo,
  onClose,
  onChallenge,
  onVisit
}) => {
  const [leaderboard, setLeaderboard] = useState<DojoLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'challenges'>('info');

  useEffect(() => {
    loadDojoData();
  }, [dojo.id]);

  const loadDojoData = async () => {
    try {
      setLoading(true);
      const leaderboardData = await DojoService.getLeaderboard(dojo.id);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading dojo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Verified</span>;
      case 'unconfirmed':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Unconfirmed</span>;
      case 'pending_verification':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
      default:
        return null;
    }
  };

  const getChallengeType = () => {
    // Determine challenge type based on dojo status and player relationship
    if (dojo.status === 'verified') {
      return 'gauntlet'; // Climb Top Ten leaderboard
    } else {
      return 'pilgrimage'; // Wanderer path
    }
  };

  const renderInfoTab = () => (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
            {dojo.photo ? (
              <img
                src={dojo.photo}
                alt={dojo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <span className="text-gray-600 text-xs">No Photo</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{dojo.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{dojo.address}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-gray-500">{dojo.distance}m away</span>
            {getStatusBadge(dojo.status)}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Dojo Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Verification:</span>
            <span className="font-medium">{dojo.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Challenge Type:</span>
            <span className="font-medium capitalize">{getChallengeType()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Players:</span>
            <span className="font-medium">{leaderboard?.players.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Top Ten Players</h4>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading leaderboard...</p>
        </div>
      ) : leaderboard && leaderboard.players.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {player.rank}
              </div>
              
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">?</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{player.name}</p>
                <p className="text-sm text-gray-500">Level {player.level}</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{player.wins}W</p>
                <p className="text-xs text-gray-500">{player.losses}L</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No players yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to challenge this dojo!</p>
        </div>
      )}
    </div>
  );

  const renderChallengesTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Available Challenges</h4>
      
      <div className="space-y-3">
        {getChallengeType() === 'gauntlet' ? (
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">🏆 Dojo Master Gauntlet</h5>
            <p className="text-sm text-blue-700 mb-3">
              Climb the Top Ten leaderboard to become the Dojo Master. Defeat players in order of rank.
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <div>• Defeat #10 ranked player</div>
              <div>• Defeat #9 ranked player</div>
              <div>• Continue until you reach #1</div>
              <div>• Defeat the current Dojo Master</div>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">🗡️ Wandering Ronin Path</h5>
            <p className="text-sm text-purple-700 mb-3">
              Collect the Dojo Master's badge by defeating 2 Top Ten players and the Master.
            </p>
            <div className="text-xs text-purple-600 space-y-1">
              <div>• Defeat any 2 Top Ten players</div>
              <div>• Defeat the Dojo Master</div>
              <div>• Earn "Wandering Ronin" badge</div>
            </div>
          </div>
        )}

        <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">🎯 Casual Challenge</h5>
          <p className="text-sm text-gray-700 mb-3">
            Challenge any player at this dojo for practice or fun.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• No ranking requirements</div>
            <div>• Earn experience points</div>
            <div>• Build relationships</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Dojo Profile</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Challenges
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
      </div>

      {/* Actions */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex space-x-3">
          <button
            onClick={() => onVisit(dojo.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Visit Dojo
          </button>
          <button
            onClick={() => onChallenge(dojo.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default DojoProfilePanel; 