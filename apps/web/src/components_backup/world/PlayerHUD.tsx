import React from 'react';
import { type PlayerData } from '../../services/LivingWorldHubService';

interface PlayerHUDProps {
  playerData: PlayerData;
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({ playerData }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-lg border-2 border-cyan-500 rounded-2xl p-4 text-white shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl border-2 border-cyan-300">
            {playerData.avatar || '👤'}
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {playerData.name}
            </div>
            <div className="text-sm text-gray-300 font-mono">
              Level {playerData.level} • {playerData.clanRank}
            </div>
            <div className="text-sm text-blue-300 font-mono">
              Home: {playerData.homeDojo}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {playerData.clan}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-400 text-lg">💰</span>
            <span className="font-mono font-bold text-yellow-300">
              {playerData.dojoCoins.toLocaleString()} Dojo Coins
            </span>
          </div>

          {playerData.isMoving && playerData.destination && (
            <div className="mt-2 text-xs text-green-300 font-mono flex items-center space-x-1">
              <span className="animate-pulse">🚶</span>
              <span>Moving to {playerData.destination.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
