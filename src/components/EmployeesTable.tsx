'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface EmployeesTableProps {
  employees: Employee[];
  aiName: string;
  onSelectEmployee: (emp: Employee) => void;
}

export function EmployeesTable({
  employees,
  aiName,
  onSelectEmployee,
}: EmployeesTableProps) {
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">Đội ngũ nhân sự công ty</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Nhân viên do CEO {aiName} trực tiếp quản lý và phân công công việc
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-stone-700">
          Tổng lương: {formatVND(totalSalary)}/tháng
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Họ tên & Vai trò</th>
              <th className="py-3 px-4">Nhiệm vụ đang làm</th>
              <th className="py-3 px-4 text-center">Kỹ năng</th>
              <th className="py-3 px-4 text-right">Lương cứng</th>
              <th className="py-3 px-4 text-center">Tinh thần</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className="hover:bg-stone-50/80 transition cursor-pointer"
              >
                <td className="py-3.5 px-4">
                  <span className="font-bold text-stone-900 block">{emp.name}</span>
                  <span className="text-[11px] text-stone-500">{emp.role}</span>
                </td>
                <td className="py-3.5 px-4 text-stone-700 max-w-xs truncate">
                  {emp.hoatDongHienTai}
                </td>
                <td className="py-3.5 px-4 text-center text-amber-500">
                  {'★'.repeat(emp.skill)}{'☆'.repeat(5 - emp.skill)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                  {formatVND(emp.salary)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-medium text-emerald-600">
                  {emp.morale}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
