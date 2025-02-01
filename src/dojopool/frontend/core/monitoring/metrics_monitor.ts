// Enums and Types
export enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error"
}

export interface Alert {
    id: string;
    severity: AlertSeverity;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    details?: Record<string, any>;
}

export interface GameMetrics {
    activePlayers: number;
    activeGames: number;
    totalGamesCompleted: number;
    completionRate: number;
    averageCompletionTime: number;
    averageScore: number;
    playerRetention: number;
    errorCount: number;
    warningCount: number;
    errorRate: number;
    lastError?: {
        timestamp: Date;
        type: string;
        message: string;
        details?: Record<string, any>;
    };
}

class GameMetricsMonitor {
    private static instance: GameMetricsMonitor;
    private metrics: Map<string, GameMetrics>;
    private alerts: Alert[];
    private errorHistory: Map<string, Array<{
        timestamp: Date;
        type: string;
        message: string;
        details?: Record<string, any>;
    }>>;
    private readonly RATE_WINDOW = 5 * 60; // 5 minutes in seconds

    private constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.errorHistory = new Map();
    }

    public static getInstance(): GameMetricsMonitor {
        if (!GameMetricsMonitor.instance) {
            GameMetricsMonitor.instance = new GameMetricsMonitor();
        }
        return GameMetricsMonitor.instance;
    }

    public addAlert(severity: AlertSeverity, message: string, details?: Record<string, any>): Alert {
        const alert: Alert = {
            id: `alert-${Date.now()}`,
            severity,
            message,
            timestamp: new Date(),
            acknowledged: false,
            details
        };
        this.alerts.push(alert);
        return alert;
    }

    public acknowledgeAlert(alertId: string, userId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = userId;
            alert.acknowledgedAt = new Date();
            return true;
        }
        return false;
    }

    public getAlerts(severity?: AlertSeverity): Alert[] {
        if (severity) {
            return this.alerts.filter(a => a.severity === severity);
        }
        return [...this.alerts];
    }

    public recordGameCompletion(gameId: string, score: number, time: number): void {
        const metrics = this.metrics.get(gameId) || this.getDefaultMetrics();
        metrics.totalGamesCompleted++;
        metrics.completionRate = metrics.totalGamesCompleted / Math.max(metrics.activeGames, 1);
        metrics.averageCompletionTime = (
            (metrics.averageCompletionTime * (metrics.totalGamesCompleted - 1) + time)
            / metrics.totalGamesCompleted
        );
        metrics.averageScore = (
            (metrics.averageScore * (metrics.totalGamesCompleted - 1) + score)
            / metrics.totalGamesCompleted
        );
        this.metrics.set(gameId, metrics);
    }

    public recordError(gameId: string, errorType: string, message: string, details?: Record<string, any>): void {
        const metrics = this.metrics.get(gameId) || this.getDefaultMetrics();
        metrics.errorCount++;
        metrics.lastError = {
            timestamp: new Date(),
            type: errorType,
            message,
            details
        };

        // Update error history
        const errors = this.errorHistory.get(gameId) || [];
        errors.push({
            timestamp: new Date(),
            type: errorType,
            message,
            details
        });
        this.errorHistory.set(gameId, errors);

        // Calculate error rate
        const recentErrors = errors.filter(
            e => (new Date().getTime() - e.timestamp.getTime()) / 1000 <= this.RATE_WINDOW
        );
        metrics.errorRate = recentErrors.length / (this.RATE_WINDOW / 60);

        this.metrics.set(gameId, metrics);

        // Add alert for errors
        this.addAlert(
            AlertSeverity.ERROR,
            `Error in game ${gameId}: ${message}`,
            { error_type: errorType, details }
        );
    }

    public getMetrics(gameId: string): GameMetrics {
        return this.metrics.get(gameId) || this.getDefaultMetrics();
    }

    public clearMetrics(gameId: string): void {
        this.metrics.delete(gameId);
        this.errorHistory.delete(gameId);
    }

    private getDefaultMetrics(): GameMetrics {
        return {
            activePlayers: 0,
            activeGames: 0,
            totalGamesCompleted: 0,
            completionRate: 0,
            averageCompletionTime: 0,
            averageScore: 0,
            playerRetention: 0,
            errorCount: 0,
            warningCount: 0,
            errorRate: 0
        };
    }
}

// Export singleton instance
export const metrics_monitor = GameMetricsMonitor.getInstance(); 