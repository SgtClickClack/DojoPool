import { scalabilityScenarios, scalabilityThresholds, resourceMonitoring, testDataConfig } from './config';
import { performanceMonitor } from '../../config/performance';
import { analytics, AnalyticsEventType } from '../../config/analytics';
import * as k6 from 'k6';
import { check } from 'k6';

// Test result interface
interface TestResult {
  scenario: string;
  metrics: {
    http: {
      requestCount: number;
      errorCount: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
    websocket: {
      connectionCount: number;
      messageCount: number;
      latency: number;
    };
    game: {
      eventCount: number;
      averageFrameTime: number;
      shotAnalysisTime: number;
    };
    resources: {
      cpu: {
        average: number;
        peak: number;
      };
      memory: {
        average: number;
        peak: number;
      };
      network: {
        bandwidth: number;
        connections: number;
      };
    };
  };
  thresholds: {
    passed: boolean;
    failures: string[];
  };
  duration: number;
  timestamp: Date;
}

// Scalability test runner class
export class ScalabilityTestRunner {
  private results: TestResult[] = [];
  private currentTest: string | null = null;
  private startTime: number = 0;

  constructor() {
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Set up resource monitoring intervals
    setInterval(() => this.collectSystemMetrics(), resourceMonitoring.intervals.system);
    setInterval(() => this.collectApplicationMetrics(), resourceMonitoring.intervals.application);
    setInterval(() => this.collectDatabaseMetrics(), resourceMonitoring.intervals.database);
  }

  public async runAllTests() {
    console.log('Starting scalability test suite...');

    // Run each test scenario
    await this.runLoadTest();
    await this.runStressTest();
    await this.runSpikeTest();
    await this.runEnduranceTest();

    // Generate final report
    this.generateReport();
  }

  private async runLoadTest() {
    this.currentTest = 'loadTest';
    this.startTime = Date.now();

    console.log('Running load test...');
    const scenario = scalabilityScenarios.loadTest;

    try {
      // Configure k6 options
      k6.options = {
        scenarios: {
          load_test: {
            executor: 'ramping-vus',
            stages: scenario.rampUp,
            gracefulRampDown: '30s',
          },
        },
        thresholds: scenario.thresholds,
      };

      // Run the test
      const result = await this.executeTest();
      this.results.push(result);

      console.log('Load test completed successfully');
    } catch (error) {
      console.error('Load test failed:', error);
      this.trackTestFailure('loadTest', error);
    }
  }

  private async runStressTest() {
    this.currentTest = 'stressTest';
    this.startTime = Date.now();

    console.log('Running stress test...');
    const scenario = scalabilityScenarios.stressTest;

    try {
      k6.options = {
        scenarios: {
          stress_test: {
            executor: 'ramping-vus',
            stages: scenario.rampUp,
            gracefulRampDown: '30s',
          },
        },
        thresholds: scenario.thresholds,
      };

      const result = await this.executeTest();
      this.results.push(result);

      console.log('Stress test completed successfully');
    } catch (error) {
      console.error('Stress test failed:', error);
      this.trackTestFailure('stressTest', error);
    }
  }

  private async runSpikeTest() {
    this.currentTest = 'spikeTest';
    this.startTime = Date.now();

    console.log('Running spike test...');
    const scenario = scalabilityScenarios.spikeTest;

    try {
      k6.options = {
        scenarios: {
          spike_test: {
            executor: 'ramping-vus',
            stages: scenario.rampUp,
            gracefulRampDown: '30s',
          },
        },
        thresholds: scenario.thresholds,
      };

      const result = await this.executeTest();
      this.results.push(result);

      console.log('Spike test completed successfully');
    } catch (error) {
      console.error('Spike test failed:', error);
      this.trackTestFailure('spikeTest', error);
    }
  }

  private async runEnduranceTest() {
    this.currentTest = 'enduranceTest';
    this.startTime = Date.now();

    console.log('Running endurance test...');
    const scenario = scalabilityScenarios.enduranceTest;

    try {
      k6.options = {
        scenarios: {
          endurance_test: {
            executor: 'ramping-vus',
            stages: scenario.rampUp,
            gracefulRampDown: '30s',
          },
        },
        thresholds: scenario.thresholds,
      };

      const result = await this.executeTest();
      this.results.push(result);

      console.log('Endurance test completed successfully');
    } catch (error) {
      console.error('Endurance test failed:', error);
      this.trackTestFailure('enduranceTest', error);
    }
  }

