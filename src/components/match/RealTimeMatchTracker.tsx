import React, { useState, useEffect, useCallback } from 'react';
import { RealTimeMatchTrackingService, MatchEvent, MatchAnalytics, MatchResult } from '../../services/RealTimeMatchTrackingService';

interface RealTimeMatchTrackerProps {
  challengeId: string;
  matchData: any;
  onMatchEnd?: (result: MatchResult) => void;
}

export const RealTimeMatchTracker: React.FC<RealTimeMatchTrackerProps> = ({
  challengeId,
  matchData,
  onMatchEnd,
}) => {
  const [matchTrackingService] = useState(() => new RealTimeMatchTrackingService());
  const [matchId, setMatchId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [scores, setScores] = useState<{ [playerId: string]: number }>({});
  const [matchDuration, setMatchDuration] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize match tracking
  useEffect(() => {
    const initializeMatch = async () => {
      try {
        await matchTrackingService.startMatchTracking(challengeId, matchData);
        const activeMatches = matchTrackingService.getActiveMatches();
        const match = activeMatches.find(m => m.challengeId === challengeId);
        if (match) {
          setMatchId(match.id);
          setIsTracking(true);
          setCurrentPlayer(matchData.players[0]?.id || '');
          setScores(matchData.players.reduce((acc: any, player: any) => {
            acc[player.id] = 0;
            return acc;
          }, {}));
        }
      } catch (error) {
        console.error('Error initializing match tracking:', error);
      }
    };

    initializeMatch();
  }, [challengeId, matchData, matchTrackingService]);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleMatchEvent = ({ matchId: eventMatchId, event }: { matchId: string; event: MatchEvent }) => {
      if (eventMatchId === matchId) {
        setMatchEvents(prev => [...prev, event]);
      }
    };
    const handleAnalyticsUpdated = ({ matchId: analyticsMatchId, analytics }: { matchId: string; analytics: MatchAnalytics }) => {
      if (analyticsMatchId === matchId) {
        setAnalytics(analytics);
      }
    };
    const handleMatchEnded = ({ matchId: endedMatchId, result }: { matchId: string; result: MatchResult }) => {
      if (endedMatchId === matchId) {
        setIsTracking(false);
        onMatchEnd?.(result);
      }
    };

    matchTrackingService.on('connected', handleConnected);
    matchTrackingService.on('disconnected', handleDisconnected);
    matchTrackingService.on('matchEvent', handleMatchEvent);
    matchTrackingService.on('analyticsUpdated', handleAnalyticsUpdated);
    matchTrackingService.on('matchEnded', handleMatchEnded);

    return () => {
      matchTrackingService.off('connected', handleConnected);
      matchTrackingService.off('disconnected', handleDisconnected);
      matchTrackingService.off('matchEvent', handleMatchEvent);
      matchTrackingService.off('analyticsUpdated', handleAnalyticsUpdated);
      matchTrackingService.off('matchEnded', handleMatchEnded);
    };
  }, [matchTrackingService, matchId, onMatchEnd]);

  // Update match duration
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setMatchDuration(prev => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  // Record match event
  const recordEvent = useCallback(async (eventType: MatchEvent['type'], data: any) => {
    if (!matchId || !isTracking) return;

    try {
      await matchTrackingService.recordMatchEvent(matchId, {
        matchId,
        type: eventType,
        playerId: currentPlayer,
        data,
      });

      // Update scores if it's a shot event
      if (eventType === 'shot' && data.success) {
        setScores(prev => ({
          ...prev,
          [currentPlayer]: (prev[currentPlayer] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Error recording match event:', error);
    }
  }, [matchTrackingService, matchId, isTracking, currentPlayer]);

  // End match
  const endMatch = useCallback(async (winnerId: string, loserId: string) => {
    if (!matchId || !isTracking) return;

    try {
      const winnerScore = scores[winnerId] || 0;
      const loserScore = scores[loserId] || 0;

      await matchTrackingService.endMatch(matchId, {
        challengeId,
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        duration: matchDuration,
        highlights: [],
        territoryId: matchData.territoryId,
        isTerritoryMatch: !!matchData.territoryId,
      });
    } catch (error) {
      console.error('Error ending match:', error);
    }
  }, [matchTrackingService, matchId, isTracking, challengeId, scores, matchDuration, matchData.territoryId]);

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isTracking) {
    return (
      <div className="bg-gray-900 text-white p-6 rounded-lg border border-cyan-500">
        <h3 className="text-xl font-bold mb-4">Match Tracking</h3>
        <p className="text-gray-300">Match tracking has ended.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg border border-cyan-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Real-Time Match Tracker</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-sm text-cyan-400">
            {formatDuration(matchDuration)}
          </span>
        </div>
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Match Info</h4>
          <div className="space-y-2">
            <p><span className="text-gray-400">Match ID:</span> {matchId}</p>
            <p><span className="text-gray-400">Challenge ID:</span> {challengeId}</p>
            <p><span className="text-gray-400">Players:</span> {matchData.players.map((p: any) => p.name).join(' vs ')}</p>
            {matchData.territoryId && (
              <p><span className="text-gray-400">Territory:</span> {matchData.territoryId}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Scores</h4>
          <div className="space-y-2">
            {Object.entries(scores).map(([playerId, score]) => {
              const player = matchData.players.find((p: any) => p.id === playerId);
              return (
                <div key={playerId} className="flex justify-between items-center">
                  <span className={currentPlayer === playerId ? 'text-cyan-400 font-semibold' : ''}>
                    {player?.name || playerId}
                  </span>
                  <span className="text-xl font-bold">{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-semibold mb-3">Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Shots</p>
              <p className="text-xl font-bold">{analytics.totalShots}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-xl font-bold">{(analytics.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fouls</p>
              <p className="text-xl font-bold">{analytics.fouls}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Highlights</p>
              <p className="text-xl font-bold">{analytics.highlights.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Event Recording */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-3">Record Events</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => recordEvent('shot', { success: true, ball: '8-ball' })}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
          >
            Successful Shot
          </button>
          <button
            onClick={() => recordEvent('shot', { success: false, ball: '8-ball' })}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
          >
            Missed Shot
          </button>
          <button
            onClick={() => recordEvent('foul', { type: 'scratch', ball: 'cue' })}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-semibold"
          >
            Foul
          </button>
          <button
            onClick={() => recordEvent('highlight', { description: 'Amazing shot!' })}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold"
          >
            Highlight
          </button>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-3">Recent Events</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {matchEvents.slice(-10).reverse().map((event) => (
            <div key={event.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                {event.timestamp.toLocaleTimeString()}
              </span>
              <span className="capitalize">{event.type}</span>
              <span className="text-cyan-400">
                {matchData.players.find((p: any) => p.id === event.playerId)?.name || event.playerId}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* End Match */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">End Match</h4>
        <div className="grid grid-cols-2 gap-3">
          {matchData.players.map((player: any) => (
            <button
              key={player.id}
              onClick={() => {
                const otherPlayer = matchData.players.find((p: any) => p.id !== player.id);
                endMatch(player.id, otherPlayer.id);
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
            >
              {player.name} Wins
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 