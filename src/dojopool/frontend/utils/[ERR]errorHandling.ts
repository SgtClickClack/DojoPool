type ErrorType = "network" | "validation" | "auth" | "unknown";
type ErrorSeverity = "error" | "warning" | "info";

interface ErrorResponse {
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
}

/**
 * Checks if an error is a network error.
 * @param error - The error to check.
 * @returns True if the error is a network error, false otherwise.
 */
export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.toLowerCase().includes("failed to fetch") ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("offline")
  );
};

/**
 * Formats an error message for display.
 * @param error - The error to format.
 * @returns A formatted error message string.
 */
export const formatErrorMessage = (error: Error): string => {
  if (!error.message) {
    return "An unknown error occurred";
  }
  return `Error: ${error.message}`;
};

/**
 * Handles different types of errors and returns a standardized error response.
 * @param error - The error to handle.
 * @returns A standardized error response object.
 */
export const handleError = (error: Error): ErrorResponse => {
  // Handle network errors
  if (isNetworkError(error)) {
    return {
      message: "Network error occurred. Please check your connection.",
      type: "network",
      severity: "error",
    };
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    return {
      message: error.message,
      type: "validation",
      severity: "warning",
    };
  }

  // Handle authentication errors
  if (error.name === "AuthError") {
    return {
      message: "Authentication failed. Please log in again.",
      type: "auth",
      severity: "error",
    };
  }

  // Handle unknown errors
  return {
    message: "An unexpected error occurred.",
    type: "unknown",
    severity: "error",
  };
};
