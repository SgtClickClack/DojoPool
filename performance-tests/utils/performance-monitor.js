#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class PerformanceMonitor {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.interval = options.interval || 5000; // 5 seconds
    this.duration = options.duration || 300000; // 5 minutes
    this.outputDir = path.join(__dirname, '..', 'reports');
    this.metrics = [];
    this.isRunning = false;
  }

  async startMonitoring() {
    console.log('📊 Starting DojoPool Performance Monitoring...');
    console.log(`📡 Target: ${this.baseUrl}`);
    console.log(`⏱️  Interval: ${this.interval}ms`);
    console.log(`🕐 Duration: ${this.duration / 1000}s`);
    console.log('');

    await this.ensureOutputDir();
    this.isRunning = true;

    const endTime = Date.now() + this.duration;

    while (this.isRunning && Date.now() < endTime) {
      await this.collectMetrics();
      await this.sleep(this.interval);
    }

    await this.generateReport();
    console.log('✅ Performance monitoring completed!');
  }

  async collectMetrics() {
    const timestamp = Date.now();
    const metrics = {
      timestamp,
      datetime: moment(timestamp).format(),
      endpoints: {},
      system: {},
    };

    try {
      // Test critical endpoints
      const endpoints = [
        { name: 'dashboard', url: '/api/dashboard/stats', method: 'GET' },
        {
          name: 'tournaments',
          url: '/api/tournaments?page=1&limit=5',
          method: 'GET',
        },
        { name: 'battlepass', url: '/api/battle-pass/current', method: 'GET' },
        { name: 'analytics', url: '/api/analytics/realtime', method: 'GET' },
        {
          name: 'notifications',
          url: '/api/notifications?limit=5',
          method: 'GET',
        },
      ];

      for (const endpoint of endpoints) {
        try {
          const startTime = process.hrtime.bigint();
          const response = await fetch(`${this.baseUrl}${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DojoPool-Performance-Monitor/1.0',
            },
            timeout: 10000, // 10 second timeout
          });
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

          metrics.endpoints[endpoint.name] = {
            status: response.status,
            responseTime,
            success: response.ok,
            error: null,
          };
        } catch (error) {
          metrics.endpoints[endpoint.name] = {
            status: null,
            responseTime: null,
            success: false,
            error: error.message,
          };
        }
      }

      // Collect system metrics
      metrics.system = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
      };
    } catch (error) {
      console.error('❌ Error collecting metrics:', error.message);
    }

    this.metrics.push(metrics);

    // Real-time console output
    const successCount = Object.values(metrics.endpoints).filter(
      (endpoint) => endpoint.success
    ).length;
    const totalCount = Object.keys(metrics.endpoints).length;
    const avgResponseTime = Object.values(metrics.endpoints)
      .filter((endpoint) => endpoint.responseTime)
      .reduce(
        (sum, endpoint, _, arr) => sum + endpoint.responseTime / arr.length,
        0
      );

    console.log(
      `📊 ${moment(timestamp).format('HH:mm:ss')} | ${successCount}/${totalCount} OK | Avg: ${avgResponseTime.toFixed(2)}ms`
    );
  }

  async generateReport() {
    const reportPath = path.join(
      this.outputDir,
      `performance-monitor-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`
    );
    const summaryPath = path.join(
      this.outputDir,
      `performance-summary-${moment().format('YYYY-MM-DD-HH-mm-ss')}.txt`
    );

    // Calculate summary statistics
    const summary = this.calculateSummary();

    // Save detailed metrics
    await fs.writeJson(
      reportPath,
      {
        metadata: {
          startTime: moment(this.metrics[0]?.timestamp).format(),
          endTime: moment(
            this.metrics[this.metrics.length - 1]?.timestamp
          ).format(),
          duration: this.duration,
          interval: this.interval,
          totalSamples: this.metrics.length,
        },
        summary,
        metrics: this.metrics,
      },
      { spaces: 2 }
    );

    // Generate human-readable summary
    const summaryReport = this.generateSummaryReport(summary);
    await fs.writeFile(summaryPath, summaryReport);

    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log(`📋 Summary report saved to: ${summaryPath}`);
  }

  calculateSummary() {
    const summary = {
      overall: {
        totalSamples: this.metrics.length,
        successRate: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p95ResponseTime: 0,
      },
      endpoints: {},
    };

    const endpointStats = {};
    const allResponseTimes = [];

    // Collect all response times and endpoint stats
    this.metrics.forEach((metric) => {
      Object.entries(metric.endpoints).forEach(
        ([endpointName, endpointData]) => {
          if (!endpointStats[endpointName]) {
            endpointStats[endpointName] = {
              totalRequests: 0,
              successfulRequests: 0,
              responseTimes: [],
              errors: 0,
            };
          }

          endpointStats[endpointName].totalRequests++;

          if (endpointData.success) {
            endpointStats[endpointName].successfulRequests++;
            endpointStats[endpointName].responseTimes.push(
              endpointData.responseTime
            );
            allResponseTimes.push(endpointData.responseTime);
          } else {
            endpointStats[endpointName].errors++;
          }
        }
      );
    });

    // Calculate overall statistics
    if (allResponseTimes.length > 0) {
      allResponseTimes.sort((a, b) => a - b);
      summary.overall.avgResponseTime =
        allResponseTimes.reduce((a, b) => a + b) / allResponseTimes.length;
      summary.overall.minResponseTime = allResponseTimes[0];
      summary.overall.maxResponseTime =
        allResponseTimes[allResponseTimes.length - 1];
      summary.overall.p95ResponseTime =
        allResponseTimes[Math.floor(allResponseTimes.length * 0.95)];
    }

    // Calculate per-endpoint statistics
    Object.entries(endpointStats).forEach(([endpointName, stats]) => {
      const responseTimes = stats.responseTimes;
      responseTimes.sort((a, b) => a - b);

      summary.endpoints[endpointName] = {
        successRate: (stats.successfulRequests / stats.totalRequests) * 100,
        avgResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b) / responseTimes.length
            : 0,
        minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
        maxResponseTime:
          responseTimes.length > 0
            ? responseTimes[responseTimes.length - 1]
            : 0,
        p95ResponseTime:
          responseTimes.length > 0
            ? responseTimes[Math.floor(responseTimes.length * 0.95)]
            : 0,
        totalRequests: stats.totalRequests,
        errors: stats.errors,
      };
    });

    // Calculate overall success rate
    const totalRequests = Object.values(endpointStats).reduce(
      (sum, stats) => sum + stats.totalRequests,
      0
    );
    const totalSuccessful = Object.values(endpointStats).reduce(
      (sum, stats) => sum + stats.successfulRequests,
      0
    );
    summary.overall.successRate = (totalSuccessful / totalRequests) * 100;

    return summary;
  }

  generateSummaryReport(summary) {
    let report = '📊 DojoPool Performance Monitoring Report\n';
    report += '='.repeat(50) + '\n\n';
    report += `Monitoring Period: ${this.duration / 1000} seconds\n`;
    report += `Sample Interval: ${this.interval}ms\n`;
    report += `Total Samples: ${summary.overall.totalSamples}\n\n`;

    report += '🎯 Overall Performance:\n';
    report += `- Success Rate: ${summary.overall.successRate.toFixed(2)}%\n`;
    report += `- Average Response Time: ${summary.overall.avgResponseTime.toFixed(2)}ms\n`;
    report += `- Min Response Time: ${summary.overall.minResponseTime.toFixed(2)}ms\n`;
    report += `- Max Response Time: ${summary.overall.maxResponseTime.toFixed(2)}ms\n`;
    report += `- P95 Response Time: ${summary.overall.p95ResponseTime.toFixed(2)}ms\n\n`;

    report += '📍 Endpoint Performance:\n';
    Object.entries(summary.endpoints).forEach(([endpoint, stats]) => {
      report += `\n${endpoint.toUpperCase()}:\n`;
      report += `  Success Rate: ${stats.successRate.toFixed(2)}%\n`;
      report += `  Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms\n`;
      report += `  P95 Response Time: ${stats.p95ResponseTime.toFixed(2)}ms\n`;
      report += `  Total Requests: ${stats.totalRequests}\n`;
      if (stats.errors > 0) {
        report += `  Errors: ${stats.errors}\n`;
      }
    });

    report += '\n💡 Recommendations:\n';

    if (summary.overall.successRate < 95) {
      report +=
        '- ⚠️  Success rate is below 95%. Investigate failing endpoints.\n';
    }

    if (summary.overall.avgResponseTime > 1000) {
      report +=
        '- 🐌 Average response time > 1s. Consider performance optimizations.\n';
    } else if (summary.overall.avgResponseTime > 500) {
      report += '- ⚡ Response time is acceptable but could be improved.\n';
    } else {
      report += '- ✅ Excellent response times!\n';
    }

    if (summary.overall.p95ResponseTime > 2000) {
      report +=
        '- 📈 P95 latency is high. Check for outliers and bottlenecks.\n';
    }

    return report;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = isNaN(value) ? value : parseInt(value);
  }

  const monitor = new PerformanceMonitor(options);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping performance monitoring...');
    monitor.stop();
  });

  monitor.startMonitoring().catch(console.error);
}

module.exports = PerformanceMonitor;
