'use client';

import React from 'react';
import { DiaryRow } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface CashflowTableProps {
  rows: DiaryRow[];
}

export function CashflowTable({ rows }: CashflowTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">
            Bảng dòng tiền & Biến động tài chính
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
            Số tiền và số dư được phân tách rõ ràng, dễ theo dõi và đối soát
          </p>
        </div>
        <span className="text-[11px] sm:text-xs text-stone-400 font-mono shrink-0">
          {rows.length} giao dịch
        </span>
      </div>

      {/* MOBILE CARD VIEW: hiển thị khi màn hình < sm (640px) */}
      <div className="block sm:hidden divide-y divide-stone-100">
        {rows.map((row) => {
          const isPositive = row.amount > 0;
          const isNegative = row.amount < 0;

          return (
            <div key={row.id} className="p-3.5 space-y-2 hover:bg-stone-50/60 transition">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                  Tuần {row.week}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {row.time}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                {row.content}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs border-t border-stone-50">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-400">Biến động:</span>
                  <span className="font-mono font-bold">
                    {isPositive && (
                      <span className="text-emerald-600">+{formatVND(row.amount)}</span>
                    )}
                    {isNegative && (
                      <span className="text-red-600">-{formatVND(Math.abs(row.amount))}</span>
                    )}
                    {!isPositive && !isNegative && (
                      <span className="text-stone-400">0đ</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-400">Số dư:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatVND(row.balanceAfter)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW: hiển thị khi màn hình >= sm */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Nội dung hoạt động</th>
              <th className="py-3 px-4 text-right">Biến động (VND)</th>
              <th className="py-3 px-4 text-right">Số dư sau đó</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
            {rows.map((row) => {
              const isPositive = row.amount > 0;
              const isNegative = row.amount < 0;

              let statusClass = 'text-stone-500';
              if (row.statusType === 'running') statusClass = 'text-emerald-600 font-semibold';
              if (row.statusType === 'success') statusClass = 'text-stone-600';
              if (row.statusType === 'stopped') statusClass = 'text-stone-500';

              return (
                <tr key={row.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-stone-900">Tuần {row.week}</span>
                    <span className="block text-[11px] text-stone-400 font-mono mt-0.5">
                      {row.time}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-md font-medium text-stone-800 leading-snug">
                    {row.content}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                    {isPositive && (
                      <span className="text-emerald-600">+{formatVND(row.amount)}</span>
                    )}
                    {isNegative && (
                      <span className="text-red-600 font-bold">{formatVND(row.amount)}</span>
                    )}
                    {!isPositive && !isNegative && (
                      <span className="text-stone-400">0đ</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-stone-700">
                    {formatVND(row.balanceAfter)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`text-xs ${statusClass}`}>{row.statusText}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
