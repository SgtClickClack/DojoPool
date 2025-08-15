import React, { useState, useEffect } from 'react';
import { DojoService, DojoLeaderboard } from '../../services/DojoService';

interface DojoLeaderboardProps {
  dojoId: string;
  className?: string;
  showHeader?: boolean;
  maxPlayers?: number;
}

const DojoLeaderboard: React.FC<DojoLeaderboardProps> = ({
  dojoId,
  className = '',
  showHeader = true,
  maxPlayers = 10
}) => {
  const [leaderboard, setLeaderboard] = useState<DojoLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [dojoId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DojoService.getLeaderboard(dojoId);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-white text-gray-800 border-gray-200';
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Top Ten Players</h3>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Top Ten Players</h3>
          </div>
        )}
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.players.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Top Ten Players</h3>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">🏆</div>
          <p className="text-gray-500">No players yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to join this dojo!</p>
        </div>
      </div>
    );
  }

  const displayPlayers = leaderboard.players.slice(0, maxPlayers);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Top Ten Players</h3>
          <p className="text-sm text-gray-500 mt-1">
            {leaderboard.players.length} active player{leaderboard.players.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {displayPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${getRankColor(player.rank)}`}
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  {getRankIcon(player.rank)}
                </div>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-gray-900 truncate">{player.name}</p>
                  {player.rank === 1 && (
                    <span className="text-yellow-600 text-sm">👑 Master</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">Level {player.level}</span>
                  <span className="text-sm text-gray-500">
                    {player.wins}W / {player.losses}L
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {getWinRate(player.wins, player.losses)} WR
                  </span>
                </div>
              </div>

              {/* Challenge Button */}
              <div className="flex-shrink-0">
                <button
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors"
                  onClick={() => {
                    // Handle challenge player
                    console.log(`Challenge player: ${player.name}`);
                  }}
                >
                  Challenge
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {leaderboard.players.length > maxPlayers && (
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Showing top {maxPlayers} of {leaderboard.players.length} players
          </p>
        </div>
      )}
    </div>
  );
};

export default DojoLeaderboard; 