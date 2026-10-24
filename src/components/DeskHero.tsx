'use client';

import React from 'react';
import { TerminalMonitor } from './TerminalMonitor';

interface DeskHeroProps {
  isSleeping: boolean;
  aiName: string;
}

export function DeskHero({
  isSleeping,
  aiName,
}: DeskHeroProps) {
  return (
    <div className="relative bg-[#E8DCC8] rounded-t-2xl pt-4 sm:pt-8 px-3 sm:px-8 border border-[#D6C7AF] border-b-0 shadow-sm overflow-visible">
      {/* Stage: 2-column layout (Cat slot on left, PC Monitor on right) */}
      <div className="flex items-end justify-between gap-2.5 sm:gap-6 min-h-[160px] sm:min-h-[240px]">
        {/* Left Column: Cat image slot + Keyboard */}
        <div className="relative flex flex-col items-center justify-end w-[110px] sm:w-[220px] flex-shrink-0">
          {/* Floating Zzz */}
          {isSleeping && (
            <div className="absolute top-1 left-2 sm:top-2 sm:left-4 text-purple-700 font-extrabold select-none pointer-events-none z-30">
              <span className="text-lg sm:text-2xl animate-pulse block">Z</span>
              <span className="text-xs sm:text-base animate-pulse block ml-2 sm:ml-3 delay-300">z</span>
            </div>
          )}

          {/* Character Image slot (Working: cat.png | Resting: sleep.png) */}
          <div className="w-[105px] h-[95px] sm:w-[230px] sm:h-[195px] flex items-end justify-center relative">
            <img
              src={isSleeping ? '/character/sleep.png' : '/character/cat.png'}
              alt={isSleeping ? `${aiName} đang nghỉ ngơi / nghỉ giải lao` : `${aiName} AI CEO`}
              style={{ mixBlendMode: 'multiply' }}
              className="max-h-full max-w-full object-contain object-bottom z-10 transition-all duration-300"
            />
          </div>

          {/* Keyboard on the desk (without 2 white paw dots) */}
          <div className="w-[98px] sm:w-[190px] h-[11px] sm:h-[16px] bg-[#B0BCC8] rounded border-t border-[#D0D8E0] border-b-2 border-[#8A98A6] flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 -mt-1 z-20 shadow-xs relative">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-[5px] sm:h-[8px] flex-1 bg-[#E8ECEF] rounded-[1px]" />
            ))}
          </div>
        </div>

        {/* Right Column: PC Monitor on stand + Badge + Mug */}
        <TerminalMonitor
          isSleeping={isSleeping}
          aiName={aiName}
        />
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
