import React, { useState } from 'react';
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Target,
  DollarSign,
  Trophy,
  Users,
  Activity,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react';

interface AdvancedAnalyticsDashboardProps {
  selectedVenueId?: string;
  selectedPlayerId?: string;
  onVenueSelect?: (venueId: string) => void;
  onPlayerSelect?: (playerId: string) => void;
}

export const AdvancedAnalyticsDashboard: React.FC<
  AdvancedAnalyticsDashboardProps
> = ({ selectedVenueId, selectedPlayerId, onVenueSelect, onPlayerSelect }) => {
  const {
    trends,
    optimizations,
    forecasts,
    predictions,
    insights,
    analytics,
    loading,
    error,
    refreshAnalytics,
  } = useAdvancedAnalytics();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'trends'
    | 'optimizations'
    | 'forecasts'
    | 'predictions'
    | 'insights'
  >('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error loading analytics</div>
        <Button onClick={refreshAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Performance insights, predictions, and optimization recommendations
          </p>
        </div>
        <Button onClick={refreshAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="whitespace-nowrap"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'trends' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('trends')}
          className="whitespace-nowrap"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends
        </Button>
        <Button
          variant={activeTab === 'optimizations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('optimizations')}
          className="whitespace-nowrap"
        >
          <Target className="w-4 h-4 mr-2" />
          Optimizations
        </Button>
        <Button
          variant={activeTab === 'forecasts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('forecasts')}
          className="whitespace-nowrap"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Forecasts
        </Button>
        <Button
          variant={activeTab === 'predictions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('predictions')}
          className="whitespace-nowrap"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Predictions
        </Button>
        <Button
          variant={activeTab === 'insights' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('insights')}
          className="whitespace-nowrap"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Insights
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Performance Trends
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trends.length}</div>
              <p className="text-xs text-muted-foreground">
                Active trend analyses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Venue Optimizations
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimizations.length}</div>
              <p className="text-xs text-muted-foreground">
                Optimization recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Forecasts
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecasts.length}</div>
              <p className="text-xs text-muted-foreground">
                Revenue projections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tournament Predictions
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{predictions.length}</div>
              <p className="text-xs text-muted-foreground">
                Outcome predictions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {trends.map((trend) => (
            <Card key={`${trend.playerId}-${trend.metric}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {trend.playerName}
                    </CardTitle>
                    <div className="text-sm text-gray-500 capitalize">
                      {trend.metric.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(trend.trend)}
                    <Badge variant="outline">
                      {trend.changeRate > 0 ? '+' : ''}
                      {formatPercentage(trend.changeRate)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Current Value</div>
                    <div className="text-lg font-semibold">
                      {trend.values[trend.values.length - 1]}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Prediction</div>
                    <div className="text-lg font-semibold">
                      {trend.prediction}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Optimizations Tab */}
      {activeTab === 'optimizations' && (
        <div className="space-y-4">
          {optimizations.map((optimization) => (
            <Card key={optimization.venueId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {optimization.venueName}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      Optimization Score: {optimization.optimizationScore}/100
                    </div>
                  </div>
                  <Badge variant="outline" className={getImpactColor('high')}>
                    Score: {optimization.currentScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {optimization.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Potential Improvements</h4>
                  <div className="space-y-2">
                    {optimization.potentialImprovements.map(
                      (improvement, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {improvement.category}
                            </div>
                            <Badge
                              className={getImpactColor(improvement.impact)}
                            >
                              {improvement.impact}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Current:</span>{' '}
                              {improvement.currentValue}
                            </div>
                            <div>
                              <span className="text-gray-500">Target:</span>{' '}
                              {improvement.targetValue}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-green-600">
                            +
                            {formatCurrency(
                              improvement.estimatedRevenueIncrease
                            )}{' '}
                            potential revenue
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Forecasts Tab */}
      {activeTab === 'forecasts' && (
        <div className="space-y-4">
          {forecasts.map((forecast) => (
            <Card key={forecast.venueId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {forecast.venueName}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      Confidence: {formatPercentage(forecast.confidence)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(forecast.forecastedRevenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Forecasted Revenue
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Current Revenue</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(forecast.currentRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Growth</div>
                    <div className="text-lg font-semibold text-green-600">
                      +
                      {formatCurrency(
                        forecast.forecastedRevenue - forecast.currentRevenue
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Factors</h4>
                  <div className="space-y-2">
                    {forecast.factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{factor.factor}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {formatPercentage(factor.impact)}
                          </span>
                          {factor.trend === 'positive' && (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          )}
                          {factor.trend === 'negative' && (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Timeframes</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {forecast.timeframes.map((timeframe, index) => (
                      <div
                        key={index}
                        className="text-center p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="text-sm text-gray-500">
                          {timeframe.timeframe}
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(timeframe.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPercentage(timeframe.confidence)} confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <Card key={prediction.tournamentId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {prediction.tournamentName}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      {prediction.tournamentMetrics.expectedParticipants}{' '}
                      participants •
                      {prediction.tournamentMetrics.expectedDuration} days
                    </div>
                  </div>
                  <Badge
                    className={getDifficultyColor(
                      prediction.tournamentMetrics.difficulty
                    )}
                  >
                    {prediction.tournamentMetrics.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <div className="font-semibold">Predicted Winner</div>
                  </div>
                  <div className="text-lg font-bold">
                    {prediction.predictedWinner.playerName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPercentage(prediction.predictedWinner.probability)}{' '}
                    probability
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Top Contenders</h4>
                  <div className="space-y-2">
                    {prediction.participants
                      .slice(0, 5)
                      .map((participant, index) => (
                        <div
                          key={participant.playerId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {participant.playerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Expected finish: {participant.expectedFinish}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatPercentage(participant.winProbability)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Win probability
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">
                      Expected Revenue
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(
                        prediction.tournamentMetrics.expectedRevenue
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">
                      Expected Duration
                    </div>
                    <div className="text-lg font-semibold">
                      {prediction.tournamentMetrics.expectedDuration} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.playerId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {insight.playerName}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      Potential Rating: {insight.potentialRating}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {insight.performanceMetrics.averageRating}
                    </div>
                    <div className="text-sm text-gray-500">Current Rating</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatPercentage(insight.performanceMetrics.winRate)}
                    </div>
                    <div className="text-sm text-gray-500">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatPercentage(
                        insight.performanceMetrics.tournamentPerformance
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Tournament</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatPercentage(insight.performanceMetrics.consistency)}
                    </div>
                    <div className="text-sm text-gray-500">Consistency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatPercentage(
                        insight.performanceMetrics.clutchFactor
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Clutch</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {insight.potentialRating}
                    </div>
                    <div className="text-sm text-gray-500">Potential</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {insight.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-700">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-1">
                      {insight.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-red-700">
                          • {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Target className="w-4 h-4 text-blue-500 mr-2" />
                    Improvement Areas
                  </h4>
                  <ul className="space-y-1">
                    {insight.improvementAreas.map((area, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        • {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
