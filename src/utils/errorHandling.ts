// Use the centralized logError from src/services/ErrorLoggingService for all error logging.
// This file should not define its own logError.

interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Extracts error message from any error type in a type-safe way
 * @param err - Any error object
 * @returns string - The error message
 */
export const getErrorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : String(err);
};

export const handleApiError = (error: any): ErrorResponse => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      message: error.response.data.message || 'An error occurred',
      code: error.response.status.toString(),
      details: error.response.data,
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response received from server',
      code: 'NETWORK_ERROR',
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: getErrorMessage(error),
      code: 'UNKNOWN_ERROR',
    };
  }
};

export const formatErrorMessage = (error: ErrorResponse): string => {
  if (error.code) {
    return `Error ${error.code}: ${error.message}`;
  }
  return error.message;
};
