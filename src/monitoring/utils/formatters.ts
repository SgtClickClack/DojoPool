/**
 * Formats a byte value into a human-readable string with appropriate units.
 * @param bytes The number of bytes to format
 * @returns A formatted string with appropriate unit (B, KB, MB, GB)
 */
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const TIME_UNITS = [
  { unit: 'ms', threshold: 1000 },
  { unit: 's', threshold: 60 * 1000 },
  { unit: 'm', threshold: 60 * 60 * 1000 },
  { unit: 'h', threshold: 24 * 60 * 60 * 1000 },
  { unit: 'd', threshold: Infinity },
];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${BYTE_UNITS[unitIndex]}`;
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param ms Duration in milliseconds
 * @returns A formatted string (e.g., "2.5s" or "1m 30s")
 */
export function formatDuration(milliseconds: number): string {
  for (const { unit, threshold } of TIME_UNITS) {
    if (milliseconds < threshold) {
      const value =
        unit === 'ms'
          ? Math.round(milliseconds)
          : (milliseconds / 1000).toFixed(1);
      return `${value} ${unit}`;
    }
    milliseconds /= threshold;
  }
  return `${Math.round(milliseconds)} d`;
}

/**
 * Formats a timestamp into a human-readable string.
 * @param timestamp Unix timestamp in milliseconds
 * @returns A formatted date/time string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Formats a number with fixed decimal places and optional unit.
 * @param value The number to format
 * @param decimals Number of decimal places
 * @param unit Optional unit to append
 * @returns A formatted string
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  unit?: string
): string {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}
