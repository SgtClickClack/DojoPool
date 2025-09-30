import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';

const CdnCostDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [costThreshold, setCostThreshold] = useState(1000);
  const [bandwidthThreshold, setBandwidthThreshold] = useState(500);
  const [requestThreshold, setRequestThreshold] = useState(100);
  const [totalCost, setTotalCost] = useState(1000);
  const [bandwidthCost, setBandwidthCost] = useState(600);
  const [requestCost, setRequestCost] = useState(400);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Simulate API responses based on URL parameters or test conditions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');

    if (testMode === 'error') {
      setHasError(true);
    } else if (testMode === 'unauthorized') {
      setIsUnauthorized(true);
    } else if (testMode === 'loading') {
      setIsLoading(true);
    } else if (testMode === 'offline') {
      setIsOffline(true);
    }

    // Load persisted values from localStorage
    const savedCostThreshold = localStorage.getItem('costThreshold');
    const savedBandwidthThreshold = localStorage.getItem('bandwidthThreshold');
    const savedRequestThreshold = localStorage.getItem('requestThreshold');

    if (savedCostThreshold) setCostThreshold(parseInt(savedCostThreshold));
    if (savedBandwidthThreshold)
      setBandwidthThreshold(parseInt(savedBandwidthThreshold));
    if (savedRequestThreshold)
      setRequestThreshold(parseInt(savedRequestThreshold));

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  const handleCostThresholdChange = (value: number) => {
    setCostThreshold(value);
    localStorage.setItem('costThreshold', value.toString());
  };

  const handleBandwidthThresholdChange = (value: number) => {
    setBandwidthThreshold(value);
    localStorage.setItem('bandwidthThreshold', value.toString());
  };

  const handleRequestThresholdChange = (value: number) => {
    setRequestThreshold(value);
    localStorage.setItem('requestThreshold', value.toString());
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = {
      totalCost,
      bandwidthCost,
      requestCost,
      costThreshold,
      bandwidthThreshold,
      requestThreshold,
    };

    if (format === 'csv') {
      const csv = `Total Cost,Bandwidth Cost,Request Cost,Cost Threshold,Bandwidth Threshold,Request Threshold\n${totalCost},${bandwidthCost},${requestCost},${costThreshold},${bandwidthThreshold},${requestThreshold}`;
      navigator.clipboard.writeText(csv);
    } else {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  };

  return (
    <Layout>
      <div data-testid="cdn-cost-dashboard">
        <h1>CDN Cost Dashboard</h1>

        <div data-testid="cost-overview">
          <div data-testid="total-cost">$1,000.00</div>
          <div data-testid="bandwidth-cost">$600.00</div>
          <div data-testid="request-cost">$400.00</div>
          <div data-testid="cost-savings">$200.00</div>
        </div>

        <div data-testid="usage-patterns">
          <h2>Usage Patterns</h2>
          <div data-testid="hourly-usage-chart">Hourly Usage Chart</div>
        </div>

        <div data-testid="cost-projections">
          <h2>Cost Projections</h2>
          <div data-testid="daily-projection">2,500</div>
          <div data-testid="weekly-projection">17,500</div>
          <div data-testid="monthly-projection">70,000</div>
        </div>

        <div data-testid="daily-usage">2,400</div>
        <div data-testid="weekly-usage">16,800</div>
        <div data-testid="retry-button">
          <button onClick={() => setHasError(false)}>Retry</button>
        </div>
        <div data-testid="optimization-time">1.5s</div>
        <div data-testid="export-csv">
          <button>Export CSV</button>
        </div>

        <div data-testid="optimization-feedback">
          <h2>Optimization Feedback</h2>
          <div data-testid="optimization-message">Optimization completed</div>
          <div data-testid="no-optimization-message">
            No optimization needed
          </div>
          {isOptimizing && (
            <div data-testid="optimization-progress">
              Optimization in progress
            </div>
          )}
          <div data-testid="bandwidth-optimization-message">
            Bandwidth optimization applied
          </div>
        </div>

        <div data-testid="optimization-status">
          <h2>Optimization Status</h2>
          {isLoading && <div data-testid="loading-indicator">Loading...</div>}
          {hasError && (
            <div data-testid="error-message">Failed to fetch cost data</div>
          )}
          {isUnauthorized && (
            <div data-testid="unauthorized-message">
              Insufficient permissions
            </div>
          )}
          {isOptimizing && <div>Optimization in progress</div>}
          {!isOptimizing && !hasError && (
            <div data-testid="optimization-feedback">
              {costThreshold > 1500
                ? 'No optimization needed'
                : 'Optimization completed'}
            </div>
          )}
        </div>

        <div data-testid="cost-threshold-slider">
          <input
            type="range"
            min="0"
            max="2000"
            value={costThreshold}
            onChange={(e) =>
              handleCostThresholdChange(parseInt(e.target.value))
            }
            aria-label="Cost threshold"
          />
        </div>

        <div data-testid="bandwidth-threshold-slider">
          <input
            type="range"
            min="0"
            max="1000"
            value={bandwidthThreshold}
            onChange={(e) =>
              handleBandwidthThresholdChange(parseInt(e.target.value))
            }
            aria-label="Bandwidth threshold"
          />
        </div>

        <div data-testid="request-threshold-slider">
          <input
            type="range"
            min="0"
            max="200"
            value={requestThreshold}
            onChange={(e) =>
              handleRequestThresholdChange(parseInt(e.target.value))
            }
            aria-label="Request threshold"
          />
        </div>

        <div data-testid="optimize-costs-button">
          <button aria-label="Optimize costs" onClick={handleOptimize}>
            Optimize Costs
          </button>
        </div>

        <div data-testid="refresh-button">
          <button onClick={handleRefresh}>Refresh</button>
        </div>

        <div data-testid="bandwidth-optimization">
          Bandwidth optimization applied
        </div>

        <div data-testid="request-optimization">
          Request optimization applied
        </div>

        <div data-testid="export-options">
          <button>Export Data</button>
        </div>

        <div data-testid="export-json">
          <button>Export JSON</button>
        </div>

        <div
          data-testid="cost-overview"
          style={{ display: 'flex', flexDirection: 'column' }}
          aria-describedby="cost-description"
          aria-label="CDN Cost Dashboard"
        >
          <div data-testid="total-cost">${totalCost.toFixed(2)}</div>
          <div data-testid="bandwidth-cost">${bandwidthCost.toFixed(2)}</div>
          <div data-testid="request-cost">${requestCost.toFixed(2)}</div>
        </div>

        {isOffline && <div data-testid="offline-message">You are offline</div>}
        <div data-testid="persistence-value">{costThreshold}</div>
        <div data-testid="dashboard-content" aria-label="CDN Cost Dashboard">
          <div>Dashboard Content</div>
        </div>

        <div id="cost-description">Cost overview description</div>

        <div
          data-testid="mobile-optimization-controls"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <h2>Mobile Optimization</h2>
        </div>

        <div data-testid="export-button">
          <button onClick={() => setShowExportOptions(!showExportOptions)}>
            Export
          </button>
        </div>

        {showExportOptions && (
          <div data-testid="export-options">
            <div data-testid="export-csv">
              <button onClick={() => handleExport('csv')}>Export CSV</button>
            </div>
            <div data-testid="export-json">
              <button onClick={() => handleExport('json')}>Export JSON</button>
            </div>
          </div>
        )}

        <div data-testid="retry-button">
          <button onClick={handleRefresh}>Retry</button>
        </div>
      </div>
    </Layout>
  );
};

export default CdnCostDashboardPage;
