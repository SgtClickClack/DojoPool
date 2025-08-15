const fs = require('fs');
const path = require('path');

// Thresholds for performance metrics (in milliseconds)
const THRESHOLDS = {
  RENDER_TIME: 50,
  INTERACTION_TIME: 100,
  ANIMATION_FRAME_TIME: 16.67, // 60fps
};

function analyzePerformanceResults() {
  const performanceReport = {
    timestamp: new Date().toISOString(),
    metrics: {},
    regressions: [],
    improvements: [],
  };

  // Read current test results
  const testResults = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../performance-report/current-results.json'),
    'utf8'
  ));

  // Calculate metrics
  performanceReport.metrics = {
    averageRenderTime: calculateAverageMetric(testResults.renderTimes),
    averageInteractionTime: calculateAverageMetric(testResults.interactionTimes),
    averageFrameTime: calculateAverageMetric(testResults.frameTimes),
    memoryUsage: testResults.memoryUsage,
  };

  // Check for regressions
  checkRegressions(performanceReport);

  // Save results
  saveResults(performanceReport);

  return performanceReport;
}

function calculateAverageMetric(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function checkRegressions(report) {
  const { metrics } = report;

  if (metrics.averageRenderTime > THRESHOLDS.RENDER_TIME) {
    report.regressions.push({
      metric: 'renderTime',
      value: metrics.averageRenderTime,
      threshold: THRESHOLDS.RENDER_TIME,
    });
  }

  if (metrics.averageInteractionTime > THRESHOLDS.INTERACTION_TIME) {
    report.regressions.push({
      metric: 'interactionTime',
      value: metrics.averageInteractionTime,
      threshold: THRESHOLDS.INTERACTION_TIME,
    });
  }

  if (metrics.averageFrameTime > THRESHOLDS.ANIMATION_FRAME_TIME) {
    report.regressions.push({
      metric: 'frameTime',
      value: metrics.averageFrameTime,
      threshold: THRESHOLDS.ANIMATION_FRAME_TIME,
    });
  }
}

function saveResults(report) {
  // Ensure directory exists
  const reportDir = path.join(__dirname, '../performance-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Save current report
  fs.writeFileSync(
    path.join(reportDir, 'performance-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Update history
  const historyPath = path.join(reportDir, 'performance-history.json');
  let history = [];
  
  if (fs.existsSync(historyPath)) {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  }
  
  history.push(report);
  
  // Keep last 30 entries
  if (history.length > 30) {
    history = history.slice(-30);
  }
  
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// Run analysis
const report = analyzePerformanceResults();

// Exit with error if there are regressions
if (report.regressions.length > 0) {
  console.error('Performance regressions detected:', report.regressions);
  process.exit(1);
}

console.log('Performance analysis completed successfully'); 