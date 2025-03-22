interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timestamp: number;
}

interface MemoryThresholds {
  warning: number;  // percentage of heap limit
  critical: number; // percentage of heap limit
}

type MemoryCallback = (stats: MemoryStats) => void;

export class MemoryProfilerService {
  private static instance: MemoryProfilerService;
  private readonly DEFAULT_INTERVAL = 30000; // 30 seconds
  private readonly DEFAULT_THRESHOLDS: MemoryThresholds = {
    warning: 70,  // 70% of heap limit
    critical: 85  // 85% of heap limit
  };

  private intervalId: number | null = null;
  private listeners: Set<MemoryCallback> = new Set();
  private memoryHistory: MemoryStats[] = [];
  private readonly MAX_HISTORY_LENGTH = 100;

  private constructor() {}

  public static getInstance(): MemoryProfilerService {
    if (!MemoryProfilerService.instance) {
      MemoryProfilerService.instance = new MemoryProfilerService();
    }
    return MemoryProfilerService.instance;
  }

  public startProfiling(interval: number = this.DEFAULT_INTERVAL): void {
    if (this.intervalId !== null) {
      this.stopProfiling();
    }

    this.intervalId = window.setInterval(() => {
      this.captureMemoryStats();
    }, interval);

    // Capture initial stats
    this.captureMemoryStats();
  }

  public stopProfiling(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public addListener(callback: MemoryCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  public getLatestStats(): MemoryStats | null {
    return this.memoryHistory[this.memoryHistory.length - 1] || null;
  }

  public clearHistory(): void {
    this.memoryHistory = [];
  }

  public checkMemoryUsage(): { warning: boolean; critical: boolean } {
    const stats = this.getLatestStats();
    if (!stats) {
      return { warning: false, critical: false };
    }

    const usagePercentage = (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100;
    return {
      warning: usagePercentage >= this.DEFAULT_THRESHOLDS.warning,
      critical: usagePercentage >= this.DEFAULT_THRESHOLDS.critical
    };
  }

  public suggestGarbageCollection(): void {
    const { critical } = this.checkMemoryUsage();
    if (critical && window.gc) {
      try {
        window.gc();
        console.log('Manual garbage collection triggered');
      } catch (error) {
        console.warn('Failed to trigger manual garbage collection:', error);
      }
    }
  }

  private captureMemoryStats(): void {
    if (!window.performance || !window.performance.memory) {
      console.warn('Memory API not available');
      return;
    }

    const memory = window.performance.memory;
    const stats: MemoryStats = {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timestamp: Date.now()
    };

    this.memoryHistory.push(stats);
    if (this.memoryHistory.length > this.MAX_HISTORY_LENGTH) {
      this.memoryHistory.shift();
    }

    this.notifyListeners(stats);
    this.checkAndWarnMemoryUsage(stats);
  }

  private checkAndWarnMemoryUsage(stats: MemoryStats): void {
    const usagePercentage = (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100;
    
    if (usagePercentage >= this.DEFAULT_THRESHOLDS.critical) {
      console.warn('Critical memory usage detected:', usagePercentage.toFixed(2) + '%');
      this.suggestGarbageCollection();
    } else if (usagePercentage >= this.DEFAULT_THRESHOLDS.warning) {
      console.warn('High memory usage detected:', usagePercentage.toFixed(2) + '%');
    }
  }

  private notifyListeners(stats: MemoryStats): void {
    this.listeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in memory stats listener:', error);
      }
    });
  }
}

// Add type declaration for window.performance.memory
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }

  interface Window {
    gc?: () => void;
  }
} 