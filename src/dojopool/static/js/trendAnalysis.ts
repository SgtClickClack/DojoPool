// Type definitions
interface DataPoint {
  timestamp: number;
  value: number;
}

interface Baseline {
  mean: number;
  stdDev: number;
  timestamp: number;
}

interface TrendData {
  data: DataPoint[];
  maxSamples: number;
  baseline: Baseline | null;
  anomalies: DataPoint[];
}

interface Trends {
  [key: string]: TrendData;
}

interface MetricsUpdateEvent extends CustomEvent {
  detail: {
    type: string;
    data: {
      duration?: number;
      current?: number;
      usage?: number;
      limit?: number;
    };
  };
}

interface TrendAnalysisResult {
  mean: number;
  stdDev: number;
  trend: "stable" | "increasing" | "decreasing";
  anomalies: DataPoint[];
  baseline?: Baseline | null;
  timeRange?: {
    start: number;
    end: number;
  };
}

import alertSystem from "./alertSystem.js";

export class TrendAnalysis {
  private trends: Trends;
  private analysisInterval: number;

  constructor() {
    this.trends = {
      loadTime: {
        data: [],
        maxSamples: 1000,
        baseline: null,
        anomalies: [],
      },
      bandwidth: {
        data: [],
        maxSamples: 1000,
        baseline: null,
        anomalies: [],
      },
      memory: {
        data: [],
        maxSamples: 1000,
        baseline: null,
        anomalies: [],
      },
    };
    this.analysisInterval = 60000; // 1 minute
    this.init();
  }

  private init(): void {
    this.bindEvents();
    this.startAnalysis();
  }

  private bindEvents(): void {
    window.addEventListener("metricsUpdate", ((event: MetricsUpdateEvent) => {
      const { type, data } = event.detail;
      this.addDataPoint(type, data);
    }) as EventListener);
  }

  private addDataPoint(
    type: string,
    data: MetricsUpdateEvent["detail"]["data"],
  ): void {
    if (!this.trends[type]) return;

    const timestamp = Date.now();
    let value: number;

    switch (type) {
      case "loadTime":
        value = data.duration || 0;
        break;
      case "bandwidth":
        value = data.current || 0;
        break;
      case "memory":
        value = data.usage && data.limit ? (data.usage / data.limit) * 100 : 0;
        break;
      default:
        return;
    }

    this.trends[type].data.push({ timestamp, value });

    if (this.trends[type].data.length > this.trends[type].maxSamples) {
      this.trends[type].data.shift();
    }

    if (!this.trends[type].baseline || this.shouldUpdateBaseline(type)) {
      this.updateBaseline(type);
    }
  }

  private startAnalysis(): void {
    setInterval(() => {
      Object.keys(this.trends).forEach((type) => {
        this.analyzeMetric(type);
      });
    }, this.analysisInterval);
  }

  private analyzeMetric(type: string): void {
    const trend = this.trends[type];
    if (trend.data.length < 10) return;

    const recentData = this.getRecentData(type, 5 * 60 * 1000);
    const analysis: TrendAnalysisResult = {
      mean: this.calculateMean(recentData),
      stdDev: this.calculateStdDev(recentData),
      trend: this.calculateTrendDirection(recentData),
      anomalies: this.detectAnomalies(type, recentData),
    };

    this.updateAnomalies(type, analysis.anomalies);
    this.notifySignificantChanges(type, analysis);

    window.dispatchEvent(
      new CustomEvent("trendUpdate", {
        detail: {
          type,
          analysis: {
            ...analysis,
            baseline: trend.baseline,
            timeRange: {
              start: recentData[0]?.timestamp,
              end: recentData[recentData.length - 1]?.timestamp,
            },
          },
        },
      }),
    );
  }

  private getRecentData(type: string, timeRange: number): DataPoint[] {
    const now = Date.now();
    return this.trends[type].data.filter(
      (point) => now - point.timestamp <= timeRange,
    );
  }

  private calculateMean(data: DataPoint[]): number {
    if (!data.length) return 0;
    return data.reduce((sum, point) => sum + point.value, 0) / data.length;
  }

  private calculateStdDev(data: DataPoint[]): number {
    if (data.length < 2) return 0;
    const mean = this.calculateMean(data);
    const variance =
      data.reduce((sum, point) => sum + Math.pow(point.value - mean, 2), 0) /
      (data.length - 1);
    return Math.sqrt(variance);
  }

