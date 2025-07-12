import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RealTimeMatchTracker } from '../src/components/match/RealTimeMatchTracker';
import { MatchReplayComponent } from '../src/components/match/MatchReplayComponent';
import { MatchAnalyticsComponent } from '../src/components/match/MatchAnalyticsComponent';
import { MatchResult, MatchEvent } from '../src/services/RealTimeMatchTrackingService';

export default function MatchTrackingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tracking' | 'replay' | 'analytics'>('tracking');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [challengeId, setChallengeId] = useState<string>('');
  const [matchData, setMatchData] = useState<any>(null);
  const [isMatchComplete, setIsMatchComplete] = useState(false);

  // Get challenge ID from URL params
  useEffect(() => {
    if (router.query.challengeId) {
      setChallengeId(router.query.challengeId as string);
      
      // Mock match data for demonstration
      setMatchData({
        players: [
          { id: 'player-1', name: 'Player One' },
          { id: 'player-2', name: 'Player Two' },
        ],
        territoryId: router.query.territoryId as string || null,
        challengeType: router.query.challengeType as string || 'standard',
      });
    }
  }, [router.query]);

  // Handle match end
  const handleMatchEnd = (result: MatchResult) => {
    setMatchResult(result);
    setIsMatchComplete(true);
    setActiveTab('replay');
  };

  // Mock match events for demonstration
  useEffect(() => {
    if (isMatchComplete && matchResult) {
      const mockEvents: MatchEvent[] = [
        {
          id: 'event_1',
          matchId: matchResult.matchId,
          type: 'shot',
          playerId: 'player-1',
          timestamp: new Date(Date.now() - 300000),
          data: { success: true, ball: '8-ball' },
        },
        {
          id: 'event_2',
          matchId: matchResult.matchId,
          type: 'shot',
          playerId: 'player-2',
          timestamp: new Date(Date.now() - 280000),
          data: { success: false, ball: '8-ball' },
        },
        {
          id: 'event_3',
          matchId: matchResult.matchId,
          type: 'foul',
          playerId: 'player-1',
          timestamp: new Date(Date.now() - 260000),
          data: { type: 'scratch', ball: 'cue' },
        },
        {
          id: 'event_4',
          matchId: matchResult.matchId,
          type: 'highlight',
          playerId: 'player-2',
          timestamp: new Date(Date.now() - 240000),
          data: { description: 'Amazing bank shot!' },
        },
        {
          id: 'event_5',
          matchId: matchResult.matchId,
          type: 'shot',
          playerId: 'player-1',
          timestamp: new Date(Date.now() - 220000),
          data: { success: true, ball: '8-ball' },
        },
      ];
      setMatchEvents(mockEvents);
    }
  }, [isMatchComplete, matchResult]);

  if (!challengeId || !matchData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500">
            <h1 className="text-2xl font-bold mb-4">Match Tracking</h1>
            <p className="text-gray-300">Loading match data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Match Tracking</h1>
          <p className="text-gray-300">
            Challenge ID: {challengeId} | 
            Players: {matchData.players.map((p: any) => p.name).join(' vs ')}
            {matchData.territoryId && ` | Territory: ${matchData.territoryId}`}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                activeTab === 'tracking'
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Live Tracking
            </button>
            <button
              onClick={() => setActiveTab('replay')}
              disabled={!isMatchComplete}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                activeTab === 'replay'
                  ? 'bg-cyan-600 text-white'
                  : isMatchComplete
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              Match Replay
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              disabled={!isMatchComplete}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-cyan-600 text-white'
                  : isMatchComplete
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tracking' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Real-Time Match Tracking</h2>
                <p className="text-gray-300">
                  Track your match in real-time, record events, and monitor performance.
                </p>
              </div>
              <RealTimeMatchTracker
                challengeId={challengeId}
                matchData={matchData}
                onMatchEnd={handleMatchEnd}
              />
            </div>
          )}

          {activeTab === 'replay' && isMatchComplete && matchResult && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Match Replay & Highlights</h2>
                <p className="text-gray-300">
                  Review the match, watch highlights, and analyze key moments.
                </p>
              </div>
              <MatchReplayComponent
                matchResult={matchResult}
                matchEvents={matchEvents}
                onClose={() => setActiveTab('tracking')}
              />
            </div>
          )}

          {activeTab === 'analytics' && isMatchComplete && matchResult && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Match Analytics & Insights</h2>
                <p className="text-gray-300">
                  Detailed performance analysis, insights, and recommendations.
                </p>
              </div>
              <MatchAnalyticsComponent
                matchResult={matchResult}
                onClose={() => setActiveTab('tracking')}
              />
            </div>
          )}

          {activeTab === 'replay' && !isMatchComplete && (
            <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500">
              <h2 className="text-xl font-bold mb-4">Match Replay</h2>
              <p className="text-gray-300">
                Match replay will be available once the match is completed.
              </p>
            </div>
          )}

          {activeTab === 'analytics' && !isMatchComplete && (
            <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500">
              <h2 className="text-xl font-bold mb-4">Match Analytics</h2>
              <p className="text-gray-300">
                Match analytics will be available once the match is completed.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 p-4 rounded-lg border border-cyan-500">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/map')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
            >
              Back to Map
            </button>
            <button
              onClick={() => router.push('/game-mechanics')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
            >
              Game Mechanics
            </button>
            {isMatchComplete && (
              <button
                onClick={() => setActiveTab('replay')}
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold transition-colors"
              >
                View Replay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 