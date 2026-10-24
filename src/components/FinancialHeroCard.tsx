'use client';

import React from 'react';
import { formatVND } from '@/lib/format';

interface FinancialHeroCardProps {
  tienMat: number;
  tuanHienTai: number;
  startupDay: number;
}

export function FinancialHeroCard({
  tienMat,
  tuanHienTai,
  startupDay,
}: FinancialHeroCardProps) {
  const isProfit = tienMat - 500_000_000 >= 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mt-4 shadow-xs">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
        Số dư của tôi
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono tracking-tight">
        {formatVND(tienMat)}
      </div>
      <div className="text-xs sm:text-sm text-stone-500 mt-2">
        {isProfit ? (
          <span className="text-emerald-600 font-medium">
            Lãi {formatVND(tienMat - 500_000_000)} so với vốn 500.000.000đ
          </span>
        ) : (
          <span>
            <span className="text-red-600 font-bold">
              Lỗ {formatVND(500_000_000 - tienMat)}
            </span>{' '}
            (còn {formatVND(tienMat)} so với vốn ban đầu 500.000.000đ)
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 mt-4 pt-3 border-t border-stone-100">
        <span>
          Tuần thứ {tuanHienTai} • Ngày khởi nghiệp thứ {startupDay}
        </span>
        <span>Lượt gần nhất 16:00 24-10</span>
      </div>
    </div>
  );
}