  private calculateTrendDirection(
    data: DataPoint[],
  ): "stable" | "increasing" | "decreasing" {
    if (data.length < 2) return "stable";

    const values = data.map((point) => point.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstMean = this.calculateMean(
      firstHalf.map((v) => ({ timestamp: 0, value: v })),
    );
    const secondMean = this.calculateMean(
      secondHalf.map((v) => ({ timestamp: 0, value: v })),
    );

    const changePct = ((secondMean - firstMean) / firstMean) * 100;

    if (Math.abs(changePct) < 5) return "stable";
    return changePct > 0 ? "increasing" : "decreasing";
  }

  private detectAnomalies(type: string, data: DataPoint[]): DataPoint[] {
    const trend = this.trends[type];
    if (!trend.baseline) return [];

    const mean = trend.baseline.mean;
    const stdDev = trend.baseline.stdDev;
    const threshold = 2;

    return data.filter(
      (point) => Math.abs(point.value - mean) > threshold * stdDev,
    );
  }

  private shouldUpdateBaseline(type: string): boolean {
    const lastUpdate = this.trends[type].baseline?.timestamp || 0;
    return Date.now() - lastUpdate > 24 * 60 * 60 * 1000;
  }

  private updateBaseline(type: string): void {
    const data = this.trends[type].data;
    if (data.length < 100) return;

    this.trends[type].baseline = {
      mean: this.calculateMean(data),
      stdDev: this.calculateStdDev(data),
      timestamp: Date.now(),
    };
  }

  private updateAnomalies(type: string, newAnomalies: DataPoint[]): void {
    this.trends[type].anomalies = newAnomalies;
  }

  private notifySignificantChanges(
    type: string,
    analysis: TrendAnalysisResult,
  ): void {
    const trend = this.trends[type];
    const baseline = trend.baseline;
    if (!baseline) return;

    if (Math.abs(analysis.mean - baseline.mean) > 2 * baseline.stdDev) {
      const direction = analysis.mean > baseline.mean ? "increase" : "decrease";
      const changePct = Math.abs(
        ((analysis.mean - baseline.mean) / baseline.mean) * 100,
      );

      alertSystem.addAlert({
        severity: "warning",
        category: "Trend Analysis",
        message: `Significant ${direction} in ${type}: ${changePct.toFixed(1)}% change from baseline`,
      });
    }

    if (analysis.trend === "increasing" && this.isMetricBad(type, "increase")) {
      alertSystem.addAlert({
        severity: "warning",
        category: "Trend Analysis",
        message: `${type} showing consistent upward trend over last 5 minutes`,
      });
    }
  }

  private isMetricBad(
    type: string,
    direction: "increase" | "decrease",
  ): boolean {
    switch (type) {
      case "loadTime":
        return direction === "increase";
      case "bandwidth":
        return direction === "decrease";
      case "memory":
        return direction === "increase";
      default:
        return false;
    }
  }

  public getTrendData(
    type: string,
    timeRange: number = 3600000,
  ): {
    data: DataPoint[];
    baseline: Baseline | null;
    anomalies: DataPoint[];
  } {
    return {
      data: this.getRecentData(type, timeRange),
      baseline: this.trends[type].baseline,
      anomalies: this.trends[type].anomalies,
    };
  }

  public getAnomalyCount(type: string): number {
    return this.trends[type].anomalies.length;
  }

  public getMetricHealth(type: string): {
    status: "healthy" | "warning" | "critical";
    anomalyCount: number;
    trend: "stable" | "increasing" | "decreasing";
  } {
    const trend = this.trends[type];
    const recentData = this.getRecentData(type, 5 * 60 * 1000);
    const anomalyCount = trend.anomalies.length;
    const trendDirection = this.calculateTrendDirection(recentData);

    let status: "healthy" | "warning" | "critical" = "healthy";
    if (anomalyCount > 5) {
      status = "critical";
    } else if (
      anomalyCount > 2 ||
      (trendDirection === "increasing" && this.isMetricBad(type, "increase"))
    ) {
      status = "warning";
    }

    return {
      status,
      anomalyCount,
      trend: trendDirection,
    };
  }
}

// Initialize and export instance
const trendAnalysis: any = new TrendAnalysis();
export default trendAnalysis;
