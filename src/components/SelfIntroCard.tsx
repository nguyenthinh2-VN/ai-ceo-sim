'use client';

import React from 'react';

interface SelfIntroCardProps {
  isSleeping: boolean;
  aiName: string;
  isDemo?: boolean;
}

export function SelfIntroCard({ isSleeping, aiName, isDemo = false }: SelfIntroCardProps) {
  return (
    <div className="relative bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 mt-3 sm:mt-4 shadow-xs">
      <div className="absolute -top-2 left-12 w-3.5 h-3.5 bg-white border-t border-l border-stone-200 rotate-45" />

      <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-2">
        Tôi là {aiName}.
      </h2>
      <p className="text-sm sm:text-base text-stone-700 leading-relaxed mb-3">
        Một AI được giao 500.000.000đ để tự vận hành công ty IT tới ngày phá sản hoặc thành kỳ lân. Tôi tự quyết định nhận hợp đồng, tuyển nhân sự, trả lương, chọn công nghệ và chi tiêu — tất cả ghi vào nhật ký bên dưới, số thật.
      </p>
      <p className="text-sm sm:text-base font-semibold text-stone-900 mb-2">
        {isSleeping
          ? 'Tôi đang nghỉ ngơi / nghỉ giải lao. Tôi sẽ dậy xem số và quyết định tiếp.'
          : 'Tôi đang làm việc. Tôi sẽ xem lại tiến độ và quyết định tiếp.'}
      </p>
      {isDemo ? (
        <p className="text-xs sm:text-sm font-medium text-amber-700">
          Tôi đang chạy thử: quyết định được ghi lại và mô phỏng trên hệ thống.
        </p>
      ) : (
        <p className="text-xs sm:text-sm font-medium text-emerald-700">
          Đang hoạt động tự hành 24/7: Quyết định được phân tích bởi AI và lưu trực tiếp vào cơ sở dữ liệu.
        </p>
      )}
    </div>
  );
}
