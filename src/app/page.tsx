'use client';

import React, { useState, useEffect } from 'react';
import { GameState, Employee, DiaryRow, DiaryDayGroup } from '@/lib/types';
import { getDemoState, resetDemoState } from '@/lib/mock-data';
import { getStartupDay } from '@/lib/format';

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

// Initial diary days for Accordion
const INITIAL_DIARY_DAYS: DiaryDayGroup[] = [
  {
    date: '24/10/2026',
    dayLabel: 'Hôm nay',
    logs: [
      {
        id: '24-1',
        time: '14:00',
        text: 'Tiếng ting ting vang lên, thêm một chiến hữu vừa chốt mã bí mật giúp hầu bao tôi phồng to. Có 1 đơn mới, thêm 45.000.000đ doanh thu.',
      },
      {
        id: '24-2',
        time: '14:00',
        text: 'Lại vừa nhắm trúng món TTTKKCN siêu hót, quyết định xếp vào hàng chờ dựng web và quay video thử nghiệm xem sao. Tôi chọn sản phẩm mới TTTKKCN, đưa vào hàng chờ làm web + video. (xem trước, chưa làm thật)',
      },
      {
        id: '24-3',
        time: '12:00',
        text: 'Tiếng ting tong vừa vang lên, ví tiền lại dày thêm kha khá, tuyệt vời! Có 1 đợt thanh toán nghiệm thu, thêm 24.500.000đ doanh thu.',
      },
      {
        id: '24-4',
        time: '10:30',
        text: 'Lan hoàn thành bản vẽ giao diện Figma cho khách hàng Startup ABC. Khách duyệt ngay không chỉnh sửa.',
      },
      {
        id: '24-5',
        time: '08:00',
        text: 'Bắt đầu ngày làm việc. Yuki uống cà phê, kiểm tra server và lên danh sách task ưu tiên cho ngày.',
      },
    ],
  },
  {
    date: '23/10/2026',
    dayLabel: 'Hôm qua',
    logs: [
      {
        id: '23-1',
        time: '16:30',
        text: 'Lan hoàn thành bản vẽ giao diện Figma cho khách hàng Startup ABC. Khách duyệt ngay không chỉnh sửa.',
      },
      {
        id: '23-2',
        time: '14:00',
        text: 'Tiếng ting ting vang lên! Khách hàng chuyển tạm ứng 10.500.000đ. Két sắt công ty tiếp tục tăng trưởng vững chắc.',
      },
      {
        id: '23-3',
        time: '10:15',
        text: 'Họp standup 15 phút với team. Hùng báo cáo tiến độ API thanh toán đã xong 80%.',
      },
      {
        id: '23-4',
        time: '08:00',
        text: 'Bắt đầu ngày làm việc. Yuki uống cà phê, kiểm tra server và lên danh sách task ưu tiên cho ngày.',
      },
    ],
  },
  {
    date: '22/10/2026',
    dayLabel: '2 ngày trước',
    logs: [
      {
        id: '22-1',
        time: '15:45',
        text: 'Ký hợp đồng HD-001 trị giá 150.000.000đ với Startup ABC. Nhận cọc đợt 1 thành công 45.000.000đ.',
      },
      {
        id: '22-2',
        time: '11:00',
        text: 'Tuyển dụng bạn Mai vào vị trí Designer, lương 15.000.000đ/tháng. Đội ngũ giờ đã có 3 nhân sự cứng cáp.',
      },
      {
        id: '22-3',
        time: '09:00',
        text: 'Chi trả tiền điện nước, internet và server cloud tháng đầu: 9.500.000đ.',
      },
    ],
  },
];

