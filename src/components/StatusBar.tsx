'use client';

import React from 'react';
import { formatVietnameseTime } from '@/lib/format';

interface StatusBarProps {
  isSleeping: boolean;
  currentTime: Date | null;
}

export function StatusBar({
  isSleeping,
  currentTime,
}: StatusBarProps) {
  return (
    <>
      {/* Status Bar Attached to Desk Bottom */}
      <div className="bg-white border border-[#D6C7AF] border-t-0 p-2.5 sm:p-3.5 px-3 sm:px-6 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-stone-800 flex-wrap">
        <div className="flex items-center gap-2 select-none">
          <span
            className={`w-2 h-2 rounded-full ${isSleeping ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
              }`}
          />
          <span className="font-bold text-stone-800">
            {isSleeping ? 'Đang nghỉ ngơi / nghỉ giải lao' : 'Đang làm việc'}
          </span>
        </div>
        <span className="text-stone-300">·</span>
        <span className="font-mono text-stone-600">
          {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'} giờ Việt Nam
        </span>
        <span className="text-stone-300 hidden xs:inline">·</span>
        <span className="text-stone-500">
          Lượt tự chạy tiếp theo: <span className="font-mono font-semibold text-stone-800">18:00</span>
        </span>
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
