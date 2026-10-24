'use client';

import React, { useState, useEffect, useMemo } from 'react';

// Pool of thoughts when working
const WORK_LOG_POOL = [
  '14:00 Lại vừa nhắm trúng món TTTKKCN siêu hót, quyết định xếp vào hàng chờ dựng web và quay video thử nghiệm xem sao. Tôi chọn sản phẩm mới TTTKKCN, đưa vào hàng chờ',
  '14:30 Kiểm tra số dư: tiền mặt an toàn 385.000.000đ, đủ runway hơn 5 tháng vận hành.',
  '15:15 Khách hàng HD-002 xem demo quản lý kho và phản hồi rất tích cực, chuẩn bị nghiệm thu.',
  '16:00 Nhắc nhở Lan và Hùng giữ sức khỏe, không cày đêm quá sức, duy trì năng lượng cao.',
  '16:45 Đang nghiên cứu mở rộng dịch vụ cloud & AI cho các doanh nghiệp vừa và nhỏ.',
];

interface TerminalMonitorProps {
  isSleeping: boolean;
  aiName: string;
}

export function TerminalMonitor({
  isSleeping,
  aiName,
}: TerminalMonitorProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [logIndex, setLogIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const restLogs = useMemo(
    () => [
      'Đang nghỉ ngơi / nghỉ giải lao. Zzz...',
      `Đang nghỉ ngơi / nghỉ giải lao. ${aiName} đang ngủ nạp lại năng lượng sau giờ làm việc.`,
      'Đang nghỉ ngơi / nghỉ giải lao. Tạm dừng code, chờ đến 18:00 xem lại tiến độ.',
    ],
    [aiName]
  );

  const activePool = isSleeping ? restLogs : WORK_LOG_POOL;

  // Typewriter effect
  useEffect(() => {
    const fullText = activePool[logIndex % activePool.length];
    let charIndex = 0;
    setDisplayedText('');
    setIsFading(false);

    const typingTimer = setInterval(() => {
      if (charIndex < fullText.length) {
        charIndex++;
        setDisplayedText(fullText.slice(0, charIndex));
      } else {
        clearInterval(typingTimer);
        const pauseTimer = setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setLogIndex((prev) => (prev + 1) % activePool.length);
          }, 350);
        }, 4500);

        return () => clearTimeout(pauseTimer);
      }
    }, 35);

    return () => clearInterval(typingTimer);
  }, [logIndex, isSleeping, activePool]);

  return (
    <div className="relative flex flex-col items-center justify-end flex-1 min-w-0 max-w-[430px]">
      {/* Badge "CHẠY THỬ" taped on top-right corner of monitor */}
      <div className="absolute -top-2.5 -right-1 sm:-top-3.5 sm:-right-3 z-30 bg-white text-[#C26715] font-extrabold text-[9px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border sm:border-2 border-[#C26715] rotate-[10deg] shadow-md uppercase tracking-wider select-none">
        CHẠY THỬ
      </div>

      {/* Monitor Chassis */}
      <div className="w-full bg-[#24262D] rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 shadow-2xl border border-[#373A44] relative z-10">
        {/* Monitor Top Bezel dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 pb-1 sm:pb-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF5F56]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFBD2E]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#27C93F]" />
          <span className="text-[9px] sm:text-[11px] font-mono text-stone-400 ml-1.5 sm:ml-2 truncate">
            terminal — {aiName.toLowerCase()}@ceo {isSleeping ? '[NGHỈ NGƠI]' : '[WORK]'}
          </span>
        </div>

        {/* Monitor Screen: TYPEWRITER EFFECT */}
        <div className="bg-[#15171D] rounded sm:rounded-lg p-2 sm:p-3.5 pb-7 sm:pb-8 min-h-[95px] sm:min-h-[140px] font-mono text-[11px] sm:text-[13px] text-[#A6AFBE] relative flex flex-col justify-start">
          <div
            className={`font-bold mb-0.5 sm:mb-1 text-xs sm:text-sm ${isSleeping ? 'text-purple-400' : 'text-emerald-400'
              }`}
          >
            {isSleeping ? '💤 >' : '>'}
          </div>
          <div
            className={`transition-opacity duration-300 leading-snug sm:leading-relaxed ${isFading ? 'opacity-0' : 'opacity-100'
              }`}
          >
            <span className={isSleeping ? 'text-purple-200 font-medium' : ''}>
              {displayedText || (isSleeping ? 'Đang nghỉ ngơi / nghỉ giải lao...' : 'Đang xử lý công việc...')}
            </span>
            <span
              className={`inline-block w-1.5 sm:w-2 h-3.5 sm:h-4 animate-pulse align-middle ml-1 ${isSleeping ? 'bg-purple-400' : 'bg-emerald-400'
                }`}
            />
          </div>

          {/* Read-only status indicator */}
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-20 text-[10px] sm:text-xs font-mono font-medium text-stone-400 select-none flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isSleeping ? 'bg-purple-400' : 'bg-emerald-400 animate-pulse'
                }`}
            />
            <span>{isSleeping ? 'Đang ngủ' : 'Đang làm'}</span>
          </div>
        </div>
      </div>

      {/* Monitor Stand & Foot */}
      <div className="w-8 sm:w-12 h-3.5 sm:h-6 bg-gradient-to-b from-[#A6B2BD] to-[#8895A2] mx-auto" />
      <div className="w-20 sm:w-32 h-1.5 sm:h-2 bg-gradient-to-b from-[#B5C0CA] to-[#929FA9] mx-auto rounded-full" />

      {/* Blue Coffee Mug with fish icon on desk */}
      <div className="absolute -right-2 sm:-right-5 bottom-0 w-6 h-7 sm:w-8 sm:h-9 bg-[#2563EB] rounded-b sm:rounded-b-md border border-[#1D4ED8] flex items-center justify-center shadow-md z-15">
        <span className="text-white text-[10px] sm:text-xs select-none">🐟</span>
        <div className="absolute -right-1.5 sm:-right-2 top-1 sm:top-2 w-2 sm:w-2.5 h-3 sm:h-4 border-2 border-[#2563EB] border-l-0 rounded-r" />
      </div>
    </div>
  );
}
