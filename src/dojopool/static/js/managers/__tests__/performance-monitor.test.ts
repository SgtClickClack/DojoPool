import { PerformanceMonitor } from '../performance-monitor';
import { WebGLProfiler } from '../webgl-profiler';
import { WorkerProfiler } from '../worker-profiler';
import { PerformanceBudgetManager } from '../performance-budget';
import { PerformanceVisualizer } from '../performance-visualizer';
import { ResourceVisualizer } from '../resource-visualizer';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;
    let mockWebGLContext: WebGLRenderingContext;
    let mockWorker: Worker;

    beforeEach(() => {
        // Create mock WebGL context
        mockWebGLContext = {
            getExtension: jest.fn().mockReturnValue({
                beginQuery: jest.fn(),
                endQuery: jest.fn(),
                getQueryObject: jest.fn().mockReturnValue(0)
            })
        } as any;

        // Create mock worker
        mockWorker = {
            postMessage: jest.fn(),
            terminate: jest.fn()
        } as any;

        // Initialize monitor with default options
        monitor = PerformanceMonitor.getInstance({
            autoStart: false,
            sampleInterval: 100
        });
    });

    afterEach(() => {
        monitor.cleanup();
    });

    describe('Initialization', () => {
        it('should initialize with default options', () => {
            expect(monitor).toBeDefined();
            expect(monitor['sampleInterval']).toBe(100);
        });

        it('should initialize WebGL profiler', () => {
            monitor.initializeWebGL(mockWebGLContext);
            expect(monitor['webglProfiler']).toBeDefined();
        });

        it('should register worker', () => {
            monitor.registerWorker(mockWorker);
            expect(monitor['workerProfiler']).toBeDefined();
        });
    });

    describe('Monitoring', () => {
        beforeEach(() => {
            monitor.initializeWebGL(mockWebGLContext);
            monitor.registerWorker(mockWorker);
        });

        it('should start and stop monitoring', () => {
            monitor.start();
            expect(monitor['isMonitoring']).toBe(true);
            expect(monitor['monitoringInterval']).toBeDefined();

            monitor.stop();
            expect(monitor['isMonitoring']).toBe(false);
            expect(monitor['monitoringInterval']).toBeUndefined();
        });

        it('should generate performance reports', () => {
            monitor.start();
            jest.advanceTimersByTime(1000);

            const reports = monitor.getReports();
            expect(reports.length).toBeGreaterThan(0);
            expect(reports[0]).toHaveProperty('timestamp');
            expect(reports[0]).toHaveProperty('fps');
            expect(reports[0]).toHaveProperty('frameTime');
            expect(reports[0]).toHaveProperty('gpuMetrics');
            expect(reports[0]).toHaveProperty('workerMetrics');
            expect(reports[0]).toHaveProperty('memoryUsage');
            expect(reports[0]).toHaveProperty('budgetStatus');
        });

        it('should limit report history size', () => {
            monitor.start();
            jest.advanceTimersByTime(1000 * 1000); // Advance time to generate many reports

            const reports = monitor.getReports();
            expect(reports.length).toBeLessThanOrEqual(monitor['maxReports']);
        });
    });

    describe('Visualization', () => {
        it('should initialize performance visualizer', () => {
            const monitorWithVisualizer = PerformanceMonitor.getInstance({
                visualizer: {
                    container: document.createElement('div'),
                    width: 800,
                    height: 400
                }
            });

            expect(monitorWithVisualizer['visualizer']).toBeDefined();
            monitorWithVisualizer.cleanup();
        });

        it('should initialize resource visualizer', () => {
            const monitorWithResourceVisualizer = PerformanceMonitor.getInstance({
                resourceVisualizer: {
                    container: document.createElement('div'),
                    width: 800,
                    height: 400
                }
            });

            expect(monitorWithResourceVisualizer['resourceVisualizer']).toBeDefined();
            monitorWithResourceVisualizer.cleanup();
        });
    });

    describe('Budget Violations', () => {
        it('should notify listeners of budget violations', () => {
            const listener = jest.fn();
            monitor.onBudgetViolation(listener);

            // Trigger a violation by setting a very strict budget
            const strictBudget = {
                maxFrameTime: 1,
                minFps: 1000,
                maxGpuTime: 1,
                maxMemoryUsage: 1,
                maxWorkerUtilization: 0.1,
                maxDrawCalls: 1
            };

            monitor['budgetManager'].setBudget(strictBudget);
            monitor.start();
            jest.advanceTimersByTime(1000);

            expect(listener).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should clean up all resources', () => {
            monitor.initializeWebGL(mockWebGLContext);
            monitor.registerWorker(mockWorker);
            monitor.start();

            const cleanupSpy = jest.spyOn(monitor, 'cleanup');
            monitor.cleanup();

            expect(cleanupSpy).toHaveBeenCalled();
            expect(monitor['isMonitoring']).toBe(false);
            expect(monitor['monitoringInterval']).toBeUndefined();
            expect(monitor['reports']).toHaveLength(0);
        });
    });

    describe('Error Recovery', () => {
        it('should recover from WebGL context loss', () => {
            monitor.initializeWebGL(mockWebGLContext);
            monitor.start();

            // Simulate context loss
            mockWebGLContext.getExtension = jest.fn().mockReturnValue(null);
            jest.advanceTimersByTime(1000);

            const reports = monitor.getReports();
            expect(reports[0].gpuMetrics.contextLost).toBe(true);
        });

        it('should handle worker errors gracefully', () => {
            monitor.registerWorker(mockWorker);
            monitor.start();

            // Simulate worker error
            mockWorker.onerror = jest.fn();
            mockWorker.onerror(new ErrorEvent('error', { error: new Error('Worker error') }));
            jest.advanceTimersByTime(1000);

            const reports = monitor.getReports();
            expect(reports[0].workerMetrics.totalErrors).toBeGreaterThan(0);
        });
    });

    describe('Resource Cleanup', () => {
        it('should clean up all resources', () => {
            monitor.initializeWebGL(mockWebGLContext);
            monitor.registerWorker(mockWorker);
            monitor.start();

            monitor.cleanup();

            expect(monitor['isMonitoring']).toBe(false);
            expect(monitor['monitoringInterval']).toBeUndefined();
            expect(monitor['reports']).toHaveLength(0);
            expect(mockWorker.terminate).toHaveBeenCalled();
        });

        it('should handle cleanup when monitoring is not started', () => {
            expect(() => monitor.cleanup()).not.toThrow();
        });
    });

    describe('Performance Monitoring', () => {
        it('should track frame time accurately', () => {
            monitor.initializeWebGL(mockWebGLContext);
            monitor.start();

            // Simulate frame timing
            const startTime = performance.now();
            jest.advanceTimersByTime(16); // ~60fps
            const endTime = performance.now();

            const reports = monitor.getReports();
            expect(reports[0].frameTime).toBeCloseTo(endTime - startTime, -1);
        });

        it('should track memory usage', () => {
            monitor.start();
            jest.advanceTimersByTime(1000);

            const reports = monitor.getReports();
            expect(reports[0].memoryUsage).toBeDefined();
            expect(reports[0].memoryUsage.jsHeapSize).toBeDefined();
            expect(reports[0].memoryUsage.totalJSHeapSize).toBeDefined();
            expect(reports[0].memoryUsage.usedJSHeapSize).toBeDefined();
        });
    });

    describe('Integration Tests', () => {
        it('should work with PerformanceBudgetManager', () => {
            const budget = {
                maxFrameTime: 33,
                minFps: 30,
                maxGpuTime: 16,
                maxMemoryUsage: 0.8,
                maxWorkerUtilization: 0.9,
                maxDrawCalls: 100
            };

            monitor = PerformanceMonitor.getInstance({
                budget,
                autoStart: false
            });

            monitor.initializeWebGL(mockWebGLContext);
            monitor.start();
            jest.advanceTimersByTime(1000);

            const reports = monitor.getReports();
            expect(reports[0].budgetStatus).toBeDefined();
            expect(reports[0].budgetStatus.isWithinBudget).toBeDefined();
        });

        it('should work with PerformanceVisualizer', () => {
            const container = document.createElement('div');
            monitor = PerformanceMonitor.getInstance({
                visualizer: {
                    container,
                    width: 800,
                    height: 400
                },
                autoStart: false
            });

            monitor.initializeWebGL(mockWebGLContext);
            monitor.start();
            jest.advanceTimersByTime(1000);

            expect(container.children.length).toBeGreaterThan(0);
        });
    });
}); 