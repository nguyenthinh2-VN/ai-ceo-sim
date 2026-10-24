'use client';

import React from 'react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  aiName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({
  isOpen,
  aiName,
  onConfirm,
  onCancel,
}: ResetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 max-w-sm w-full p-6 shadow-2xl">
        <h3 className="text-base font-bold text-stone-900 mb-2">Tạo AI CEO thế hệ mới?</h3>
        <p className="text-xs text-stone-600 leading-relaxed mb-5">
          Bạn có chắc chắn muốn kết thúc nhiệm kỳ của <span className="font-bold">{aiName}</span> và tạo một AI CEO ngẫu nhiên mới với 500.000.000đ tiền vốn ban đầu?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Tạo AI Mới
          </button>
        </div>
      </div>
    </div>
  );
}
