'use client';

import React, { useState } from 'react';
import { DiaryDayGroup } from '@/lib/types';

interface DiaryAccordionProps {
  diaryDays: DiaryDayGroup[];
}

export function DiaryAccordion({ diaryDays }: DiaryAccordionProps) {
  // Today open by default
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({
    '24/10/2026': true,
  });

  const toggleDate = (date: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="space-y-4">
      {diaryDays.map((group) => {
        const isOpen = openDates[group.date] ?? false;
        return (
          <div
            key={group.date}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleDate(group.date)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-50/70 transition cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-stone-900 text-sm sm:text-base">
                  {group.date}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {group.dayLabel}
                </span>
                <span className="text-xs text-stone-400 font-mono hidden sm:inline">
                  • {group.logs.length} nhật ký
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">
                  {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                </span>
                <svg
                  className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-stone-100 space-y-3">
                {group.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-100/80 hover:border-stone-200 transition"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                        {log.time}
                      </span>
                      <span className="text-xs text-stone-400">· Tự động ghi lại</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
                      {log.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
