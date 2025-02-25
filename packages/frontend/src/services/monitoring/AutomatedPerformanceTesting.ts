import { GamePerformanceMonitor } from './GamePerformanceMonitor';
import { PerformanceMonitor } from './PerformanceMonitor';

interface TestScenario {
    name: string;
    duration: number; // in milliseconds
    setup?: () => void;
    teardown?: () => void;
    actions: (() => void)[];
}

interface TestResult {
    scenarioName: string;
    averageMetrics: {
        fps: number;
        frameTime: number;
        renderTime: number;
        physicsTime: number;
        networkLatency: number;
        memoryUsage: number;
    };
    performanceScore: number;
    thresholdViolations: {
        type: string;
        value: number;
        threshold: number;
        timestamp: number;
    }[];
    duration: number;
    startTime: number;
    endTime: number;
}

export class AutomatedPerformanceTesting {
    private static instance: AutomatedPerformanceTesting;
    private performanceMonitor: GamePerformanceMonitor;
    private baselineResults: Map<string, TestResult>;
    private currentTest: NodeJS.Timeout | null;
    private thresholdViolations: {
        type: string;
        value: number;
        threshold: number;
        timestamp: number;
    }[];

    private constructor() {
        this.performanceMonitor = GamePerformanceMonitor.getInstance();
        this.baselineResults = new Map();
        this.currentTest = null;
        this.thresholdViolations = [];
    }

    public static getInstance(): AutomatedPerformanceTesting {
        if (!AutomatedPerformanceTesting.instance) {
            AutomatedPerformanceTesting.instance = new AutomatedPerformanceTesting();
        }
        return AutomatedPerformanceTesting.instance;
    }

    public async runTest(scenario: TestScenario): Promise<TestResult> {
        if (this.currentTest) {
            throw new Error('A test is already running');
        }

        this.thresholdViolations = [];
        const startTime = Date.now();

        // Setup
        if (scenario.setup) {
            await scenario.setup();
        }

        // Start monitoring
        this.performanceMonitor.startMonitoring();

        // Run actions
        const actionInterval = Math.floor(scenario.duration / scenario.actions.length);
        let actionIndex = 0;

        return new Promise<TestResult>((resolve, reject) => {
            this.currentTest = setInterval(() => {
                try {
                    if (actionIndex < scenario.actions.length) {
                        scenario.actions[actionIndex]();
                        actionIndex++;
                    }

                    // Check if test duration is complete
                    if (Date.now() - startTime >= scenario.duration) {
                        this.completeTest(scenario, startTime, resolve);
                    }

                    // Track metrics
                    this.checkThresholds();
                } catch (error) {
                    this.cleanup(scenario);
                    reject(error);
                }
            }, actionInterval);
        });
    }

