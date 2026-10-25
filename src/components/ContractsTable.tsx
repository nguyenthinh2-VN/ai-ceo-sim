'use client';

import React from 'react';
import { Contract } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface ContractsTableProps {
  contracts: Contract[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">
            Hợp đồng & Dự án đang thực hiện
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
            Theo dõi hợp đồng khách hàng, tiến độ bàn giao và giá trị thanh toán
          </p>
        </div>
        <span className="text-[11px] sm:text-xs text-stone-400 font-mono shrink-0">
          {contracts.length} hợp đồng
        </span>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block sm:hidden divide-y divide-stone-100">
        {contracts.map((c) => {
          let statusLabel = 'Đang làm';
          let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          if (c.status === 'BAN_GIAO') {
            statusLabel = 'Chờ nghiệm thu';
            statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
          } else if (c.status === 'HOAN_THANH') {
            statusLabel = 'Đã tất toán';
            statusColor = 'text-stone-600 bg-stone-100 border-stone-200';
          }

          return (
            <div key={c.id} className="p-3.5 space-y-2 hover:bg-stone-50/60 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-stone-900">{c.name}</h4>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {c.id} • {c.clientType} • {c.weeksElapsed}/{c.weeksEstimate} tuần
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor} shrink-0`}>
                  {statusLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                  <span>Tiến độ</span>
                  <span className="font-bold text-stone-800">{c.progress}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, c.progress)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs border-t border-stone-50">
                <span className="text-[11px] text-stone-400">Giá trị / Đã cọc:</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatVND(c.value)}{' '}
                  <span className="text-stone-400 font-normal text-[11px]">
                    (cọc {formatVND(c.advancePaid)})
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Dự án</th>
              <th className="py-3 px-4 text-right">Giá trị hợp đồng</th>
              <th className="py-3 px-4 text-right">Đã cọc (30%)</th>
              <th className="py-3 px-4 text-center">Tiến độ</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
            {contracts.map((c) => {
              let statusLabel = 'đang làm';
              let statusColor = 'text-emerald-600 font-semibold';
              if (c.status === 'BAN_GIAO') {
                statusLabel = 'chờ nghiệm thu';
                statusColor = 'text-amber-600 font-semibold';
              } else if (c.status === 'HOAN_THANH') {
                statusLabel = 'đã tất toán';
                statusColor = 'text-stone-500';
              }

              return (
                <tr key={c.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-stone-900 block">{c.name}</span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {c.id} • {c.clientType} • {c.weeksElapsed}/{c.weeksEstimate} tuần
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                    {formatVND(c.value)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                    {formatVND(c.advancePaid)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="font-bold text-stone-800">{c.progress}%</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
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
