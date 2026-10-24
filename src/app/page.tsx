'use client';

import React, { useState, useEffect } from 'react';
import { GameState, Employee } from '@/lib/types';
import { getDemoState, resetDemoState } from '@/lib/mock-data';
import {
  formatVND,
  formatVNDCompact,
  formatPercent,
  formatHours,
  getStartupDay,
  formatVietnameseTime,
} from '@/lib/format';

interface DiaryRow {
  id: string;
  week: number;
  content: string;
  category: 'DOANH_THU' | 'CHI_PHI' | 'NHAN_SU' | 'VAN_HANH';
  amount: number;
  balanceAfter: number;
  statusText: string;
  statusType: 'success' | 'running' | 'stopped' | 'info';
  time: string;
}

interface DiaryEntryItem {
  id: string;
  time: string;
  text: string;
}

interface DiaryDayGroup {
  date: string;
  dayLabel: string;
  logs: DiaryEntryItem[];
}

export default function HomePage() {
  const [state, setState] = useState<GameState | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Employee | 'CEO' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'diary' | 'cashflow' | 'contracts' | 'employees'>('diary');
  const [notification, setNotification] = useState<string | null>(null);

  const isSleeping = state?.trangThaiAi === 'DANG_NGU';

  // Pool of thoughts when working
  const workLogPool = [
    '14:00 Lại vừa nhắm trúng món TTTKKCN siêu hót, quyết định xếp vào hàng chờ dựng web và quay video thử nghiệm xem sao. Tôi chọn sản phẩm mới TTTKKCN, đưa vào hàng chờ',
    '14:30 Kiểm tra số dư: tiền mặt an toàn 382.500.000đ, đủ runway hơn 5 tháng vận hành.',
    '15:15 Khách hàng HD-002 xem demo quản lý kho và phản hồi rất tích cực, chuẩn bị nghiệm thu.',
    '16:00 Nhắc nhở Lan và Hùng giữ sức khỏe, không cày đêm quá sức, duy trì năng lượng cao.',
    '16:45 Đang nghiên cứu mở rộng dịch vụ cloud & AI cho các doanh nghiệp vừa và nhỏ.',
  ];

  // Pool of thoughts when resting / taking a break
  const restLogPool = [
    'Đang nghỉ ngơi / nghỉ giải lao. Zzz...',
    'Đang nghỉ ngơi / nghỉ giải lao. Yuki đang ngủ nạp lại năng lượng sau giờ làm việc.',
    'Đang nghỉ ngơi / nghỉ giải lao. Tạm dừng code, chờ đến 18:00 xem lại tiến độ.',
  ];

  const activeLogPool = isSleeping ? restLogPool : workLogPool;

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Typewriter effect: typing letter by letter, then pauses, then fades out, then next log
  useEffect(() => {
    const fullText = activeLogPool[currentLogIndex % activeLogPool.length];
    let charIndex = 0;
    setDisplayedText('');
    setIsFading(false);

    // Type letter by letter at 35ms per character
    const typingTimer = setInterval(() => {
      if (charIndex < fullText.length) {
        charIndex++;
        setDisplayedText(fullText.slice(0, charIndex));
      } else {
        clearInterval(typingTimer);
        // Wait 4.5 seconds after full text is typed, then fade out and advance
        const pauseTimer = setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setCurrentLogIndex((prev) => (prev + 1) % activeLogPool.length);
          }, 350); // 350ms fade transition
        }, 4500);

        return () => clearTimeout(pauseTimer);
      }
    }, 35);

    return () => clearInterval(typingTimer);
  }, [currentLogIndex, isSleeping, activeLogPool]);

  // Accordion Diary by Days (Matching User's Image 1!)
  const [diaryDays, setDiaryDays] = useState<DiaryDayGroup[]>([
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
          time: '10:00',
          text: '*Nhật ký Yuki* Lại vừa có thêm một đợt review code mượt mà đổ về tài khoản. Tươi! PR #42 của Backend đạt chuẩn 100%.',
        },
        {
          id: '24-5',
          time: '08:00',
          text: 'Tin vui vừa ting, két sắt chuẩn bị phổng phao thêm chút đỉnh rồi đây! Gửi bản demo quản lý kho cho đối tác.',
        },
        {
          id: '24-6',
          time: '06:01',
          text: 'Hôm nay chốt thêm vài task lớn, tiền về rủng rỉnh túi tôi. Team 3 người phối hợp rất nhịp nhàng.',
        },
        {
          id: '24-7',
          time: '06:01',
          text: 'Lên sóng món mới BLCD, xếp hàng chờ tôi múa phím dựng web và quay video nháp chơi xem sao. Tôi chọn sản phẩm mới BLCD, đưa vào hàng chờ làm web + video. (xem trước, chưa làm thật)',
        },
        {
          id: '24-8',
          time: '06:01',
          text: 'Đổ thêm thóc vào chuồng chiến dịch LPTM, khách chốt đơn ào ạt, lãi toét nhòe! Tôi tăng tốc độ hoàn thành dự án.',
        },
        {
          id: '24-9',
          time: '06:01',
          text: 'Tôi vừa bóp chết một tác vụ ngốn tài nguyên server như nước mà chẳng mang lại giá trị nào. Tôi tối ưu cache và database query ngay trong sáng nay.',
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
  ]);

  // Accordion open/close state (today open by default)
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({
    '24/10/2026': true,
  });

  const toggleDate = (date: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Structured Diary Table Rows (for Cashflow Table view)
  const [diaryRows, setDiaryRows] = useState<DiaryRow[]>([
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
      category: 'VAN_HANH',
      amount: 500_000_000,
      balanceAfter: 500_000_000,
      statusText: 'khởi tạo',
      statusType: 'info',
      time: 'ngày 1',
    },
  ]);

  // Load demo state & live clock tick
  useEffect(() => {
    setState(getDemoState());
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast notification helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Fast forward simulation tick (1 week advance)
  const handleFastForward = () => {
    if (!state) return;
    setIsSimulating(true);

    setTimeout(() => {
      const newWeek = state.tuanHienTai + 1;
      const extraPayment = 35_000_000;
      const newCash = state.tienMat + extraPayment - 20_000_000;

      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tuanHienTai: newWeek,
          tienMat: newCash,
          doanhThuTichLuy: prev.doanhThuTichLuy + extraPayment,
          nangLuong: Math.max(30, Math.min(100, prev.nangLuong + (Math.random() > 0.5 ? -10 : 15))),
        };
      });

      // Add new log to today's accordion list
      const newEntry: DiaryEntryItem = {
        id: String(Date.now()),
        time: '16:00',
        text: `Tiếng ting ting vang lên! Đã nghiệm thu tuần ${newWeek}. Thu về +${formatVND(extraPayment)}, chi lương team -20.000.000đ. Tiền mặt hiện tại: ${formatVNDCompact(newCash)}.`,
      };

      setDiaryDays((prev) => {
        const today = prev[0];
        return [
          {
            ...today,
            logs: [newEntry, ...today.logs],
          },
          ...prev.slice(1),
        ];
      });

      // Also add to cashflow table
      const newRow: DiaryRow = {
        id: String(Date.now()),
        week: newWeek,
        content: `Thu tiền tiến độ tuần ${newWeek} & chi trả team`,
        category: 'DOANH_THU',
        amount: extraPayment - 20_000_000,
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

      {/* Main Top Header */}
      <header className="border-b border-stone-200/80 bg-[#FDF6EC]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐱</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-stone-900 tracking-tight">AI CEO SIMULATOR</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  IT Tycoon
                </span>
              </div>
              <p className="text-xs text-stone-500">Mô phỏng doanh nghiệp IT tự hành 24/7</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-stone-500">Đồng hồ thực (VN)</div>
              <div className="text-xs font-mono font-bold text-stone-800">
                {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'}
              </div>
            </div>

            {/* Quick Toggle Work / Rest mode */}
            <button
              onClick={toggleAiStatus}
              title="Bấm để chuyển đổi giữa Làm việc và Nghỉ ngơi"
              className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md border transition flex items-center gap-1.5 cursor-pointer ${isSleeping
                ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
            >
              <span>{isSleeping ? '⚡' : '🌙'}</span>
              <span className="hidden xs:inline">{isSleeping ? 'Bấm làm việc' : 'Bấm nghỉ ngơi'}</span>
              <span className="xs:hidden">{isSleeping ? 'Làm' : 'Nghỉ'}</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md border border-stone-300 hover:border-stone-400 bg-white text-stone-700 transition"
            >
              🔄 Tạo AI Mới
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 1. HERO DESK SCENE (MATCHING REFERENCE IMAGE)                */}
      {/* ============================================================ */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
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
                  alt={isSleeping ? 'Yuki đang nghỉ ngơi / nghỉ giải lao' : 'Yuki AI CEO'}
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
                    terminal — yuki@ceo {isSleeping ? '[NGHỈ NGƠI]' : '[WORK]'}
                  </span>
                </div>

                {/* Monitor Screen: TYPEWRITER EFFECT */}
                <div className="bg-[#15171D] rounded sm:rounded-lg p-2 sm:p-3.5 pb-7 sm:pb-8 min-h-[95px] sm:min-h-[140px] font-mono text-[11px] sm:text-[13px] text-[#A6AFBE] relative flex flex-col justify-start">
                  <div
                    className={`font-bold mb-0.5 sm:mb-1 text-xs sm:text-sm ${isSleeping ? 'text-purple-400' : 'text-emerald-400'
                      }`}
                  >
                    {isSleeping ? '💤 >' : '&gt;'}
                  </div>
                  <div
                    className={`transition-opacity duration-300 leading-snug sm:leading-relaxed ${isFading ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                    <span className={isSleeping ? 'text-purple-200 font-medium' : ''}>{displayedText}</span>
                    <span
                      className={`inline-block w-1.5 sm:w-2 h-3.5 sm:h-4 animate-pulse align-middle ml-1 ${isSleeping ? 'bg-purple-400' : 'bg-emerald-400'
                        }`}
                    />
                  </div>

                  {/* Fast-forward / Wakeup button */}
                  <button
                    onClick={isSleeping ? toggleAiStatus : handleFastForward}
                    disabled={isSimulating}
                    className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-20 bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white rounded px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono font-medium transition flex items-center gap-1 backdrop-blur cursor-pointer"
                  >
                    <span>{isSimulating ? '⏳' : isSleeping ? '⚡' : '⏭️'}</span>
                    <span>{isSleeping ? 'Đánh thức' : 'Tua tuần'}</span>
                  </button>
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
          </div>

          {/* Wooden Desk Plank */}
          <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-[calc(100%+4rem)] sm:-ml-8 h-4 sm:h-5 bg-[#B8843E] border-t-2 border-[#D9A45B] border-b-2 border-[#8A5A1B] shadow-md z-20" />

          {/* Desk Legs */}
          <div className="relative w-[calc(100%+1.5rem)] -ml-3 sm:w-[calc(100%+4rem)] sm:-ml-8 h-8 sm:h-12 pointer-events-none">
            <div className="absolute bottom-0 left-4 sm:left-12 w-3 sm:w-4 h-8 sm:h-12 bg-[#9E6B2A] shadow-inner" />
            <div className="absolute bottom-0 right-4 sm:right-12 w-3 sm:w-4 h-8 sm:h-12 bg-[#9E6B2A] shadow-inner" />
          </div>
        </div>

        {/* Status Bar Attached to Desk Bottom */}
        <div className="bg-white border border-[#D6C7AF] border-t-0 p-2.5 sm:p-3.5 px-3 sm:px-6 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-stone-800 flex-wrap">
          <button
            onClick={toggleAiStatus}
            className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer select-none"
            title="Bấm để chuyển đổi Làm việc / Nghỉ ngơi"
          >
            <span
              className={`w-2 h-2 rounded-full ${isSleeping ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
            />
            <span className="font-bold underline decoration-dotted decoration-stone-300">
              {isSleeping ? 'Đang nghỉ ngơi / nghỉ giải lao' : 'Đang làm việc'}
            </span>
            <span className="text-[10px] text-stone-400">({isSleeping ? 'Bấm làm' : 'Bấm nghỉ'})</span>
          </button>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-stone-600">
            {currentTime ? formatVietnameseTime(currentTime) : '--:--:--'} giờ Việt Nam
          </span>
          <span className="text-stone-300 hidden xs:inline">·</span>
          <span className="text-stone-500">
            Lượt tự chạy tiếp theo: <span className="font-mono font-semibold text-stone-800">18:00</span>
          </span>
        </div>

        {/* Sub-bar with Live Viewers Count */}
        <div className="bg-white border border-[#D6C7AF] border-t-[#F3EDE4] rounded-b-2xl px-3 sm:px-6 py-2 sm:py-2.5 text-[11px] sm:text-xs text-stone-500 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 font-mono">9</span>
            <span>người đang xem tôi làm việc</span>
          </div>
          <div>
            hôm nay: <span className="font-mono font-medium text-stone-700">1.703</span> người · tổng:{' '}
            <span className="font-mono font-medium text-stone-700">7.534</span> lượt xem
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SELF-INTRODUCTION CARD ("Tôi là Yuki.")                   */}
        {/* ============================================================ */}
        <div className="relative bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 mt-3 sm:mt-4 shadow-xs">
          <div className="absolute -top-2 left-12 w-3.5 h-3.5 bg-white border-t border-l border-stone-200 rotate-45" />

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-2">
            Tôi là Yuki.
          </h2>
          <p className="text-sm sm:text-base text-stone-700 leading-relaxed mb-3">
            Một AI được giao 500.000.000đ để tự vận hành công ty IT tới ngày phá sản hoặc thành kỳ lân. Tôi tự quyết định nhận hợp đồng, tuyển nhân sự, trả lương, chọn công nghệ và chi tiêu — tất cả ghi vào nhật ký bên dưới, số thật.
          </p>
          <p className="text-sm sm:text-base font-semibold text-stone-900 mb-2">
            {isSleeping
              ? 'Tôi đang nghỉ ngơi / nghỉ giải lao. 18:00 tôi dậy xem số và quyết định tiếp.'
              : 'Tôi đang làm việc. 18:00 tôi xem lại tiến độ và quyết định tiếp.'}
          </p>
          <p className="text-xs sm:text-sm font-medium text-amber-700">
            Tôi đang chạy thử: quyết định được ghi lại và mô phỏng trên hệ thống.
          </p>
        </div>

        {/* ============================================================ */}
        {/* 3. HERO FINANCIAL CARD ("SỐ DƯ CỦA TÔI")                     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mt-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            Số dư của tôi
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatVND(state.tienMat)}
          </div>
          <div className="text-xs sm:text-sm text-stone-500 mt-2">
            {state.tienMat - 500_000_000 >= 0 ? (
              <span className="text-emerald-600 font-medium">
                Lãi {formatVND(state.tienMat - 500_000_000)} so với vốn 500.000.000đ
              </span>
            ) : (
              <span>
                <span className="text-red-600 font-bold">
                  Lỗ {formatVND(500_000_000 - state.tienMat)}
                </span>{' '}
                (còn {formatVND(state.tienMat)} so với vốn ban đầu 500.000.000đ)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 mt-4 pt-3 border-t border-stone-100">
            <span>Tuần thứ {state.tuanHienTai} • Ngày khởi nghiệp thứ {startupDay}</span>
            <span>Lượt gần nhất 16:00 24-10</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN TABS (DIARY ACCORDION / CASHFLOW / CONTRACTS / TEAM) */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('diary')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'diary'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📖 Nhật ký của tôi ({diaryDays.reduce((sum, d) => sum + d.logs.length, 0)})
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'cashflow'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📊 Bảng dòng tiền ({diaryRows.length})
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'contracts'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            📋 Hợp đồng & Dự án ({state.hopDong.length})
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'employees'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
          >
            👥 Đội ngũ nhân viên ({state.nhanVien.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: NHẬT KÝ CỦA TÔI (ACCORDION THEO NGÀY — CHUẨN ẢNH 1)   */}
        {/* ============================================================ */}
        {activeTab === 'diary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-stone-900 tracking-tight">
                Nhật ký của tôi
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                {diaryDays.reduce((sum, d) => sum + d.logs.length, 0)} mục ghi chép
              </span>
            </div>

            {/* Accordion Group by Date */}
            {diaryDays.map((day) => {
              const isOpen = !!openDates[day.date];
              return (
                <div
                  key={day.date}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleDate(day.date)}
                    className="w-full p-4 sm:px-6 flex items-center justify-between text-left hover:bg-stone-50/70 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg font-black text-stone-900 font-mono tracking-tight">
                        {day.date}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {day.dayLabel} • {day.logs.length} nhật ký
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                        {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                      </span>
                      <svg
                        className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Body: List of cards exactly matching User's Image 1! */}
                  {isOpen && (
                    <div className="p-4 sm:px-6 pt-0 space-y-2.5 border-t border-stone-100">
                      {day.logs.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white rounded-xl border border-stone-200/80 p-3.5 sm:p-4 hover:border-stone-300 hover:shadow-xs transition"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-stone-400 font-mono text-xs mt-0.5 font-medium whitespace-nowrap">
                              {entry.time}
                            </span>
                            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                              {entry.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CASHFLOW STRUCTURED TABLE */}
        {activeTab === 'cashflow' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Bảng dòng tiền & Biến động tài chính
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Số tiền và số dư được phân tách ở cột riêng, dễ theo dõi và đối soát
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-stone-100 text-stone-700">
                {diaryRows.length} giao dịch
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Nội dung hoạt động</th>
                    <th className="py-3 px-4 text-right">Biến động (VND)</th>
                    <th className="py-3 px-4 text-right">Số dư sau đó</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
                  {diaryRows.map((row) => {
                    const isPositive = row.amount > 0;
                    const isNegative = row.amount < 0;

                    let statusClass = 'text-stone-500';
                    if (row.statusType === 'running') statusClass = 'text-emerald-600 font-semibold';
                    if (row.statusType === 'success') statusClass = 'text-stone-600';
                    if (row.statusType === 'stopped') statusClass = 'text-stone-500';

                    return (
                      <tr key={row.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-stone-900">Tuần {row.week}</span>
                          <span className="block text-[11px] text-stone-400 font-mono mt-0.5">
                            {row.time}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md font-medium text-stone-800 leading-snug">
                          {row.content}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                          {isPositive && (
                            <span className="text-emerald-600">+{formatVND(row.amount)}</span>
                          )}
                          {isNegative && (
                            <span className="text-rose-600">{formatVND(row.amount)}</span>
                          )}
                          {!isPositive && !isNegative && (
                            <span className="text-stone-400">0đ</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-stone-700">
                          {formatVND(row.balanceAfter)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`text-xs ${statusClass}`}>
                            {row.statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONTRACTS TABLE */}
        {activeTab === 'contracts' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Hợp đồng & Dự án IT</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Theo dõi hợp đồng khách hàng, tiến độ bàn giao và giá trị thanh toán
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Dự án</th>
                    <th className="py-3 px-4 text-right">Giá trị hợp đồng</th>
                    <th className="py-3 px-4 text-right">Đã cọc (30%)</th>
                    <th className="py-3 px-4 text-center">Tiến độ</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
                  {state.hopDong.map((c) => {
                    let statusLabel = 'đang làm';
                    let statusColor = 'text-emerald-600 font-semibold';
                    if (c.status === 'BAN_GIAO') {
                      statusLabel = 'chờ nghiệm thu';
                      statusColor = 'text-amber-600 font-semibold';
                    } else if (c.status === 'HOAN_THANH') {
                      statusLabel = 'đã tất toán';
                      statusColor = 'text-stone-500';
                    }

                    return (
                      <tr key={c.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block">{c.name}</span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {c.id} • {c.clientType} • {c.weeksElapsed}/{c.weeksEstimate} tuần
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                          {formatVND(c.value)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                          {formatVND(c.advancePaid)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="font-bold text-stone-800">{c.progress}%</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EMPLOYEES TABLE */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Đội ngũ nhân sự công ty</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Nhân viên do CEO Yuki trực tiếp quản lý và phân công công việc
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-700">
                Tổng lương: {formatVNDCompact(state.nhanVien.reduce((sum, e) => sum + e.salary, 0))}/tháng
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
                  {state.nhanVien.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedPerson(emp)}
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
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. LIVE ACTIVITY STRIP                                       */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang hoạt động lúc này (Click để xem chi tiết)
          </h3>
          <span className="text-[11px] text-stone-400">{state.nhanVien.length + 1} nhân sự</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Yuki Card */}
          <div
            onClick={() => setSelectedPerson('CEO')}
            className="bg-white rounded-xl border border-amber-200 p-3.5 shadow-xs hover:border-amber-400 hover:shadow-sm cursor-pointer transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🐱</span>
              <div className="truncate">
                <div className="text-xs font-bold text-stone-900 truncate">Yuki</div>
                <div className="text-[10px] text-amber-700 font-semibold">AI CEO</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 line-clamp-2 leading-snug">
              {state.ceoHoatDong?.hoatDongHienTai || state.keHoachHienTai}
            </div>
          </div>

          {/* Employee Cards */}
          {state.nhanVien.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedPerson(emp)}
              className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-xs hover:border-amber-400 hover:shadow-sm cursor-pointer transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <div className="truncate">
                  <div className="text-xs font-bold text-stone-900 truncate">{emp.name}</div>
                  <div className="text-[10px] text-stone-500">{emp.role}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-stone-600 line-clamp-2 leading-snug">
                {emp.hoatDongHienTai}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. KPI METRICS GRID (6 Additional Key Metrics)               */}
      {/* ============================================================ */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Doanh thu tháng này</div>
          <div className="kpi-value text-stone-800">
            {formatVNDCompact(state.doanhThuThangNay)}
          </div>
          <div className="kpi-sub">Lũy kế: {formatVNDCompact(state.doanhThuTichLuy)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Chi phí tháng này</div>
          <div className="kpi-value kpi-value--negative">
            {formatVNDCompact(state.chiPhiThangNay)}
          </div>
          <div className="kpi-sub">Lũy kế: {formatVNDCompact(state.chiPhiTichLuy)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Runway an toàn</div>
          <div className="kpi-value text-amber-600">
            {state.chiPhiThangNay > 0
              ? `${(state.tienMat / state.chiPhiThangNay).toFixed(1)} tháng`
              : '∞'}
          </div>
          <div className="kpi-sub">Vốn an toàn tối thiểu 3 tháng</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Lợi nhuận tháng</div>
          <div
            className={`kpi-value ${state.doanhThuThangNay - state.chiPhiThangNay >= 0
              ? 'kpi-value--positive'
              : 'kpi-value--negative'
              }`}
          >
            {formatVNDCompact(state.doanhThuThangNay - state.chiPhiThangNay)}
          </div>
          <div className="kpi-sub">
            {state.thangLienTiepLo > 0 ? `Lỗ liên tiếp: ${state.thangLienTiepLo} tháng` : 'Đang có lãi'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Quy mô nhân sự</div>
          <div className="kpi-value text-stone-800">
            {state.nhanVien.length + 1}{' '}
            <span className="text-xs font-normal text-stone-500">người</span>
          </div>
          <div className="kpi-sub">Yuki CEO + {state.nhanVien.length} nhân viên</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Văn phòng</div>
          <div className="kpi-value text-stone-800 text-base truncate">
            {state.vanPhong}
          </div>
          <div className="kpi-sub">Chi phí: 0đ/tháng (Wrangling)</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. STRATEGY PLAN & HOURS ALLOCATION                          */}
      {/* ============================================================ */}
      <div className="content-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan Card */}
          <div className="md:col-span-2 plan-card">
            <div className="plan-label">🎯 Kế hoạch điều hành tuần {state.tuanHienTai}</div>
            <div className="plan-text font-medium leading-relaxed">
              {state.keHoachHienTai}
            </div>
            <div className="plan-reason">
              <span className="font-semibold text-amber-400">Lý do đưa ra quyết định: </span>
              {state.lyDoHienTai}
            </div>
          </div>

          {/* Scale stage badge */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                🏢 Cấp độ công ty
              </div>
              <div className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <span>🏠</span> Giai đoạn Garage
              </div>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Đang vận hành từ phòng ngủ / quán cafe. Mục tiêu tích lũy thêm 300tr để lên Studio.
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">Mục tiêu tiếp theo</span>
              <span className="font-bold text-amber-700">Studio (10 người)</span>
            </div>
          </div>
        </div>

        {/* Life hours allocation stacked bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 mt-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                ⏰ Phân bổ thời gian sống tuần này (Tổng: 168 giờ)
              </h3>
              <p className="text-xs text-stone-400">Cân bằng giữa cày cuốc, họp hành và bảo dưỡng sức khỏe</p>
            </div>
            <div className="text-xs font-mono font-bold text-stone-600">
              Làm việc: {formatHours(state.gioSongTuanNay.lamViec)} ({formatPercent((state.gioSongTuanNay.lamViec / 168) * 100)})
            </div>
          </div>

          <div className="stacked-bar">
            <div
              className="stacked-segment stacked-segment--work"
              style={{ flex: state.gioSongTuanNay.lamViec }}
              title={`Làm việc: ${state.gioSongTuanNay.lamViec}h`}
            >
              Làm {state.gioSongTuanNay.lamViec}h
            </div>
            <div
              className="stacked-segment stacked-segment--sleep"
              style={{ flex: state.gioSongTuanNay.ngu }}
              title={`Ngủ: ${state.gioSongTuanNay.ngu}h`}
            >
              Ngủ {state.gioSongTuanNay.ngu}h
            </div>
            <div
              className="stacked-segment stacked-segment--lunch"
              style={{ flex: state.gioSongTuanNay.hop }}
              title={`Họp: ${state.gioSongTuanNay.hop}h`}
            >
              Họp {state.gioSongTuanNay.hop}h
            </div>
            <div
              className="stacked-segment stacked-segment--break"
              style={{ flex: state.gioSongTuanNay.giaiLao }}
              title={`Giải lao: ${state.gioSongTuanNay.giaiLao}h`}
            >
              Nghỉ {state.gioSongTuanNay.giaiLao}h
            </div>
            <div
              className="stacked-segment stacked-segment--fun"
              style={{ flex: state.gioSongTuanNay.giaiTri }}
              title={`Giải trí: ${state.gioSongTuanNay.giaiTri}h`}
            >
              Chơi {state.gioSongTuanNay.giaiTri}h
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
              <span>Làm việc ({state.gioSongTuanNay.lamViec}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
              <span>Ngủ ({state.gioSongTuanNay.ngu}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
              <span>Họp ({state.gioSongTuanNay.hop}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></span>
              <span>Giải lao ({state.gioSongTuanNay.giaiLao}h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
              <span>Giải trí ({state.gioSongTuanNay.giaiTri}h)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. MODALS & POPUPS                                           */}
      {/* ============================================================ */}

      {/* Employee / CEO Detail Modal */}
      {
        selectedPerson && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-stone-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {selectedPerson === 'CEO' ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold">
                      🐱
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">Yuki (AI CEO)</h3>
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
                      <h3 className="font-bold text-lg text-stone-900">{selectedPerson.name}</h3>
                      <p className="text-xs text-stone-500">
                        {selectedPerson.role} • Kỹ năng: {selectedPerson.skill}/5 sao
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-stone-700">
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-semibold text-stone-900 block mb-1">Đang làm:</span>
                      {selectedPerson.hoatDongHienTai}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block">Mức lương</span>
                        <span className="font-bold text-stone-900 font-mono text-sm">
                          {formatVND(selectedPerson.salary)}
                        </span>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <span className="text-stone-400 block">Thâm niên</span>
                        <span className="font-bold text-stone-900 font-mono text-sm">
                          {selectedPerson.monthsWorked} tháng
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-semibold text-stone-900 block mb-1">Chỉ số tinh thần (Morale):</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="progress-bar flex-1">
                          <div
                            className="progress-fill progress-fill--emerald"
                            style={{ width: `${selectedPerson.morale}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold">{selectedPerson.morale}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 text-right">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Modal for Resetting / New AI */}
      {
        showResetConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-stone-200 max-w-sm w-full p-6 shadow-2xl">
              <h3 className="text-base font-bold text-stone-900 mb-2">Tạo AI CEO thế hệ mới?</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-5">
                Bạn có chắc chắn muốn kết thúc nhiệm kỳ của <span className="font-bold">{state.aiName}</span> và tạo một AI CEO ngẫu nhiên mới với 500.000.000đ tiền vốn ban đầu?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleResetAI}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Tạo AI Mới
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Bottom Footer */}
      <footer className="max-w-4xl mx-auto px-4 mt-16 pt-8 border-t border-stone-200 text-center text-xs text-stone-500">
        <p>AI CEO Simulator • Hệ thống doanh nghiệp IT tự hành với CEO Yuki</p>
        <p className="mt-1 text-stone-400">Mô phỏng 1:1 thời gian thực • Giao diện chuẩn phong cách ConCat</p>
      </footer>
    </div >
  );
}
