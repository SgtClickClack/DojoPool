import analyticsService from "./analytics";

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize?: number;
  decodedBodySize?: number;
}

interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

class PerformanceService {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, PerformanceEntry[]> = new Map();
  private isMonitoring = false;
  private longTaskThreshold = 50; // milliseconds

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === "undefined") return;

    // Performance Observer for long tasks
    if ("PerformanceObserver" in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.handleLongTask(entry);
          });
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.handleResourceTiming(entry);
          });
        });

        resourceObserver.observe({ entryTypes: ["resource"] });

        // Navigation timing observer
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.handleNavigationTiming(entry);
          });
        });

        navigationObserver.observe({ entryTypes: ["navigation"] });

        this.isMonitoring = true;
      } catch (error) {
        console.error("Failed to initialize performance observers:", error);
      }
    }
  }

  public startMeasure(name: string): void {
    this.marks.set(name, performance.now());
  }

  public endMeasure(name: string, category?: string): void {
    const startTime = this.marks.get(name);
    if (!startTime) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    const entry: PerformanceEntry = {
      name,
      startTime,
      duration,
      entryType: "measure",
    };

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(entry);

    // Report if duration exceeds threshold
    if (duration > this.longTaskThreshold) {
      this.reportLongTask(name, duration, category);
    }

    this.marks.delete(name);
  }

  private handleLongTask(entry: PerformanceEntry): void {
    analyticsService.trackPerformance({
      loadTime: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: entry.duration,
    });
  }

  private handleResourceTiming(entry: any): void {
    const timing: ResourceTiming = {
      name: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      decodedBodySize: entry.decodedBodySize,
    };

    // Report slow resource loads
    if (timing.duration > 1000) {
      // 1 second threshold
      this.reportSlowResource(timing);
    }
  }

  private handleNavigationTiming(entry: any): void {
    analyticsService.trackPerformance({
      loadTime: entry.loadEventEnd - entry.navigationStart,
      timeToInteractive: entry.domInteractive - entry.navigationStart,
      firstContentfulPaint: entry.firstContentfulPaint,
      largestContentfulPaint: entry.largestContentfulPaint,
      firstInputDelay: 0,
    });
  }

  private reportLongTask(
    name: string,
    duration: number,
    category?: string,
  ): void {
    analyticsService.trackUserEvent({
      type: "performance_issue",
      userId: "system",
      details: {
        type: "long_task",
        name,
        duration,
        category,
      },
    });
  }

  private reportSlowResource(timing: ResourceTiming): void {
    analyticsService.trackUserEvent({
      type: "performance_issue",
      userId: "system",
      details: {
        type: "slow_resource",
        ...timing,
      },
    });
  }

  public getMemoryStats(): MemoryStats | null {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
    return null;
  }

  public getMeasures(name?: string): PerformanceEntry[] {
    if (name) {
      return this.measures.get(name) || [];
    }
    return Array.from(this.measures.values()).flat();
  }

  public clearMeasures(name?: string): void {
    if (name) {
      this.measures.delete(name);
    } else {
      this.measures.clear();
    }
  }

  public isSupported(): boolean {
    return this.isMonitoring;
  }

  public getResourceTimings(): ResourceTiming[] {
    if (typeof performance === "undefined") return [];

    return performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      initiatorType: (entry as PerformanceResourceTiming).initiatorType,
      duration: entry.duration,
      transferSize: (entry as PerformanceResourceTiming).transferSize,
      decodedBodySize: (entry as PerformanceResourceTiming).decodedBodySize,
    }));
  }

  public setLongTaskThreshold(threshold: number): void {
    this.longTaskThreshold = threshold;
  }
}

// Create a singleton instance
const performanceService = new PerformanceService();

export default performanceService;
