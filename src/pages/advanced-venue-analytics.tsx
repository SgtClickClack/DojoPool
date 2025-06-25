import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { AdvancedVenueAnalyticsComponent } from '../components/analytics/AdvancedVenueAnalyticsComponent';
import AdvancedVenueAnalyticsService, { PerformanceOptimization, OptimizationRecommendation } from '../services/analytics/AdvancedVenueAnalyticsService';

const AdvancedVenueAnalyticsPage: React.FC = () => {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('venue_001');
  const [recentOptimizations, setRecentOptimizations] = useState<PerformanceOptimization[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const analyticsService = AdvancedVenueAnalyticsService.getInstance();

  useEffect(() => {
    // Simulate venue selection and load initial data
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    // Mock system status
    setSystemStatus({
      overallHealth: 'excellent',
      services: {
        analytics: 'online',
        predictions: 'online',
        optimization: 'online',
        benchmarking: 'online'
      },
      lastUpdated: new Date()
    });
  };

  const handleOptimizationGenerated = (optimization: PerformanceOptimization) => {
    console.log('Optimization generated:', optimization);
    setRecentOptimizations(prev => [optimization, ...prev.slice(0, 4)]);
  };

  const handleRecommendationUpdated = (recommendation: OptimizationRecommendation) => {
    console.log('Recommendation updated:', recommendation);
  };

  const getHealthColor = (health: string): string => {
    const colors: Record<string, string> = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      poor: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[health] || 'text-gray-600';
  };

  const getServiceStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      online: 'text-green-600',
      degraded: 'text-yellow-600',
      offline: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Advanced Venue Analytics
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                AI-powered performance optimization and predictive insights for venue success
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded">
                    System Status: <span className={getHealthColor(systemStatus?.overallHealth || 'good')}>●</span> {systemStatus?.overallHealth || 'Good'}
                  </span>
                  <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded">
                    Last Updated: {systemStatus?.lastUpdated?.toLocaleTimeString() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Why Choose Advanced Analytics?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Performance Optimization</h3>
                <p className="text-gray-600">
                  AI-driven recommendations to maximize revenue, efficiency, and player satisfaction through data-driven insights.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔮</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Predictive Analytics</h3>
                <p className="text-gray-600">
                  Forecast revenue trends, player growth, and equipment needs with machine learning algorithms.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Benchmarking</h3>
                <p className="text-gray-600">
                  Compare performance against industry standards and similar venues to identify improvement opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        {systemStatus && (
          <div className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
                System Status
              </h2>
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${getHealthColor(systemStatus.overallHealth)}`}>
                        {systemStatus.overallHealth.toUpperCase()}
                      </div>
                      <div className="text-gray-600">Overall Health</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${getServiceStatusColor(systemStatus.services.analytics)}`}>
                        ●
                      </div>
                      <div className="text-gray-600">Analytics Service</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${getServiceStatusColor(systemStatus.services.predictions)}`}>
                        ●
                      </div>
                      <div className="text-gray-600">Predictions</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${getServiceStatusColor(systemStatus.services.optimization)}`}>
                        ●
                      </div>
                      <div className="text-gray-600">Optimization</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Venue Selection */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Venue for Analysis</h2>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="venue_001">DojoPool Central - Downtown</option>
                  <option value="venue_002">DojoPool North - Business District</option>
                  <option value="venue_003">DojoPool South - Entertainment Zone</option>
                  <option value="venue_004">DojoPool East - University Area</option>
                </select>
              </div>
            </div>

            {/* Main Analytics Component */}
            <AdvancedVenueAnalyticsComponent
              venueId={selectedVenueId}
              onOptimizationGenerated={handleOptimizationGenerated}
              onRecommendationUpdated={handleRecommendationUpdated}
            />
          </div>
        </div>

        {/* Recent Optimizations */}
        {recentOptimizations.length > 0 && (
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
                Recent Optimizations
              </h2>
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentOptimizations.map((optimization, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">Venue {optimization.venueId}</h3>
                        <span className="text-sm text-gray-500">
                          {optimization.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Revenue Increase:</span>
                          <span className="font-medium text-green-600">+{optimization.expectedImpact.revenueIncrease}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cost Reduction:</span>
                          <span className="font-medium text-blue-600">-{optimization.expectedImpact.costReduction}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Efficiency Gain:</span>
                          <span className="font-medium text-purple-600">+{optimization.expectedImpact.efficiencyGain}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Priority:</span>
                          <span className="font-medium capitalize">{optimization.implementationPriority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              How Advanced Analytics Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Data Collection</h3>
                <p className="text-gray-600">
                  Real-time data collection from venue operations, player behavior, and market trends.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">AI Analysis</h3>
                <p className="text-gray-600">
                  Advanced machine learning algorithms analyze patterns and generate insights.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Optimization</h3>
                <p className="text-gray-600">
                  Generate actionable recommendations for revenue, operations, and player experience.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Implementation</h3>
                <p className="text-gray-600">
                  Track implementation progress and measure impact of optimizations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Optimize Your Venue?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join the future of venue management with AI-powered analytics and predictive insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Analysis
              </button>
              <button
                onClick={() => window.location.href = '/venue/venue-management'}
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Venue Management
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvancedVenueAnalyticsPage; 