'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getCeoStatusDisplay, CeoStatusDisplay } from '@/lib/format';
import { TerminalMonitor } from './TerminalMonitor';

interface DeskHeroProps {
  ceoStatus?: CeoStatusDisplay;
  isSleeping?: boolean;
  aiName: string;
  currentPlan?: string;
  currentReason?: string;
  latestDiary?: string;
  isDemo?: boolean;
}

export function DeskHero({
  ceoStatus,
  isSleeping,
  aiName,
  currentPlan,
  currentReason,
  latestDiary,
  isDemo,
}: DeskHeroProps) {
  const currentStatus =
    ceoStatus ||
    getCeoStatusDisplay(
      isSleeping ? { hoatDongHienTai: 'Đang ngủ', trangThai: 'NGU' } : null
    );

  const isWorking = currentStatus.isWorking;
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div className="relative bg-[#E8DCC8] rounded-t-2xl pt-4 sm:pt-8 px-3 sm:px-8 border border-[#D6C7AF] border-b-0 shadow-sm overflow-visible">
      {/* 6. Post-it Note on the wall */}
      <div className="absolute top-2.5 sm:top-4 left-[30%] sm:left-[35%] z-10 select-none flex items-center">
        <div
          className="postit-note bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xs sm:rounded-sm shadow-md rotate-[-5deg] text-[10px] sm:text-[11px] font-bold font-mono tracking-tight flex items-center gap-1.5 group cursor-pointer"
          title="Mục tiêu tối thượng của CEO!"
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700 shadow-xs" />
          <span>🎯 KPI: 1 TỶ VNĐ</span>
        </div>
      </div>

      {/* Stage: 2-column layout (Cat slot on left, PC Monitor on right) */}
      <div className="flex items-end justify-between gap-2.5 sm:gap-6 min-h-[160px] sm:min-h-[240px]">
        {/* Left Column: Cat image slot + Keyboard */}
        <div className="relative flex flex-col items-center justify-end w-[110px] sm:w-[220px] flex-shrink-0">
          {/* 5. Smooth Floating Zzz particles */}
          {!isWorking && (
            <div className="absolute top-1 left-3 sm:top-2 sm:left-6 select-none pointer-events-none z-30 font-bold font-mono text-purple-600">
              <span className="absolute -left-1 top-5 text-xs sm:text-sm animate-zzz-drift-1">z</span>
              <span className="absolute left-2 top-2 text-sm sm:text-base animate-zzz-drift-2">z</span>
              <span className="absolute left-5 -top-1 text-base sm:text-xl animate-zzz-drift-3">Z</span>
            </div>
          )}

          {/* 1. Character Image with Idle / Sleeping Bobbing */}
          <div
            className={`w-[105px] h-[95px] sm:w-[230px] sm:h-[195px] flex items-end justify-center relative ${!isWorking ? 'animate-cat-sleeping' : 'animate-cat-working'
              }`}
          >
            {/* 2. Coffee Cup Steam Waves (rising above the cup in cat's paw) */}
            {isWorking && (
              <div className="absolute left-[18px] sm:left-[42px] bottom-[48px] sm:bottom-[102px] z-20 pointer-events-none">
                <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 steam-wave animate-steam-1" />
                <div className="w-2 sm:w-3 h-2 sm:h-3 steam-wave animate-steam-2 ml-1 -mt-1" />
              </div>
            )}

            <Image
              src={!isWorking ? '/character/sleep.png' : '/character/cat.png'}
              alt={!isWorking ? `${aiName} ${currentStatus.label.toLowerCase()}` : `${aiName} AI CEO`}
              fill
              sizes="(max-width: 640px) 105px, 230px"
              style={{ mixBlendMode: 'multiply', objectFit: 'contain', objectPosition: 'bottom' }}
              className="z-10 transition-all duration-300"
            />
          </div>

          {/* 3. Keyboard on desk with Dynamic Typing LED flash */}
          <div className="w-[98px] sm:w-[190px] h-[11px] sm:h-[16px] bg-[#B0BCC8] rounded border-t border-[#D0D8E0] border-b-2 border-[#8A98A6] flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 -mt-1 z-20 shadow-xs relative">
            {Array.from({ length: 11 }).map((_, i) => {
              const isTappingKey = isTyping && (i === 2 || i === 5 || i === 8);
              const tapClass =
                i === 2 ? 'animate-key-tap-1' : i === 5 ? 'animate-key-tap-2' : 'animate-key-tap-3';
              return (
                <div
                  key={i}
                  className={`h-[5px] sm:h-[8px] flex-1 rounded-[1px] transition-colors duration-150 ${isTappingKey ? tapClass : 'bg-[#E8ECEF]'
                    }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: PC Monitor on stand + Badge + Mug */}
        <TerminalMonitor
          ceoStatus={currentStatus}
          isSleeping={!isWorking}
          aiName={aiName}
          currentPlan={currentPlan}
          currentReason={currentReason}
          latestDiary={latestDiary}
          isDemo={isDemo}
          onTypingChange={setIsTyping}
        />
      </div>

      {/* 7. Mini Desk Plant (Sen đá / Xương rồng mini 🌵) */}
      <div
        className="absolute left-2.5 sm:left-6 bottom-4 sm:bottom-5 z-25 flex flex-col items-center select-none group cursor-pointer"
        title="Chậu cây sen đá phong thủy hút bug 🌱"
      >
        <div className="animate-plant-sway text-sm sm:text-xl filter drop-shadow-xs transform transition-transform group-hover:scale-125">
          🌵
        </div>
        <div className="w-3.5 sm:w-5 h-2.5 sm:h-3.5 bg-[#C2714F] rounded-b-sm border-t-2 border-[#D9825E] border-x border-b border-[#A05333] shadow-xs flex items-center justify-center -mt-0.5">
          <div className="w-2 sm:w-3 h-0.5 bg-[#8C4326] rounded-full opacity-60" />
        </div>
      </div>

      {/* Wooden Desk Plank */}
      <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-[calc(100%+4rem)] sm:-ml-8 h-4 sm:h-5 bg-[#B8843E] border-t-2 border-[#D9A45B] border-b-2 border-[#8A5A1B] shadow-md z-20" />

      {/* Desk Legs */}
      <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-[calc(100%+4rem)] sm:-ml-8 h-8 sm:h-12 pointer-events-none">
        <div className="absolute bottom-0 left-4 sm:left-12 w-3 sm:w-4 h-8 sm:h-12 bg-[#9E6B2A] shadow-inner" />
        <div className="absolute bottom-0 right-4 sm:right-12 w-3 sm:w-4 h-8 sm:h-12 bg-[#9E6B2A] shadow-inner" />
      </div>
    </div>
  );
}