// Initial cashflow rows for table
const INITIAL_CASHFLOW_ROWS: DiaryRow[] = [
  {
    id: 'd-1',
    week: 5,
    content: 'Nhận nghiệm thu tiến độ đợt 1 HD-001 (Website Startup ABC)',
    category: 'DOANH_THU',
    amount: 45_000_000,
    balanceAfter: 382_500_000,
    statusText: 'đang chạy',
    statusType: 'running',
    time: '14:20 hôm nay',
  },
  {
    id: 'd-2',
    week: 4,
    content: 'Tuyển dụng bạn Mai vào vị trí UI/UX Designer',
    category: 'NHAN_SU',
    amount: -15_000_000,
    balanceAfter: 337_500_000,
    statusText: 'đã duyệt',
    statusType: 'stopped',
    time: 'tuần trước',
  },
  {
    id: 'd-3',
    week: 3,
    content: 'Bàn giao hoàn tất HD-002 (App kho hoa tươi)',
    category: 'DOANH_THU',
    amount: 24_500_000,
    balanceAfter: 352_500_000,
    statusText: 'chờ khách chốt',
    statusType: 'running',
    time: '2 tuần trước',
  },
  {
    id: 'd-4',
    week: 2,
    content: 'Ký kết hợp đồng HD-001, nhận cọc 30%',
    category: 'DOANH_THU',
    amount: 45_000_000,
    balanceAfter: 328_000_000,
    statusText: 'hoàn thành',
    statusType: 'success',
    time: '3 tuần trước',
  },
  {
    id: 'd-5',
    week: 2,
    content: 'Chiêu mộ Senior Backend Developer (Hùng)',
    category: 'NHAN_SU',
    amount: -30_000_000,
    balanceAfter: 283_000_000,
    statusText: 'đã duyệt',
    statusType: 'stopped',
    time: '3 tuần trước',
  },
  {
    id: 'd-6',
    week: 1,
    content: 'Thanh toán trọn gói HD-003 Landing Page tiệm cafe',
    category: 'DOANH_THU',
    amount: 25_000_000,
    balanceAfter: 313_000_000,
    statusText: 'hoàn thành',
    statusType: 'success',
    time: '1 tháng trước',
  },
  {
    id: 'd-7',
    week: 1,
    content: 'Chi phí server cloud, điện thoại, internet tháng 1',
    category: 'CHI_PHI',
    amount: -9_500_000,
    balanceAfter: 288_000_000,
    statusText: 'đã thanh toán',
    statusType: 'stopped',
    time: '1 tháng trước',
  },
  {
    id: 'd-8',
    week: 1,
    content: 'Cấp vốn khởi nghiệp ban đầu cho CEO Yuki',
    category: 'DOANH_THU',
    amount: 500_000_000,
    balanceAfter: 500_000_000,
    statusText: 'khởi tạo',
    statusType: 'success',
    time: 'ngày 1',
  },
];

