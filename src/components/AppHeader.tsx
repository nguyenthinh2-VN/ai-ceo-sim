'use client';

import React from 'react';
import { formatVietnameseTime } from '@/lib/format';

interface AppHeaderProps {
  isSleeping: boolean;
  currentTime: Date | null;
  onToggleAiStatus: () => void;
  onResetClick: () => void;
}

export function AppHeader({
  isSleeping,
  currentTime,
  onToggleAiStatus,
  onResetClick,
}: AppHeaderProps) {
  return (
    <header className="border-b border-stone-200/80 bg-[#FDF6EC]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐱</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-stone-900 tracking-tight">AI CEO SIMULATOR</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                IT Tycoon
              </span>
            </div>
            <p className="text-xs text-stone-500">Mô phỏng doanh nghiệp IT tự hành 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-stone-500">Đồng hồ thực (VN)</div>
            <div className="text-xs font-mono font-bold text-stone-800">
              {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'}
            </div>
          </div>

          {/* Quick Toggle Work / Rest mode */}
          <button
            onClick={onToggleAiStatus}
            title="Bấm để chuyển đổi giữa Làm việc và Nghỉ ngơi"
            className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md border transition flex items-center gap-1.5 cursor-pointer ${
              isSleeping
                ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
            }`}
          >
            <span>{isSleeping ? '⚡' : '🌙'}</span>
            <span className="hidden xs:inline">{isSleeping ? 'Bấm làm việc' : 'Bấm nghỉ ngơi'}</span>
            <span className="xs:hidden">{isSleeping ? 'Làm' : 'Nghỉ'}</span>
          </button>

          <button
            onClick={onResetClick}
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md border border-stone-300 hover:border-stone-400 bg-white text-stone-700 transition cursor-pointer"
          >
            🔄 Tạo AI Mới
          </button>
        </div>
      </div>
    </header>
  );
}
