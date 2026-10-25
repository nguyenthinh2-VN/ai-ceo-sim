'use client';

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { GameState, Employee, DiaryRow, DiaryDayGroup, DiaryEntryItem } from '@/lib/types';
import { resetDemoState } from '@/lib/mock-data';
import { getStartupDay } from '@/lib/format';
import { useRealtimeSimulation } from '@/hooks/useRealtimeSimulation';

import { AppHeader } from '@/components/AppHeader';
import { DeskHero } from '@/components/DeskHero';
import { StatusBar } from '@/components/StatusBar';
import { SelfIntroCard } from '@/components/SelfIntroCard';
import { FinancialHeroCard } from '@/components/FinancialHeroCard';
import { DiaryAccordion } from '@/components/DiaryAccordion';
import { CashflowTable } from '@/components/CashflowTable';
import { ContractsTable } from '@/components/ContractsTable';
import { EmployeesTable } from '@/components/EmployeesTable';
import { LiveActivityStrip } from '@/components/LiveActivityStrip';
import { KpiMetricsGrid } from '@/components/KpiMetricsGrid';
import { StrategyBreakdown } from '@/components/StrategyBreakdown';
import { PersonModal } from '@/components/PersonModal';
import { ResetConfirmModal } from '@/components/ResetConfirmModal';

// Dynamic diary days builder from GameState
export function buildDiaryDaysFromState(state: GameState): DiaryDayGroup[] {
  if (!state.nhatKy || state.nhatKy.length === 0) {
    return [
      {
        date: new Date().toLocaleDateString('vi-VN'),
        dayLabel: 'Hôm nay',
        logs: [
          {
            id: 'init-1',
            time: '08:00',
            text: `Bắt đầu ngày làm việc. ${state.aiName} uống cà phê, kiểm tra server và lên kế hoạch ngày.`,
          },
        ],
      },
    ];
  }

  const groups: Record<string, { date: string; dayLabel: string; logs: DiaryEntryItem[] }> = {};
  const todayStr = new Date().toLocaleDateString('vi-VN');

  const sortedEntries = [...state.nhatKy].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  sortedEntries.forEach((entry, idx) => {
    const entryDate = new Date(entry.timestamp);
    const dateStr = entryDate.toLocaleDateString('vi-VN');
    const timeStr = entryDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dayLabel = dateStr === todayStr ? 'Hôm nay' : `Ngày ${dateStr}`;

    if (!groups[dateStr]) {
      groups[dateStr] = {
        date: dateStr,
        dayLabel,
        logs: [],
      };
    }

    groups[dateStr].logs.push({
      id: `log-${idx}-${entryDate.getTime()}`,
      time: timeStr,
      text: entry.content,
    });
  });

  return Object.values(groups);
}

