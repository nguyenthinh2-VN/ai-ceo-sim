'use client';

import React from 'react';
import { GameState } from '@/lib/types';
import { formatHours, formatPercent } from '@/lib/format';

interface StrategyBreakdownProps {
  state: GameState;
}

export function StrategyBreakdown({ state }: StrategyBreakdownProps) {
  return (
    <div className="content-section">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan Card */}
        <div className="md:col-span-2 plan-card">
          <div className="plan-label">🎯 Kế hoạch điều hành tuần {state.tuanHienTai}</div>
          <div className="plan-text font-medium leading-relaxed">
            {state.keHoachHienTai}
          </div>
          <div className="plan-reason">
            <span className="font-semibold text-amber-400">Lý do đưa ra quyết định: </span>
            {state.lyDoHienTai}
          </div>
        </div>

        {/* Scale stage badge */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              🏢 Cấp độ công ty
            </div>
            <div className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>🏠</span> Giai đoạn Garage
            </div>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Đang vận hành từ phòng ngủ / quán cafe. Mục tiêu tích lũy thêm 300.000.000đ để lên Studio.
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Mục tiêu tiếp theo</span>
            <span className="font-bold text-amber-700">Studio (10 người)</span>
          </div>
        </div>
      </div>

      {/* Life hours allocation stacked bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mt-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              ⏰ Phân bổ thời gian sống tuần này (Tổng: 168 giờ)
            </h3>
            <p className="text-xs text-stone-400">Cân bằng giữa cày cuốc, họp hành và bảo dưỡng sức khỏe</p>
          </div>
          <div className="text-xs font-mono font-bold text-stone-600">
            Làm việc: {formatHours(state.gioSongTuanNay.lamViec)} ({formatPercent((state.gioSongTuanNay.lamViec / 168) * 100)})
          </div>
        </div>

        <div className="stacked-bar">
          <div
            className="stacked-segment stacked-segment--work"
            style={{ flex: state.gioSongTuanNay.lamViec }}
            title={`Làm việc: ${state.gioSongTuanNay.lamViec}h`}
          >
            Làm {state.gioSongTuanNay.lamViec}h
          </div>
          <div
            className="stacked-segment stacked-segment--sleep"
            style={{ flex: state.gioSongTuanNay.ngu }}
            title={`Ngủ: ${state.gioSongTuanNay.ngu}h`}
          >
            Ngủ {state.gioSongTuanNay.ngu}h
          </div>
          <div
            className="stacked-segment stacked-segment--lunch"
            style={{ flex: state.gioSongTuanNay.hop }}
            title={`Họp: ${state.gioSongTuanNay.hop}h`}
          >
            Họp {state.gioSongTuanNay.hop}h
          </div>
          <div
            className="stacked-segment stacked-segment--break"
            style={{ flex: state.gioSongTuanNay.giaiLao }}
            title={`Giải lao: ${state.gioSongTuanNay.giaiLao}h`}
          >
            Nghỉ {state.gioSongTuanNay.giaiLao}h
          </div>
          <div
            className="stacked-segment stacked-segment--fun"
            style={{ flex: state.gioSongTuanNay.giaiTri }}
            title={`Giải trí: ${state.gioSongTuanNay.giaiTri}h`}
          >
            Chơi {state.gioSongTuanNay.giaiTri}h
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
            <span>Làm việc ({state.gioSongTuanNay.lamViec}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
            <span>Ngủ ({state.gioSongTuanNay.ngu}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            <span>Họp ({state.gioSongTuanNay.hop}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></span>
            <span>Giải lao ({state.gioSongTuanNay.giaiLao}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
            <span>Giải trí ({state.gioSongTuanNay.giaiTri}h)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
