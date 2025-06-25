import React, { useState } from 'react';
import { useEnhancedTournament } from '../../hooks/useEnhancedTournament';
import { AICommentaryPanel } from '../ai/AICommentaryPanel';
import { PoolGodInteraction } from '../../services/tournament/EnhancedTournamentService';

interface EnhancedTournamentPanelProps {
  tournamentId: string;
  onMatchComplete?: (matchId: string, winnerId: string, loserId: string) => void;
}

export const EnhancedTournamentPanel: React.FC<EnhancedTournamentPanelProps> = ({
  tournamentId,
  onMatchComplete
}) => {
  const {
    tournament,
    currentMatch,
    aiEvents,
    poolGodInteractions,
    rewards,
    isLoading,
    error,
    processMatch,
    completeTournament,
    getLatestCommentary,
    getLatestPoolGodInteraction,
    clearAIEvents
  } = useEnhancedTournament(tournamentId);

  const [showRewards, setShowRewards] = useState(false);
  const [selectedPoolGod, setSelectedPoolGod] = useState<PoolGodInteraction | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading tournament...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Tournament Error</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-gray-600">Tournament not found</h3>
      </div>
    );
  }

  const latestCommentary = getLatestCommentary();
  const latestPoolGodInteraction = getLatestPoolGodInteraction();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tournament Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{tournament.name}</h2>
            <p className="text-blue-100 mt-1">
              {tournament.format} • {tournament.participants?.length || 0} Participants
            </p>
            <p className="text-blue-100 mt-1">
              Prize Pool: {tournament.prize_pool || 0} Dojo Coins
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{tournament.status}</div>
            <div className="text-blue-100 text-sm">Status</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Tournament Bracket */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Tournament Bracket</h3>
            {tournament.matches && tournament.matches.length > 0 ? (
              <div className="space-y-4">
                {tournament.matches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border ${
                      match.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : match.status === 'in_progress'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-500">Round {match.round}</span>
                        <div className="font-medium">
                          {match.player1?.username || 'TBD'} vs {match.player2?.username || 'TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          match.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : match.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {match.status}
                        </span>
                        {match.winner && (
                          <div className="text-sm text-green-600 mt-1">
                            Winner: {match.winner.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No matches scheduled yet
              </div>
            )}
          </div>
        </div>

        {/* AI Commentary & Pool God Interactions */}
        <div className="space-y-6">
          {/* AI Commentary Panel */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-purple-800">AI Commentary</h3>
            {latestCommentary ? (
              <AICommentaryPanel commentary={latestCommentary} />
            ) : (
              <div className="text-gray-500 text-sm">
                No commentary available yet
              </div>
            )}
          </div>

          {/* Pool God Interactions */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-orange-800">Pool God Interactions</h3>
            {latestPoolGodInteraction ? (
              <div
                className="cursor-pointer p-3 bg-white rounded border border-orange-200 hover:border-orange-300 transition-colors"
                onClick={() => setSelectedPoolGod(latestPoolGodInteraction)}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-sm font-bold">
                      {latestPoolGodInteraction.god.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-orange-800">
                    {latestPoolGodInteraction.god.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{latestPoolGodInteraction.message}</p>
                {latestPoolGodInteraction.blessing && (
                  <div className="mt-2 text-xs text-orange-600">
                    Blessing: {latestPoolGodInteraction.blessing.type} (+{latestPoolGodInteraction.blessing.value})
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No Pool God interactions yet
              </div>
            )}
          </div>

          {/* Tournament Rewards */}
          {rewards.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-green-800">Tournament Rewards</h3>
              <div className="space-y-2">
                {rewards.map((reward, index) => (
                  <div key={index} className="flex items-center p-2 bg-white rounded border border-green-200">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 text-xs">🎁</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-green-800">
                        {reward.type.replace('_', ' ').toUpperCase()}
                      </div>
                      {reward.amount && (
                        <div className="text-sm text-green-600">
                          Amount: {reward.amount}
                        </div>
                      )}
                      {reward.nftMetadata && (
                        <div className="text-sm text-green-600">
                          NFT: {reward.nftMetadata.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={clearAIEvents}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear AI Events
            </button>
            {rewards.length > 0 && (
              <button
                onClick={() => setShowRewards(!showRewards)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                {showRewards ? 'Hide' : 'Show'} Rewards
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pool God Interaction Modal */}
      {selectedPoolGod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-orange-600 text-xl font-bold">
                  {selectedPoolGod.god.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-800">
                  {selectedPoolGod.god.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-500">{selectedPoolGod.event.replace('_', ' ')}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{selectedPoolGod.message}</p>
            {selectedPoolGod.blessing && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                <h4 className="font-semibold text-orange-800 mb-2">Divine Blessing</h4>
                <div className="text-sm text-orange-700">
                  <div>Type: {selectedPoolGod.blessing.type.replace('_', ' ')}</div>
                  <div>Value: +{selectedPoolGod.blessing.value}</div>
                  <div>Duration: {selectedPoolGod.blessing.duration} seconds</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSelectedPoolGod(null)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 