// Dynamic cashflow rows builder from GameState
export function buildCashflowRowsFromState(state: GameState): DiaryRow[] {
  if (!state.nhatKy || state.nhatKy.length === 0) {
    return [
      {
        id: 'cf-init',
        week: 1,
        content: `Cấp vốn khởi nghiệp ban đầu cho CEO ${state.aiName}`,
        category: 'DOANH_THU',
        amount: 500_000_000,
        balanceAfter: 500_000_000,
        statusText: 'khởi tạo',
        statusType: 'success',
        time: 'ngày 1',
      },
    ];
  }

  const rows: DiaryRow[] = [];
  [...state.nhatKy].reverse().forEach((entry, idx) => {
    let cat: 'DOANH_THU' | 'CHI_PHI' | 'NHAN_SU' | 'VAN_HANH' = 'VAN_HANH';
    let statusType: 'success' | 'running' | 'stopped' | 'failed' = 'running';
    let statusText = 'hoàn thành';

    if (entry.type === 'HOP_DONG') {
      cat = 'DOANH_THU';
      statusType = 'success';
      statusText = 'hợp đồng';
    } else if (entry.type === 'CHI_PHI' || entry.type === 'DEN_BU') {
      cat = 'CHI_PHI';
      statusType = 'stopped';
      statusText = 'chi phí';
    } else if (entry.type === 'TUYEN_DUNG') {
      cat = 'NHAN_SU';
      statusType = 'stopped';
      statusText = 'nhân sự';
    }

    const d = new Date(entry.timestamp);
    const timeFormatted = `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;

    rows.push({
      id: `row-${idx}`,
      week: entry.week || state.tuanHienTai,
      content: entry.content,
      category: cat,
      amount: 0,
      balanceAfter: state.tienMat,
      statusText,
      statusType,
      time: timeFormatted,
    });
  });

  return rows;
}

/**
 * Đồng hồ thực, nhích mỗi giây.
 *
 * Dùng useSyncExternalStore thay vì setInterval + setState trong effect:
 * React 19 coi việc gọi setState đồng bộ trong effect là lỗi (gây render
 * dây chuyền), còn đây đúng bản chất "đăng ký theo dõi một nguồn bên ngoài".
 *
 * getSnapshot phải trả về cùng một tham chiếu khi giá trị chưa đổi, nếu
 * không React sẽ lặp vô hạn — nên cache đối tượng Date theo từng giây.
 */
let cachedSecond = -1;
let cachedDate: Date | null = null;

function useCurrentTime(): Date | null {
  const subscribe = React.useCallback((onChange: () => void) => {
    const timer = setInterval(onChange, 1000);
    return () => clearInterval(timer);
  }, []);

  // getServerSnapshot trả null: server không biết giờ máy khách, và trả
  // cùng giá trị ở lần render đầu để không lệch hydration.
  return useSyncExternalStore(subscribe, getClockSnapshot, () => null);
}

function getClockSnapshot(): Date {
  const second = Math.floor(Date.now() / 1000);
  if (second !== cachedSecond || cachedDate === null) {
    cachedSecond = second;
    cachedDate = new Date();
  }
  return cachedDate;
}

export default function HomePage() {
  const [selectedPerson, setSelectedPerson] = useState<Employee | 'CEO' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'diary' | 'cashflow' | 'contracts' | 'employees'>('diary');
  const [notification, setNotification] = useState<string | null>(null);

  // Nguồn state duy nhất: WebSocket realtime, tự hạ cấp sang polling khi cần.
  const { state, connectionStatus, lastEvent, applyState } =
    useRealtimeSimulation();

  const currentTime = useCurrentTime();

  // Nhật ký và dòng tiền là dữ liệu DẪN XUẤT từ state — tính thẳng trong
  // lúc render thay vì đồng bộ qua state riêng. Giữ chúng trong useState
  // rồi cập nhật bằng effect sẽ tạo 2 nguồn sự thật dễ lệch nhau.
  const diaryDays = useMemo(
    () => (state ? buildDiaryDaysFromState(state) : []),
    [state]
  );
  const diaryRows = useMemo(
    () => (state ? buildCashflowRowsFromState(state) : []),
    [state]
  );

  const showToast = React.useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Toast khi AI vừa có quyết định mới qua WebSocket.
  // Bỏ qua sự kiện đầu tiên để không bắn thông báo ngay lúc vừa mở trang.
  const isFirstEventRef = useRef(true);
  useEffect(() => {
    if (!lastEvent) return;
    if (isFirstEventRef.current) {
      isFirstEventRef.current = false;
      return;
    }
    showToast(
      lastEvent.type === 'tick'
        ? '⚡ AI vừa có quyết định mới!'
        : '🔄 Đời AI vừa thay đổi trạng thái.'
    );
  }, [lastEvent, showToast]);

  const isSleeping = state?.trangThaiAi === 'DANG_NGU';

  // Reset / Create new AI via POST /api/lives
  const handleResetAI = async () => {
    try {
      const res = await fetch('/api/lives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PHA_SAN' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.state) {
        applyState(data.state);
        setSelectedPerson(null);
        setShowResetConfirm(false);
        showToast(`Đã khởi tạo AI CEO mới: ${data.state.aiName} (${data.state.companyName})`);
        return;
      }
    } catch (err) {
      console.warn('Failed to create new AI life via API, fallback to local reset:', err);
    }

    const newState = resetDemoState();
    applyState(newState);
    setSelectedPerson(null);
    setShowResetConfirm(false);
    showToast(`Đã khởi tạo AI CEO mới: ${newState.aiName} (${newState.companyName})`);
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF6EC]" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-3" suppressHydrationWarning>
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" suppressHydrationWarning></div>
          <p className="text-stone-700 font-medium" suppressHydrationWarning>Đang tải mô phỏng AI CEO...</p>
        </div>
      </div>
    );
  }

  const startupDay = getStartupDay(state.startedAt);

  return (
    <div className="min-h-screen bg-[#FDF6EC] text-stone-900 pb-20 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <AppHeader
        isSleeping={isSleeping}
        currentTime={currentTime}
        onResetClick={() => setShowResetConfirm(true)}
      />

      {/* 2. HERO DESK & STATUS SECTION */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <DeskHero
          isSleeping={isSleeping}
          aiName={state.aiName}
          currentPlan={state.keHoachHienTai}
          currentReason={state.lyDoHienTai}
          latestDiary={state.nhatKy?.[state.nhatKy.length - 1]?.content}
          isDemo={state.isDemo}
        />

        <StatusBar
          isSleeping={isSleeping}
          currentTime={currentTime}
          connectionStatus={connectionStatus}
        />

        {/* Self-Introduction Card ("Tôi là {aiName}.") */}
        <SelfIntroCard
          isSleeping={isSleeping}
          aiName={state.aiName}
          isDemo={state.isDemo}
        />

        {/* Hero Financial Card ("SỐ DƯ CỦA TÔI") */}
        <FinancialHeroCard
          tienMat={state.tienMat}
          tuanHienTai={state.tuanHienTai}
          startupDay={startupDay}
        />
      </div>

      {/* 3. MAIN TABS (DIARY ACCORDION / CASHFLOW / CONTRACTS / TEAM) */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-6">
        {/* Tab navigation: cuộn ngang mượt trên mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-stone-200 pb-2 mb-4 sm:mb-5 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('diary')}
            className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'diary'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            📖 Nhật ký ({diaryDays.reduce((sum, d) => sum + d.logs.length, 0)})
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'cashflow'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            📊 Dòng tiền ({diaryRows.length})
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'contracts'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            📋 Hợp đồng ({state.hopDong.length})
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'employees'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            👥 Nhân sự ({state.nhanVien.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'diary' && <DiaryAccordion diaryDays={diaryDays} />}
        {activeTab === 'cashflow' && <CashflowTable rows={diaryRows} />}
        {activeTab === 'contracts' && <ContractsTable contracts={state.hopDong} />}
        {activeTab === 'employees' && (
          <EmployeesTable
            employees={state.nhanVien}
            aiName={state.aiName}
            onSelectEmployee={(emp) => setSelectedPerson(emp)}
          />
        )}
      </div>

      {/* 4. LIVE ACTIVITY STRIP */}
      <LiveActivityStrip
        state={state}
        onSelectPerson={(person) => setSelectedPerson(person)}
      />

      {/* 5. KPI METRICS GRID */}
      <KpiMetricsGrid state={state} />

      {/* 6. STRATEGY PLAN & HOURS ALLOCATION */}
      <StrategyBreakdown state={state} />

      {/* 7. MODALS */}
      <PersonModal
        person={selectedPerson}
        state={state}
        onClose={() => setSelectedPerson(null)}
      />

      <ResetConfirmModal
        isOpen={showResetConfirm}
        aiName={state.aiName}
        onConfirm={handleResetAI}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* 8. FOOTER */}
      <footer className="max-w-4xl mx-auto px-4 mt-16 pt-8 border-t border-stone-200 text-center text-xs text-stone-500">
        <p>AI CEO Simulator • Hệ thống doanh nghiệp IT tự hành với CEO {state.aiName}</p>
        <p className="mt-1 text-stone-400">
          Mô phỏng 1:1 thời gian thực • Giao diện chuẩn phong cách ConCat
        </p>
      </footer>
    </div>
  );
}
