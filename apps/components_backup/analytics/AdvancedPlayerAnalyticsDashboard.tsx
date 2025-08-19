import React, { useState } from 'react';
import {
  useAdvancedPlayerAnalytics,
  PlayerPerformance,
  type PlayerInsights,
  type PlayerComparison,
} from '../../hooks/useAdvancedPlayerAnalytics';

interface AdvancedPlayerAnalyticsDashboardProps {
  className?: string;
}

export const AdvancedPlayerAnalyticsDashboard: React.FC<
  AdvancedPlayerAnalyticsDashboardProps
> = ({ className = '' }) => {
  const {
    config,
    updateConfig,
    metrics,
    performances,
    topPerformers,
    mostImproved,
    getPlayerPerformance,
    updatePlayerPerformance,
    addPerformanceMetric,
    getSkillProgression,
    updateSkillProgression,
    analyzeMatch,
    getMatchAnalyses,
    generatePlayerInsights,
    getPlayerInsights,
    comparePlayers,
    getPlayerComparisons,
    isLoading,
    error,
    clearError,
  } = useAdvancedPlayerAnalytics();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'players'
    | 'performance'
    | 'skills'
    | 'analysis'
    | 'insights'
    | 'comparison'
  >('overview');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [comparisonPlayerId, setComparisonPlayerId] = useState<string>('');
  const [playerInsights, setPlayerInsights] = useState<PlayerInsights | null>(
    null
  );
  const [playerComparison, setPlayerComparison] =
    useState<PlayerComparison | null>(null);

  const handleGenerateInsights = async (playerId: string) => {
    const insights = await generatePlayerInsights(playerId);
    if (insights) {
      setPlayerInsights(insights);
    }
  };

  const handleComparePlayers = async () => {
    if (selectedPlayerId && comparisonPlayerId) {
      const comparison = await comparePlayers(
        selectedPlayerId,
        comparisonPlayerId
      );
      if (comparison) {
        setPlayerComparison(comparison);
      }
    }
  };

  const handleUpdatePerformance = async (playerId: string, matchData: any) => {
    await updatePlayerPerformance(playerId, matchData);
  };

  const handleAddMetric = async (
    playerId: string,
    metricType: string,
    value: number
  ) => {
    await addPerformanceMetric({
      playerId,
      metricType: metricType as any,
      value,
    });
  };

  const handleUpdateSkill = async (
    playerId: string,
    skillArea: string,
    improvement: number,
    reason: string
  ) => {
    await updateSkillProgression(playerId, skillArea, improvement, reason);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-lg">Loading Advanced Player Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-100 border border-red-400 text-red-700 rounded ${className}`}
      >
        <div className="flex justify-between items-center">
          <span>Error: {error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Player Analytics
        </h1>
        <p className="text-gray-600">
          Comprehensive player performance tracking and analysis system
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'players', label: 'Players' },
          { id: 'performance', label: 'Performance' },
          { id: 'skills', label: 'Skills' },
          { id: 'analysis', label: 'Analysis' },
          { id: 'insights', label: 'Insights' },
          { id: 'comparison', label: 'Comparison' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">
                Total Players
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {metrics?.totalPlayers || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">
                Active Players
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {metrics?.activePlayers || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">
                Avg Skill Level
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {metrics?.averageSkillLevel?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900">
                Avg Win Rate
              </h3>
              <p className="text-3xl font-bold text-orange-600">
                {metrics?.averageWinRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="space-y-2">
                {topPerformers.slice(0, 5).map((player, index) => (
                  <div
                    key={player.playerId}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-600">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <span className="text-green-600 font-semibold">
                      {player.winRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Most Improved</h3>
              <div className="space-y-2">
                {mostImproved.slice(0, 5).map((player, index) => (
                  <div
                    key={player.playerId}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-600">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <span className="text-blue-600 font-semibold">
                      {player.reputation} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Player Performances</h2>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select a player</option>
              {performances.map((player) => (
                <option key={player.playerId} value={player.playerId}>
                  {player.playerName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skill Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reputation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performances.map((player) => (
                  <tr key={player.playerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {player.playerName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {player.totalMatches}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          player.winRate >= 70
                            ? 'bg-green-100 text-green-800'
                            : player.winRate >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {player.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          player.skillLevel === 'master'
                            ? 'bg-purple-100 text-purple-800'
                            : player.skillLevel === 'expert'
                              ? 'bg-red-100 text-red-800'
                              : player.skillLevel === 'advanced'
                                ? 'bg-blue-100 text-blue-800'
                                : player.skillLevel === 'intermediate'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {player.skillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {player.reputation}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(player.lastActive).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Performance Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performances.map((player) => (
              <div
                key={player.playerId}
                className="bg-white border rounded-lg p-4"
              >
                <h3 className="font-semibold mb-3">{player.playerName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Shot Accuracy:</span>
                    <span className="font-medium">
                      {player.shotAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break Success:</span>
                    <span className="font-medium">
                      {player.breakSuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Shot:</span>
                    <span className="font-medium">
                      {player.safetyShotRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Score:</span>
                    <span className="font-medium">
                      {player.averageScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Streak:</span>
                    <span className="font-medium">
                      {player.currentWinStreak}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Skill Progression</h2>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Update Skill Progression</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Select player"
              >
                <option value="">Select a player</option>
                {performances.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>

              <select className="border rounded px-3 py-2">
                <option value="">Select skill area</option>
                <option value="accuracy">Accuracy</option>
                <option value="power">Power</option>
                <option value="strategy">Strategy</option>
                <option value="consistency">Consistency</option>
                <option value="mental_game">Mental Game</option>
              </select>
            </div>

            <div className="mt-4 space-y-2">
              <input
                type="number"
                placeholder="Improvement value"
                className="border rounded px-3 py-2 w-full"
              />
              <textarea
                placeholder="Reason for improvement"
                className="border rounded px-3 py-2 w-full"
                rows={3}
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Update Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Match Analysis</h2>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Analyze Match</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Match ID"
                  className="border rounded px-3 py-2"
                />
                <select className="border rounded px-3 py-2">
                  <option value="">Select player</option>
                  {performances.map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="border rounded px-3 py-2">
                  <option value="">Select opponent</option>
                  {performances.map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                    </option>
                  ))}
                </select>
                <select className="border rounded px-3 py-2">
                  <option value="">Match result</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="draw">Draw</option>
                </select>
              </div>

              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Analyze Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Player Insights</h2>

          <div className="flex space-x-4 mb-4">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select a player</option>
              {performances.map((player) => (
                <option key={player.playerId} value={player.playerId}>
                  {player.playerName}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                selectedPlayerId && handleGenerateInsights(selectedPlayerId)
              }
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Generate Insights
            </button>
          </div>

          {playerInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-green-700">Strengths</h3>
                <ul className="space-y-1">
                  {playerInsights.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-red-700">
                  Areas for Improvement
                </h3>
                <ul className="space-y-1">
                  {playerInsights.improvementAreas.map((area, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {area}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-blue-700">
                  Recommended Drills
                </h3>
                <ul className="space-y-1">
                  {playerInsights.recommendedDrills.map((drill, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {drill}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-purple-700">
                  Performance Predictions
                </h3>
                <div className="space-y-2">
                  {playerInsights.predictions.map((prediction, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{prediction.metric}</div>
                      <div className="text-gray-600">
                        Predicted: {prediction.predictedValue.toFixed(1)}
                        (Confidence: {prediction.confidence * 100}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Player Comparison</h2>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Compare Players</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">Select first player</option>
                {performances.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>

              <select
                value={comparisonPlayerId}
                onChange={(e) => setComparisonPlayerId(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">Select second player</option>
                {performances.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleComparePlayers}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Compare Players
            </button>
          </div>

          {playerComparison && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-green-700">Strengths</h3>
                <ul className="space-y-1">
                  {playerComparison.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-red-700">Weaknesses</h3>
                <ul className="space-y-1">
                  {playerComparison.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border rounded-lg p-4 lg:col-span-2">
                <h3 className="font-semibold mb-3 text-blue-700">
                  Recommendations
                </h3>
                <ul className="space-y-1">
                  {playerComparison.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {recommendation}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
