import React from 'react';
import { type DojoData } from '../services/LivingWorldHubService';

interface LeaderboardPlayer {
  id?: string;
  name: string;
  score: number;
}

interface ClanInfluence {
  name: string;
  percent: number;
}

interface DojoProfilePanelProps {
  dojo: DojoData | null;
  onClose: () => void;
}

const mockLeaderboard: LeaderboardPlayer[] = [
  { name: 'Kicky Breaks', score: 1200 },
  { name: 'RyuKlaw', score: 1100 },
  { name: 'FireMaster', score: 1050 },
  { name: 'ShadowStriker', score: 1000 },
  { name: 'PoolMaster', score: 950 },
  { name: 'CueWizard', score: 900 },
  { name: 'BreakBot', score: 850 },
  { name: 'SpinDoctor', score: 800 },
  { name: 'BankShot', score: 750 },
  { name: 'EightBall', score: 700 },
];

const mockAllegianceMeter: ClanInfluence[] = [
  { name: 'Crimson Monkey Clan', percent: 60 },
  { name: 'Iron Fist Alliance', percent: 30 },
  { name: "Dragon's Breath", percent: 10 },
];

const DojoProfilePanel: React.FC<DojoProfilePanelProps> = ({
  dojo,
  onClose,
}) => {
  if (!dojo) return null;

  // Fallbacks for missing fields
  const leaderboard: LeaderboardPlayer[] =
    (dojo as any).leaderboard || mockLeaderboard;
  const allegianceMeter: ClanInfluence[] =
    (dojo as any).allegianceMeter || mockAllegianceMeter;

  const getAllegianceColor = () => {
    switch (dojo.allegiance) {
      case 'player':
        return '#22d3ee';
      case 'rival':
        return '#ef4444';
      case 'neutral':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getAllegianceIcon = () => {
    switch (dojo.allegiance) {
      case 'player':
        return '🏠';
      case 'rival':
        return '⚔️';
      case 'neutral':
        return '🎱';
      default:
        return '🎱';
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 border-t-2 border-cyan-500 p-6 z-[100] animate-slide-up">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
      >
        &times;
      </button>
      <h2 className="text-3xl font-bold text-cyan-400">{dojo.name}</h2>
      <p className="text-gray-400 mb-4">{dojo.distance}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-lg mb-2">Top Ten Leaderboard</h3>
          <ul className="space-y-1">
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard
                .slice(0, 10)
                .map((player: LeaderboardPlayer, idx: number) => (
                  <li
                    key={player.id || idx}
                    className="flex justify-between text-gray-200"
                  >
                    <span>
                      {idx + 1}. {player.name}
                    </span>
                    <span className="text-cyan-300 font-mono">
                      {player.score}
                    </span>
                  </li>
                ))
            ) : (
              <li className="text-gray-500">No leaderboard data</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Clan Influence</h3>
          <div className="space-y-2">
            {allegianceMeter && allegianceMeter.length > 0 ? (
              allegianceMeter.map((clan: ClanInfluence, idx: number) => (
                <div key={clan.name || idx} className="flex items-center gap-2">
                  <span className="w-20 text-gray-300">{clan.name}</span>
                  <div className="flex-1 bg-gray-700 rounded h-3 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-3"
                      style={{ width: `${clan.percent}%` }}
                    ></div>
                  </div>
                  <span className="text-cyan-300 font-mono w-10 text-right">
                    {clan.percent}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No clan influence data</div>
            )}
          </div>
          <h3 className="font-bold text-lg mb-2 mt-4">Challenge Options</h3>
          <div className="space-y-3">
            <button className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-bold">
              Challenge for Title (Gauntlet)
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold">
              Challenge for Badge (Pilgrimage)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DojoProfilePanel;
