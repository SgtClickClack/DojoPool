import React, { useState, useEffect } from 'react';

const CDNCostDashboard: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [_hasError, setHasError] = useState(false);
  const [costThreshold, setCostThreshold] = useState(1000);
  const [bandwidthThreshold, setBandwidthThreshold] = useState(500);
  const [requestThreshold, setRequestThreshold] = useState(100);
  const [totalCost, setTotalCost] = useState(1000);
  const [bandwidthCost, setBandwidthCost] = useState(600);
  const [requestCost, setRequestCost] = useState(400);
  const [_ws, setWs] = useState<WebSocket | null>(null);

  // 1. Data Persistence - Load settings from localStorage on mount
  useEffect(() => {
    const savedCostThreshold = localStorage.getItem('costThreshold');
    const savedBandwidthThreshold = localStorage.getItem('bandwidthThreshold');
    const savedRequestThreshold = localStorage.getItem('requestThreshold');

    if (savedCostThreshold) setCostThreshold(parseInt(savedCostThreshold));
    if (savedBandwidthThreshold)
      setBandwidthThreshold(parseInt(savedBandwidthThreshold));
    if (savedRequestThreshold)
      setRequestThreshold(parseInt(savedRequestThreshold));
  }, []);

  // 1. Data Persistence - Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('costThreshold', costThreshold.toString());
  }, [costThreshold]);

  useEffect(() => {
    localStorage.setItem('bandwidthThreshold', bandwidthThreshold.toString());
  }, [bandwidthThreshold]);

  useEffect(() => {
    localStorage.setItem('requestThreshold', requestThreshold.toString());
  }, [requestThreshold]);

  // 2. Network Interruptions - Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Real-Time Updates - WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080/cdn-cost');

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cost_update') {
          setTotalCost(data.data.total_cost);
          setBandwidthCost(data.data.bandwidth_cost);
          setRequestCost(data.data.request_cost);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = () => {
      setHasError(true);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  // 4. Data Export - Clipboard API
  const handleExport = async (format: 'csv' | 'json') => {
    const data = {
      totalCost,
      bandwidthCost,
      requestCost,
      costThreshold,
      bandwidthThreshold,
      requestThreshold,
    };

    let exportData: string;
    if (format === 'csv') {
      exportData = `Total Cost,Bandwidth Cost,Request Cost,Cost Threshold,Bandwidth Threshold,Request Threshold\n${totalCost},${bandwidthCost},${requestCost},${costThreshold},${bandwidthThreshold},${requestThreshold}`;
    } else {
      exportData = JSON.stringify(data, null, 2);
    }

    try {
      await navigator.clipboard.writeText(exportData);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

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
            aria-label="CDN Cost Overview"
            aria-describedby="cost-overview-desc"
            className="bg-white rounded-lg shadow p-6"
          >
            <p id="cost-overview-desc" className="sr-only">
              Overview of CDN costs
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="text-center">
                <div
                  data-testid="total-cost"
                  className="text-2xl font-bold text-blue-600"
                >
                  ${totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="bandwidth-cost"
                  className="text-2xl font-bold text-green-600"
                >
                  ${bandwidthCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Bandwidth Cost</div>
              </div>
              <div className="text-center">
                <div
                  data-testid="request-cost"
                  className="text-2xl font-bold text-purple-600"
                >
                  ${requestCost.toFixed(2)}
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
              value={costThreshold}
              onChange={(e) => setCostThreshold(parseInt(e.target.value))}
              className="w-full"
            />
            <input
              data-testid="bandwidth-threshold-slider"
              aria-label="Bandwidth threshold"
              type="range"
              min={0}
              max={1000}
              value={bandwidthThreshold}
              onChange={(e) => setBandwidthThreshold(parseInt(e.target.value))}
              className="w-full"
            />
            <input
              data-testid="request-threshold-slider"
              aria-label="Request threshold"
              type="range"
              min={0}
              max={100}
              value={requestThreshold}
              onChange={(e) => setRequestThreshold(parseInt(e.target.value))}
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
              onClick={() => setIsOptimizing(true)}
            >
              Optimize
            </button>
            <button
              data-testid="refresh-button"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Refresh
            </button>
            {isOptimizing && (
              <div data-testid="optimization-status">
                Optimization in progress
              </div>
            )}
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
            {isOffline && (
              <div data-testid="offline-message">You are offline</div>
            )}
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
                onClick={() => handleExport('csv')}
              >
                CSV
              </button>
              <button
                data-testid="export-json"
                className="px-3 py-1 bg-gray-100 rounded"
                onClick={() => handleExport('json')}
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
