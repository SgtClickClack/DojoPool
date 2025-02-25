import { Middleware } from 'redux';
import { ErrorTracker } from '../../services/error/ErrorTracker';

interface ErrorTrackingOptions {
    ignoredActions?: string[];
    ignoredErrors?: string[];
    extraContext?: Record<string, any>;
    shouldRethrow?: boolean;
    serialization?: {
        maxDepth?: number;
        maxLength?: number;
        sensitiveKeys?: string[];
        customSerializers?: {
            [key: string]: (value: any) => any;
        };
    };
}

interface ErrorContext {
    action: {
        type: string;
        [key: string]: any;
    };
    state: any;
    timestamp: number;
    extraContext?: Record<string, any>;
}

class ReduxErrorTracker {
    private static instance: ReduxErrorTracker;
    private errorTracker: ErrorTracker;
    private options: ErrorTrackingOptions;

    private constructor(options: ErrorTrackingOptions = {}) {
        this.errorTracker = ErrorTracker.getInstance();
        this.options = {
            ignoredActions: [],
            ignoredErrors: [],
            shouldRethrow: true,
            ...options
        };
    }

    public static getInstance(options?: ErrorTrackingOptions): ReduxErrorTracker {
        if (!ReduxErrorTracker.instance) {
            ReduxErrorTracker.instance = new ReduxErrorTracker(options);
        }
        return ReduxErrorTracker.instance;
    }

    public trackError(error: Error, context: ErrorContext): void {
        // Check if we should ignore this error
        if (this.shouldIgnoreError(error, context)) {
            return;
        }

        // Track the error with our error tracking service
        this.errorTracker.trackError(error, {
            component: 'Redux',
            timestamp: context.timestamp,
            additionalInfo: {
                actionType: context.action.type,
                actionPayload: this.sanitizePayload(context.action),
                state: this.sanitizeState(context.state),
                ...context.extraContext
            }
        });
    }

    private shouldIgnoreError(error: Error, context: ErrorContext): boolean {
        const { ignoredActions = [], ignoredErrors = [] } = this.options;

        return (
            ignoredActions.includes(context.action.type) ||
            ignoredErrors.some(pattern => 
                error.message.includes(pattern) || 
                error.name.includes(pattern)
            )
        );
    }

    private sanitizePayload(action: any): any {
        const { sensitiveKeys = ['password', 'token', 'secret', 'key'], 
                maxDepth = 3, 
                maxLength = 1000,
                customSerializers = {} 
        } = this.options.serialization || {};

        return this.serializeValue(action, {
            currentDepth: 0,
            maxDepth,
            maxLength,
            sensitiveKeys,
            customSerializers
        });
    }

    private sanitizeState(state: any): any {
        const { sensitiveKeys = ['password', 'token', 'secret', 'key'],
                maxDepth = 2,
                maxLength = 500,
                customSerializers = {}
        } = this.options.serialization || {};

        return this.serializeValue(state, {
            currentDepth: 0,
            maxDepth,
            maxLength,
            sensitiveKeys,
            customSerializers
        });
    }

    private serializeValue(
        value: any, 
        options: {
            currentDepth: number;
            maxDepth: number;
            maxLength: number;
            sensitiveKeys: string[];
            customSerializers: { [key: string]: (value: any) => any };
            path?: string[];
        }
    ): any {
        const { currentDepth, maxDepth, maxLength, sensitiveKeys, customSerializers, path = [] } = options;

        // Check for custom serializer
        for (const [type, serializer] of Object.entries(customSerializers)) {
            if (
                (type === 'Date' && value instanceof Date) ||
                (type === 'Error' && value instanceof Error) ||
                (type === 'Map' && value instanceof Map) ||
                (type === 'Set' && value instanceof Set)
            ) {
                return serializer(value);
            }
        }

        // Handle primitive types
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value !== 'object') {
            if (typeof value === 'string' && value.length > maxLength) {
                return `${value.substring(0, maxLength)}...`;
            }
            return value;
        }

        // Check depth
        if (currentDepth >= maxDepth) {
            return '[Max Depth Reached]';
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.slice(0, maxLength).map(item =>
                this.serializeValue(item, {
                    ...options,
                    currentDepth: currentDepth + 1,
                    path: [...path]
                })
            );
        }

        // Handle objects
        const serialized: any = {};
        for (const [key, val] of Object.entries(value)) {
            // Skip sensitive keys
            if (sensitiveKeys.includes(key)) {
                serialized[key] = '[REDACTED]';
                continue;
            }

            // Check circular references
            if (path.includes(key)) {
                serialized[key] = '[Circular Reference]';
                continue;
            }

            serialized[key] = this.serializeValue(val, {
                ...options,
                currentDepth: currentDepth + 1,
                path: [...path, key]
            });
        }

        return serialized;
    }
}

export const createErrorTrackingMiddleware = (
    options: ErrorTrackingOptions = {}
): Middleware => {
    const errorTracker = ReduxErrorTracker.getInstance(options);

    return store => next => action => {
        try {
            // Attempt to process the action
            const result = next(action);

            // If the action returns a promise, track any errors in the promise chain
            if (result instanceof Promise) {
                return result.catch(error => {
                    const context: ErrorContext = {
                        action,
                        state: store.getState(),
                        timestamp: Date.now(),
                        extraContext: options.extraContext
                    };
                    errorTracker.trackError(error, context);

                    if (options.shouldRethrow) {
                        throw error;
                    }
                });
            }

            return result;
        } catch (error) {
            // Track synchronous errors
            const context: ErrorContext = {
                action,
                state: store.getState(),
                timestamp: Date.now(),
                extraContext: options.extraContext
            };
            errorTracker.trackError(error as Error, context);

            if (options.shouldRethrow) {
                throw error;
            }
        }
    };
};

// Export for testing
export const __ReduxErrorTracker = ReduxErrorTracker; 