  private async executeTest(): Promise<TestResult> {
    const metrics = {
      http: {
        requestCount: 0,
        errorCount: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      },
      websocket: {
        connectionCount: 0,
        messageCount: 0,
        latency: 0,
      },
      game: {
        eventCount: 0,
        averageFrameTime: 0,
        shotAnalysisTime: 0,
      },
      resources: {
        cpu: {
          average: 0,
          peak: 0,
        },
        memory: {
          average: 0,
          peak: 0,
        },
        network: {
          bandwidth: 0,
          connections: 0,
        },
      },
    };

    // Track test execution
    this.trackTestExecution();

    // Collect metrics during test
    const testMetrics = k6.metrics;
    
    // Update metrics from k6 results
    metrics.http.requestCount = testMetrics.http_reqs.count;
    metrics.http.errorCount = testMetrics.http_req_failed.count;
    metrics.http.p50 = testMetrics.http_req_duration.percentile(50);
    metrics.http.p90 = testMetrics.http_req_duration.percentile(90);
    metrics.http.p95 = testMetrics.http_req_duration.percentile(95);
    metrics.http.p99 = testMetrics.http_req_duration.percentile(99);

    // Check thresholds
    const thresholdResults = {
      passed: true,
      failures: [] as string[],
    };

    // Verify each threshold
    Object.entries(k6.options.thresholds || {}).forEach(([metric, thresholds]) => {
      thresholds.forEach((threshold: string) => {
        if (!check(null, { [metric]: threshold })) {
          thresholdResults.passed = false;
          thresholdResults.failures.push(`${metric}: ${threshold}`);
        }
      });
    });

    return {
      scenario: this.currentTest!,
      metrics,
      thresholds: thresholdResults,
      duration: Date.now() - this.startTime,
      timestamp: new Date(),
    };
  }

  private collectSystemMetrics() {
    // Collect system-level metrics
    const metrics = {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      // Add more system metrics as needed
    };

    this.trackResourceMetrics('system', metrics);
  }

  private collectApplicationMetrics() {
    // Collect application-level metrics
    performanceMonitor.trackCustomMetric('app_metrics', 1, {
      activeUsers: testDataConfig.users.concurrentSessions,
      activeGames: testDataConfig.games.count,
      activeTournaments: testDataConfig.tournaments.count,
    });
  }

  private collectDatabaseMetrics() {
    // Collect database metrics
    // This would be implemented based on your database monitoring setup
  }

  private trackTestExecution() {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        value: 1,
      },
      metadata: {
        testType: this.currentTest,
        stage: 'execution',
      },
    });
  }

  private trackTestFailure(scenario: string, error: any) {
    analytics.trackEvent({
      type: AnalyticsEventType.ERROR_OCCURRED,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        errorCount: 1,
      },
      metadata: {
        testType: scenario,
        error: error.message,
        stack: error.stack,
      },
    });
  }

  private trackResourceMetrics(type: string, metrics: any) {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        value: 1,
      },
      metadata: {
        metricType: type,
        ...metrics,
      },
    });
  }

  private generateReport() {
    console.log('\nScalability Test Report');
    console.log('=======================\n');

    this.results.forEach((result) => {
      console.log(`Test Scenario: ${result.scenario}`);
      console.log(`Duration: ${result.duration}ms`);
      console.log('Metrics:');
      console.log('- HTTP:');
      console.log(`  Requests: ${result.metrics.http.requestCount}`);
      console.log(`  Errors: ${result.metrics.http.errorCount}`);
      console.log(`  P95: ${result.metrics.http.p95}ms`);
      console.log(`  P99: ${result.metrics.http.p99}ms`);
      console.log('- Resources:');
      console.log(`  CPU Peak: ${result.metrics.resources.cpu.peak * 100}%`);
      console.log(`  Memory Peak: ${result.metrics.resources.memory.peak * 100}%`);
      console.log('Thresholds:');
      console.log(`  Passed: ${result.thresholds.passed}`);
      if (result.thresholds.failures.length > 0) {
        console.log('  Failures:');
        result.thresholds.failures.forEach((failure) => {
          console.log(`  - ${failure}`);
        });
      }
      console.log('-------------------\n');
    });
  }
}

// Export test runner instance
export const testRunner = new ScalabilityTestRunner(); 