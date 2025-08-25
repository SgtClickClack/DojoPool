/**
 * Utility functions for consistent error handling across services
 */
export class ErrorUtils {
  /**
   * Extracts error message from any error type in a consistent way
   * @param err - Any error object
   * @returns string - The error message
   */
  static getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  /**
   * Formats error message for logging with consistent structure
   * @param operation - Description of the operation that failed
   * @param identifier - Optional identifier (ID, name, etc.)
   * @param err - The error object
   * @returns string - Formatted error message
   */
  static formatErrorMessage(
    operation: string,
    identifier?: string,
    err?: unknown
  ): string {
    const base = `Failed to ${operation}`;
    const idPart = identifier ? ` ${identifier}` : '';
    const errorPart = err ? `: ${this.getErrorMessage(err)}` : '';
    return `${base}${idPart}${errorPart}`;
  }
}
