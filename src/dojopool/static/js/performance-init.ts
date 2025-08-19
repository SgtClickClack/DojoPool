import { NetworkProfiler } from './managers/network-profiler';
import { type PerformanceBudget } from './managers/performance-budget';
import {
  type MonitorOptions,
  PerformanceMonitor,
} from './managers/performance-monitor';
import {
  PerformanceReporter,
  type ReportingOptions,
} from './managers/performance-reporter';

export interface PerformanceConfig {
  monitor?: MonitorOptions;
  reporting?: ReportingOptions;
  containers: {
    graphs?: HTMLElement;
    resources?: HTMLElement;
    network?: HTMLElement;
  };
  webgl?: WebGLRenderingContext | WebGL2RenderingContext;
  workers?: Worker[];
  budget?: PerformanceBudget;
  network?: {
    enabled: boolean;
    includeInReports?: boolean;
  };
}

export interface PerformanceSystem {
  monitor: PerformanceMonitor;
  reporter: PerformanceReporter;
  networkProfiler?: NetworkProfiler;
  start: () => void;
  stop: () => void;
  cleanup: () => void;
}

const defaultBudget: PerformanceBudget = {
  maxFrameTime: 16.67, // 60 FPS
  minFps: 55,
  maxGpuTime: 12, // ~70% of frame time
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  maxWorkerUtilization: 0.8, // 80%
  maxDrawCalls: 1000,
};

export function initializePerformanceMonitoring(
  config: PerformanceConfig
): PerformanceSystem {
  // Validate configuration
  if (
    !config.containers.graphs &&
    !config.containers.resources &&
    !config.containers.network
  ) {
    throw new Error('At least one visualization container must be provided');
  }

  // Create monitor options
  const monitorOptions: MonitorOptions = {
    budget: config.budget || defaultBudget,
    sampleInterval: config.monitor?.sampleInterval || 1000,
    autoStart: false, // We'll start manually after setup
    ...config.monitor,
    visualizer: config.containers.graphs
      ? {
          container: config.containers.graphs,
          width: config.containers.graphs.clientWidth,
          height: config.containers.graphs.clientHeight,
          refreshRate: config.monitor?.sampleInterval || 1000,
        }
      : undefined,
    resourceVisualizer: config.containers.resources
      ? {
          container: config.containers.resources,
          size: Math.min(
            config.containers.resources.clientWidth / 3,
            config.containers.resources.clientHeight
          ),
          refreshRate: config.monitor?.sampleInterval || 1000,
        }
      : undefined,
  };

  // Initialize monitor
  const monitor = PerformanceMonitor.getInstance(monitorOptions);

  // Initialize WebGL profiling if provided
  if (config.webgl) {
    monitor.initializeWebGL(config.webgl);
  }

  // Register workers if provided
  if (config.workers) {
    config.workers.forEach((worker) => monitor.registerWorker(worker));
  }

  // Initialize reporter
  const reporter = PerformanceReporter.getInstance(config.reporting);

  // Initialize network profiler if enabled
  let networkProfiler: NetworkProfiler | undefined;
  if (config.network?.enabled) {
    networkProfiler = NetworkProfiler.getInstance();

    // If network metrics should be included in reports
    if (config.network.includeInReports) {
      const originalGenerateReport = (monitor as any).generateReport;
      (monitor as any).generateReport = function () {
        const report = originalGenerateReport.call(this);
        if (networkProfiler) {
          (report as any).networkMetrics = networkProfiler.getMetrics();
        }
        reporter.addReport(report);
        return report;
      };
    }
  }

  // Connect monitor to reporter
  const originalGenerateReport = (monitor as any).generateReport;
  (monitor as any).generateReport = function () {
    const report = originalGenerateReport.call(this);
    reporter.addReport(report);
    return report;
  };

  return {
    monitor,
    reporter,
    networkProfiler,
    start: () => {
      monitor.start();
    },
    stop: () => {
      monitor.stop();
    },
    cleanup: () => {
      monitor.cleanup();
      reporter.cleanup();
      networkProfiler?.cleanup();
    },
  };
}

// Example usage:
/*
const performanceSystem = initializePerformanceMonitoring({
    containers: {
        graphs: document.getElementById('performance-graphs')!,
        resources: document.getElementById('resource-charts')!,
        network: document.getElementById('network-metrics')!
    },
    webgl: gl, // Your WebGL context
    workers: [worker1, worker2], // Your web workers
    budget: {
        maxFrameTime: 16.67,
        minFps: 55,
        maxGpuTime: 12,
        maxMemoryUsage: 512 * 1024 * 1024,
        maxWorkerUtilization: 0.8,
        maxDrawCalls: 1000
    },
    monitor: {
        sampleInterval: 1000
    },
    reporting: {
        autoExport: true,
        exportInterval: 3600000, // 1 hour
        format: {
            type: 'html',
            includeVisualizations: true
        }
    },
    network: {
        enabled: true,
        includeInReports: true
    }
});

// Start monitoring
performanceSystem.start();

// Access network metrics
const networkMetrics = performanceSystem.networkProfiler?.getMetrics();
console.log('Network stats:', networkMetrics?.stats);
console.log('Endpoint metrics:', networkMetrics?.byEndpoint);

// Stop monitoring
performanceSystem.stop();

// Clean up when done
performanceSystem.cleanup();
*/
