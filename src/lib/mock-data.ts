// ============================================================
// mock-data.ts — Demo state for initial build without LLM/Supabase
// This is the "luật tạm" (temporary rules) mentioned in the spec.
// Will be replaced by real LLM + Supabase later.
// ============================================================

import { GameState, DiaryEntry, Employee, Contract } from './types';
import {
  INITIAL_STATE,
  PERSONALITY_POOL,
  NAME_POOL,
  COMPANY_NAME_POOL,
} from './constants';

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Demo employees
const demoEmployees: Employee[] = [
  {
    id: 'emp-01',
    name: 'Lan',
    role: 'Frontend',
    skill: 3,
    salary: 18_000_000,
    morale: 75,
    monthsWorked: 2,
    hoatDongHienTai: 'Đang code giao diện dashboard cho HD-001',
    trangThai: 'LAM',
    tu: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'emp-02',
    name: 'Hùng',
    role: 'Backend',
    skill: 4,
    salary: 30_000_000,
    morale: 82,
    monthsWorked: 3,
    hoatDongHienTai: 'Đang viết API thanh toán cho HD-001',
    trangThai: 'LAM',
    tu: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'emp-03',
    name: 'Mai',
    role: 'Designer',
    skill: 3,
    salary: 15_000_000,
    morale: 90,
    monthsWorked: 1,
    hoatDongHienTai: 'Đang thiết kế UI cho trang landing',
    trangThai: 'LAM',
    tu: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

// Demo contracts
const demoContracts: Contract[] = [
  {
    id: 'HD-001',
    name: 'Website bán hàng cho Startup ABC',
    clientType: 'Startup',
    value: 150_000_000,
    advancePaid: 45_000_000,
    remainingPayment: 105_000_000,
    progress: 65,
    status: 'DANG_LAM',
    weeksEstimate: 6,
    weeksElapsed: 4,
    minTeam: 2,
    penaltyPaid: 0,
    clientReviewWeeks: 0,
  },
  {
    id: 'HD-002',
    name: 'App quản lý kho cho Shop Hoa',
    clientType: 'Cá nhân/Shop',
    value: 35_000_000,
    advancePaid: 10_500_000,
    remainingPayment: 24_500_000,
    progress: 100,
    status: 'BAN_GIAO',
    weeksEstimate: 3,
    weeksElapsed: 3,
    minTeam: 1,
    penaltyPaid: 0,
    clientReviewWeeks: 1,
  },
  // Phương án chọn cho HD-003: (a) Đã hoàn thành và đã thu đủ 100% (25.000.000đ)
  // remainingPayment = 0, doanhThuTichLuy = 80.500.000đ (45tr + 10.5tr + 25tr),
  // tienMat = 385.000.000đ (500tr vốn + 80.5tr doanh thu - 195.5tr chi phí),
  // phần tử cuối lichSuTien = 385.000.000đ.
  {
    id: 'HD-003',
    name: 'Landing page cho tiệm cafe',
    clientType: 'Cá nhân/Shop',
    value: 25_000_000,
    advancePaid: 25_000_000,
    remainingPayment: 0,
    progress: 100,
    status: 'HOAN_THANH',
    weeksEstimate: 2,
    weeksElapsed: 2,
    minTeam: 1,
    penaltyPaid: 0,
    clientReviewWeeks: 0,
  },
];

// Demo diary
const demoDiary: DiaryEntry[] = [
  {
    week: 5,
    type: 'HOAT_DONG',
    content: 'Tuần 5: Tôi quyết định cày liên tục cho kịp deadline HD-001. Năng lượng tôi giảm xuống 55 nhưng tiến độ đã lên 65%. Team làm rất tốt.',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    week: 4,
    type: 'TUYEN_DUNG',
    content: 'Tuần 4: Tôi thuê thêm bạn Mai làm Designer, lương 15.000.000đ/tháng. Team giờ có 3 người. Tiền mặt còn 380.000.000đ.',
    timestamp: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    week: 3,
    type: 'HOP_DONG',
    content: 'Tuần 3: HD-002 hoàn thành 100%, tôi bàn giao cho khách. Đang chờ khách xem và chốt. Hy vọng nhận được 24.500.000đ còn lại.',
    timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    week: 2,
    type: 'HOP_DONG',
    content: 'Tuần 2: Nhận hợp đồng mới HD-001 từ Startup ABC, giá trị 150.000.000đ. Đã nhận cọc 45.000.000đ. Dự kiến 6 tuần.',
    timestamp: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    week: 2,
    type: 'TUYEN_DUNG',
    content: 'Tuần 2: Thuê bạn Hùng làm Backend, lương 30.000.000đ/tháng. Tay này kỹ năng 4/5, đáng đồng tiền.',
    timestamp: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    week: 1,
    type: 'HOP_DONG',
    content: 'Tuần 1: Khởi nghiệp! Vốn 500.000.000đ. Tôi nhận ngay hợp đồng nhỏ HD-003 làm landing page cho tiệm cafe, 25.000.000đ, 2 tuần. Bắt đầu thôi!',
    timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    week: 1,
    type: 'CHI_PHI',
    content: 'Tuần 1: Chi phí tháng đầu: sinh hoạt 8.000.000đ, điện nước internet 1.500.000đ. Làm tại nhà nên chưa tốn thuê văn phòng.',
    timestamp: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
];

function randomPickExcept<T>(arr: readonly T[], except?: T): T {
  const filtered = except ? arr.filter((x) => x !== except) : arr;
  const pool = filtered.length > 0 ? filtered : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createDemoState(prevPersonality?: string, prevName?: string): GameState {
  const aiName = randomPickExcept(NAME_POOL, prevName);
  const companyName = randomPick(COMPANY_NAME_POOL);
  const personality = randomPickExcept(PERSONALITY_POOL, prevPersonality);

  return {
    aiName,
    companyName,
    personality,
    lifeId: generateId(),
    startedAt: new Date(Date.now() - 35 * 86400000).toISOString(), // started 35 days ago

    // Tiền mặt = 500.000.000 + doanhThuTichLuy (80.500.000đ) - chiPhiTichLuy (195.500.000đ) = 385.000.000đ
    tienMat: 385_000_000,
    noVay: 0,
    doanhThuTichLuy: 80_500_000,
    chiPhiTichLuy: 195_500_000,
    doanhThuThangNay: 45_000_000,
    chiPhiThangNay: 73_000_000,

    tuanHienTai: 5,
    nangLuong: 55,
    danhTieng: 18,
    trangThaiAi: 'DANG_LAM',

    nhanVien: demoEmployees,
    hopDong: demoContracts,
    sanPham: [],
    taiSan: [],

    vanPhong: 'Làm tại nhà',

    // Giờ tuần này cộng lại = 52 + 8 + 49 + 7 + 28 + 24 = 168 giờ
    gioSongTuanNay: { lamViec: 52, hop: 8, ngu: 49, nghiTrua: 7, giaiLao: 28, giaiTri: 24 },
    // Giờ tích lũy = 5 tuần x 168 = 840 giờ (230 + 40 + 265 + 35 + 115 + 155 = 840)
    gioSongTichLuy: { lamViec: 230, hop: 40, ngu: 265, nghiTrua: 35, giaiLao: 115, giaiTri: 155 },
    lichSuTien: [500_000_000, 488_000_000, 465_000_000, 420_000_000, 385_000_000],

    nhatKy: demoDiary,

    keHoachHienTai: 'Tuần này tôi tập trung cày HD-001 cho kịp deadline, đồng thời chờ khách HD-002 phản hồi. Nếu khách chốt thì sẽ có thêm 24.500.000đ.',
    lyDoHienTai: 'HD-001 tiến độ mới 65%, còn 2 tuần nữa hết hạn. Team 3 người đủ sức nhưng tôi cần cày thêm. Năng lượng còn 55, chưa đến mức kiệt sức.',

    ceoHoatDong: {
      hoatDongHienTai: 'Đang review code và họp với team về tiến độ HD-001',
      trangThai: 'LAM',
      tu: new Date(Date.now() - 2 * 3600000).toISOString(),
    },

    thangLienTiepLo: 1,
    tongTienDenBu: 0,
  };
}

// Singleton demo state
let currentDemoState: GameState | null = null;

export function getDemoState(): GameState {
  if (!currentDemoState) {
    currentDemoState = createDemoState();
  }
  return currentDemoState;
}

export function resetDemoState(): GameState {
  const prevPersonality = currentDemoState?.personality;
  const prevName = currentDemoState?.aiName;
  currentDemoState = createDemoState(prevPersonality, prevName);
  return currentDemoState;
}
