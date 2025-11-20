/**
 * Utility functions for formatting data in AlgoGainz
 */

/**
 * Format a number as Indian Rupees (₹)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  const safeValue = value ?? 0;
  return `₹${safeValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format a number as a percentage with sign
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + sign for positive values (default: true)
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number | null | undefined,
  decimals: number = 2,
  showSign: boolean = true
): string => {
  const safeValue = value ?? 0;
  const sign = showSign && safeValue >= 0 ? '+' : '';
  return `${sign}${safeValue.toFixed(decimals)}%`;
};

/**
 * Format a large number with K, L, Cr suffixes (Indian numbering system)
 * @param value - The number to format
 * @returns Formatted string with suffix
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  const safeValue = value ?? 0;
  const absValue = Math.abs(safeValue);

  if (absValue >= 10000000) {
    // 1 Crore or more
    return `₹${(safeValue / 10000000).toFixed(2)}Cr`;
  } else if (absValue >= 100000) {
    // 1 Lakh or more
    return `₹${(safeValue / 100000).toFixed(2)}L`;
  } else if (absValue >= 1000) {
    // 1 Thousand or more
    return `₹${(safeValue / 1000).toFixed(2)}K`;
  } else {
    return formatCurrency(safeValue, 2);
  }
};

/**
 * Format a date as a readable string
 * @param date - Date string or Date object
 * @param format - Format type ('short' | 'long' | 'time' | 'datetime')
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short'
): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  switch (format) {
    case 'short':
      // DD-MM-YYYY
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    case 'long':
      // DD Month YYYY
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    case 'time':
      // HH:MM AM/PM
      return dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    case 'datetime':
      // DD-MM-YYYY HH:MM AM/PM
      return `${formatDate(dateObj, 'short')} ${formatDate(dateObj, 'time')}`;

    default:
      return dateObj.toLocaleDateString('en-IN');
  }
};

/**
 * Format a relative date (e.g., "2 days ago", "Just now")
 * @param date - Date string or Date object
 * @returns Relative date string
 */
export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  return formatDate(dateObj, 'short');
};

/**
 * Format a number with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  const safeValue = value ?? 0;
  return safeValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format quantity (always show whole numbers for share quantities)
 * @param value - The quantity value
 * @returns Formatted quantity string
 */
export const formatQuantity = (value: number | null | undefined): string => {
  return formatNumber(value ?? 0, 0);
};

/**
 * Get color based on value (positive = green, negative = red)
 * @param value - The value to check
 * @returns Color string (success.main or error.main)
 */
export const getValueColor = (value: number | null | undefined): string => {
  const safeValue = value ?? 0;
  return safeValue >= 0 ? 'success.main' : 'error.main';
};

/**
 * Get background color based on value
 * @param value - The value to check
 * @returns Background color string
 */
export const getValueBgColor = (value: number | null | undefined): string => {
  const safeValue = value ?? 0;
  return safeValue >= 0 ? 'success.50' : 'error.50';
};

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text to specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format duration in milliseconds to readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
