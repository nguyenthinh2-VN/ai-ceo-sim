'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { getCeoStatusDisplay, CeoStatusDisplay } from '@/lib/format';

/** Nhịp gõ từng ký tự, thời gian giữ nguyên dòng, và thời gian mờ dần. */
const TYPING_MS = 35;
const HOLD_MS = 4500;
const FADE_MS = 350;

/** Pha của dòng terminal: đang gõ -> giữ nguyên -> mờ đi -> sang dòng kế. */
type TypewriterPhase = 'typing' | 'holding' | 'fading';

interface TypewriterState {
  index: number;
  charCount: number;
  phase: TypewriterPhase;
}

interface TerminalMonitorProps {
  ceoStatus?: CeoStatusDisplay;
  isSleeping?: boolean;
  aiName: string;
  currentPlan?: string;
  currentReason?: string;
  latestDiary?: string;
  isDemo?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
}

export function TerminalMonitor({
  ceoStatus,
  isSleeping,
  aiName,
  currentPlan,
  currentReason,
  latestDiary,
  isDemo = false,
  onTypingChange,
}: TerminalMonitorProps) {
  const currentStatus =
    ceoStatus ||
    getCeoStatusDisplay(
      isSleeping ? { hoatDongHienTai: 'Đang ngủ', trangThai: 'NGU' } : null
    );

  const isWorking = currentStatus.isWorking;

  const [typer, setTyper] = useState<TypewriterState>({
    index: 0,
    charCount: 0,
    phase: 'typing',
  });

  useEffect(() => {
    onTypingChange?.(typer.phase === 'typing' && isWorking);
  }, [typer.phase, isWorking, onTypingChange]);

  const restLogs = useMemo(() => {
    if (currentStatus.label === 'Đang nghỉ trưa') {
      return [
        'Đang nghỉ trưa ăn uống và nạp lại năng lượng.',
        `${aiName} đang nghỉ trưa cùng team. Tiếp tục làm việc lúc 13h00.`,
        'Tạm dừng code giờ trưa, phục hồi tinh thần sẵn sàng cho ca chiều.',
      ];
    }
    if (currentStatus.label === 'Đang ngủ') {
      return [
        'Đang ngủ nạp lại năng lượng. Zzz...',
        `${aiName} đang ngủ say. Sẽ bắt đầu ngày làm việc mới vào sáng mai.`,
        'Server và hệ thống vẫn chạy ngầm, CEO đang nghỉ ngơi dưỡng sức.',
      ];
    }
    // 'Đang nghỉ ngơi' (giờ giải trí 18-23h)
    return [
      'Đang nghỉ ngơi / thư giãn buổi tối sau giờ làm việc.',
      `${aiName} đang nghỉ ngơi, xả hơi và chuẩn bị tinh thần cho ngày mới.`,
      'Hết giờ làm việc hành chính, tạm gác công việc để cân bằng cuộc sống.',
    ];
  }, [aiName, currentStatus.label]);


  const dynamicWorkLogs = useMemo(() => {
    const list: string[] = [];
    if (currentPlan) list.push(currentPlan);
    if (currentReason) list.push(currentReason);
    if (latestDiary) list.push(latestDiary);
    if (list.length === 0) {
      list.push(`Đang kiểm tra server, tài chính và lập kế hoạch vận hành công ty.`);
      list.push(`Tập trung triển khai hợp đồng và tối ưu hóa chi phí hàng tháng.`);
    }
    return list;
  }, [currentPlan, currentReason, latestDiary]);

  const activePool = !isWorking ? restLogs : dynamicWorkLogs;
  const fullText = activePool[typer.index % activePool.length];

  // Nguồn dữ liệu đổi (AI thức/ngủ, kế hoạch mới) thì dòng đang gõ không còn
  // thuộc pool mới — quay về đầu pool thay vì gõ tiếp một câu của ngữ cảnh cũ.
  //
  // Điều chỉnh state ngay trong lúc render là cách React chỉ định cho trường
  // hợp "state phụ thuộc prop": React render lại ngay, chưa commit, nên người
  // xem không thấy khung hình trung gian. Dùng useEffect ở đây sẽ tạo thêm
  // một lượt render thừa và bị eslint coi là setState trong effect.
  const [poolAtLastReset, setPoolAtLastReset] = useState(activePool);
  if (poolAtLastReset !== activePool) {
    setPoolAtLastReset(activePool);
    setTyper({ index: 0, charCount: 0, phase: 'typing' });
  }

  // Hiệu ứng máy đánh chữ.
  //
  // Một effect duy nhất lo cả ba pha, mỗi pha là một timer riêng và mọi
  // setState đều nằm TRONG callback của timer — không có setState đồng bộ
  // trong thân effect, nên không sinh render dây chuyền.
  //
  // Bản cũ trả hàm dọn dẹp từ bên trong callback setInterval: React không
  // bao giờ gọi tới nó, nên timer hẹn giờ cũ vẫn sống sau khi unmount.
  useEffect(() => {
    if (typer.phase === 'holding') {
      const holdTimer = setTimeout(
        () => setTyper((prev) => ({ ...prev, phase: 'fading' })),
        HOLD_MS
      );
      return () => clearTimeout(holdTimer);
    }

    if (typer.phase === 'fading') {
      const fadeTimer = setTimeout(
        () =>
          setTyper((prev) => ({
            index: (prev.index + 1) % activePool.length,
            charCount: 0,
            phase: 'typing',
          })),
        FADE_MS
      );
      return () => clearTimeout(fadeTimer);
    }

    // phase === 'typing'
    if (typer.charCount >= fullText.length) {
      // Gõ xong: chờ một nhịp rồi mới mờ. Đặt trong timer để không setState
      // đồng bộ ngay trong thân effect.
      const settleTimer = setTimeout(
        () => setTyper((prev) => ({ ...prev, phase: 'holding' })),
        0
      );
      return () => clearTimeout(settleTimer);
    }

    const typingTimer = setTimeout(
      () => setTyper((prev) => ({ ...prev, charCount: prev.charCount + 1 })),
      TYPING_MS
    );
    return () => clearTimeout(typingTimer);
  }, [typer, fullText, activePool.length]);

  const displayedText = fullText.slice(0, typer.charCount);
  const isFading = typer.phase === 'fading';

  return (
    <div className="relative flex flex-col items-center justify-end flex-1 min-w-0 max-w-[430px]">
      {/* Badge "CHẠY THỬ" or "TỰ HÀNH" taped on top-right corner of monitor */}
      <div className={`absolute -top-2.5 -right-1 sm:-top-3.5 sm:-right-3 z-30 font-extrabold text-[9px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border sm:border-2 rotate-[10deg] shadow-md uppercase tracking-wider select-none ${isDemo
        ? 'bg-white text-[#C26715] border-[#C26715]'
        : 'bg-emerald-50 text-emerald-700 border-emerald-600'
        }`}>
        {isDemo ? 'CHẠY THỬ' : 'TỰ HÀNH'}
      </div>

      {/* Monitor Chassis with Ambient Glow */}
      <div className={`w-full bg-[#24262D] rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 shadow-2xl border border-[#373A44] relative z-10 transition-shadow duration-700 ${!isWorking
        ? 'shadow-[0_8px_30px_rgba(168,85,247,0.18)]'
        : 'shadow-[0_8px_30px_rgba(16,185,129,0.22)]'
        }`}>
        {/* Monitor Top Bezel dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 pb-1 sm:pb-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF5F56]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FFBD2E]" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#27C93F]" />
          <span className="text-[9px] sm:text-[11px] font-mono text-stone-400 ml-1.5 sm:ml-2 truncate">
            terminal — {aiName.toLowerCase()}@ceo {currentStatus.tag}
          </span>
        </div>

        {/* Monitor Screen: TYPEWRITER EFFECT */}
        <div className="bg-[#15171D] rounded sm:rounded-lg p-2 sm:p-3.5 pb-7 sm:pb-8 min-h-[95px] sm:min-h-[140px] font-mono text-[11px] sm:text-[13px] text-[#A6AFBE] relative flex flex-col justify-start">
          <div
            className={`font-bold mb-0.5 sm:mb-1 text-xs sm:text-sm ${!isWorking ? 'text-purple-400' : 'text-emerald-400'
              }`}
          >
            {currentStatus.promptSymbol}
          </div>
          <div
            className={`transition-opacity duration-300 leading-snug sm:leading-relaxed ${isFading ? 'opacity-0' : 'opacity-100'
              }`}
          >
            <span className={!isWorking ? 'text-purple-200 font-medium' : ''}>
              {displayedText || (!isWorking ? `${currentStatus.label}...` : 'Đang xử lý công việc...')}
            </span>
            <span
              className={`inline-block w-1.5 sm:w-2 h-3.5 sm:h-4 animate-pulse align-middle ml-1 ${!isWorking ? 'bg-purple-400' : 'bg-emerald-400'
                }`}
            />
          </div>

          {/* Read-only status indicator */}
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-20 text-[10px] sm:text-xs font-mono font-medium text-stone-400 select-none flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded">
            <span
              className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`}
            />
            <span>{currentStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Monitor Stand & Foot */}
      <div className="w-8 sm:w-12 h-3.5 sm:h-6 bg-gradient-to-b from-[#A6B2BD] to-[#8895A2] mx-auto" />
      <div className="w-20 sm:w-32 h-1.5 sm:h-2 bg-gradient-to-b from-[#B5C0CA] to-[#929FA9] mx-auto rounded-full" />

      {/* Blue Coffee Mug with fish icon & rising steam on desk */}
      <div className="absolute -right-2 sm:-right-5 bottom-0 w-6 h-7 sm:w-8 sm:h-9 bg-[#2563EB] rounded-b sm:rounded-b-md border border-[#1D4ED8] flex items-center justify-center shadow-md z-15 group cursor-pointer" title="Cốc nước năng lượng của CEO ☕">
        {/* Tiny rising steam above blue mug */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 steam-wave animate-steam-2 opacity-70" />
        <span className="text-white text-[10px] sm:text-xs select-none animate-fish-wiggle group-hover:scale-125 transition-transform">🐟</span>
        <div className="absolute -right-1.5 sm:-right-2 top-1 sm:top-2 w-2 sm:w-2.5 h-3 sm:h-4 border-2 border-[#2563EB] border-l-0 rounded-r" />
      </div>
    </div>
  );
}
