import { MONITORING_CONFIG } from "../../constants";
import { DataCompressor } from "./dataCompressor";

interface MetricValue {
  value: number;
  timestamp: number;
}

interface MetricWindow {
  values: MetricValue[];
  sum: number;
  count: number;
}

interface ErrorContext {
  component?: string;
  timestamp: number;
  details?: Record<string, any>;
}

interface ErrorStats {
  total: number;
  byComponent: Map<string, number>;
  recentErrors: Array<{ error: Error; context: ErrorContext }>;
  errorRates: Record<string, number>;
}

interface GameMetrics {
  activePlayers: number;
  activeGames: number;
  totalGamesCompleted: number;
  completionRate: number;
  averageCompletionTime: number;
  averageScore: number;
  playerRetention: number;
  playerProgress: Record<string, number>;
  completedClues: number;
  clueDiscoveryRate: number;
  safetyIncidents: {
    total: number;
    byType: Map<string, number>;
    recentIncidents: Array<{
      type: string;
      details: string;
      timestamp: number;
    }>;
  };
  [key: string]: any; // Allow additional string-indexed properties
}

interface ArchiveMetadata {
  timestamp: number;
  dataType: string;
}

interface Archive {
  key: string;
  metadata: ArchiveMetadata;
}

interface Alert {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
  timestamp: number;
  acknowledged: boolean;
  details: Record<string, any>;
}

export class GameMetricsMonitor {
  private static instance: GameMetricsMonitor;
  private dataCompressor: DataCompressor;
  private playerGames: Map<string, string> = new Map();
  private gameToPlayers: Map<string, Set<string>> = new Map();
  private playerProgress: Map<string, number> = new Map();
  private lastClueTime: number = 0;
  private completedClues: number = 0;
  private alerts: Alert[] = [];
  private alertSubscribers: ((alert: Alert) => void)[] = [];
  private safetyIncidents = {
    total: 0,
    byType: new Map<string, number>(),
    recentIncidents: [] as Array<{
      type: string;
      details: string;
      timestamp: number;
    }>,
  };
  private metrics: GameMetrics = {
    activePlayers: 0,
    activeGames: 0,
    totalGamesCompleted: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    averageScore: 0,
    playerRetention: 0,
    playerProgress: {},
    completedClues: 0,
    clueDiscoveryRate: 0,
    safetyIncidents: this.safetyIncidents,
  };

  private constructor() {
    this.dataCompressor = DataCompressor.getInstance();
  }

  public static getInstance(): GameMetricsMonitor {
    if (!GameMetricsMonitor.instance) {
      GameMetricsMonitor.instance = new GameMetricsMonitor();
    }
    return GameMetricsMonitor.instance;
  }

  public recordPlayerJoin(playerId: string, gameId: string): void {
    this.playerGames.set(playerId, gameId);
    if (!this.gameToPlayers.has(gameId)) {
      this.gameToPlayers.set(gameId, new Set());
      this.metrics.activeGames++;
    }
    this.gameToPlayers.get(gameId)?.add(playerId);
    this.metrics.activePlayers++;
  }

  public recordPlayerLeave(playerId: string): void {
    const gameId = this.playerGames.get(playerId);
    if (gameId) {
      this.gameToPlayers.get(gameId)?.delete(playerId);
      if (this.gameToPlayers.get(gameId)?.size === 0) {
        this.gameToPlayers.delete(gameId);
        this.metrics.activeGames--;
      }
      this.playerGames.delete(playerId);
      this.metrics.activePlayers--;
      this.metrics.playerRetention = this.calculatePlayerRetention();
    }
  }

