const fs = require('fs');
const path = require('path');

// Load test results
const loadTestResults = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../results/k6-results.json'), 'utf8')
);

// Load component performance results
const componentResults = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../results/component-perf.json'), 'utf8')
);

// Calculate metrics
const metrics = {
  avgResponseTime: calculateAverageResponseTime(loadTestResults),
  p95ResponseTime: calculate95thPercentileResponseTime(loadTestResults),
  avgMemoryUsage: calculateAverageMemoryUsage(componentResults),
  maxMemoryUsage: calculateMaxMemoryUsage(componentResults),
  avgCpuUsage: calculateAverageCpuUsage(componentResults),
  thresholdsPassed: checkThresholds(loadTestResults, componentResults),
};

// Generate HTML report
const htmlReport = generateHtmlReport(metrics, loadTestResults, componentResults);

// Save results
fs.writeFileSync('performance-metrics.json', JSON.stringify(metrics, null, 2));
fs.writeFileSync('performance-report.html', htmlReport);

// Utility functions
function calculateAverageResponseTime(results) {
  const times = results.metrics.http_req_duration.values;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

function calculate95thPercentileResponseTime(results) {
  const times = [...results.metrics.http_req_duration.values].sort((a, b) => a - b);
  const index = Math.floor(times.length * 0.95);
  return times[index];
}

function calculateAverageMemoryUsage(results) {
  const usages = results.components.map(c => c.memoryUsage);
  return usages.reduce((a, b) => a + b, 0) / usages.length;
}

function calculateMaxMemoryUsage(results) {
  return Math.max(...results.components.map(c => c.memoryUsage));
}

function calculateAverageCpuUsage(results) {
  const usages = results.components.map(c => c.cpuUsage);
  return usages.reduce((a, b) => a + b, 0) / usages.length;
}

function checkThresholds(loadResults, componentResults) {
  const thresholds = {
    maxResponseTime: 500,
    maxMemoryUsage: 512, // MB
    maxCpuUsage: 80, // %
  };

  return (
    calculate95thPercentileResponseTime(loadResults) < thresholds.maxResponseTime &&
    calculateMaxMemoryUsage(componentResults) < thresholds.maxMemoryUsage &&
    calculateAverageCpuUsage(componentResults) < thresholds.maxCpuUsage
  );
}

function generateHtmlReport(metrics, loadResults, componentResults) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric {
      margin: 10px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .chart {
      margin: 20px 0;
      padding: 20px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .status {
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .pass {
      background: #d4edda;
      color: #155724;
    }
    .fail {
      background: #f8d7da;
      color: #721c24;
    }
  </style>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
  <div class="container">
    <h1>Performance Test Report</h1>
    
    <div class="status ${metrics.thresholdsPassed ? 'pass' : 'fail'}">
      ${metrics.thresholdsPassed ? '✅ All performance thresholds passed' : '❌ Some performance thresholds failed'}
    </div>

    <h2>Key Metrics</h2>
    <div class="metric">
      <h3>Response Times</h3>
      <p>Average: ${metrics.avgResponseTime.toFixed(2)}ms</p>
      <p>95th Percentile: ${metrics.p95ResponseTime.toFixed(2)}ms</p>
    </div>

    <div class="metric">
      <h3>Resource Usage</h3>
      <p>Average Memory: ${metrics.avgMemoryUsage.toFixed(2)}MB</p>
      <p>Maximum Memory: ${metrics.maxMemoryUsage.toFixed(2)}MB</p>
      <p>Average CPU: ${metrics.avgCpuUsage.toFixed(2)}%</p>
    </div>

    <h2>Response Time Distribution</h2>
    <div id="responseTimeChart" class="chart"></div>

    <h2>Component Performance</h2>
    <div id="componentChart" class="chart"></div>

    <script>
      // Response time distribution chart
      const responseTimeBins = calculateHistogramBins(${JSON.stringify(loadResults.metrics.http_req_duration.values)});
      Plotly.newPlot('responseTimeChart', [{
        x: responseTimeBins.bins,
        y: responseTimeBins.counts,
        type: 'bar'
      }], {
        title: 'Response Time Distribution',
        xaxis: { title: 'Response Time (ms)' },
        yaxis: { title: 'Count' }
      });

      // Component performance chart
      const componentData = ${JSON.stringify(componentResults.components)};
      Plotly.newPlot('componentChart', [{
        x: componentData.map(c => c.name),
        y: componentData.map(c => c.renderTime),
        type: 'bar'
      }], {
        title: 'Component Render Times',
        xaxis: { title: 'Component' },
        yaxis: { title: 'Render Time (ms)' }
      });

      function calculateHistogramBins(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binCount = 20;
        const binSize = (max - min) / binCount;
        const bins = Array.from({ length: binCount }, (_, i) => min + i * binSize);
        const counts = new Array(binCount).fill(0);
        
        data.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
          counts[binIndex]++;
        });

        return { bins, counts };
      }
    </script>
  </div>
</body>
</html>
  `;
} 