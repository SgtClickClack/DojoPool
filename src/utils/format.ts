/**
 * Formats a number as currency with the specified currency code
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g. 'USD', 'DP' for Dojo Points)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'DP'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode === 'DP' ? 'USD' : currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formatted = formatter.format(amount);
  return currencyCode === 'DP' ? formatted.replace('$', 'DP ') : formatted;
};

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Formats a number with appropriate suffix (K, M, B)
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}; 