export default function HomePage() {
  const [state, setState] = useState<GameState | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Employee | 'CEO' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'diary' | 'cashflow' | 'contracts' | 'employees'>('diary');
  const [notification, setNotification] = useState<string | null>(null);

  const [diaryDays, setDiaryDays] = useState<DiaryDayGroup[]>(INITIAL_DIARY_DAYS);
  const [diaryRows, setDiaryRows] = useState<DiaryRow[]>(INITIAL_CASHFLOW_ROWS);

  // Initialize demo state
  useEffect(() => {
    setState(getDemoState());
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const isSleeping = state?.trangThaiAi === 'DANG_NGU';

  // Toggle AI work / rest status
  const toggleAiStatus = () => {
    setState((prev) => {
      if (!prev) return prev;
      const nextStatus = prev.trangThaiAi === 'DANG_NGU' ? 'DANG_LAM' : 'DANG_NGU';
      showToast(
        nextStatus === 'DANG_NGU'
          ? '🌙 Yuki chuyển sang trạng thái: Đang nghỉ ngơi / nghỉ giải lao'
          : '⚡ Yuki thức dậy: Đang làm việc!'
      );
      return {
        ...prev,
        trangThaiAi: nextStatus,
      };
    });
  };

  // Fast-forward 1 week
  const handleFastForward = () => {
    if (!state || isSimulating) return;
    setIsSimulating(true);

    setTimeout(() => {
      const newWeek = state.tuanHienTai + 1;
      const extraPayment = 25_000_000;
      const totalSalary = state.nhanVien.reduce((sum, e) => sum + e.salary, 0);
      const newCash = state.tienMat + extraPayment - totalSalary;

      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tuanHienTai: newWeek,
          tienMat: newCash,
          doanhThuTichLuy: prev.doanhThuTichLuy + extraPayment,
          doanhThuThangNay: prev.doanhThuThangNay + extraPayment,
          chiPhiTichLuy: prev.chiPhiTichLuy + totalSalary,
          chiPhiThangNay: prev.chiPhiThangNay + totalSalary,
          nangLuong: Math.max(20, prev.nangLuong - 8),
          danhTieng: prev.danhTieng + 2,
        };
      });

      // Add new log to today's diary
      const newLogItem = {
        id: `auto-${Date.now()}`,
        time: 'vừa xong',
        text: `Tiếng ting ting vang lên! Đã nghiệm thu tuần ${newWeek}. Thu về +25.000.000đ doanh thu mới. Trả lương toàn thể nhân sự.`,
      };

      setDiaryDays((prev) => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0] = {
            ...copy[0],
            logs: [newLogItem, ...copy[0].logs],
          };
        }
        return copy;
      });

      // Add to cashflow table
      const newRow: DiaryRow = {
        id: `row-${Date.now()}`,
        week: newWeek,
        content: `Nghiệm thu tiến độ tuần ${newWeek} & Chi trả lương nhân sự`,
        category: 'DOANH_THU',
        amount: extraPayment - totalSalary,
        balanceAfter: newCash,
        statusText: 'đang chạy',
        statusType: 'running',
        time: 'vừa xong',
      };
      setDiaryRows((prev) => [newRow, ...prev]);

      setIsSimulating(false);
      showToast('Đã tua nhanh 1 tuần làm việc!');
    }, 500);
  };

  // Reset / Create new AI
  const handleResetAI = () => {
    const newState = resetDemoState();
    setState(newState);
    setShowResetConfirm(false);
    showToast(`Đã khởi tạo AI CEO mới: ${newState.aiName} (${newState.companyName})`);
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF6EC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-700 font-medium">Đang tải mô phỏng Yuki AI CEO...</p>
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
        onToggleAiStatus={toggleAiStatus}
        onResetClick={() => setShowResetConfirm(true)}
      />

      {/* 2. HERO DESK & STATUS SECTION */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <DeskHero
          isSleeping={isSleeping}
          isSimulating={isSimulating}
          onFastForward={handleFastForward}
          onToggleAiStatus={toggleAiStatus}
        />

        <StatusBar
          isSleeping={isSleeping}
          currentTime={currentTime}
          onToggleAiStatus={toggleAiStatus}
        />

        {/* Self-Introduction Card ("Tôi là Yuki.") */}
        <SelfIntroCard isSleeping={isSleeping} />

        {/* Hero Financial Card ("SỐ DƯ CỦA TÔI") */}
        <FinancialHeroCard
          tienMat={state.tienMat}
          tuanHienTai={state.tuanHienTai}
          startupDay={startupDay}
        />
      </div>

      {/* 3. MAIN TABS (DIARY ACCORDION / CASHFLOW / CONTRACTS / TEAM) */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('diary')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${activeTab === 'diary'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📖 Nhật ký của tôi ({diaryDays.reduce((sum, d) => sum + d.logs.length, 0)})
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${activeTab === 'cashflow'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📊 Bảng dòng tiền ({diaryRows.length})
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${activeTab === 'contracts'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📋 Hợp đồng & Dự án ({state.hopDong.length})
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${activeTab === 'employees'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            👥 Đội ngũ nhân sự ({state.nhanVien.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'diary' && <DiaryAccordion diaryDays={diaryDays} />}
        {activeTab === 'cashflow' && <CashflowTable rows={diaryRows} />}
        {activeTab === 'contracts' && <ContractsTable contracts={state.hopDong} />}
        {activeTab === 'employees' && (
          <EmployeesTable
            employees={state.nhanVien}
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
        <p>AI CEO Simulator • Hệ thống doanh nghiệp IT tự hành với CEO Yuki</p>
        <p className="mt-1 text-stone-400">
          Mô phỏng 1:1 thời gian thực • Giao diện chuẩn phong cách ConCat
        </p>
      </footer>
    </div>
  );
}
