import React, { useState, useEffect } from 'react';
import AdvancedVenueAnalyticsService, {
  type PerformanceOptimization,
  type OptimizationRecommendation,
  type PredictiveAnalytics,
  type RealTimePerformanceMetrics,
  type BenchmarkingData,
} from '../../services/analytics/AdvancedVenueAnalyticsService';

interface AdvancedVenueAnalyticsComponentProps {
  venueId: string;
  onOptimizationGenerated?: (optimization: PerformanceOptimization) => void;
  onRecommendationUpdated?: (
    recommendation: OptimizationRecommendation
  ) => void;
}

export const AdvancedVenueAnalyticsComponent: React.FC<
  AdvancedVenueAnalyticsComponentProps
> = ({ venueId, onOptimizationGenerated, onRecommendationUpdated }) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'optimization'
    | 'predictive'
    | 'benchmarking'
    | 'recommendations'
  >('overview');
  const [performanceOptimization, setPerformanceOptimization] =
    useState<PerformanceOptimization | null>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] =
    useState<PredictiveAnalytics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] =
    useState<RealTimePerformanceMetrics | null>(null);
  const [benchmarkingData, setBenchmarkingData] =
    useState<BenchmarkingData | null>(null);
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [generatingOptimization, setGeneratingOptimization] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<OptimizationRecommendation | null>(null);

  const analyticsService = AdvancedVenueAnalyticsService.getInstance();

  useEffect(() => {
    loadData();
  }, [venueId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all analytics data
      const [optimization, analytics, metrics, benchmarking, recs] =
        await Promise.all([
          analyticsService.getPerformanceOptimization(venueId),
          analyticsService.getPredictiveAnalytics(venueId),
          analyticsService.getRealTimeMetrics(venueId),
          analyticsService.getBenchmarkingData(venueId),
          analyticsService.getOptimizationRecommendations(venueId),
        ]);

      setPerformanceOptimization(optimization);
      setPredictiveAnalytics(analytics);
      setRealTimeMetrics(metrics);
      setBenchmarkingData(benchmarking);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOptimization = async () => {
    try {
      setGeneratingOptimization(true);
      const optimization =
        await analyticsService.generatePerformanceOptimization(venueId);
      setPerformanceOptimization(optimization);
      onOptimizationGenerated?.(optimization);
    } catch (error) {
      console.error('Error generating optimization:', error);
    } finally {
      setGeneratingOptimization(false);
    }
  };

  const handleGeneratePredictiveAnalytics = async () => {
    try {
      const analytics =
        await analyticsService.generatePredictiveAnalytics(venueId);
      setPredictiveAnalytics(analytics);
    } catch (error) {
      console.error('Error generating predictive analytics:', error);
    }
  };

  const handleUpdateRecommendationStatus = async (
    recommendationId: string,
    status: OptimizationRecommendation['status']
  ) => {
    try {
      await analyticsService.updateRecommendationStatus(
        recommendationId,
        status
      );
      const updatedRecommendations = recommendations.map((rec) =>
        rec.id === recommendationId ? { ...rec, status } : rec
      );
      setRecommendations(updatedRecommendations);

      const updatedRec = updatedRecommendations.find(
        (r) => r.id === recommendationId
      );
      if (updatedRec) {
        onRecommendationUpdated?.(updatedRec);
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
    }
  };

  const getStatusColor = (
    status: OptimizationRecommendation['status']
  ): string => {
    const colors: Record<OptimizationRecommendation['status'], string> = {
      pending: 'text-yellow-600',
      in_progress: 'text-blue-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getPriorityColor = (
    priority: OptimizationRecommendation['priority']
  ): string => {
    const colors: Record<OptimizationRecommendation['priority'], string> = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getDifficultyColor = (
    difficulty: OptimizationRecommendation['implementation']['difficulty']
  ): string => {
    const colors: Record<
      OptimizationRecommendation['implementation']['difficulty'],
      string
    > = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Advanced Analytics...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Advanced Venue Analytics
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateOptimization}
            disabled={generatingOptimization}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generatingOptimization ? 'Generating...' : 'Generate Optimization'}
          </button>
          <button
            onClick={handleGeneratePredictiveAnalytics}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Predictions
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'optimization'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Performance Optimization
        </button>
        <button
          onClick={() => setActiveTab('predictive')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'predictive'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Predictive Analytics
        </button>
        <button
          onClick={() => setActiveTab('benchmarking')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'benchmarking'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Benchmarking
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Real-Time Performance Overview
            </h3>
            {realTimeMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {realTimeMetrics.currentMetrics.occupancy}%
                  </div>
                  <div className="text-sm text-gray-600">Current Occupancy</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {realTimeMetrics.currentMetrics.activeGames}
                  </div>
                  <div className="text-sm text-gray-600">Active Games</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {realTimeMetrics.currentMetrics.waitTime} min
                  </div>
                  <div className="text-sm text-gray-600">Average Wait Time</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    ${realTimeMetrics.currentMetrics.revenue}
                  </div>
                  <div className="text-sm text-gray-600">Today's Revenue</div>
                </div>
              </div>
            )}

            {realTimeMetrics && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Performance Indicators
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {realTimeMetrics.performanceIndicators.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {realTimeMetrics.performanceIndicators.satisfaction}/5
                    </div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {realTimeMetrics.performanceIndicators.profitability}%
                    </div>
                    <div className="text-sm text-gray-600">Profitability</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-lg font-semibold text-gray-800">
                      {realTimeMetrics.performanceIndicators.growth}%
                    </div>
                    <div className="text-sm text-gray-600">Growth</div>
                  </div>
                </div>
              </div>
            )}

            {realTimeMetrics && realTimeMetrics.alerts.critical.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-md font-semibold text-red-800 mb-2">
                  Critical Alerts
                </h4>
                <ul className="text-sm text-red-700">
                  {realTimeMetrics.alerts.critical.map(
                    (alert: any, index: any) => (
                      <li key={index}>• {alert}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimization' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Performance Optimization
            </h3>
            {performanceOptimization ? (
              <div className="space-y-6">
                {/* Expected Impact */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Expected Impact
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        +
                        {performanceOptimization.expectedImpact.revenueIncrease}
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Revenue Increase
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        -{performanceOptimization.expectedImpact.costReduction}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Cost Reduction
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        +{performanceOptimization.expectedImpact.efficiencyGain}
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Efficiency Gain
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        +
                        {
                          performanceOptimization.expectedImpact
                            .playerSatisfaction
                        }
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        Player Satisfaction
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Optimization */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Revenue Optimization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">
                        Current Revenue
                      </div>
                      <div className="text-lg font-semibold">
                        $
                        {performanceOptimization.optimizationAreas.revenue.currentRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Potential Revenue
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        $
                        {performanceOptimization.optimizationAreas.revenue.potentialRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">Market Position</div>
                    <div className="text-sm font-medium capitalize">
                      {
                        performanceOptimization.optimizationAreas.revenue
                          .marketAnalysis.marketPosition
                      }
                    </div>
                  </div>
                </div>

                {/* Operations Optimization */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Operations Optimization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">
                        Current Efficiency
                      </div>
                      <div className="text-lg font-semibold">
                        {
                          performanceOptimization.optimizationAreas.operations
                            .currentEfficiency
                        }
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Target Efficiency
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {
                          performanceOptimization.optimizationAreas.operations
                            .targetEfficiency
                        }
                        %
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      Table Utilization
                    </div>
                    <div className="text-sm font-medium">
                      {
                        performanceOptimization.optimizationAreas.operations
                          .optimizationAreas.tableUtilization.current
                      }
                      % →{' '}
                      {
                        performanceOptimization.optimizationAreas.operations
                          .optimizationAreas.tableUtilization.target
                      }
                      %
                    </div>
                  </div>
                </div>

                {/* Implementation Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Implementation Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Priority</div>
                      <div className="text-sm font-medium capitalize">
                        {performanceOptimization.implementationPriority}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Timeline</div>
                      <div className="text-sm font-medium">
                        {performanceOptimization.estimatedTimeline}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Recommendations
                      </div>
                      <div className="text-sm font-medium">
                        {performanceOptimization.recommendations.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No optimization data available.</p>
                <button
                  onClick={handleGenerateOptimization}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Generate Optimization Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'predictive' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Predictive Analytics
            </h3>
            {predictiveAnalytics ? (
              <div className="space-y-6">
                {/* Revenue Forecast */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Revenue Forecast
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        $
                        {predictiveAnalytics.forecasts.revenue.nextWeek.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        $
                        {predictiveAnalytics.forecasts.revenue.nextMonth.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        $
                        {predictiveAnalytics.forecasts.revenue.nextQuarter.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Quarter</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        $
                        {predictiveAnalytics.forecasts.revenue.nextYear.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Year</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600">
                      Confidence Level
                    </div>
                    <div className="text-sm font-medium">
                      {predictiveAnalytics.forecasts.revenue.confidence}%
                    </div>
                  </div>
                </div>

                {/* Player Growth Forecast */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Player Growth Forecast
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {predictiveAnalytics.forecasts.playerGrowth.newPlayers}
                      </div>
                      <div className="text-sm text-gray-600">New Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {
                          predictiveAnalytics.forecasts.playerGrowth
                            .returningPlayers
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Returning Players
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {predictiveAnalytics.forecasts.playerGrowth.churnRate}%
                      </div>
                      <div className="text-sm text-gray-600">Churn Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        $
                        {
                          predictiveAnalytics.forecasts.playerGrowth
                            .lifetimeValue
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Lifetime Value
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-red-800 mb-3">
                    Risk Assessment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-red-800 mb-1">
                        High Risk
                      </div>
                      <ul className="text-sm text-red-700">
                        {predictiveAnalytics.riskAssessment.highRisk.map(
                          (risk: any, index: any) => (
                            <li key={index}>• {risk}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-yellow-800 mb-1">
                        Medium Risk
                      </div>
                      <ul className="text-sm text-yellow-700">
                        {predictiveAnalytics.riskAssessment.mediumRisk.map(
                          (risk: any, index: any) => (
                            <li key={index}>• {risk}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-800 mb-1">
                        Low Risk
                      </div>
                      <ul className="text-sm text-green-700">
                        {predictiveAnalytics.riskAssessment.lowRisk.map(
                          (risk: any, index: any) => (
                            <li key={index}>• {risk}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No predictive analytics available.</p>
                <button
                  onClick={handleGeneratePredictiveAnalytics}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Generate Predictive Analytics
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'benchmarking' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Benchmarking Analysis
            </h3>
            {benchmarkingData ? (
              <div className="space-y-6">
                {/* Benchmark Comparisons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">
                      Industry Benchmarks
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Revenue
                        </div>
                        <div className="text-lg font-semibold">
                          $
                          {benchmarkingData.benchmarks.industry.averageRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Occupancy
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            benchmarkingData.benchmarks.industry
                              .averageOccupancy
                          }
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Percentile</div>
                        <div className="text-lg font-semibold">
                          {benchmarkingData.benchmarks.industry.percentile}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">
                      Regional Benchmarks
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Revenue
                        </div>
                        <div className="text-lg font-semibold">
                          $
                          {benchmarkingData.benchmarks.regional.averageRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Occupancy
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            benchmarkingData.benchmarks.regional
                              .averageOccupancy
                          }
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Percentile</div>
                        <div className="text-lg font-semibold">
                          {benchmarkingData.benchmarks.regional.percentile}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">
                      Similar Venues
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Revenue
                        </div>
                        <div className="text-lg font-semibold">
                          $
                          {benchmarkingData.benchmarks.similarVenues.averageRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Average Occupancy
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            benchmarkingData.benchmarks.similarVenues
                              .averageOccupancy
                          }
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Percentile</div>
                        <div className="text-lg font-semibold">
                          {benchmarkingData.benchmarks.similarVenues.percentile}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitive Analysis */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    Competitive Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">
                        Strengths
                      </h5>
                      <ul className="text-sm text-green-700">
                        {benchmarkingData.competitiveAnalysis.strengths.map(
                          (strength: any, index: any) => (
                            <li key={index}>• {strength}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-red-800 mb-2">
                        Weaknesses
                      </h5>
                      <ul className="text-sm text-red-700">
                        {benchmarkingData.competitiveAnalysis.weaknesses.map(
                          (weakness: any, index: any) => (
                            <li key={index}>• {weakness}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">
                        Opportunities
                      </h5>
                      <ul className="text-sm text-blue-700">
                        {benchmarkingData.competitiveAnalysis.opportunities.map(
                          (opportunity: any, index: any) => (
                            <li key={index}>• {opportunity}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-orange-800 mb-2">
                        Threats
                      </h5>
                      <ul className="text-sm text-orange-700">
                        {benchmarkingData.competitiveAnalysis.threats.map(
                          (threat: any, index: any) => (
                            <li key={index}>• {threat}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No benchmarking data available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Optimization Recommendations
            </h3>
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-md font-semibold text-gray-800">
                            {recommendation.title}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(recommendation.priority)}`}
                          >
                            {recommendation.priority}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(recommendation.status)}`}
                          >
                            {recommendation.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {recommendation.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">
                              Revenue Impact
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              +{recommendation.impact.revenue}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Cost Impact
                            </div>
                            <div className="text-sm font-medium text-red-600">
                              -{recommendation.impact.cost}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Efficiency Gain
                            </div>
                            <div className="text-sm font-medium text-blue-600">
                              +{recommendation.impact.efficiency}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Satisfaction
                            </div>
                            <div className="text-sm font-medium text-purple-600">
                              +{recommendation.impact.satisfaction}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            Difficulty:{' '}
                            <span
                              className={getDifficultyColor(
                                recommendation.implementation.difficulty
                              )}
                            >
                              {recommendation.implementation.difficulty}
                            </span>
                          </span>
                          <span>
                            Timeline: {recommendation.implementation.timeline}
                          </span>
                          <span>
                            Cost: $
                            {recommendation.implementation.cost.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="ml-4">
                        <select
                          value={recommendation.status}
                          onChange={(e) =>
                            handleUpdateRecommendationStatus(
                              recommendation.id,
                              e.target
                                .value as OptimizationRecommendation['status']
                            )
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recommendations available.</p>
                <button
                  onClick={handleGenerateOptimization}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Generate Recommendations
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
