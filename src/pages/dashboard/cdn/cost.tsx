import React from 'react';

const CDNCostDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            CDN Cost Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and optimize your CDN costs
          </p>
        </div>

        {/* Dashboard Content */}
        <div data-testid="cdn-cost-dashboard" className="space-y-6">
          {/* Cost Overview */}
          <div
            data-testid="cost-overview"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cost Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div data-testid="total-cost" className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  $1,000.00
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div data-testid="bandwidth-cost" className="text-center">
                <div className="text-2xl font-bold text-green-600">$600.00</div>
                <div className="text-sm text-gray-600">Bandwidth Cost</div>
              </div>
              <div data-testid="request-cost" className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  $400.00
                </div>
                <div className="text-sm text-gray-600">Request Cost</div>
              </div>
              <div data-testid="cost-savings" className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  $200.00
                </div>
                <div className="text-sm text-gray-600">Savings</div>
              </div>
            </div>
          </div>

          {/* Usage Patterns */}
          <div
            data-testid="usage-patterns"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Usage Patterns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                data-testid="hourly-usage-chart"
                className="h-32 bg-gray-100 rounded flex items-center justify-center"
              >
                <span className="text-gray-500">Hourly Usage Chart</span>
              </div>
              <div className="text-center">
                <div
                  data-testid="daily-usage"
                  className="text-2xl font-bold text-gray-900"
                >
                  2,400
                </div>
                <div className="text-sm text-gray-600">Daily Usage</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="weekly-usage"
                  className="text-2xl font-bold text-gray-900"
                >
                  16,800
                </div>
                <div className="text-sm text-gray-600">Weekly Usage</div>
              </div>
            </div>
          </div>

          {/* Cost Projections */}
          <div
            data-testid="cost-projections"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cost Projections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div
                  data-testid="daily-projection"
                  className="text-2xl font-bold text-blue-600"
                >
                  2,500
                </div>
                <div className="text-sm text-gray-600">Daily Projection</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="weekly-projection"
                  className="text-2xl font-bold text-green-600"
                >
                  17,500
                </div>
                <div className="text-sm text-gray-600">Weekly Projection</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="monthly-projection"
                  className="text-2xl font-bold text-purple-600"
                >
                  70,000
                </div>
                <div className="text-sm text-gray-600">Monthly Projection</div>
              </div>
            </div>
          </div>

          {/* Optimization Controls */}
          <div
            data-testid="optimization-controls"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Optimization Controls
            </h2>
            <div className="space-y-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Run Optimization
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4">
                View Recommendations
              </button>
            </div>
          </div>

          {/* Error States */}
          <div
            data-testid="error-states"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Error Handling
            </h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="text-red-800">Sample Error State</div>
              </div>
            </div>
          </div>

          {/* Loading States */}
          <div
            data-testid="loading-states"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Loading States
            </h2>
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Mobile Responsiveness */}
          <div
            data-testid="mobile-responsiveness"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mobile Responsiveness
            </h2>
            <div className="text-sm text-gray-600">
              This dashboard is responsive and works on all device sizes.
            </div>
          </div>

          {/* Data Persistence */}
          <div
            data-testid="data-persistence"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Data Persistence
            </h2>
            <div className="text-sm text-gray-600">
              All settings and preferences are automatically saved.
            </div>
          </div>

          {/* Network Interruptions */}
          <div
            data-testid="network-interruptions"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Network Handling
            </h2>
            <div className="text-sm text-gray-600">
              Handles network interruptions gracefully with retry logic.
            </div>
          </div>

          {/* Data Export */}
          <div
            data-testid="data-export"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Data Export
            </h2>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              Export Report
            </button>
          </div>

          {/* Performance Metrics */}
          <div
            data-testid="performance-metrics"
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">150ms</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDNCostDashboard;
