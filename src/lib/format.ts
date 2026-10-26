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
 * Format a number as VND for display (never abbreviates as "tr")
 * e.g. 45000000 -> "45.000.000đ"
 */
export function formatVNDCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
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

export interface CeoStatusDisplay {
  label: string; // 'Đang làm việc' | 'Đang nghỉ trưa' | 'Đang nghỉ ngơi' | 'Đang ngủ'
  tag: string; // '[WORK]' | '[NGHỈ TRƯA]' | '[NGHỈ NGƠI]' | '[NGỦ]'
  dotColor: string; // class CSS cho màu đèn
  isWorking: boolean; // true nếu đang làm việc, false nếu nghỉ/ngủ
  promptSymbol: string; // '>' hoặc '💤 >'
}

/**
 * Trả về thông tin hiển thị trạng thái CEO theo giờ thực:
 * - Giờ làm việc (8–12h, 13–18h VN): 'Đang làm việc', tag [WORK]
 * - Nghỉ trưa (12–13h VN): 'Đang nghỉ trưa', tag [NGHỈ TRƯA]
 * - Giải trí / buổi tối (18–23h VN): 'Đang nghỉ ngơi', tag [NGHỈ NGƠI]
 * - Đêm (23–8h VN): 'Đang ngủ', tag [NGỦ]
 */
export function getCeoStatusDisplay(
  ceoHoatDong?: { hoatDongHienTai?: string; trangThai?: string } | null,
  currentTime?: Date | null
): CeoStatusDisplay {
  let hour: number | null = null;
  if (currentTime instanceof Date && !isNaN(currentTime.getTime())) {
    hour = (currentTime.getUTCHours() + 7) % 24;
  }

  let statusText = ceoHoatDong?.hoatDongHienTai || '';

  if (hour !== null) {
    if (hour === 12) {
      statusText = 'Đang nghỉ trưa';
    } else if (hour >= 18 && hour < 23) {
      statusText = 'Đang nghỉ ngơi';
    } else if (hour >= 23 || hour < 8) {
      statusText = 'Đang ngủ';
    } else {
      statusText = 'Đang làm việc';
    }
  }

  const lower = statusText.toLowerCase();
  if (lower.includes('nghỉ trưa')) {
    return {
      label: 'Đang nghỉ trưa',
      tag: '[NGHỈ TRƯA]',
      dotColor: 'bg-amber-500',
      isWorking: false,
      promptSymbol: '💤 >',
    };
  }
  if (lower.includes('nghỉ ngơi') || lower.includes('giải lao') || lower.includes('giải trí')) {
    return {
      label: 'Đang nghỉ ngơi',
      tag: '[NGHỈ NGƠI]',
      dotColor: 'bg-purple-500',
      isWorking: false,
      promptSymbol: '💤 >',
    };
  }
  if (lower.includes('ngủ')) {
    return {
      label: 'Đang ngủ',
      tag: '[NGỦ]',
      dotColor: 'bg-indigo-500',
      isWorking: false,
      promptSymbol: '💤 >',
    };
  }

  return {
    label: 'Đang làm việc',
    tag: '[WORK]',
    dotColor: 'bg-emerald-500 animate-pulse',
    isWorking: true,
    promptSymbol: '>',
  };
}

