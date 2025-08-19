import { EventEmitter } from 'events';

interface ShotData {
  timestamp: number;
  position: { x: number; y: number };
  confidence: number;
  verified: boolean;
  processingTime: number;
}

interface HeatmapData {
  x: number;
  y: number;
  weight: number;
}

interface AnalyticsSummary {
  totalShots: number;
  verifiedShots: number;
  accuracy: number;
  averageConfidence: number;
  averageProcessingTime: number;
  hotspots: HeatmapData[];
  patterns: {
    timeOfDay: { [hour: string]: number };
    consecutiveShots: number[];
    intervalDistribution: { [interval: string]: number };
  };
}

class ShotAnalytics extends EventEmitter {
  private shots: ShotData[] = [];
  private heatmapResolution = 20; // Grid size for heatmap
  private maxHistorySize = 1000; // Maximum number of shots to keep in memory
  private analysisInterval = 60000; // Analyze every minute
  private readonly recentShotsCount = 20;

  constructor() {
    super();
    this.startPeriodicAnalysis();
  }

  public addShot(shot: ShotData): void {
    this.shots.push(shot);
    this.pruneOldData();
    this.emit('shotAdded', shot);
  }

  private pruneOldData(): void {
    if (this.shots.length > this.maxHistorySize) {
      this.shots = this.shots.slice(-this.maxHistorySize);
    }
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      const analysis = this.analyzeShots();
      this.emit('analysisUpdate', analysis);
    }, this.analysisInterval);
  }

  public analyzeShots(): AnalyticsSummary {
    const verifiedShots = this.shots.filter((shot) => shot.verified);
    const recentShots = this.shots.slice(-100); // Analysis on recent shots

    return {
      totalShots: this.shots.length,
      verifiedShots: verifiedShots.length,
      accuracy: verifiedShots.length / this.shots.length || 0,
      averageConfidence: this.calculateAverageConfidence(),
      averageProcessingTime: this.calculateAverageProcessingTime(),
      hotspots: this.generateHeatmap(),
      patterns: {
        timeOfDay: this.analyzeTimeDistribution(),
        consecutiveShots: this.analyzeConsecutiveShots(),
        intervalDistribution: this.analyzeIntervalDistribution(),
      },
    };
  }

  private calculateAverageConfidence(): number {
    if (this.shots.length === 0) return 0;
    return (
      this.shots.reduce((sum, shot) => sum + shot.confidence, 0) /
      this.shots.length
    );
  }

  private calculateAverageProcessingTime(): number {
    if (this.shots.length === 0) return 0;
    return (
      this.shots.reduce((sum, shot) => sum + shot.processingTime, 0) /
      this.shots.length
    );
  }

  private generateHeatmap(): HeatmapData[] {
    const heatmap: Map<string, number> = new Map();
    const gridSize = 100 / this.heatmapResolution;

    this.shots.forEach((shot) => {
      const gridX = Math.floor(shot.position.x / gridSize);
      const gridY = Math.floor(shot.position.y / gridSize);
      const key = `${gridX},${gridY}`;
      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    });

    return Array.from(heatmap.entries()).map(([key, weight]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, weight };
    });
  }

  private analyzeTimeDistribution(): { [hour: string]: number } {
    const distribution: { [hour: string]: number } = {};
    this.shots.forEach((shot) => {
      const hour = new Date(shot.timestamp).getHours();
      distribution[hour] = (distribution[hour] || 0) + 1;
    });
    return distribution;
  }

  private analyzeConsecutiveShots(): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < this.shots.length; i++) {
      intervals.push(this.shots[i].timestamp - this.shots[i - 1].timestamp);
    }
    return intervals;
  }

  private analyzeIntervalDistribution(): { [interval: string]: number } {
    const intervals = this.analyzeConsecutiveShots();
    const distribution: { [interval: string]: number } = {
      rapid: 0, // < 1 second
      normal: 0, // 1-3 seconds
      slow: 0, // > 3 seconds
    };

    intervals.forEach((interval) => {
      if (interval < 1000) distribution['rapid']++;
      else if (interval < 3000) distribution['normal']++;
      else distribution['slow']++;
    });

    return distribution;
  }

  public getRecentTrends(): string[] {
    const trends: string[] = [];
    const analysis = this.analyzeShots();

    // Accuracy trends
    if (analysis.accuracy < 0.8) {
      trends.push('Accuracy below target (80%)');
    }

    // Processing time trends
    if (analysis.averageProcessingTime > 100) {
      trends.push('High processing time (>100ms)');
    }

    // Shot pattern trends
    const intervals = this.analyzeIntervalDistribution();
    if (intervals['rapid'] > intervals['normal'] + intervals['slow']) {
      trends.push('High frequency of rapid shots detected');
    }

    return trends;
  }

  public getShotPredictions(): { x: number; y: number; probability: number }[] {
    // Implement predictive analytics for likely shot locations
    const heatmap = this.generateHeatmap();
    const totalWeight = heatmap.reduce((sum, point) => sum + point.weight, 0);

    return heatmap
      .map((point) => ({
        x: point.x,
        y: point.y,
        probability: point.weight / totalWeight,
      }))
      .filter((prediction) => prediction.probability > 0.1)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }

  public getRecentShots(): ShotData[] {
    return this.shots.slice(-this.recentShotsCount);
  }
}

// Export singleton instance
const shotAnalytics = new ShotAnalytics();
export default shotAnalytics;
