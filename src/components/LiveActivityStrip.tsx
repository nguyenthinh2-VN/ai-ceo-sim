'use client';

import React from 'react';
import { GameState, Employee } from '@/lib/types';

interface LiveActivityStripProps {
  state: GameState;
  onSelectPerson: (person: Employee | 'CEO') => void;
}

export function LiveActivityStrip({
  state,
  onSelectPerson,
}: LiveActivityStripProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Đang hoạt động lúc này (Click để xem chi tiết)
        </h3>
        <span className="text-xs text-stone-400 font-mono">
          {state.nhanVien.length + 1} nhân sự
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CEO Card */}
        <div
          onClick={() => onSelectPerson('CEO')}
          className="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🐱</span>
            <div>
              <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span>{state.aiName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  AI CEO
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-stone-600 line-clamp-2 leading-snug">
            {state.ceoHoatDong?.hoatDongHienTai || state.keHoachHienTai}
          </div>
        </div>

        {/* Employees Cards */}
        {state.nhanVien.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onSelectPerson(emp)}
            className="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-xs hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💻</span>
              <div>
                <div className="font-bold text-stone-900 text-xs sm:text-sm">
                  {emp.name}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">{emp.role}</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 line-clamp-2 leading-snug">
              {emp.hoatDongHienTai}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
