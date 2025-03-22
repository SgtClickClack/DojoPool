/**
 * Performance budgets and thresholds configuration
 */
module.exports = {
  budgets: {
    initialRender: {
      threshold: 100, // ms
      warning: 80, // ms
    },
    largeDatasetRender: {
      threshold: 200, // ms
      warning: 150, // ms
    },
    updatePerformance: {
      threshold: 50, // ms
      warning: 40, // ms
    },
    chartRendering: {
      threshold: 150, // ms
      warning: 120, // ms
    },
    listVirtualization: {
      threshold: 200, // ms
      warning: 160, // ms
    },
    scrollPerformance: {
      threshold: 16, // ms (one frame at 60fps)
      warning: 12, // ms
    }
  },
  regressionThresholds: {
    maxDegradation: 20, // Maximum allowed performance degradation in percentage
    significantChange: 10, // Percentage change that triggers a warning
  },
  monitoring: {
    sampleSize: 5, // Number of test runs to average
    retainHistory: 30, // Days to retain historical data
    alertThreshold: 3, // Number of consecutive failures before alerting
  },
  reporting: {
    includeWarnings: true,
    generateTrends: true,
    outputFormat: 'json',
    outputDir: 'performance-results',
  }
}; 