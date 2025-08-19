import { analytics, AnalyticsEventType } from './analytics';

// Performance thresholds
export const performanceThresholds = {
  // Page load thresholds
  pageLoad: {
    ttfb: 200, // Time to First Byte (ms)
    fcp: 1000, // First Contentful Paint (ms)
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100, // First Input Delay (ms)
    cls: 0.1, // Cumulative Layout Shift
    tbt: 300, // Total Blocking Time (ms)
  },

  // API response thresholds
  api: {
    p50: 100, // 50th percentile (ms)
    p90: 300, // 90th percentile (ms)
    p95: 500, // 95th percentile (ms)
    p99: 1000, // 99th percentile (ms)
    errorRate: 0.01, // 1% error rate
  },

  // Game performance thresholds
  game: {
    frameRate: 60, // Minimum frame rate
    inputLatency: 16, // Maximum input latency (ms)
    renderTime: 16, // Maximum render time per frame (ms)
    networkLatency: 100, // Maximum network latency (ms)
  },

  // Resource utilization thresholds
  resources: {
    cpuUsage: 0.8, // 80% CPU usage
    memoryUsage: 0.8, // 80% memory usage
    diskUsage: 0.8, // 80% disk usage
    networkBandwidth: 0.8, // 80% network bandwidth
  },
};

// Performance monitoring configuration
export const performanceConfig = {
  // Sampling configuration
  sampling: {
    pageLoad: 1.0, // 100% of page loads
    api: 1.0, // 100% of API calls
    game: 0.1, // 10% of game events
    resources: 0.01, // 1% of resource metrics
  },

  // Monitoring intervals
  intervals: {
    metrics: 10000, // Collect metrics every 10 seconds
    alerts: 60000, // Check alerts every minute
    cleanup: 3600000, // Cleanup every hour
  },

  // Alert configuration
  alerts: {
    enabled: true,
    channels: ['email', 'slack', 'pagerduty'],
    cooldown: 300000, // 5 minutes between similar alerts
  },
};

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring() {
    if (typeof window !== 'undefined') {
      this.setupWebVitals();
      this.setupResourceMonitoring();
      this.setupErrorMonitoring();
    }
    this.setupAPIMonitoring();
    this.setupGameMonitoring();
  }

  private setupWebVitals() {
    if ('performance' in window) {
      // Track Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.trackPerformanceMetric(entry);
        });
      });

      observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      });
    }
  }

  private setupResourceMonitoring() {
    if ('performance' in window) {
      // Track resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (Math.random() < performanceConfig.sampling.resources && entry.entryType === 'resource') {
            this.trackResourceMetric(entry as PerformanceResourceTiming);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  private setupErrorMonitoring() {
    window.addEventListener('error', (event) => {
      this.trackError(event);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event);
    });
  }

  private setupAPIMonitoring() {
    // Wrap fetch/XMLHttpRequest to track API performance
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        try {
          const response = await originalFetch(...args);
          this.trackAPIMetric(
            startTime,
            performance.now(),
            response.status,
            typeof args[0] === 'string' ? args[0] : args[0].toString()
          );
          return response;
        } catch (error) {
          this.trackAPIMetric(startTime, performance.now(), 0, typeof args[0] === 'string' ? args[0] : args[0].toString(), error);
          throw error;
        }
      };
    }
  }

  private setupGameMonitoring() {
    // Track game performance metrics
    let lastFrameTime = performance.now();
    const gameLoop = () => {
      const currentTime = performance.now();
      const frameDelta = currentTime - lastFrameTime;

      if (Math.random() < performanceConfig.sampling.game) {
        this.trackGameMetric('frameTime', frameDelta);
      }

      lastFrameTime = currentTime;
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }

  private trackPerformanceMetric(entry: PerformanceEntry) {
    analytics.trackEvent({
      type: AnalyticsEventType.PAGE_LOAD,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        value: entry.startTime,
        duration: entry.duration || undefined,
      },
      metadata: {
        metricName: entry.entryType,
        url: window.location.href,
      },
    });
  }

  private trackResourceMetric(entry: PerformanceResourceTiming) {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        duration: entry.duration,
        value: entry.duration,
      },
      metadata: {
        resourceType: entry.initiatorType,
        resourceUrl: entry.name,
        size: entry.transferSize,
      },
    });
  }

  private trackAPIMetric(
    startTime: number,
    endTime: number,
    status: number,
    url: string,
    error?: any
  ) {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        duration: endTime - startTime,
        value: endTime - startTime,
        errorCount: error || status >= 400 ? 1 : 0,
      },
      metadata: {
        url: url,
        status,
        error: error?.message,
      },
    });
  }

  private trackGameMetric(metric: string, value: number) {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        value,
      },
      metadata: {
        metricName: metric,
        gameId: (window as any).gameId, // Assuming game ID is stored in window
      },
    });
  }

  private trackError(event: ErrorEvent | PromiseRejectionEvent) {
    analytics.trackEvent({
      type: AnalyticsEventType.ERROR_OCCURRED,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        errorCount: 1,
      },
      metadata: {
        error: event instanceof ErrorEvent ? event.error?.stack : event.reason,
        type: event instanceof ErrorEvent ? 'error' : 'unhandledrejection',
        url: window.location.href,
      },
    });
  }

  public trackCustomMetric(
    name: string,
    value: number,
    metadata: Record<string, any> = {}
  ) {
    analytics.trackEvent({
      type: AnalyticsEventType.API_LATENCY,
      dimensions: {
        timestamp: new Date(),
      },
      metrics: {
        value,
      },
      metadata: {
        metricName: name,
        ...metadata,
      },
    });
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
