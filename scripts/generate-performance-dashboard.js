const fs = require('fs');
const path = require('path');

// Read all performance reports
const reportsDir = path.join(__dirname, '../cypress/reports/performance');
const reportsPath = path.join(reportsDir, 'report.json');
const violationsPath = path.join(reportsDir, 'violations.json');

// Read performance data
const report = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
const violations = JSON.parse(fs.readFileSync(violationsPath, 'utf8'));

// Generate dashboard HTML
const dashboardHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>DojoPool Performance Dashboard</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chart-container {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .status-good { color: #4caf50; }
    .status-warning { color: #ff9800; }
    .status-critical { color: #f44336; }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>DojoPool Performance Dashboard</h1>
      <p>Last Updated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Overall Health</h3>
        <h2 class="${report.summary.failedTests === 0 ? 'status-good' : 'status-critical'}">
          ${report.summary.failedTests === 0 ? '✅ Healthy' : '❌ Issues Detected'}
        </h2>
        <p>Score: ${report.summary.averageScore.toFixed(2)}%</p>
      </div>

      <div class="metric-card">
        <h3>Test Results</h3>
        <p>Total: ${report.summary.totalTests}</p>
        <p class="status-good">Passed: ${report.summary.passedTests}</p>
        <p class="status-critical">Failed: ${report.summary.failedTests}</p>
      </div>

      <div class="metric-card">
        <h3>Performance Violations</h3>
        <p>Total: ${violations.violations.length}</p>
        <p>Last Check: ${new Date(violations.timestamp).toLocaleString()}</p>
      </div>
    </div>

    <div class="chart-container">
      <h2>Core Web Vitals</h2>
      <div id="webVitalsChart"></div>
    </div>

    <div class="chart-container">
      <h2>Game Performance</h2>
      <div id="gamePerformanceChart"></div>
    </div>

    <div class="chart-container">
      <h2>Resource Usage</h2>
      <div id="resourceUsageChart"></div>
    </div>

    <div class="chart-container">
      <h2>Network Performance</h2>
      <div id="networkChart"></div>
    </div>
  </div>

  <script>
    // Web Vitals Chart
    const webVitalsData = ${JSON.stringify(report.metrics.filter((m) => m.name.includes('webVitals')))};
    Plotly.newPlot('webVitalsChart', [{
      type: 'bar',
      x: webVitalsData.map(m => m.name),
      y: webVitalsData.map(m => m.value),
      marker: {
        color: webVitalsData.map(m => m.passed ? '#4caf50' : '#f44336')
      }
    }], {
      title: 'Core Web Vitals Metrics',
      yaxis: { title: 'Value' }
    });

    // Game Performance Chart
    const gameData = ${JSON.stringify(report.metrics.filter((m) => m.name.includes('game')))};
    Plotly.newPlot('gamePerformanceChart', [{
      type: 'scatter',
      x: gameData.map(m => m.name),
      y: gameData.map(m => m.value),
      mode: 'lines+markers',
      line: { shape: 'spline' }
    }], {
      title: 'Game Performance Metrics',
      yaxis: { title: 'Response Time (ms)' }
    });

    // Resource Usage Chart
    const resourceData = ${JSON.stringify(report.metrics.filter((m) => m.name.includes('resource')))};
    const ctx = document.createElement('canvas').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: resourceData.map(m => m.name),
        datasets: [{
          data: resourceData.map(m => m.value),
          backgroundColor: [
            '#4caf50',
            '#2196f3',
            '#ff9800',
            '#f44336'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Resource Usage Distribution'
          }
        }
      }
    });

    // Network Performance Chart
    const networkData = ${JSON.stringify(report.metrics.filter((m) => m.name.includes('network')))};
    Plotly.newPlot('networkChart', [{
      type: 'scatter',
      x: networkData.map(m => m.name),
      y: networkData.map(m => m.value),
      mode: 'lines+markers',
      fill: 'tozeroy'
    }], {
      title: 'Network Performance Metrics',
      yaxis: { title: 'Value' }
    });
  </script>
</body>
</html>`;

// Save dashboard
const dashboardPath = path.join(reportsDir, 'dashboard.html');
fs.writeFileSync(dashboardPath, dashboardHtml);

console.log(`Performance dashboard generated at: ${dashboardPath}`);
