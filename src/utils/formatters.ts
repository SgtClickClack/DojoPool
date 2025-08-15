/**
 * Format bytes to human readable string
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format time in milliseconds to human readable string
 * @param ms Time in milliseconds
 * @returns Formatted string (e.g., "1.5s" or "100ms")
 */
export const formatTime = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
};

/**
 * Format percentage to string with specified precision
 * @param value Percentage value
 * @param precision Number of decimal places
 * @returns Formatted string (e.g., "42.5%")
 */
export const formatPercentage = (value: number, precision = 1): string => {
  return `${value.toFixed(precision)}%`;
};

/**
 * Format date to locale string with time
 * @param date Date object or timestamp
 * @returns Formatted string (e.g., "4/14/2024, 2:30:45 PM")
 */
export const formatDateTime = (date: Date | number): string => {
  const dateObj = typeof date === "number" ? new Date(date) : date;
  return dateObj.toLocaleString();
};

/**
 * Format number with thousands separator
 * @param value Number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};
