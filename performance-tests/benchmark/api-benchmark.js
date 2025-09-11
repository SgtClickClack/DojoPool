#!/usr/bin/env node

const autocannon = require('autocannon');
const fs = require('fs-extra');
const path = require('path');
const Table = require('easy-table');
const moment = require('moment');

class APIBenchmark {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.outputDir = path.join(__dirname, '..', 'reports');
  }

  async runAllBenchmarks() {
    console.log('🚀 Starting DojoPool API Performance Benchmarks\n');

    await this.ensureOutputDir();

    // Benchmark different API endpoints
    await this.benchmarkDashboard();
    await this.benchmarkTournaments();
    await this.benchmarkAuthentication();
    await this.benchmarkAnalytics();
    await this.benchmarkBattlePass();
    await this.benchmarkInventory();

    // Generate comprehensive report
    await this.generateReport();

    console.log('\n✅ All benchmarks completed!');
  }

  async benchmarkDashboard() {
    console.log('📊 Benchmarking Dashboard APIs...');

    const endpoints = [
      { url: '/api/dashboard/stats', method: 'GET', name: 'Dashboard Stats' },
      {
        url: '/api/activity/global?limit=20',
        method: 'GET',
        name: 'Global Activity',
      },
      {
        url: '/api/notifications?limit=10',
        method: 'GET',
        name: 'Notifications',
      },
    ];

    for (const endpoint of endpoints) {
      const result = await this.runBenchmark(endpoint.url, {
        method: endpoint.method,
        title: endpoint.name,
        connections: 10,
        duration: 10,
      });
      this.results.push(result);
    }
  }

  async benchmarkTournaments() {
    console.log('🏆 Benchmarking Tournament APIs...');

    const endpoints = [
      {
        url: '/api/tournaments?page=1&limit=12',
        method: 'GET',
        name: 'Tournament List',
      },
      {
        url: '/api/tournaments?status=UPCOMING',
        method: 'GET',
        name: 'Upcoming Tournaments',
      },
      {
        url: '/api/tournaments/register',
        method: 'POST',
        name: 'Tournament Registration',
        body: JSON.stringify({
          tournamentId: 'test-tournament',
          userId: 'test-user',
        }),
      },
    ];

    for (const endpoint of endpoints) {
      const result = await this.runBenchmark(endpoint.url, {
        method: endpoint.method,
        title: endpoint.name,
        connections: 15,
        duration: 15,
        body: endpoint.body,
        headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
      });
      this.results.push(result);
    }
  }

  async benchmarkAuthentication() {
    console.log('🔐 Benchmarking Authentication APIs...');

    const result = await this.runBenchmark('/api/auth/login', {
      method: 'POST',
      title: 'User Authentication',
      connections: 20,
      duration: 20,
      body: JSON.stringify({
        email: 'benchmark-test@example.com',
        password: 'testpassword123',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    this.results.push(result);
  }

  async benchmarkAnalytics() {
    console.log('📈 Benchmarking Analytics APIs...');

    const endpoints = [
      {
        url: '/api/analytics/track',
        method: 'POST',
        name: 'Analytics Tracking',
        body: JSON.stringify({ event: 'benchmark_test', userId: 'test-user' }),
      },
      {
        url: '/api/analytics/realtime',
        method: 'GET',
        name: 'Real-time Analytics',
      },
    ];

    for (const endpoint of endpoints) {
      const result = await this.runBenchmark(endpoint.url, {
        method: endpoint.method,
        title: endpoint.name,
        connections: 25,
        duration: 15,
        body: endpoint.body,
        headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
      });
      this.results.push(result);
    }
  }

  async benchmarkBattlePass() {
    console.log('🎯 Benchmarking Battle Pass APIs...');

    const endpoints = [
      {
        url: '/api/battle-pass/current',
        method: 'GET',
        name: 'Battle Pass Status',
      },
      {
        url: '/api/battle-pass/progress',
        method: 'GET',
        name: 'Battle Pass Progress',
      },
    ];

    for (const endpoint of endpoints) {
      const result = await this.runBenchmark(endpoint.url, {
        method: endpoint.method,
        title: endpoint.name,
        connections: 12,
        duration: 12,
      });
      this.results.push(result);
    }
  }

  async benchmarkInventory() {
    console.log('🎒 Benchmarking Inventory APIs...');

    const result = await this.runBenchmark('/api/inventory/items', {
      method: 'GET',
      title: 'Inventory Items',
      connections: 18,
      duration: 18,
    });

    this.results.push(result);
  }

  async runBenchmark(url, options) {
    const config = {
      url: `http://localhost:3000${url}`,
      connections: options.connections || 10,
      duration: options.duration || 10,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body,
      title: options.title,
    };

    console.log(`  Running ${options.title}...`);

    try {
      const result = await autocannon(config);

      return {
        title: options.title,
        url,
        method: options.method,
        connections: options.connections,
        duration: options.duration,
        requests: result.requests.total,
        throughput: result.requests.average,
        latency: {
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodes: result.statusCodeStats,
        timestamp: moment().format(),
      };
    } catch (error) {
      console.error(`❌ Benchmark failed for ${options.title}:`, error.message);
      return {
        title: options.title,
        url,
        error: error.message,
        timestamp: moment().format(),
      };
    }
  }

  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  async generateReport() {
    const reportPath = path.join(
      this.outputDir,
      `benchmark-report-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`
    );
    const summaryPath = path.join(
      this.outputDir,
      `benchmark-summary-${moment().format('YYYY-MM-DD-HH-mm-ss')}.txt`
    );

    // Save detailed results
    await fs.writeJson(
      reportPath,
      {
        metadata: {
          startTime: moment(this.startTime).format(),
          endTime: moment().format(),
          duration: Date.now() - this.startTime,
          totalEndpoints: this.results.length,
        },
        results: this.results,
      },
      { spaces: 2 }
    );

    // Generate summary report
    let summary = '🚀 DojoPool API Performance Benchmark Report\n';
    summary += '='.repeat(50) + '\n\n';
    summary += `Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`;
    summary += `Total Duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)} seconds\n`;
    summary += `Endpoints Tested: ${this.results.length}\n\n`;

    const table = new Table();

    this.results.forEach((result) => {
      if (result.error) {
        table.cell('Endpoint', result.title);
        table.cell('Status', '❌ FAILED');
        table.cell('Error', result.error);
        table.newRow();
      } else {
        table.cell('Endpoint', result.title);
        table.cell('Requests/sec', result.throughput.toFixed(2));
        table.cell('Avg Latency', `${result.latency.average.toFixed(2)}ms`);
        table.cell('P95 Latency', `${result.latency.p95.toFixed(2)}ms`);
        table.cell('P99 Latency', `${result.latency.p99.toFixed(2)}ms`);
        table.cell('Errors', result.errors || 0);
        table.newRow();
      }
    });

    summary += table.toString();
    summary += '\n\n📊 Performance Recommendations:\n';

    // Add performance insights
    const avgLatencies = this.results
      .filter((r) => !r.error)
      .map((r) => r.latency.average);

    if (avgLatencies.length > 0) {
      const avgLatency =
        avgLatencies.reduce((a, b) => a + b) / avgLatencies.length;

      if (avgLatency > 1000) {
        summary +=
          '⚠️  Average latency is high (>1s). Consider optimizing database queries.\n';
      } else if (avgLatency > 500) {
        summary +=
          '⚡ Average latency is moderate (500ms-1s). Good performance with room for improvement.\n';
      } else {
        summary += '✅ Excellent performance! Average latency under 500ms.\n';
      }
    }

    await fs.writeFile(summaryPath, summary);

    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log(`📋 Summary report saved to: ${summaryPath}`);
    console.log('\n' + summary);
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new APIBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

module.exports = APIBenchmark;
