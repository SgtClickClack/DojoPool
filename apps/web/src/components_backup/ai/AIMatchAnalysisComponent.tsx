import React, { useState, useEffect } from 'react';
import {
  AIPoweredMatchAnalysisService,
  type AIMatchAnalysis,
  type AIShotAnalysis,
  type AIRealTimeCoaching,
  ShotType,
} from '../../services/ai/AIPoweredMatchAnalysisService';

interface AIMatchAnalysisComponentProps {
  matchId: string;
  player1Id: string;
  player2Id: string;
  onAnalysisUpdate?: (analysis: AIMatchAnalysis) => void;
}

export const AIMatchAnalysisComponent: React.FC<
  AIMatchAnalysisComponentProps
> = ({ matchId, player1Id, player2Id, onAnalysisUpdate }) => {
  const [analysis, setAnalysis] = useState<AIMatchAnalysis | null>(null);
  const [recentShots, setRecentShots] = useState<AIShotAnalysis[]>([]);
  const [coaching, setCoaching] = useState<AIRealTimeCoaching | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const aiService = AIPoweredMatchAnalysisService.getInstance();

  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        setLoading(true);
        await aiService.startMatchAnalysis(matchId, player1Id, player2Id);

        // Set up event listeners
        aiService.on('connected', () => setIsConnected(true));
        aiService.on('disconnected', () => setIsConnected(false));
        aiService.on('shotAnalyzed', (shotAnalysis: AIShotAnalysis) => {
          setRecentShots((prev) => [shotAnalysis, ...prev.slice(0, 9)]);
        });
        aiService.on('coachingProvided', (coachingData: AIRealTimeCoaching) => {
          setCoaching(coachingData);
        });

        // Get initial analysis
        const initialAnalysis = aiService.getAnalysisByMatchId(matchId);
        if (initialAnalysis) {
          setAnalysis(initialAnalysis);
          onAnalysisUpdate?.(initialAnalysis);
        }
      } catch (error) {
        console.error('Error initializing AI analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAnalysis();

    return () => {
      aiService.removeAllListeners();
    };
  }, [matchId, player1Id, player2Id, aiService, onAnalysisUpdate]);

  const requestCoaching = async (situation: string) => {
    try {
      const coachingData = await aiService.provideRealTimeCoaching(
        matchId,
        player1Id,
        situation
      );
      setCoaching(coachingData);
    } catch (error) {
      console.error('Error requesting coaching:', error);
    }
  };

  const getShotTypeColor = (shotType: ShotType): string => {
    const colors: Record<ShotType, string> = {
      [ShotType.BREAK]: 'bg-red-500',
      [ShotType.STRAIGHT]: 'bg-green-500',
      [ShotType.CUT]: 'bg-blue-500',
      [ShotType.BANK]: 'bg-purple-500',
      [ShotType.COMBINATION]: 'bg-yellow-500',
      [ShotType.CAROM]: 'bg-pink-500',
      [ShotType.SAFETY]: 'bg-gray-500',
      [ShotType.DEFENSIVE]: 'bg-orange-500',
      [ShotType.CLUTCH]: 'bg-indigo-500',
      [ShotType.SPECIALTY]: 'bg-teal-500',
    };
    return colors[shotType] || 'bg-gray-400';
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing AI Analysis...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 text-center text-red-600">
        Failed to load match analysis
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">AI Match Analysis</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Match Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Score */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Current Score
          </h3>
          <div className="text-2xl font-bold text-blue-600">
            {analysis.currentScore.player1} - {analysis.currentScore.player2}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Momentum: {analysis.momentum}
          </div>
        </div>

        {/* Pressure Level */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Pressure Level
          </h3>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysis.pressureLevel}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold text-orange-600">
              {analysis.pressureLevel}%
            </span>
          </div>
        </div>

        {/* Match Prediction */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            AI Prediction
          </h3>
          <div className="text-lg font-bold text-green-600">
            {analysis.matchPrediction.predictedWinner}
          </div>
          <div className="text-sm text-green-600">
            Confidence: {analysis.matchPrediction.confidence}%
          </div>
        </div>
      </div>

      {/* Player Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Player 1 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Player 1 Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span
                className={getPerformanceColor(
                  analysis.player1Analysis.accuracy
                )}
              >
                {analysis.player1Analysis.accuracy}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Consistency:</span>
              <span
                className={getPerformanceColor(
                  analysis.player1Analysis.consistency
                )}
              >
                {analysis.player1Analysis.consistency}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Strategy:</span>
              <span
                className={getPerformanceColor(
                  analysis.player1Analysis.strategy
                )}
              >
                {analysis.player1Analysis.strategy}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pressure Handling:</span>
              <span
                className={getPerformanceColor(
                  analysis.player1Analysis.pressureHandling
                )}
              >
                {analysis.player1Analysis.pressureHandling}%
              </span>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Player 2 Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span
                className={getPerformanceColor(
                  analysis.player2Analysis.accuracy
                )}
              >
                {analysis.player2Analysis.accuracy}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Consistency:</span>
              <span
                className={getPerformanceColor(
                  analysis.player2Analysis.consistency
                )}
              >
                {analysis.player2Analysis.consistency}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Strategy:</span>
              <span
                className={getPerformanceColor(
                  analysis.player2Analysis.strategy
                )}
              >
                {analysis.player2Analysis.strategy}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pressure Handling:</span>
              <span
                className={getPerformanceColor(
                  analysis.player2Analysis.pressureHandling
                )}
              >
                {analysis.player2Analysis.pressureHandling}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Shots */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Shots
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentShots.map((shot, index) => (
            <div key={shot.shotId} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getShotTypeColor(shot.shotType)}`}
                  ></div>
                  <span className="font-medium">{shot.shotType}</span>
                  <span className="text-sm text-gray-600">
                    by {shot.playerId}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`text-sm ${shot.success ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {shot.success ? 'Success' : 'Miss'}
                  </span>
                  <span className="text-sm text-gray-600">
                    Accuracy: {shot.accuracy}%
                  </span>
                  <span className="text-sm text-gray-600">
                    Power: {shot.power}%
                  </span>
                </div>
              </div>
              {shot.recommendations.length > 0 && (
                <div className="mt-2 text-sm text-blue-600">
                  💡 {shot.recommendations[0]}
                </div>
              )}
            </div>
          ))}
          {recentShots.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No shots analyzed yet
            </div>
          )}
        </div>
      </div>

      {/* Real-time Coaching */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          AI Coaching
        </h3>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => requestCoaching('difficult shot')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Request Coaching
          </button>
          <button
            onClick={() => requestCoaching('pressure situation')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Pressure Advice
          </button>
        </div>

        {coaching && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              Current Situation: {coaching.currentSituation}
            </h4>
            <div className="text-blue-700 mb-3">
              <strong>Recommendation:</strong> {coaching.recommendation}
            </div>
            <div className="text-sm text-blue-600 mb-2">
              <strong>Confidence:</strong> {coaching.confidence}%
            </div>
            <div className="text-sm text-blue-600 mb-3">
              <strong>Reasoning:</strong> {coaching.reasoning}
            </div>
            {coaching.alternatives.length > 0 && (
              <div className="text-sm text-blue-600">
                <strong>Alternatives:</strong>
                <ul className="list-disc list-inside mt-1">
                  {coaching.alternatives.map((alt, index) => (
                    <li key={index}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
            {coaching.mentalAdvice && (
              <div className="text-sm text-purple-600 mt-2">
                <strong>Mental Game:</strong> {coaching.mentalAdvice}
              </div>
            )}
            {coaching.tacticalAdvice && (
              <div className="text-sm text-green-600 mt-2">
                <strong>Tactical:</strong> {coaching.tacticalAdvice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analysis.performanceMetrics.totalShots}
            </div>
            <div className="text-sm text-gray-600">Total Shots</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {analysis.performanceMetrics.successfulShots}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">
              {analysis.performanceMetrics.fouls}
            </div>
            <div className="text-sm text-gray-600">Fouls</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analysis.performanceMetrics.averageShotTime}s
            </div>
            <div className="text-sm text-gray-600">Avg Shot Time</div>
          </div>
        </div>
      </div>

      {/* Key Moments */}
      {analysis.keyMoments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Key Moments
          </h3>
          <div className="space-y-2">
            {analysis.keyMoments.slice(0, 5).map((moment) => (
              <div key={moment.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">
                    {moment.type}
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      moment.impact === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : moment.impact === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {moment.impact}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {moment.description}
                </div>
                {moment.recommendation && (
                  <div className="text-sm text-blue-600 mt-1">
                    💡 {moment.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Recommendations */}
      {analysis.tacticalRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tactical Recommendations
          </h3>
          <div className="space-y-2">
            {analysis.tacticalRecommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800 mb-1">
                  {rec.situation}
                </div>
                <div className="text-green-700 mb-2">
                  {rec.recommendedAction}
                </div>
                <div className="text-sm text-green-600">{rec.reasoning}</div>
                {rec.practiceDrill && (
                  <div className="text-sm text-green-600 mt-1">
                    🎯 Practice: {rec.practiceDrill}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
