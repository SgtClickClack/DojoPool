class PerformanceMetrics {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      bandwidth: {
        current: 0,
        average: 0,
        samples: [],
      },
      memory: {
        usage: 0,
        limit: 0,
        history: [],
      },
    };
    this.observers = new Map();
    this.initObservers();
  }

  initObservers() {
    // Performance observer for load times
    if ("PerformanceObserver" in window) {
      const loadObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.trackLoadTime(entry);
        });
      });
      loadObserver.observe({ entryTypes: ["resource", "navigation"] });
      this.observers.set("load", loadObserver);

      // Performance observer for memory
      if (performance.memory) {
        this.startMemoryTracking();
      }
    }

    // Network bandwidth tracking
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        this.updateBandwidth();
      });
      this.updateBandwidth();
    }
  }

  trackLoadTime(entry) {
    const duration = entry.duration;
    const name = entry.name;
    const type = entry.entryType;
    const size = entry.transferSize || 0;

    this.metrics.loadTimes.set(name, {
      duration,
      type,
      size,
      timestamp: Date.now(),
    });

    // Calculate bandwidth from resource timing
    if (size > 0 && duration > 0) {
      const bandwidthMbps = (size * 8) / (duration * 1000); // Convert to Mbps
      this.updateBandwidthSample(bandwidthMbps);
    }

    this.notifyMetricsUpdate("loadTime", { name, duration, type, size });
  }

  updateBandwidth() {
    if (navigator.connection) {
      const downlink = navigator.connection.downlink;
      if (downlink) {
        this.metrics.bandwidth.current = downlink;
        this.updateBandwidthSample(downlink);
      }
    }
  }

  updateBandwidthSample(value) {
    this.metrics.bandwidth.samples.push(value);
    if (this.metrics.bandwidth.samples.length > 50) {
      this.metrics.bandwidth.samples.shift();
    }
    this.metrics.bandwidth.average =
      this.metrics.bandwidth.samples.reduce((a, b) => a + b, 0) /
      this.metrics.bandwidth.samples.length;

    this.notifyMetricsUpdate("bandwidth", this.metrics.bandwidth);
  }

  startMemoryTracking() {
    const trackMemory = () => {
      if (performance.memory) {
        const memory = performance.memory;
        this.metrics.memory = {
          usage: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          history: [
            ...(this.metrics.memory.history || []),
            {
              usage: memory.usedJSHeapSize,
              timestamp: Date.now(),
            },
          ],
        };

        // Keep last 100 samples
        if (this.metrics.memory.history.length > 100) {
          this.metrics.memory.history.shift();
        }

        this.notifyMetricsUpdate("memory", this.metrics.memory);
      }
    };

    // Track memory every 5 seconds
    setInterval(trackMemory, 5000);
    trackMemory(); // Initial tracking
  }

  getLoadTimeStats() {
    const stats = {
      average: 0,
      min: Infinity,
      max: 0,
      count: 0,
    };

    this.metrics.loadTimes.forEach((data) => {
      stats.average += data.duration;
      stats.min = Math.min(stats.min, data.duration);
      stats.max = Math.max(stats.max, data.duration);
      stats.count++;
    });

    if (stats.count > 0) {
      stats.average /= stats.count;
    }

    return stats;
  }

  getBandwidthStats() {
    return {
      current: this.metrics.bandwidth.current,
      average: this.metrics.bandwidth.average,
      samples: [...this.metrics.bandwidth.samples],
    };
  }

  getMemoryStats() {
    return {
      current: this.metrics.memory.usage,
      limit: this.metrics.memory.limit,
      history: [...this.metrics.memory.history],
    };
  }

  notifyMetricsUpdate(type, data) {
    window.dispatchEvent(
      new CustomEvent("metricsUpdate", {
        detail: {
          type,
          data,
          timestamp: Date.now(),
        },
      }),
    );
  }

  clearMetrics() {
    this.metrics.loadTimes.clear();
    this.metrics.bandwidth.samples = [];
    this.metrics.memory.history = [];
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Initialize and export instance
const performanceMetrics = new PerformanceMetrics();
export default performanceMetrics;