  public recordClueCompletion(playerId: string, progress: number): void {
    this.playerProgress.set(playerId, progress);
    this.metrics.completedClues++;
    const now = Date.now();
    if (this.lastClueTime === 0) {
      this.lastClueTime = now;
      this.metrics.clueDiscoveryRate = 1; // First clue, set rate to 1 per second
    } else {
      const timeDiff = Math.max(now - this.lastClueTime, 1); // Ensure at least 1ms difference
      this.metrics.clueDiscoveryRate =
        (this.metrics.completedClues * 1000) / timeDiff; // clues per second
      this.lastClueTime = now;
    }
    this.updatePlayerProgress();
  }

  public recordGameCompletion(
    playerId: string,
    score: number,
    time: number,
  ): void {
    this.metrics.totalGamesCompleted++;
    this.metrics.completionRate =
      this.metrics.totalGamesCompleted / (this.metrics.activeGames || 1);
    this.metrics.averageCompletionTime =
      (this.metrics.averageCompletionTime *
        (this.metrics.totalGamesCompleted - 1) +
        time) /
      this.metrics.totalGamesCompleted;
    this.metrics.averageScore =
      (this.metrics.averageScore * (this.metrics.totalGamesCompleted - 1) +
        score) /
      this.metrics.totalGamesCompleted;
  }

  public recordSafetyIncident(type: string, details: string): void {
    const incident = {
      type,
      details,
      timestamp: Date.now(),
    };
    this.safetyIncidents.total++;
    this.safetyIncidents.byType.set(
      type,
      (this.safetyIncidents.byType.get(type) || 0) + 1,
    );
    this.safetyIncidents.recentIncidents.unshift(incident);
    if (this.safetyIncidents.recentIncidents.length > 50) {
      this.safetyIncidents.recentIncidents.pop();
    }
  }