    private checkThresholds(): void {
        const metrics = this.performanceMonitor.getMetrics();
        const thresholds = this.performanceMonitor.getThresholds();
        const timestamp = Date.now();

        // Check FPS
        if (metrics.fps < thresholds.minFps) {
            this.thresholdViolations.push({
                type: 'fps',
                value: metrics.fps,
                threshold: thresholds.minFps,
                timestamp
            });
        }

        // Check Frame Time
        if (metrics.frameTime > thresholds.maxFrameTime) {
            this.thresholdViolations.push({
                type: 'frameTime',
                value: metrics.frameTime,
                threshold: thresholds.maxFrameTime,
                timestamp
            });
        }

        // Check Render Time
        if (metrics.renderTime > thresholds.maxRenderTime) {
            this.thresholdViolations.push({
                type: 'renderTime',
                value: metrics.renderTime,
                threshold: thresholds.maxRenderTime,
                timestamp
            });
        }

        // Check Physics Time
        if (metrics.physicsTime > thresholds.maxPhysicsTime) {
            this.thresholdViolations.push({
                type: 'physicsTime',
                value: metrics.physicsTime,
                threshold: thresholds.maxPhysicsTime,
                timestamp
            });
        }

        // Check Network Latency
        if (metrics.networkLatency > thresholds.maxNetworkLatency) {
            this.thresholdViolations.push({
                type: 'networkLatency',
                value: metrics.networkLatency,
                threshold: thresholds.maxNetworkLatency,
                timestamp
            });
        }

        // Check Memory Usage
        if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
            this.thresholdViolations.push({
                type: 'memoryUsage',
                value: metrics.memoryUsage,
                threshold: thresholds.maxMemoryUsage,
                timestamp
            });
        }
    }

    private async completeTest(
        scenario: TestScenario,
        startTime: number,
        resolve: (result: TestResult) => void
    ): Promise<void> {
        const endTime = Date.now();
        if (this.currentTest) {
            clearInterval(this.currentTest);
            this.currentTest = null;
        }

        const metrics = this.performanceMonitor.getMetrics();
        const result: TestResult = {
            scenarioName: scenario.name,
            averageMetrics: metrics,
            performanceScore: this.performanceMonitor.getPerformanceScore(),
            thresholdViolations: this.thresholdViolations,
            duration: endTime - startTime,
            startTime,
            endTime
        };

        // Store baseline if none exists
        if (!this.baselineResults.has(scenario.name)) {
            this.baselineResults.set(scenario.name, result);
        }

        // Cleanup
        await this.cleanup(scenario);

        resolve(result);
    }

    private async cleanup(scenario: TestScenario): Promise<void> {
        if (this.currentTest) {
            clearInterval(this.currentTest);
            this.currentTest = null;
        }

        this.performanceMonitor.stopMonitoring();

        if (scenario.teardown) {
            await scenario.teardown();
        }
    }

    public getBaseline(scenarioName: string): TestResult | undefined {
        return this.baselineResults.get(scenarioName);
    }

    public compareWithBaseline(current: TestResult): {
        improvements: string[];
        regressions: string[];
        unchanged: string[];
    } {
        const baseline = this.baselineResults.get(current.scenarioName);
        if (!baseline) {
            throw new Error(`No baseline exists for scenario: ${current.scenarioName}`);
        }

        const improvements: string[] = [];
        const regressions: string[] = [];
        const unchanged: string[] = [];

        // Compare FPS
        this.compareMetric(
            'FPS',
            current.averageMetrics.fps,
            baseline.averageMetrics.fps,
            true,
            improvements,
            regressions,
            unchanged
        );

        // Compare Frame Time
        this.compareMetric(
            'Frame Time',
            current.averageMetrics.frameTime,
            baseline.averageMetrics.frameTime,
            false,
            improvements,
            regressions,
            unchanged
        );

        // Compare Render Time
        this.compareMetric(
            'Render Time',
            current.averageMetrics.renderTime,
            baseline.averageMetrics.renderTime,
            false,
            improvements,
            regressions,
            unchanged
        );

        // Compare Physics Time
        this.compareMetric(
            'Physics Time',
            current.averageMetrics.physicsTime,
            baseline.averageMetrics.physicsTime,
            false,
            improvements,
            regressions,
            unchanged
        );

        // Compare Network Latency
        this.compareMetric(
            'Network Latency',
            current.averageMetrics.networkLatency,
            baseline.averageMetrics.networkLatency,
            false,
            improvements,
            regressions,
            unchanged
        );

        // Compare Memory Usage
        this.compareMetric(
            'Memory Usage',
            current.averageMetrics.memoryUsage,
            baseline.averageMetrics.memoryUsage,
            false,
            improvements,
            regressions,
            unchanged
        );

        return {
            improvements,
            regressions,
            unchanged
        };
    }

    private compareMetric(
        name: string,
        current: number,
        baseline: number,
        higherIsBetter: boolean,
        improvements: string[],
        regressions: string[],
        unchanged: string[]
    ): void {
        const threshold = 0.05; // 5% change threshold
        const percentChange = Math.abs(current - baseline) / baseline;

        if (percentChange < threshold) {
            unchanged.push(name);
            return;
        }

        const isImprovement = higherIsBetter ? current > baseline : current < baseline;
        const changePercent = Math.round(percentChange * 100);

        if (isImprovement) {
            improvements.push(`${name} improved by ${changePercent}%`);
        } else {
            regressions.push(`${name} regressed by ${changePercent}%`);
        }
    }

    public generateReport(result: TestResult): string {
        let report = `Performance Test Report: ${result.scenarioName}\n`;
        report += `Duration: ${result.duration}ms\n`;
        report += `Performance Score: ${result.performanceScore}\n\n`;

        report += 'Average Metrics:\n';
        report += `- FPS: ${result.averageMetrics.fps.toFixed(2)}\n`;
        report += `- Frame Time: ${result.averageMetrics.frameTime.toFixed(2)}ms\n`;
        report += `- Render Time: ${result.averageMetrics.renderTime.toFixed(2)}ms\n`;
        report += `- Physics Time: ${result.averageMetrics.physicsTime.toFixed(2)}ms\n`;
        report += `- Network Latency: ${result.averageMetrics.networkLatency.toFixed(2)}ms\n`;
        report += `- Memory Usage: ${(result.averageMetrics.memoryUsage / (1024 * 1024)).toFixed(2)}MB\n\n`;

        if (result.thresholdViolations.length > 0) {
            report += 'Threshold Violations:\n';
            result.thresholdViolations.forEach(violation => {
                report += `- ${violation.type}: ${violation.value.toFixed(2)} (threshold: ${violation.threshold.toFixed(2)})\n`;
            });
        } else {
            report += 'No threshold violations detected.\n';
        }

        const baseline = this.baselineResults.get(result.scenarioName);
        if (baseline) {
            const comparison = this.compareWithBaseline(result);
            report += '\nComparison with Baseline:\n';
            
            if (comparison.improvements.length > 0) {
                report += '\nImprovements:\n';
                comparison.improvements.forEach(improvement => {
                    report += `- ${improvement}\n`;
                });
            }

            if (comparison.regressions.length > 0) {
                report += '\nRegressions:\n';
                comparison.regressions.forEach(regression => {
                    report += `- ${regression}\n`;
                });
            }

            if (comparison.unchanged.length > 0) {
                report += '\nUnchanged Metrics:\n';
                comparison.unchanged.forEach(metric => {
                    report += `- ${metric}\n`;
                });
            }
        }

        return report;
    }
} 