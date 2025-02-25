import { WebSocketService } from '../websocket/WebSocketService';

interface ErrorContext {
    component?: string;
    matchId?: string;
    userId?: string;
    timestamp: number;
    additionalInfo?: Record<string, any>;
}

interface ErrorReport {
    error: Error;
    context: ErrorContext;
    stackTrace: string;
}

class ErrorTracker {
    private static instance: ErrorTracker;
    private wsService: WebSocketService;
    private errorQueue: ErrorReport[] = [];
    private readonly maxQueueSize = 100;
    private readonly flushInterval = 5000; // 5 seconds
    private flushTimeout: NodeJS.Timeout | null = null;

    private constructor() {
        this.wsService = WebSocketService.getInstance();
        this.startFlushInterval();
    }

    public static getInstance(): ErrorTracker {
        if (!ErrorTracker.instance) {
            ErrorTracker.instance = new ErrorTracker();
        }
        return ErrorTracker.instance;
    }

    public trackError(error: Error, context: ErrorContext): void {
        const errorReport: ErrorReport = {
            error,
            context: {
                ...context,
                timestamp: context.timestamp || Date.now()
            },
            stackTrace: error.stack || ''
        };

        this.addToQueue(errorReport);
        this.logError(errorReport);

        // If it's a critical error, send immediately
        if (this.isCriticalError(error)) {
            this.flushQueue();
        }
    }

    private addToQueue(errorReport: ErrorReport): void {
        this.errorQueue.push(errorReport);
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.flushQueue();
        }
    }

    private async flushQueue(): Promise<void> {
        if (this.errorQueue.length === 0) return;

        try {
            // Send errors to backend
            await this.sendErrorsToBackend(this.errorQueue);
            
            // Clear the queue after successful send
            this.errorQueue = [];
        } catch (error) {
            console.error('Failed to flush error queue:', error);
            // Keep the errors in queue for next attempt
        }
    }

    private startFlushInterval(): void {
        if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
        }

        this.flushTimeout = setInterval(() => {
            this.flushQueue();
        }, this.flushInterval);
    }

    private async sendErrorsToBackend(errors: ErrorReport[]): Promise<void> {
        try {
            // Send via WebSocket if connected
            if (this.wsService) {
                this.wsService.sendMessage({
                    type: 'error_report',
                    data: {
                        errors: errors.map(this.sanitizeErrorReport)
                    }
                });
            }

            // Also log to console in development
            if (process.env.NODE_ENV === 'development') {
                errors.forEach(error => this.logError(error));
            }
        } catch (error) {
            console.error('Error sending errors to backend:', error);
            throw error;
        }
    }

    private sanitizeErrorReport(report: ErrorReport): Partial<ErrorReport> {
        return {
            error: {
                name: report.error.name,
                message: report.error.message
            },
            context: report.context,
            stackTrace: report.stackTrace
        };
    }

    private logError(errorReport: ErrorReport): void {
        const { error, context } = errorReport;
        console.error(
            `[${new Date(context.timestamp).toISOString()}]`,
            `[${context.component || 'Unknown Component'}]`,
            error.message,
            '\nContext:', context,
            '\nStack:', error.stack
        );
    }

    private isCriticalError(error: Error): boolean {
        // Define critical error types
        const criticalErrors = [
            'WebSocketError',
            'AuthenticationError',
            'DatabaseError',
            'SecurityError'
        ];

        return criticalErrors.some(errorType => 
            error.name.includes(errorType) || 
            error.message.includes(errorType)
        );
    }

    public destroy(): void {
        if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
            this.flushTimeout = null;
        }
        this.flushQueue();
    }
} 