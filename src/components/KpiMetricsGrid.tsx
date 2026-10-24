'use client';

import React from 'react';
import { GameState } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface KpiMetricsGridProps {
  state: GameState;
}

export function KpiMetricsGrid({ state }: KpiMetricsGridProps) {
  const profitThisMonth = state.doanhThuThangNay - state.chiPhiThangNay;
  const isProfitable = profitThisMonth >= 0;

  return (
    <div className="kpi-grid">
      {/* Monthly Revenue */}
      <div className="kpi-card">
        <div className="kpi-label">Doanh thu tháng này</div>
        <div className="kpi-value text-stone-800">
          {formatVND(state.doanhThuThangNay)}
        </div>
        <div className="kpi-sub">Lũy kế: {formatVND(state.doanhThuTichLuy)}</div>
      </div>

      {/* Monthly Cost (Pure Red #DC2626) */}
      <div className="kpi-card">
        <div className="kpi-label">Chi phí tháng này</div>
        <div className="kpi-value text-red-600 font-bold">
          {formatVND(state.chiPhiThangNay)}
        </div>
        <div className="kpi-sub">Lũy kế: {formatVND(state.chiPhiTichLuy)}</div>
      </div>

      {/* Safe Runway */}
      <div className="kpi-card">
        <div className="kpi-label">Runway an toàn</div>
        <div className="kpi-value text-amber-600">
          {state.chiPhiThangNay > 0
            ? `${(state.tienMat / state.chiPhiThangNay).toFixed(1)} tháng`
            : '∞'}
        </div>
        <div className="kpi-sub">Vốn an toàn tối thiểu 3 tháng</div>
      </div>

      {/* Monthly Profit/Loss */}
      <div className="kpi-card">
        <div className="kpi-label">Lợi nhuận tháng</div>
        <div
          className={`kpi-value font-bold ${isProfitable ? 'text-emerald-600' : 'text-red-600'
            }`}
        >
          {formatVND(profitThisMonth)}
        </div>
        <div className="kpi-sub">
          {state.thangLienTiepLo > 0 ? (
            <span className="text-red-600 font-semibold">
              Lỗ liên tiếp: {state.thangLienTiepLo} tháng
            </span>
          ) : (
            'Đang có lãi'
          )}
        </div>
      </div>

      {/* Team Headcount */}
      <div className="kpi-card">
        <div className="kpi-label">Quy mô nhân sự</div>
        <div className="kpi-value text-stone-800">
          {state.nhanVien.length + 1}{' '}
          <span className="text-xs font-normal text-stone-500">người</span>
        </div>
        <div className="kpi-sub">{state.aiName} CEO + {state.nhanVien.length} nhân viên</div>
      </div>

      {/* Office */}
      <div className="kpi-card">
        <div className="kpi-label">Văn phòng</div>
        <div className="kpi-value text-stone-800 text-base truncate">
          {state.vanPhong}
        </div>
        <div className="kpi-sub">Chi phí: 0đ/tháng (Wrangling)</div>
      </div>
    </div>
  );
}
