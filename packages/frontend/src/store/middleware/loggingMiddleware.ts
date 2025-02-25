import { Middleware } from '@reduxjs/toolkit';
import { PerformanceMonitor } from '../../services/monitoring/PerformanceMonitor';

interface ActionTiming {
    actionType: string;
    startTime: number;
    endTime: number;
    duration: number;
}

interface ActionMetrics {
    totalActions: number;
    averageDuration: number;
    slowestAction: ActionTiming | null;
    actionCounts: Record<string, number>;
}

class ActionMetricsTracker {
    private static instance: ActionMetricsTracker;
    private performanceMonitor: PerformanceMonitor;
    private actionTimings: ActionTiming[] = [];
    private metrics: ActionMetrics = {
        totalActions: 0,
        averageDuration: 0,
        slowestAction: null,
        actionCounts: {}
    };

    private constructor() {
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public static getInstance(): ActionMetricsTracker {
        if (!ActionMetricsTracker.instance) {
            ActionMetricsTracker.instance = new ActionMetricsTracker();
        }
        return ActionMetricsTracker.instance;
    }

    public trackAction(timing: ActionTiming): void {
        this.actionTimings.push(timing);
        this.updateMetrics(timing);
        this.trackPerformanceMetrics(timing);
    }

    private updateMetrics(timing: ActionTiming): void {
        // Update total actions
        this.metrics.totalActions++;

        // Update action counts
        this.metrics.actionCounts[timing.actionType] = 
            (this.metrics.actionCounts[timing.actionType] || 0) + 1;

        // Update average duration
        const totalDuration = this.actionTimings.reduce(
            (sum, t) => sum + t.duration,
            0
        );
        this.metrics.averageDuration = totalDuration / this.actionTimings.length;

        // Update slowest action
        if (!this.metrics.slowestAction || 
            timing.duration > this.metrics.slowestAction.duration) {
            this.metrics.slowestAction = timing;
        }
    }

    private trackPerformanceMetrics(timing: ActionTiming): void {
        this.performanceMonitor.trackMetric(
            `redux_action_duration`,
            timing.duration,
            {
                actionType: timing.actionType,
                timestamp: timing.startTime
            }
        );
    }

    public getMetrics(): ActionMetrics {
        return { ...this.metrics };
    }

    public clear(): void {
        this.actionTimings = [];
        this.metrics = {
            totalActions: 0,
            averageDuration: 0,
            slowestAction: null,
            actionCounts: {}
        };
    }
}

export const createLoggingMiddleware = (
    options: {
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
        excludeActions?: string[];
        includeState?: boolean;
        maxStateDepth?: number;
    } = {}
): Middleware => {
    const {
        logLevel = 'info',
        excludeActions = [],
        includeState = true,
        maxStateDepth = 2
    } = options;

    const metricsTracker = ActionMetricsTracker.getInstance();

    const stringifyState = (state: any, depth: number = 0): string => {
        if (depth >= maxStateDepth) return '[Object]';
        if (!state) return String(state);

        return JSON.stringify(state, (key, value) => {
            if (depth === maxStateDepth - 1 && typeof value === 'object' && value !== null) {
                return '[Object]';
            }
            return value;
        }, 2);
    };

    const shouldLogAction = (action: any): boolean => {
        return !excludeActions.includes(action.type);
    };

    const logWithLevel = (level: string, ...args: any[]): void => {
        switch (level) {
            case 'debug':
                console.debug(...args);
                break;
            case 'warn':
                console.warn(...args);
                break;
            case 'error':
                console.error(...args);
                break;
            default:
                console.log(...args);
        }
    };

    return store => next => action => {
        if (!shouldLogAction(action)) {
            return next(action);
        }

        const startTime = performance.now();
        const prevState = includeState ? store.getState() : null;

        logWithLevel(logLevel, `%c Action:`, 'color: #9E9E9E; font-weight: bold', action.type);
        if (action.payload) {
            logWithLevel(logLevel, '%c Payload:', 'color: #4CAF50; font-weight: bold', action.payload);
        }

        if (prevState && includeState) {
            logWithLevel(
                logLevel,
                '%c Previous State:',
                'color: #2196F3; font-weight: bold',
                stringifyState(prevState)
            );
        }

        try {
            const result = next(action);
            const endTime = performance.now();
            const duration = endTime - startTime;

            const timing: ActionTiming = {
                actionType: action.type,
                startTime,
                endTime,
                duration
            };
            metricsTracker.trackAction(timing);

            if (includeState) {
                const nextState = store.getState();
                logWithLevel(
                    logLevel,
                    '%c Next State:',
                    'color: #2196F3; font-weight: bold',
                    stringifyState(nextState)
                );
            }

            logWithLevel(
                logLevel,
                '%c Duration:',
                'color: #9C27B0; font-weight: bold',
                `${duration.toFixed(2)}ms`
            );

            return result;
        } catch (error) {
            logWithLevel('error', '%c Error:', 'color: #f20404; font-weight: bold', error);
            throw error;
        }
    };
};

export const getActionMetrics = (): ActionMetrics => {
    return ActionMetricsTracker.getInstance().getMetrics();
};

export const clearActionMetrics = (): void => {
    ActionMetricsTracker.getInstance().clear();
}; 