import { useState, useCallback } from 'react';

interface RetryConfig {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}

interface RetryState {
    attempts: number;
    isRetrying: boolean;
    error: Error | null;
}

export const useRetry = (
    operation: () => Promise<any>,
    config: RetryConfig = {}
) => {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2
    } = config;

    const [state, setState] = useState<RetryState>({
        attempts: 0,
        isRetrying: false,
        error: null
    });

    const calculateDelay = (attempt: number): number => {
        const delay = initialDelay * Math.pow(backoffFactor, attempt);
        return Math.min(delay, maxDelay);
    };

    const reset = useCallback(() => {
        setState({
            attempts: 0,
            isRetrying: false,
            error: null
        });
    }, []);

    const execute = useCallback(async () => {
        setState(prev => ({
            ...prev,
            isRetrying: true,
            error: null
        }));

        try {
            const result = await operation();
            setState(prev => ({
                ...prev,
                isRetrying: false,
                error: null
            }));
            return result;
        } catch (error) {
            if (state.attempts < maxAttempts - 1) {
                const nextAttempt = state.attempts + 1;
                const delay = calculateDelay(nextAttempt);

                setState(prev => ({
                    ...prev,
                    attempts: nextAttempt,
                    error: error as Error
                }));

                // Wait for the calculated delay
                await new Promise(resolve => setTimeout(resolve, delay));

                // Retry the operation
                return execute();
            }

            // Max attempts reached
            setState(prev => ({
                ...prev,
                isRetrying: false,
                error: error as Error
            }));
            throw error;
        }
    }, [operation, state.attempts, maxAttempts]);

    return {
        execute,
        reset,
        attempts: state.attempts,
        isRetrying: state.isRetrying,
        error: state.error
    };
}; 