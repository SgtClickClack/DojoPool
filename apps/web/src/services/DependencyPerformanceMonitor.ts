export interface DependencyMetrics {
  name: string;
  version: string;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  timestamp: Date;
}

export interface PerformanceIssue {
  dependency: string;
  issue: string;
  severity: 'warning' | 'error';
}

class DependencyPerformanceMonitor {
  private static instance: DependencyPerformanceMonitor;
  private metrics: Map<string, DependencyMetrics[]> = new Map();
  private issues: PerformanceIssue[] = [];
  private isMonitoring: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): DependencyPerformanceMonitor {
    if (!DependencyPerformanceMonitor.instance) {
      DependencyPerformanceMonitor.instance =
        new DependencyPerformanceMonitor();
    }
    return DependencyPerformanceMonitor.instance;
  }

  private initializeMockData() {
    // Mock dependency metrics
    const mockDependencies = [
      'react',
      'next.js',
      'material-ui',
      'cypress',
      'typescript',
      'prisma',
      'nest.js',
    ];

    mockDependencies.forEach((dep) => {
      const depMetrics: DependencyMetrics[] = [];
      const now = new Date();

      // Generate 24 hours of mock data
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        depMetrics.push({
          name: dep,
          version: this.getMockVersion(dep),
          loadTime: Math.random() * 100 + 50, // 50-150ms
          memoryUsage: Math.random() * 20 + 10, // 10-30MB
          cpuUsage: Math.random() * 15 + 5, // 5-20%
          errorCount: Math.floor(Math.random() * 3), // 0-2 errors
          timestamp,
        });
      }

      this.metrics.set(dep, depMetrics);
    });

    // Mock performance issues
    this.issues = [
      {
        dependency: 'react',
        issue: 'High memory usage detected',
        severity: 'warning',
      },
      {
        dependency: 'cypress',
        issue: 'Test execution time increased by 20%',
        severity: 'warning',
      },
    ];
  }

  private getMockVersion(dependency: string): string {
    const versions: Record<string, string> = {
      react: '18.2.0',
      'next.js': '14.2.28',
      'material-ui': '5.15.0',
      cypress: '13.6.0',
      typescript: '5.3.0',
      prisma: '5.7.0',
      'nest.js': '10.2.0',
    };
    return versions[dependency] || '1.0.0';
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
  }

  private collectMetrics(): void {
    // Simulate collecting real-time metrics
    this.metrics.forEach((depMetrics, depName) => {
      const latestMetric = depMetrics[depMetrics.length - 1];
      const newMetric: DependencyMetrics = {
        ...latestMetric,
        loadTime: latestMetric.loadTime + (Math.random() - 0.5) * 20,
        memoryUsage: latestMetric.memoryUsage + (Math.random() - 0.5) * 2,
        cpuUsage: latestMetric.cpuUsage + (Math.random() - 0.5) * 3,
        errorCount: Math.floor(Math.random() * 3),
        timestamp: new Date(),
      };

      // Keep only last 24 hours of data
      depMetrics.push(newMetric);
      if (depMetrics.length > 24) {
        depMetrics.shift();
      }
    });

    // Update issues based on current metrics
    this.updateIssues();
  }

  private updateIssues(): void {
    this.issues = [];

    this.metrics.forEach((depMetrics, depName) => {
      const latestMetric = depMetrics[depMetrics.length - 1];

      if (latestMetric.memoryUsage > 25) {
        this.issues.push({
          dependency: depName,
          issue: 'High memory usage detected',
          severity: 'warning',
        });
      }

      if (latestMetric.loadTime > 120) {
        this.issues.push({
          dependency: depName,
          issue: 'Slow load time detected',
          severity: 'warning',
        });
      }

      if (latestMetric.errorCount > 1) {
        this.issues.push({
          dependency: depName,
          issue: 'Multiple errors detected',
          severity: 'error',
        });
      }
    });
  }

  public getMetrics(): Map<string, DependencyMetrics[]> {
    return this.metrics;
  }

  public getPerformanceIssues(): PerformanceIssue[] {
    return this.issues;
  }

  public getDependencyMetrics(dependencyName: string): DependencyMetrics[] {
    return this.metrics.get(dependencyName) || [];
  }

  public getLatestMetrics(dependencyName: string): DependencyMetrics | null {
    const depMetrics = this.metrics.get(dependencyName);
    return depMetrics && depMetrics.length > 0
      ? depMetrics[depMetrics.length - 1]
      : null;
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export { DependencyPerformanceMonitor };
