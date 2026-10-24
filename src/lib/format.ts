// ============================================================
// format.ts — Currency and number formatting utilities
// ============================================================

/**
 * Format a number as Vietnamese Dong with dots separator
 * e.g. 500000000 -> "500.000.000đ"
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
  const isNegative = amount < 0;
  const absStr = Math.abs(Math.round(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${absStr}đ`;
}

/**
 * Format a number as compact VND for display
 * e.g. 500000000 -> "500tr"
 */
export function formatVNDCompact(amount: number): string {
  if (isNaN(amount)) return '0đ';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(0)} tr`;
  }
  return formatVND(amount);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

/**
 * Format hours
 */
export function formatHours(hours: number): string {
  if (isNaN(hours)) return '0h';
  return `${Math.round(hours)}h`;
}

/**
 * Get the startup day number from startedAt
 */
export function getStartupDay(startedAt: string): number {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Format a Date to Vietnamese time string
 */
export function formatVietnameseTime(date: Date): string {
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g., "3 giờ trước")
 */
export function formatRelativeTime(isoTimestamp: string): string {
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}
