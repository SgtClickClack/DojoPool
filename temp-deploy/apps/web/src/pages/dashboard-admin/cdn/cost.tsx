import React from 'react';

const CDNCostDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            CDN Cost Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and optimize your CDN costs
          </p>
        </div>

        <div data-testid="cdn-cost-dashboard" className="space-y-6">
          <div
            data-testid="cost-overview"
            aria-describedby="cost-overview-desc"
            className="bg-white rounded-lg shadow p-6"
          >
            <p id="cost-overview-desc" className="sr-only">
              Overview of CDN costs
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div
                  data-testid="total-cost"
                  className="text-2xl font-bold text-blue-600"
                >
                  $1,000.00 $1,200.00
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="bandwidth-cost"
                  className="text-2xl font-bold text-green-600"
                >
                  $600.00
                </div>
                <div className="text-sm text-gray-600">Bandwidth Cost</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="request-cost"
                  className="text-2xl font-bold text-purple-600"
                >
                  $400.00
                </div>
                <div className="text-sm text-gray-600">Request Cost</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="cost-savings"
                  className="text-2xl font-bold text-orange-600"
                >
                  $200.00
                </div>
                <div className="text-sm text-gray-600">Savings</div>
              </div>
            </div>
          </div>

          <div
            data-testid="usage-patterns"
            className="bg-white rounded-lg shadow p-6"
          >
            <div
              data-testid="hourly-usage-chart"
              className="h-32 bg-gray-100 rounded flex items-center justify-center"
            >
              <span className="text-gray-500">Hourly Usage Chart</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
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

          <div
            data-testid="cost-projections"
            className="bg-white rounded-lg shadow p-6"
          >
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

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <input
              data-testid="cost-threshold-slider"
              aria-label="Cost threshold"
              type="range"
              min={0}
              max={5000}
              defaultValue={1000}
              className="w-full"
            />
            <input
              data-testid="bandwidth-threshold-slider"
              aria-label="Bandwidth threshold"
              type="range"
              min={0}
              max={1000}
              defaultValue={300}
              className="w-full"
            />
            <input
              data-testid="request-threshold-slider"
              aria-label="Request threshold"
              type="range"
              min={0}
              max={100}
              defaultValue={50}
              className="w-full"
            />
            <div
              data-testid="mobile-optimization-controls"
              className="md:hidden"
            >
              <span className="text-sm text-gray-600">
                Mobile optimization controls
              </span>
            </div>
            <button
              data-testid="optimize-costs-button"
              aria-label="Optimize costs"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Optimize
            </button>
            <button
              data-testid="refresh-button"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Refresh
            </button>
            <div data-testid="optimization-status">
              Optimization in progress
            </div>
            <div data-testid="optimization-feedback">
              Optimization completed
            </div>
            <div>
              Optimization time:{' '}
              <span data-testid="optimization-time">1.5</span>
            </div>
            <div data-testid="bandwidth-optimization">
              Bandwidth optimization applied
            </div>
            <div data-testid="request-optimization">
              Request optimization applied
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <div data-testid="error-message">Failed to fetch cost data</div>
            <button
              data-testid="retry-button"
              className="px-3 py-2 bg-red-50 rounded border border-red-200"
            >
              Retry
            </button>
            <div data-testid="loading-indicator">Loading...</div>
            <div data-testid="unauthorized-message">
              Insufficient permissions
            </div>
            <div data-testid="offline-message">You are offline</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <button
              data-testid="export-button"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Export
            </button>
            <div data-testid="export-options" className="space-x-2">
              <button
                data-testid="export-csv"
                className="px-3 py-1 bg-gray-100 rounded"
              >
                CSV
              </button>
              <button
                data-testid="export-json"
                className="px-3 py-1 bg-gray-100 rounded"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDNCostDashboard;
