/**
 * Format a timestamp into a human-readable string
 */
export const formatTimestamp = (timestamp: Date | number | string): string => {
  if (!timestamp) return 'Unknown';

  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Format a timestamp for display in a specific format
 */
export const formatDate = (
  timestamp: Date | number | string,
  format: 'short' | 'long' | 'time' = 'short'
): string => {
  if (!timestamp) return 'Unknown';

  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) return 'Invalid date';

  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Check if a date is today
 */
export const isToday = (timestamp: Date | number | string): boolean => {
  if (!timestamp) return false;

  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) return false;

  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (timestamp: Date | number | string): boolean => {
  if (!timestamp) return false;

  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (timestamp: Date | number | string): string => {
  if (!timestamp) return 'Unknown';

  const date =
    typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return 'In the future';
  } else if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format duration in milliseconds to human-readable string
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    const seconds = Math.floor(milliseconds / 1000);
    return `${seconds}s`;
  } else if (milliseconds < 3600000) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
};
