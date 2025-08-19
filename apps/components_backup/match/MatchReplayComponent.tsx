import React, { useState, useEffect } from 'react';
import {
  type MatchResult,
  type MatchEvent,
} from '../../services/RealTimeMatchTrackingService';

interface MatchReplayComponentProps {
  matchResult: MatchResult;
  matchEvents: MatchEvent[];
  onClose?: () => void;
}

export const MatchReplayComponent: React.FC<MatchReplayComponentProps> = ({
  matchResult,
  matchEvents,
  onClose,
}) => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(
    null
  );

  // Auto-play through events
  useEffect(() => {
    if (!isPlaying || currentEventIndex >= matchEvents.length) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => prev + 1);
    }, 2000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentEventIndex, matchEvents.length, playbackSpeed]);

  // Reset replay
  const resetReplay = () => {
    setCurrentEventIndex(0);
    setIsPlaying(false);
  };

  // Play/pause replay
  const togglePlayback = () => {
    if (currentEventIndex >= matchEvents.length) {
      resetReplay();
    }
    setIsPlaying(!isPlaying);
  };

  // Skip to specific event
  const skipToEvent = (index: number) => {
    setCurrentEventIndex(index);
    setIsPlaying(false);
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current event
  const currentEvent = matchEvents[currentEventIndex];

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg border border-cyan-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Match Replay & Highlights</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        )}
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Match Summary</h4>
          <div className="space-y-2">
            <p>
              <span className="text-gray-400">Duration:</span>{' '}
              {formatDuration(matchResult.duration)}
            </p>
            <p>
              <span className="text-gray-400">Winner:</span>{' '}
              {matchResult.winnerId}
            </p>
            <p>
              <span className="text-gray-400">Score:</span>{' '}
              {matchResult.winnerScore} - {matchResult.loserScore}
            </p>
            <p>
              <span className="text-gray-400">Total Shots:</span>{' '}
              {matchResult.analytics.totalShots}
            </p>
            <p>
              <span className="text-gray-400">Accuracy:</span>{' '}
              {(matchResult.analytics.accuracy * 100).toFixed(1)}%
            </p>
            <p>
              <span className="text-gray-400">Fouls:</span>{' '}
              {matchResult.analytics.fouls}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Highlights</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {matchResult.highlights.length > 0 ? (
              matchResult.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedHighlight === highlight
                      ? 'bg-cyan-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedHighlight(highlight)}
                >
                  {highlight}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No highlights recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Replay Controls */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-3">Replay Controls</h4>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={togglePlayback}
            className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={resetReplay}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold"
          >
            ⏮️ Reset
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
          <span className="text-gray-400">
            {currentEventIndex + 1} / {matchEvents.length} events
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentEventIndex + 1) / matchEvents.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Event Timeline */}
        <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
          {matchEvents.map((event, index) => (
            <button
              key={event.id}
              onClick={() => skipToEvent(index)}
              className={`p-2 rounded text-xs transition-colors ${
                index === currentEventIndex
                  ? 'bg-cyan-600 text-white'
                  : index < currentEventIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {event.type}
            </button>
          ))}
        </div>
      </div>

      {/* Current Event Display */}
      {currentEvent && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-semibold mb-3">Current Event</h4>
          <div className="space-y-2">
            <p>
              <span className="text-gray-400">Type:</span> {currentEvent.type}
            </p>
            <p>
              <span className="text-gray-400">Player:</span>{' '}
              {currentEvent.playerId}
            </p>
            <p>
              <span className="text-gray-400">Time:</span>{' '}
              {currentEvent.timestamp.toLocaleTimeString()}
            </p>
            <p>
              <span className="text-gray-400">Data:</span>{' '}
              {JSON.stringify(currentEvent.data)}
            </p>
          </div>
        </div>
      )}

      {/* Player Statistics */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-3">Player Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(matchResult.analytics.playerStats).map(
            ([playerId, stats]) => (
              <div key={playerId} className="bg-gray-700 p-3 rounded">
                <h5 className="font-semibold mb-2">{playerId}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Shots:</span> {stats.shots}
                  </div>
                  <div>
                    <span className="text-gray-400">Accuracy:</span>{' '}
                    {(stats.accuracy * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="text-gray-400">Fouls:</span> {stats.fouls}
                  </div>
                  <div>
                    <span className="text-gray-400">Highlights:</span>{' '}
                    {stats.highlights}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Rewards Summary */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-3">Rewards Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-900 p-3 rounded">
            <h5 className="font-semibold text-green-400 mb-2">
              Winner Rewards
            </h5>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Coins:</span>{' '}
                {matchResult.analytics.totalShots * 10}
              </p>
              <p>
                <span className="text-gray-400">Experience:</span>{' '}
                {matchResult.analytics.totalShots * 5}
              </p>
              {matchResult.isTerritoryMatch && (
                <p className="text-green-400 font-semibold">
                  Territory Control Gained!
                </p>
              )}
            </div>
          </div>
          <div className="bg-red-900 p-3 rounded">
            <h5 className="font-semibold text-red-400 mb-2">Loser Rewards</h5>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Coins:</span>{' '}
                {Math.floor(matchResult.analytics.totalShots * 5)}
              </p>
              <p>
                <span className="text-gray-400">Experience:</span>{' '}
                {Math.floor(matchResult.analytics.totalShots * 2.5)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
