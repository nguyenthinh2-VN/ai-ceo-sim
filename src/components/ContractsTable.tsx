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
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Hợp đồng & Dự án đang thực hiện
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Theo dõi hợp đồng khách hàng, tiến độ bàn giao và giá trị thanh toán
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
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
