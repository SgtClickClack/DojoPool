#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const Table = require('easy-table');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'reports');
    this.templatesDir = path.join(__dirname, '..', 'templates');
  }

  async generateComprehensiveReport(testType = 'all') {
    console.log('📊 Generating comprehensive performance report...');

    await this.ensureDirectories();
    const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');

    let reportData = {
      metadata: {
        generatedAt: moment().format(),
        testType,
        timestamp,
      },
      loadTests: {},
      stressTests: {},
      benchmarks: {},
      monitoring: {},
      recommendations: [],
    };

    // Load test results
    if (testType === 'all' || testType === 'load') {
      reportData.loadTests = await this.loadTestResults('load-tests');
    }

    // Stress test results
    if (testType === 'all' || testType === 'stress') {
      reportData.stressTests = await this.loadTestResults('stress-tests');
    }

    // Benchmark results
    if (testType === 'all' || testType === 'benchmark') {
      reportData.benchmarks = await this.loadBenchmarkResults();
    }

    // Monitoring results
    if (testType === 'all' || testType === 'monitor') {
      reportData.monitoring = await this.loadMonitoringResults();
    }

    // Generate recommendations
    reportData.recommendations = this.generateRecommendations(reportData);

    // Save comprehensive report
    const reportPath = path.join(
      this.reportsDir,
      `comprehensive-report-${timestamp}.json`
    );
    await fs.writeJson(reportPath, reportData, { spaces: 2 });

    // Generate HTML report
    const htmlReport = await this.generateHTMLReport(reportData);
    const htmlPath = path.join(
      this.reportsDir,
      `comprehensive-report-${timestamp}.html`
    );
    await fs.writeFile(htmlPath, htmlReport);

    // Generate executive summary
    const summaryReport = this.generateExecutiveSummary(reportData);
    const summaryPath = path.join(
      this.reportsDir,
      `executive-summary-${timestamp}.txt`
    );
    await fs.writeFile(summaryPath, summaryReport);

    console.log('✅ Reports generated:');
    console.log(`   📄 JSON: ${reportPath}`);
    console.log(`   🌐 HTML: ${htmlPath}`);
    console.log(`   📋 Summary: ${summaryPath}`);

    return reportData;
  }

  async loadTestResults(testType) {
    const results = {};
    const resultsDir = path.join(__dirname, '..', testType);

    try {
      const files = await fs.readdir(resultsDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(resultsDir, file);
        const data = await fs.readJson(filePath);
        const testName = path.basename(file, '.json');
        results[testName] = data;
      }
    } catch (error) {
      console.warn(
        `Warning: Could not load ${testType} results:`,
        error.message
      );
    }

    return results;
  }

  async loadBenchmarkResults() {
    const benchmarkDir = path.join(__dirname, '..', 'benchmark');
    const results = {};

    try {
      const files = await fs.readdir(benchmarkDir);
      const reportFiles = files.filter((file) =>
        file.includes('benchmark-report')
      );

      for (const file of reportFiles) {
        const filePath = path.join(benchmarkDir, file);
        const data = await fs.readJson(filePath);
        results[path.basename(file, '.json')] = data;
      }
    } catch (error) {
      console.warn('Warning: Could not load benchmark results:', error.message);
    }

    return results;
  }

  async loadMonitoringResults() {
    const reportsDir = this.reportsDir;
    const results = {};

    try {
      const files = await fs.readdir(reportsDir);
      const monitorFiles = files.filter((file) =>
        file.includes('performance-monitor')
      );

      for (const file of monitorFiles) {
        const filePath = path.join(reportsDir, file);
        const data = await fs.readJson(filePath);
        results[path.basename(file, '.json')] = data;
      }
    } catch (error) {
      console.warn(
        'Warning: Could not load monitoring results:',
        error.message
      );
    }

    return results;
  }

  generateRecommendations(reportData) {
    const recommendations = [];

    // Analyze load test results
    Object.values(reportData.loadTests).forEach((test) => {
      if (test.aggregate && test.aggregate.latency.p95 > 1000) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          message: `High P95 latency (${test.aggregate.latency.p95}ms) detected in ${test.title}`,
          suggestion:
            'Consider optimizing database queries and implementing caching',
        });
      }
    });

    // Analyze benchmark results
    Object.values(reportData.benchmarks).forEach((benchmark) => {
      if (benchmark.summary) {
        if (benchmark.summary.overall.avgResponseTime > 1000) {
          recommendations.push({
            type: 'performance',
            priority: 'high',
            message: 'Average response time exceeds 1 second',
            suggestion:
              'Implement database query optimization and response caching',
          });
        }
        if (benchmark.summary.overall.successRate < 95) {
          recommendations.push({
            type: 'reliability',
            priority: 'critical',
            message: `API success rate below 95%: ${benchmark.summary.overall.successRate}%`,
            suggestion:
              'Investigate and fix failing endpoints, implement proper error handling',
          });
        }
      }
    });

    // Analyze monitoring results
    Object.values(reportData.monitoring).forEach((monitor) => {
      if (monitor.summary) {
        if (monitor.summary.overall.successRate < 99) {
          recommendations.push({
            type: 'reliability',
            priority: 'medium',
            message: 'Service availability below 99.9%',
            suggestion:
              'Implement health checks and automatic recovery mechanisms',
          });
        }
      }
    });

    return recommendations;
  }

  generateExecutiveSummary(reportData) {
    let summary = '🚀 DojoPool Performance Test Executive Summary\n';
    summary += '='.repeat(60) + '\n\n';
    summary += `Report Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`;
    summary += `Test Type: ${reportData.metadata.testType}\n\n`;

    // Overall health assessment
    summary += '🏥 Overall System Health:\n';

    let healthScore = 100;
    let issues = [];

    // Check benchmarks
    Object.values(reportData.benchmarks).forEach((benchmark) => {
      if (benchmark.summary) {
        if (benchmark.summary.overall.successRate < 95) {
          healthScore -= 20;
          issues.push('Low API success rate');
        }
        if (benchmark.summary.overall.avgResponseTime > 1000) {
          healthScore -= 15;
          issues.push('High response times');
        }
      }
    });

    // Check monitoring
    Object.values(reportData.monitoring).forEach((monitor) => {
      if (monitor.summary) {
        if (monitor.summary.overall.successRate < 99) {
          healthScore -= 10;
          issues.push('Service availability issues');
        }
      }
    });

    summary += `Health Score: ${Math.max(0, healthScore)}/100\n`;
    if (issues.length > 0) {
      summary += `Issues: ${issues.join(', ')}\n`;
    } else {
      summary += 'Status: ✅ All systems operating normally\n';
    }

    summary += '\n📊 Key Metrics:\n';

    // Aggregate metrics from all test types
    const metrics = this.aggregateMetrics(reportData);
    summary += `- Average Response Time: ${metrics.avgResponseTime.toFixed(2)}ms\n`;
    summary += `- Overall Success Rate: ${metrics.successRate.toFixed(2)}%\n`;
    summary += `- Peak Throughput: ${metrics.peakThroughput} req/sec\n`;
    summary += `- Total Requests Tested: ${metrics.totalRequests.toLocaleString()}\n`;

    summary += '\n💡 Recommendations:\n';
    reportData.recommendations.forEach((rec, index) => {
      const priority =
        rec.priority === 'critical'
          ? '🔴'
          : rec.priority === 'high'
            ? '🟠'
            : '🟡';
      summary += `${index + 1}. ${priority} ${rec.message}\n`;
      summary += `   💡 ${rec.suggestion}\n\n`;
    });

    return summary;
  }

  aggregateMetrics(reportData) {
    const metrics = {
      avgResponseTime: 0,
      successRate: 0,
      peakThroughput: 0,
      totalRequests: 0,
    };

    let responseTimeSum = 0;
    let successCount = 0;
    let totalCount = 0;
    let maxThroughput = 0;

    // Aggregate from benchmarks
    Object.values(reportData.benchmarks).forEach((benchmark) => {
      if (benchmark.summary) {
        responseTimeSum += benchmark.summary.overall.avgResponseTime;
        successCount += benchmark.summary.overall.successRate;
        totalCount++;
      }

      if (benchmark.results) {
        benchmark.results.forEach((result) => {
          if (result.throughput && result.throughput > maxThroughput) {
            maxThroughput = result.throughput;
          }
          metrics.totalRequests += result.requests || 0;
        });
      }
    });

    // Aggregate from monitoring
    Object.values(reportData.monitoring).forEach((monitor) => {
      if (monitor.summary) {
        responseTimeSum += monitor.summary.overall.avgResponseTime;
        successCount += monitor.summary.overall.successRate;
        totalCount++;
      }
    });

    if (totalCount > 0) {
      metrics.avgResponseTime = responseTimeSum / totalCount;
      metrics.successRate = successCount / totalCount;
    }

    metrics.peakThroughput = maxThroughput;

    return metrics;
  }

  async generateHTMLReport(reportData) {
    // Simple HTML template - in a real implementation, you'd use a proper template engine
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DojoPool Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .recommendation { border-left: 4px solid #ff6b6b; padding-left: 15px; margin: 10px 0; }
        .success { color: #00ff88; }
        .warning { color: #ffa500; }
        .error { color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 DojoPool Performance Test Report</h1>
        <p>Generated: ${moment(reportData.metadata.generatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
        <p>Test Type: ${reportData.metadata.testType}</p>
    </div>

    <div class="section">
        <h2>📊 Test Results Summary</h2>`;

    // Add test results
    if (Object.keys(reportData.loadTests).length > 0) {
      html += '<h3>Load Tests</h3>';
      Object.entries(reportData.loadTests).forEach(([name, data]) => {
        html += `<div class="metric">`;
        html += `<strong>${name}:</strong> `;
        if (data.aggregate) {
          html += `${data.aggregate.requestsCompleted} requests, `;
          html += `${data.aggregate.latency.p95}ms P95 latency`;
        }
        html += `</div>`;
      });
    }

    // Add recommendations
    if (reportData.recommendations.length > 0) {
      html += '<h3>💡 Recommendations</h3>';
      reportData.recommendations.forEach((rec) => {
        const priorityClass =
          rec.priority === 'critical'
            ? 'error'
            : rec.priority === 'high'
              ? 'warning'
              : 'success';
        html += `<div class="recommendation ${priorityClass}">`;
        html += `<strong>${rec.type.toUpperCase()}:</strong> ${rec.message}<br>`;
        html += `<em>Suggestion: ${rec.suggestion}</em>`;
        html += `</div>`;
      });
    }

    html += `
    </div>
</body>
</html>`;

    return html;
  }

  async ensureDirectories() {
    await fs.ensureDir(this.reportsDir);
    await fs.ensureDir(this.templatesDir);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  const generator = new ReportGenerator();
  generator.generateComprehensiveReport(testType).catch(console.error);
}

module.exports = ReportGenerator;
