import { ErrorTracker } from './ErrorTracker';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

interface ErrorMetrics {
    totalErrors: number;
    errorsByType: { [key: string]: number };
    errorsByComponent: { [key: string]: number };
    averageErrorRate: number;
    recentErrors: Array<{
        timestamp: number;
        error: Error;
        context: any;
    }>;
}

interface ErrorPattern {
    pattern: string;
    frequency: number;
    components: string[];
    averageImpact: number;
}

export class ErrorAnalytics {
    private static instance: ErrorAnalytics;
    private errorTracker: ErrorTracker;
    private performanceMonitor: PerformanceMonitor;
    private metrics: ErrorMetrics;
    private readonly MAX_RECENT_ERRORS = 100;
    private readonly ANALYSIS_INTERVAL = 60000; // 1 minute
    private analysisInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.errorTracker = ErrorTracker.getInstance();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.metrics = {
            totalErrors: 0,
            errorsByType: {},
            errorsByComponent: {},
            averageErrorRate: 0,
            recentErrors: []
        };

        this.initializeAnalytics();
    }

    public static getInstance(): ErrorAnalytics {
        if (!ErrorAnalytics.instance) {
            ErrorAnalytics.instance = new ErrorAnalytics();
        }
        return ErrorAnalytics.instance;
    }

    private initializeAnalytics(): void {
        // Subscribe to error events
        this.errorTracker.subscribe('error', (error: Error, context: any) => {
            this.trackError(error, context);
        });

        // Start periodic analysis
        this.analysisInterval = setInterval(() => {
            this.analyzeErrorPatterns();
        }, this.ANALYSIS_INTERVAL);
    }

    private trackError(error: Error, context: any): void {
        // Update metrics
        this.metrics.totalErrors++;
        
        // Track error type
        const errorType = error.name || 'Unknown';
        this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

        // Track component
        if (context.component) {
            this.metrics.errorsByComponent[context.component] = 
                (this.metrics.errorsByComponent[context.component] || 0) + 1;
        }

        // Add to recent errors
        this.metrics.recentErrors.push({
            timestamp: Date.now(),
            error,
            context
        });

        // Maintain recent errors limit
        if (this.metrics.recentErrors.length > this.MAX_RECENT_ERRORS) {
            this.metrics.recentErrors.shift();
        }

        // Update error rate
        const timeWindow = 3600000; // 1 hour
        const recentErrorCount = this.metrics.recentErrors.filter(
            e => Date.now() - e.timestamp < timeWindow
        ).length;
        this.metrics.averageErrorRate = recentErrorCount / (timeWindow / 1000);

        // Track performance impact
        this.trackPerformanceImpact(error, context);
    }

    private trackPerformanceImpact(error: Error, context: any): void {
        if (context.timestamp) {
            this.performanceMonitor.trackMetric('error_impact', Date.now() - context.timestamp, {
                errorType: error.name,
                component: context.component,
                severity: this.calculateErrorSeverity(error, context)
            });
        }
    }

    private calculateErrorSeverity(error: Error, context: any): number {
        let severity = 1;

        // Increase severity based on various factors
        if (error instanceof TypeError || error instanceof ReferenceError) {
            severity += 1; // Programming errors are more severe
        }
        if (context.component?.includes('Game')) {
            severity += 1; // Game-related errors are more critical
        }
        if (this.isRecurringError(error)) {
            severity += 2; // Recurring errors are more severe
        }
        if (context.matchId) {
            severity += 1; // Errors during active matches are more severe
        }

        return Math.min(severity, 5); // Cap at 5
    }

    private isRecurringError(error: Error): boolean {
        const timeWindow = 300000; // 5 minutes
        const similarErrors = this.metrics.recentErrors.filter(e => 
            Date.now() - e.timestamp < timeWindow &&
            e.error.name === error.name &&
            e.error.message === error.message
        );
        return similarErrors.length >= 3;
    }

    private analyzeErrorPatterns(): ErrorPattern[] {
        const patterns: ErrorPattern[] = [];
        const timeWindow = 3600000; // 1 hour
        const recentErrors = this.metrics.recentErrors.filter(
            e => Date.now() - e.timestamp < timeWindow
        );

        // Group errors by message pattern
        const errorGroups = new Map<string, any[]>();
        recentErrors.forEach(({ error, context }) => {
            const pattern = this.extractErrorPattern(error.message);
            if (!errorGroups.has(pattern)) {
                errorGroups.set(pattern, []);
            }
            errorGroups.get(pattern)?.push({ error, context });
        });

        // Analyze each pattern
        errorGroups.forEach((errors, pattern) => {
            const components = new Set(errors.map(e => e.context.component).filter(Boolean));
            const avgImpact = errors.reduce((sum, e) => 
                sum + this.calculateErrorSeverity(e.error, e.context), 0
            ) / errors.length;

            patterns.push({
                pattern,
                frequency: errors.length,
                components: Array.from(components),
                averageImpact
            });
        });

        // Sort by frequency and impact
        return patterns.sort((a, b) => 
            (b.frequency * b.averageImpact) - (a.frequency * a.averageImpact)
        );
    }

    private extractErrorPattern(message: string): string {
        // Remove specific values but keep structure
        return message
            .replace(/[0-9]+/g, 'N')
            .replace(/["'][^"']*["']/g, 'STR')
            .replace(/\{[^}]*\}/g, 'OBJ')
            .replace(/\[[^\]]*\]/g, 'ARR');
    }

    public getMetrics(): ErrorMetrics {
        return { ...this.metrics };
    }

    public getTopErrorPatterns(limit: number = 5): ErrorPattern[] {
        return this.analyzeErrorPatterns().slice(0, limit);
    }

    public getComponentHealth(): { [key: string]: number } {
        const health: { [key: string]: number } = {};
        const timeWindow = 3600000; // 1 hour

        for (const component in this.metrics.errorsByComponent) {
            const recentErrors = this.metrics.recentErrors.filter(e => 
                e.context.component === component &&
                Date.now() - e.timestamp < timeWindow
            );

            const errorRate = recentErrors.length / (timeWindow / 1000);
            const severity = recentErrors.reduce((sum, { error, context }) => 
                sum + this.calculateErrorSeverity(error, context), 0
            ) / (recentErrors.length || 1);

            // Calculate health score (0-100)
            health[component] = Math.max(0, Math.min(100, 100 - (errorRate * 50) - (severity * 10)));
        }

        return health;
    }

    public cleanup(): void {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
    }
} 