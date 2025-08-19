import React, { useState, useEffect } from 'react';
import {
  type MatchResult,
  MatchAnalytics,
} from '../../services/RealTimeMatchTrackingService';

interface MatchAnalyticsComponentProps {
  matchResult: MatchResult;
  onClose?: () => void;
}

export const MatchAnalyticsComponent: React.FC<
  MatchAnalyticsComponentProps
> = ({ matchResult, onClose }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('accuracy');
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    // Set default selected player
    if (Object.keys(matchResult.analytics.playerStats).length > 0) {
      setSelectedPlayer(Object.keys(matchResult.analytics.playerStats)[0]);
    }

    // Generate insights
    generateInsights();
  }, [matchResult]);

  const generateInsights = () => {
    const newInsights: any[] = [];
    const analytics = matchResult.analytics;

    // Overall match insights
    if (analytics.accuracy > 0.8) {
      newInsights.push({
        type: 'positive',
        title: 'Exceptional Accuracy',
        description: `Overall accuracy of ${(analytics.accuracy * 100).toFixed(1)}% shows excellent shot precision.`,
        icon: '🎯',
      });
    } else if (analytics.accuracy < 0.5) {
      newInsights.push({
        type: 'warning',
        title: 'Low Accuracy',
        description: `Accuracy of ${(analytics.accuracy * 100).toFixed(1)}% suggests room for improvement in shot selection.`,
        icon: '⚠️',
      });
    }

    if (analytics.fouls === 0) {
      newInsights.push({
        type: 'positive',
        title: 'Clean Game',
        description:
          'No fouls recorded - excellent discipline and rule adherence.',
        icon: '✨',
      });
    } else if (analytics.fouls > 5) {
      newInsights.push({
        type: 'negative',
        title: 'High Foul Rate',
        description: `${analytics.fouls} fouls recorded - focus on cleaner play.`,
        icon: '🚫',
      });
    }

    if (analytics.totalShots > 50) {
      newInsights.push({
        type: 'info',
        title: 'Marathon Match',
        description: `${analytics.totalShots} total shots - this was a long, competitive game.`,
        icon: '🏃',
      });
    }

    // Player-specific insights
    Object.entries(analytics.playerStats).forEach(([playerId, stats]) => {
      if (stats.accuracy > 0.9) {
        newInsights.push({
          type: 'positive',
          title: `${playerId} - Sharpshooter`,
          description: `${(stats.accuracy * 100).toFixed(1)}% accuracy is outstanding!`,
          icon: '🎯',
          playerId,
        });
      }

      if (stats.highlights > 0) {
        newInsights.push({
          type: 'positive',
          title: `${playerId} - Highlight Reel`,
          description: `${stats.highlights} highlight moments recorded.`,
          icon: '⭐',
          playerId,
        });
      }

      if (stats.fouls > 3) {
        newInsights.push({
          type: 'negative',
          title: `${playerId} - Foul Trouble`,
          description: `${stats.fouls} fouls - work on cleaner play.`,
          icon: '🚫',
          playerId,
        });
      }
    });

    setInsights(newInsights);
  };

  const getMetricValue = (playerId: string, metric: string): number => {
    const stats = matchResult.analytics.playerStats[playerId];
    if (!stats) return 0;

    switch (metric) {
      case 'accuracy':
        return stats.accuracy;
      case 'shots':
        return stats.shots;
      case 'fouls':
        return stats.fouls;
      case 'highlights':
        return stats.highlights;
      default:
        return 0;
    }
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'accuracy':
        return 'Accuracy %';
      case 'shots':
        return 'Total Shots';
      case 'fouls':
        return 'Fouls';
      case 'highlights':
        return 'Highlights';
      default:
        return metric;
    }
  };

  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'accuracy':
        return value > 0.8
          ? 'text-green-400'
          : value > 0.6
            ? 'text-yellow-400'
            : 'text-red-400';
      case 'fouls':
        return value === 0
          ? 'text-green-400'
          : value > 3
            ? 'text-red-400'
            : 'text-yellow-400';
      case 'highlights':
        return value > 0 ? 'text-green-400' : 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  const getInsightColor = (type: string): string => {
    switch (type) {
      case 'positive':
        return 'border-green-500 bg-green-900/20';
      case 'negative':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg border border-cyan-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Match Analytics & Insights</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        )}
      </div>

      {/* Overall Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Total Shots</h4>
          <p className="text-3xl font-bold text-cyan-400">
            {matchResult.analytics.totalShots}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Accuracy</h4>
          <p className="text-3xl font-bold text-cyan-400">
            {(matchResult.analytics.accuracy * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Fouls</h4>
          <p className="text-3xl font-bold text-cyan-400">
            {matchResult.analytics.fouls}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Highlights</h4>
          <p className="text-3xl font-bold text-cyan-400">
            {matchResult.analytics.highlights.length}
          </p>
        </div>
      </div>

      {/* Player Comparison */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-4">
          Player Performance Comparison
        </h4>

        {/* Metric Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Compare by:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="accuracy">Accuracy</option>
            <option value="shots">Total Shots</option>
            <option value="fouls">Fouls</option>
            <option value="highlights">Highlights</option>
          </select>
        </div>

        {/* Player Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(matchResult.analytics.playerStats).map(
            ([playerId, stats]) => {
              const value = getMetricValue(playerId, selectedMetric);
              const displayValue =
                selectedMetric === 'accuracy'
                  ? `${(value * 100).toFixed(1)}%`
                  : value;

              return (
                <div key={playerId} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold">{playerId}</h5>
                    <span
                      className={`text-xl font-bold ${getMetricColor(selectedMetric, value)}`}
                    >
                      {displayValue}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((value / Math.max(...Object.values(matchResult.analytics.playerStats).map((s) => getMetricValue(s.playerId || '', selectedMetric)))) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  <p className="text-sm text-gray-400 mt-1">
                    {getMetricLabel(selectedMetric)}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-4">Match Insights</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <h5 className="font-semibold">{insight.title}</h5>
                  <p className="text-sm text-gray-300">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-semibold mb-4">
          Performance Recommendations
        </h4>
        <div className="space-y-3">
          {matchResult.analytics.accuracy < 0.7 && (
            <div className="bg-blue-900/20 border border-blue-500 p-3 rounded-lg">
              <h5 className="font-semibold text-blue-400 mb-2">
                Improve Shot Accuracy
              </h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Practice shot selection and positioning</li>
                <li>• Focus on consistent stroke mechanics</li>
                <li>• Consider using aiming aids or guides</li>
              </ul>
            </div>
          )}

          {matchResult.analytics.fouls > 2 && (
            <div className="bg-yellow-900/20 border border-yellow-500 p-3 rounded-lg">
              <h5 className="font-semibold text-yellow-400 mb-2">
                Reduce Fouls
              </h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Review pool rules and foul conditions</li>
                <li>• Practice controlled shots and positioning</li>
                <li>• Focus on ball control and spin management</li>
              </ul>
            </div>
          )}

          {matchResult.analytics.totalShots < 20 && (
            <div className="bg-green-900/20 border border-green-500 p-3 rounded-lg">
              <h5 className="font-semibold text-green-400 mb-2">
                Efficient Play
              </h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Good shot efficiency - minimal wasted shots</li>
                <li>• Consider more aggressive shot selection</li>
                <li>• Balance efficiency with shot difficulty</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Match Statistics */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Detailed Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold mb-2">Match Overview</h5>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Duration:</span>{' '}
                {Math.floor(matchResult.duration / 60000)}m{' '}
                {Math.floor((matchResult.duration % 60000) / 1000)}s
              </p>
              <p>
                <span className="text-gray-400">Winner Score:</span>{' '}
                {matchResult.winnerScore}
              </p>
              <p>
                <span className="text-gray-400">Loser Score:</span>{' '}
                {matchResult.loserScore}
              </p>
              <p>
                <span className="text-gray-400">Score Difference:</span>{' '}
                {Math.abs(matchResult.winnerScore - matchResult.loserScore)}
              </p>
            </div>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Performance Metrics</h5>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Average Shot Time:</span>{' '}
                {matchResult.analytics.averageShotTime > 0
                  ? `${Math.round(matchResult.analytics.averageShotTime / 1000)}s`
                  : 'N/A'}
              </p>
              <p>
                <span className="text-gray-400">Shots per Minute:</span>{' '}
                {Math.round(
                  (matchResult.analytics.totalShots /
                    (matchResult.duration / 60000)) *
                    10
                ) / 10}
              </p>
              <p>
                <span className="text-gray-400">Foul Rate:</span>{' '}
                {matchResult.analytics.fouls > 0
                  ? `${((matchResult.analytics.fouls / matchResult.analytics.totalShots) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
              <p>
                <span className="text-gray-400">Highlight Rate:</span>{' '}
                {matchResult.analytics.highlights.length > 0
                  ? `${((matchResult.analytics.highlights.length / matchResult.analytics.totalShots) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
