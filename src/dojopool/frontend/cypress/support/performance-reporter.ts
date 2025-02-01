import { performanceThresholds } from '../config/performance-thresholds';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  passed: boolean;
}

interface PerformanceReport {
  timestamp: string;
  metrics: PerformanceMetric[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
  };
}

class PerformanceReporter {
  private metrics: PerformanceMetric[] = [];
  private report: PerformanceReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      metrics: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageScore: 0
      }
    };
  }

  addMetric(name: string, value: number, threshold: number, unit: string) {
    const passed = value <= threshold;
    const metric: PerformanceMetric = {
      name,
      value,
      threshold,
      unit,
      passed
    };

    this.metrics.push(metric);
    this.updateSummary();
  }

  private updateSummary() {
    this.report.metrics = this.metrics;
    this.report.summary = {
      totalTests: this.metrics.length,
      passedTests: this.metrics.filter(m => m.passed).length,
      failedTests: this.metrics.filter(m => !m.passed).length,
      averageScore: this.calculateAverageScore()
    };
  }

  private calculateAverageScore(): number {
    if (this.metrics.length === 0) return 0;

    const scores = this.metrics.map(metric => {
      if (metric.passed) return 100;
      const ratio = metric.threshold / metric.value;
      return Math.max(0, Math.min(100, ratio * 100));
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateReport(): PerformanceReport {
    return this.report;
  }

  saveReport(filePath: string) {
    cy.writeFile(filePath, JSON.stringify(this.report, null, 2));
  }

  logReport() {
    const { summary } = this.report;
    const failedMetrics = this.metrics.filter(m => !m.passed);

    cy.task('log', '\n=== Performance Test Report ===');
    cy.task('log', `Timestamp: ${this.report.timestamp}`);
    cy.task('log', `Total Tests: ${summary.totalTests}`);
    cy.task('log', `Passed: ${summary.passedTests}`);
    cy.task('log', `Failed: ${summary.failedTests}`);
    cy.task('log', `Average Score: ${summary.averageScore.toFixed(2)}%`);

    if (failedMetrics.length > 0) {
      cy.task('log', '\nFailed Metrics:');
      failedMetrics.forEach(metric => {
        cy.task('log', `- ${metric.name}: ${metric.value}${metric.unit} (Threshold: ${metric.threshold}${metric.unit})`);
      });
    }
  }

  // Helper methods for common metrics
  addWebVitalMetric(name: string, value: number) {
    const threshold = performanceThresholds.webVitals[name.toLowerCase()];
    const unit = name === 'CLS' ? '' : 'ms';
    this.addMetric(name, value, threshold, unit);
  }

  addGameMetric(name: string, value: number) {
    const threshold = performanceThresholds.criticalPath[name];
    this.addMetric(name, value, threshold, 'ms');
  }

  addMemoryMetric(name: string, value: number) {
    const threshold = performanceThresholds.memory[name];
    this.addMetric(name, value, threshold, 'MB');
  }

  addNetworkMetric(name: string, value: number, unit: string) {
    const threshold = performanceThresholds.network[name];
    this.addMetric(name, value, threshold, unit);
  }

  addAnimationMetric(name: string, value: number) {
    const threshold = performanceThresholds.animation[name];
    this.addMetric(name, value, threshold, name === 'minFPS' ? 'fps' : 'ms');
  }
}

export const performanceReporter = new PerformanceReporter(); 