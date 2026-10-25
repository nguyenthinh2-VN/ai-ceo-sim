'use client';

import React from 'react';
import { formatVietnameseTime } from '@/lib/format';

interface AppHeaderProps {
  isSleeping: boolean;
  currentTime: Date | null;
  onResetClick: () => void;
}

export function AppHeader({
  isSleeping,
  currentTime,
  onResetClick,
}: AppHeaderProps) {
  return (
    <header className="border-b border-stone-200/80 bg-[#FDF6EC]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl select-none">🐱</span>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-sm sm:text-base text-stone-900 tracking-tight whitespace-nowrap">
                AI CEO SIMULATOR
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 hidden xs:block line-clamp-1">
              Mô phỏng doanh nghiệp IT tự hành 24/7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <div className="text-xs text-stone-500">Đồng hồ thực (VN)</div>
            <div className="text-xs font-mono font-bold text-stone-800">
              {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'}
            </div>
          </div>

          {/* Read-only status indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-stone-200/80 bg-white/80 text-stone-700 text-[11px] sm:text-xs font-semibold select-none whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${isSleeping ? 'bg-purple-500' : 'bg-emerald-500 animate-pulse'
                }`}
            />
            <span>{isSleeping ? 'Đang ngủ' : 'Đang làm'}</span>
          </div>

          <button
            onClick={onResetClick}
            className="text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-stone-300 hover:border-stone-400 bg-white text-stone-700 transition cursor-pointer whitespace-nowrap flex items-center gap-1"
          >
            <span>🔄</span>
            <span className="hidden xs:inline">Tạo AI Mới</span>
            <span className="xs:hidden">Tạo mới</span>
          </button>
        </div>
      </div>
    </header>
  );
}
