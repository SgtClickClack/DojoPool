interface ErrorResponse {
    message: string;
    code?: string;
    details?: Record<string, any>;
}

export const logError = (error: Error, errorInfo?: React.ErrorInfo): void => {
    // TODO: Implement error logging service (e.g., Sentry)
    console.error('Error:', error);
    if (errorInfo) {
        console.error('Error Info:', errorInfo);
    }
};

export const handleApiError = (error: any): ErrorResponse => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
            message: error.response.data.message || 'An error occurred',
            code: error.response.status.toString(),
            details: error.response.data
        };
    } else if (error.request) {
        // The request was made but no response was received
        return {
            message: 'No response received from server',
            code: 'NETWORK_ERROR'
        };
    } else {
        // Something happened in setting up the request that triggered an Error
        return {
            message: error.message || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        };
    }
};

export const formatErrorMessage = (error: ErrorResponse): string => {
    if (error.code) {
        return `Error ${error.code}: ${error.message}`;
    }
    return error.message;
}; 