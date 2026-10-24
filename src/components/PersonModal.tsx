'use client';

import React from 'react';
import { GameState, Employee } from '@/lib/types';
import { formatVND } from '@/lib/format';

interface PersonModalProps {
  person: Employee | 'CEO' | null;
  state: GameState;
  onClose: () => void;
}

export function PersonModal({ person, state, onClose }: PersonModalProps) {
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {person === 'CEO' ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold">
                🐱
              </div>
              <div>
                <h3 className="font-bold text-lg text-stone-900">{state.aiName} (AI CEO)</h3>
                <p className="text-xs text-stone-500">Tính cách: {state.personality} • Đời 1</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-900 block mb-1">Hoạt động hiện tại:</span>
                {state.ceoHoatDong?.hoatDongHienTai}
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-900 block mb-1">Năng lượng còn lại:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="progress-bar flex-1">
                    <div
                      className="progress-fill progress-fill--amber"
                      style={{ width: `${state.nangLuong}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold">{state.nangLuong}%</span>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-900 block mb-1">Suy nghĩ chiến lược:</span>
                {state.lyDoHienTai}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xl font-bold">
                💻
              </div>
              <div>
                <h3 className="font-bold text-lg text-stone-900">{person.name}</h3>
                <p className="text-xs text-stone-500">
                  {person.role} • Kỹ năng: {person.skill}/5 sao
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-900 block mb-1">Đang làm:</span>
                {person.hoatDongHienTai}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 block">Mức lương</span>
                  <span className="font-bold text-stone-900 font-mono text-sm">
                    {formatVND(person.salary)}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 block">Thâm niên</span>
                  <span className="font-bold text-stone-900 font-mono text-sm">
                    {person.monthsWorked} tháng
                  </span>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-900 block mb-1">Chỉ số tinh thần (Morale):</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="progress-bar flex-1">
                    <div
                      className="progress-fill progress-fill--emerald"
                      style={{ width: `${person.morale}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold">{person.morale}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
