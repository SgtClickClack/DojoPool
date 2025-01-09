import { AxiosError } from 'axios';

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, any>;
}

export class AppError extends Error {
    code?: string;
    details?: Record<string, any>;

    constructor(message: string, code?: string, details?: Record<string, any>) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
    }
}

export function handleApiError(error: AxiosError): ApiError {
    if (error.response) {
        // Server responded with error status
        const data = error.response.data as any;
        return {
            message: data.message || 'An unexpected error occurred',
            code: data.code,
            details: data.details,
        };
    } else if (error.request) {
        // Request made but no response received
        return {
            message: 'Unable to reach the server. Please check your connection.',
            code: 'NETWORK_ERROR',
        };
    } else {
        // Error in request setup
        return {
            message: 'Failed to make the request.',
            code: 'REQUEST_SETUP_ERROR',
        };
    }
}

export function logError(error: Error | AppError | AxiosError, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorDetails = {
        timestamp,
        context,
        name: error.name,
        message: error.message,
        stack: error.stack,
    };

    if (error instanceof AppError) {
        Object.assign(errorDetails, {
            code: error.code,
            details: error.details,
        });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', errorDetails);
    }

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implement error tracking service integration
        // Example: Sentry.captureException(error, { extra: errorDetails });
    }
}

export function displayUserFriendlyError(error: Error | AppError | AxiosError): string {
    if (error instanceof AppError) {
        return error.message;
    }

    if (error instanceof AxiosError) {
        const apiError = handleApiError(error);
        return apiError.message;
    }

    return 'An unexpected error occurred. Please try again later.';
}

export function isNetworkError(error: any): boolean {
    return (
        error instanceof AxiosError &&
        (error.code === 'ECONNABORTED' ||
         error.message === 'Network Error' ||
         !error.response)
    );
}

export function isAuthenticationError(error: any): boolean {
    return (
        error instanceof AxiosError &&
        error.response?.status === 401
    );
}

export function isValidationError(error: any): boolean {
    return (
        error instanceof AxiosError &&
        error.response?.status === 422
    );
}