  public addAlert(
    severity: "info" | "warning" | "error",
    message: string,
  ): Alert {
    const alert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      severity,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      details: {},
    };
    this.alerts.push(alert);
    this.notifySubscribers(alert);
    return alert;
  }

  public acknowledgeAlert(alertId: string, note?: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      if (note) {
        alert.details = { acknowledgeNote: note };
      }
    }
  }

  public getAlerts(filter?: {
    severity?: "info" | "warning" | "error";
    acknowledged?: boolean;
    limit?: number;
  }): Alert[] {
    let filtered = this.alerts;
    if (filter?.severity) {
      filtered = filtered.filter((a) => a.severity === filter.severity);
    }
    if (filter?.acknowledged !== undefined) {
      filtered = filtered.filter((a) => a.acknowledged === filter.acknowledged);
    }
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    return filtered;
  }

  public subscribeToAlerts(callback: (alert: Alert) => void): () => void {
    this.alertSubscribers.push(callback);
    return () => {
      this.alertSubscribers = this.alertSubscribers.filter(
        (cb) => cb !== callback,
      );
    };
  }

  public addMetricData(key: string, data: any): void {
    this.metrics[key] = data;
  }

  public async archiveData(metrics: GameMetrics): Promise<void> {
    const archiveKey = `metrics-${Date.now()}`;
    const archiveData = {
      data: metrics,
      metadata: {
        timestamp: Date.now(),
        dataType: "game-metrics",
      },
    };
    await this.dataCompressor.archiveData(archiveKey, archiveData);
  }

  public async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<GameMetrics[]> {
    const archives = await this.dataCompressor.listArchives();
    const relevantArchives = archives.filter((archive) => {
      const timestamp = archive.metadata.timestamp;
      return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
    });

    const historicalMetrics: GameMetrics[] = [];
    for (const archive of relevantArchives) {
      const result = await this.dataCompressor.retrieveArchive(archive.key);
      if (result && result.data) {
        historicalMetrics.push(result.data as unknown as GameMetrics);
      }
    }

    return historicalMetrics;
  }

  public async getMetricsSnapshot(): Promise<{
    current: GameMetrics;
    historical: { weeklyTrend: GameMetrics[] };
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTrend = await this.getHistoricalMetrics(weekAgo, now);

    return {
      current: this.getMetrics(),
      historical: { weeklyTrend },
    };
  }

  public getArchiveStats(): {
    totalSize: number;
    oldestDate: Date;
    compressionRatio: number;
  } {
    return this.dataCompressor.getArchiveStats();
  }

  private calculatePlayerRetention(): number {
    // Simple retention calculation based on active players vs total games completed
    return this.metrics.activePlayers / (this.metrics.totalGamesCompleted || 1);
  }

  private updatePlayerProgress(): void {
    this.metrics.playerProgress = Object.fromEntries(this.playerProgress);
  }

  private notifySubscribers(alert: Alert): void {
    this.alertSubscribers.forEach((callback) => callback(alert));
  }

  public reset(): void {
    this.playerGames.clear();
    this.gameToPlayers.clear();
    this.playerProgress.clear();
    this.lastClueTime = 0;
    this.completedClues = 0;
    this.alerts = [];
    this.alertSubscribers = [];
    this.metrics = {
      activePlayers: 0,
      activeGames: 0,
      totalGamesCompleted: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      averageScore: 0,
      playerRetention: 0,
      playerProgress: {},
      completedClues: 0,
      clueDiscoveryRate: 0,
      safetyIncidents: this.safetyIncidents,
    };
  }

  public getMetrics(): GameMetrics {
    return { ...this.metrics };
  }

  public recordScore(score: number): void {
    this.metrics.averageScore =
      (this.metrics.averageScore * this.metrics.totalGamesCompleted + score) /
      (this.metrics.totalGamesCompleted + 1);
  }
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, { error: Error; context: ErrorContext }[]> =
    new Map();
  private errorStats: ErrorStats = {
    total: 0,
    byComponent: new Map(),
    recentErrors: [],
    errorRates: {},
  };

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, context: ErrorContext): void {
    const { component = "unknown" } = context;

    if (!this.errors.has(component)) {
      this.errors.set(component, []);
    }

    const componentErrors = this.errors.get(component)!;
    componentErrors.push({ error, context });

    // Update stats
    this.errorStats.total++;
    this.errorStats.byComponent.set(
      component,
      (this.errorStats.byComponent.get(component) || 0) + 1,
    );

    // Add to recent errors
    this.errorStats.recentErrors.push({ error, context });
    if (this.errorStats.recentErrors.length > MONITORING_CONFIG.MAX_ERRORS) {
      this.errorStats.recentErrors.shift();
    }

    // Update error rates
    this.updateErrorRates();
  }

  getErrorStats(): ErrorStats {
    return this.errorStats;
  }

  clearErrors(): void {
    this.errors.clear();
    this.errorStats = {
      total: 0,
      byComponent: new Map(),
      recentErrors: [],
      errorRates: {},
    };
  }

  private updateErrorRates(): void {
    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour ago

    // Calculate error rates per component
    Array.from(this.errors).forEach(([component, errors]) => {
      const recentErrors = errors.filter(
        ({ context }) => context.timestamp > hourAgo,
      );
      this.errorStats.errorRates[component] =
        (recentErrors.length / 3600) * 1000; // errors per hour
    });
  }
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: { message: string; timestamp: number; level: string }[] = [];
  private readonly maxLogs = MONITORING_CONFIG.MAX_ERRORS;

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  log(message: string, level: "info" | "warning" | "error" = "info"): void {
    this.logs.push({
      message,
      timestamp: Date.now(),
      level,
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): { message: string; timestamp: number; level: string }[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export class RetryMechanism {
  private static instance: RetryMechanism;
  private readonly maxRetries = MONITORING_CONFIG.RATE_LIMIT.MAX_REQUESTS;
  private readonly retryDelay = 1000; // 1 second

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): RetryMechanism {
    if (!RetryMechanism.instance) {
      RetryMechanism.instance = new RetryMechanism();
    }
    return RetryMechanism.instance;
  }

  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = this.maxRetries,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) break;

        await this.delay(this.retryDelay * attempt);
      }
    }

    throw lastError || new Error("Operation failed after maximum retries");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
