'use client';

import { formatVietnameseTime, getCeoStatusDisplay, CeoStatusDisplay } from '@/lib/format';
import type { ConnectionStatus } from '@/hooks/useRealtimeSimulation';
import React from 'react';

interface StatusBarProps {
  ceoStatus?: CeoStatusDisplay;
  isSleeping?: boolean;
  currentTime: Date | null;
  nextTickTime?: string;
  connectionStatus?: ConnectionStatus;
}

/** Nhãn + màu đèn cho từng trạng thái kết nối. */
const CONNECTION_BADGE: Record<
  ConnectionStatus,
  { dot: string; label: string; title: string }
> = {
  connected: {
    dot: 'bg-emerald-500',
    label: 'Realtime',
    title: 'Đang nhận quyết định của AI qua WebSocket tức thời',
  },
  connecting: {
    dot: 'bg-amber-400 animate-pulse',
    label: 'Đang kết nối',
    title: 'Đang thiết lập kênh WebSocket tới Supabase Realtime',
  },
  fallback_polling: {
    dot: 'bg-amber-500',
    label: 'Polling 5s',
    title:
      'WebSocket không khả dụng — đang tự động đồng bộ mỗi 5 giây để web vẫn chạy',
  },
};

export function StatusBar({
  ceoStatus,
  isSleeping,
  currentTime,
  nextTickTime,
  connectionStatus,
}: StatusBarProps) {
  const currentStatus =
    ceoStatus ||
    getCeoStatusDisplay(
      isSleeping ? { hoatDongHienTai: 'Đang ngủ', trangThai: 'NGU' } : null,
      currentTime
    );

  // Calculate next 15-minute slot (e.g. 10:15 -> 10:30)
  const calculatedNext = React.useMemo(() => {
    if (!currentTime) return '15 phút nữa';
    const d = new Date(currentTime);
    const mins = d.getMinutes();
    const nextQuarter = (Math.floor(mins / 15) + 1) * 15;
    d.setMinutes(nextQuarter, 0, 0);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }, [currentTime]);

  const displayNextTick = nextTickTime || calculatedNext;

  return (
    <>
      <div className="bg-white border border-[#D6C7AF] border-t-0 p-2.5 sm:p-3.5 px-3 sm:px-6 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-stone-800 flex-wrap">
        <div className="flex items-center gap-2 select-none">
          <span
            className={`w-2 h-2 rounded-full ${currentStatus.dotColor}`}
          />
          <span className="font-bold text-stone-800">
            {currentStatus.label}
          </span>
        </div>
        <span className="text-stone-300">·</span>
        <span className="font-mono text-stone-600">
          {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'} giờ Việt Nam
        </span>
        <span className="text-stone-300 hidden xs:inline">·</span>
        <span className="text-stone-500">
          Lượt tự chạy tiếp theo: <span className="font-mono font-semibold text-emerald-700">{displayNextTick}</span>
        </span>

        {connectionStatus && (
          <>
            <span className="text-stone-300 hidden xs:inline">·</span>
            <span
              className="flex items-center gap-1.5 select-none"
              title={CONNECTION_BADGE[connectionStatus].title}
            >
              <span
                className={`w-2 h-2 rounded-full ${CONNECTION_BADGE[connectionStatus].dot}`}
              />
              <span className="text-stone-600">
                {CONNECTION_BADGE[connectionStatus].label}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Sub-bar with Live Viewers Count */}
      <div className="bg-white border border-[#D6C7AF] border-t-[#F3EDE4] rounded-b-2xl px-3 sm:px-6 py-2 sm:py-2.5 text-[11px] sm:text-xs text-stone-500 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-stone-900 font-mono">9</span>
          <span>người đang xem tôi làm việc</span>
        </div>
        <div>
          hôm nay: <span className="font-mono font-medium text-stone-700">1.703</span> người · tổng:{' '}
          <span className="font-mono font-medium text-stone-700">7.534</span> lượt xem
        </div>
      </div>
    </>
  );
}
