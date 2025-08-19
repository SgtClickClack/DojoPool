const fs = require('fs');
const path = require('path');
const perfConfig = require('../performance.config');
const {
  PerformanceNotificationService,
} = require('../src/services/notifications/PerformanceNotificationService');
const { AlertHistoryService } = require('../src/services/AlertHistoryService');
const { notificationConfig } = require('../config/notifications.config');

class PerformanceChecker {
  constructor(config) {
    this.config = config;
    this.resultsDir = path.join(process.cwd(), config.reporting.outputDir);
    this.historyFile = path.join(this.resultsDir, 'history.json');
    this.alertHistoryService = new AlertHistoryService();
    this.notificationService = new PerformanceNotificationService(
      notificationConfig,
      this.alertHistoryService
    );
    this.lastAlertTime = new Map();
  }

  async loadHistory() {
    try {
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      return history.slice(-this.config.monitoring.retainHistory);
    } catch {
      return [];
    }
  }

  async saveHistory(history) {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  async shouldSendAlert(metric, type) {
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(metric) || 0;
    const timeSinceLastAlert = now - lastAlert;

    if (
      timeSinceLastAlert <
      notificationConfig.alertThresholds.minTimeBetweenAlerts
    ) {
      return false;
    }

    this.lastAlertTime.set(metric, now);
    return true;
  }

  async checkBudgets(results) {
    const violations = [];
    const warnings = [];
    const alerts = [];

    for (const [metric, value] of Object.entries(results)) {
      const budget = this.config.budgets[metric];
      if (!budget) continue;

      if (value > budget.threshold) {
        violations.push({
          metric,
          value,
          threshold: budget.threshold,
          overage: value - budget.threshold,
        });

        if (await this.shouldSendAlert(metric, 'violation')) {
          alerts.push({
            type: 'violation',
            metric,
            value,
            threshold: budget.threshold,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (value > budget.warning) {
        warnings.push({
          metric,
          value,
          warning: budget.warning,
          overage: value - budget.warning,
        });

        if (await this.shouldSendAlert(metric, 'warning')) {
          alerts.push({
            type: 'warning',
            metric,
            value,
            threshold: budget.warning,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    if (alerts.length > 0) {
      await this.notificationService.sendBatchAlerts(alerts);
    }

    return { violations, warnings };
  }

  async detectRegressions(currentResults, history) {
    const regressions = [];
    const alerts = [];

    if (history.length === 0) return regressions;

    const baseline = history[history.length - 1];
    const { maxDegradation, significantChange } =
      this.config.regressionThresholds;

    for (const [metric, value] of Object.entries(currentResults)) {
      const baselineValue = baseline[metric];
      if (!baselineValue) continue;

      const percentChange = ((value - baselineValue) / baselineValue) * 100;

      if (percentChange > maxDegradation) {
        const regression = {
          metric,
          currentValue: value,
          baselineValue,
          percentChange,
          severity: 'error',
        };
        regressions.push(regression);

        if (await this.shouldSendAlert(metric, 'regression')) {
          alerts.push({
            type: 'regression',
            metric,
            value,
            baselineValue,
            percentChange,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (percentChange > significantChange) {
        const regression = {
          metric,
          currentValue: value,
          baselineValue,
          percentChange,
          severity: 'warning',
        };
        regressions.push(regression);

        if (await this.shouldSendAlert(metric, 'regression')) {
          alerts.push({
            type: 'regression',
            metric,
            value,
            baselineValue,
            percentChange,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    if (alerts.length > 0) {
      await this.notificationService.sendBatchAlerts(alerts);
    }

    return regressions;
  }

  async generateReport(results, budgetResults, regressions) {
    const report = {
      timestamp: new Date().toISOString(),
      results,
      budgets: {
        violations: budgetResults.violations,
        warnings: budgetResults.warnings,
      },
      regressions: regressions.filter((r) => r.severity === 'error'),
      warnings: regressions.filter((r) => r.severity === 'warning'),
    };

    const reportFile = path.join(this.resultsDir, 'summary.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Get analytics for the last 7 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const analytics = await this.alertHistoryService.getAlertAnalytics(
        startDate,
        endDate
      );
      const analyticsFile = path.join(this.resultsDir, 'analytics.json');
      fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    }

    return report;
  }

  async check(results) {
    const history = await this.loadHistory();
    const budgetResults = await this.checkBudgets(results);
    const regressions = await this.detectRegressions(results, history);

    history.push(results);
    await this.saveHistory(history);

    const report = await this.generateReport(
      results,
      budgetResults,
      regressions
    );

    const hasErrors =
      budgetResults.violations.length > 0 ||
      regressions.filter((r) => r.severity === 'error').length > 0;

    if (hasErrors) {
      console.error('❌ Performance budget violations or regressions detected');
      process.exit(1);
    } else if (
      budgetResults.warnings.length > 0 ||
      regressions.filter((r) => r.severity === 'warning').length > 0
    ) {
      console.warn('⚠️ Performance warnings detected');
      process.exit(0);
    } else {
      console.log('✅ All performance checks passed');
      process.exit(0);
    }
  }
}

// Execute checks
const results = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'performance-results/latest.json'),
    'utf8'
  )
);
const checker = new PerformanceChecker(perfConfig);
checker.check(results).catch((error) => {
  console.error('Error running performance checks:', error);
  process.exit(1);
});
