// ============================================================
// mock-data.ts — Fresh state generator for new AI startup lives
// ============================================================

import { GameState } from './types';
import {
  PERSONALITY_POOL,
  COMPANY_NAME_POOL,
} from './constants';

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '00000000-0000-4000-8000-000000000000';
}

export function createFreshInitialState(
  customAiName?: string,
  customCompanyName?: string,
  customPersonality?: string
): GameState {
  const aiName = customAiName || 'Yuki';
  const companyName = customCompanyName || randomPick(COMPANY_NAME_POOL);
  const personality = customPersonality || 'Quyết đoán, cẩn trọng dòng tiền & hướng đến sản phẩm';
  const now = new Date();

  return {
    aiName,
    companyName,
    personality,
    lifeId: generateId(),
    startedAt: now.toISOString(),

    tienMat: 500_000_000,
    noVay: 0,
    doanhThuTichLuy: 0,
    chiPhiTichLuy: 0,
    doanhThuThangNay: 0,
    chiPhiThangNay: 0,

    tuanHienTai: 1,
    nangLuong: 100,
    danhTieng: 10,
    trangThaiAi: 'DANG_LAM',

    nhanVien: [],
    hopDong: [
      {
        id: 'HD-001',
        name: 'Website giới thiệu công ty cho đối tác SME',
        clientType: 'Doanh nghiệp SME',
        value: 30_000_000,
        advancePaid: 9_000_000,
        remainingPayment: 21_000_000,
        progress: 0,
        status: 'DANG_LAM',
        weeksEstimate: 2,
        weeksElapsed: 0,
        minTeam: 1,
        penaltyPaid: 0,
        clientReviewWeeks: 0,
      },
    ],
    sanPham: [],
    taiSan: [],

    vanPhong: 'Làm tại nhà',

    gioSongTuanNay: { lamViec: 0, hop: 0, ngu: 0, nghiTrua: 0, giaiLao: 0, giaiTri: 0 },
    gioSongTichLuy: { lamViec: 0, hop: 0, ngu: 0, nghiTrua: 0, giaiLao: 0, giaiTri: 0 },
    lichSuTien: [500_000_000],

    nhatKy: [
      {
        week: 1,
        type: 'HOAT_DONG',
        content: `Tuần 1: Ngày đầu tiên khởi nghiệp! Vốn điều lệ 500.000.000đ. Tôi là ${aiName}, chính thức tiếp quản vị trí CEO của ${companyName}. Với tính cách "${personality}", tôi sẽ tự tay điều hành mọi quyết định từ hợp đồng, nhân sự đến công nghệ. Bắt đầu thôi!`,
        timestamp: now.toISOString(),
      },
    ],

    keHoachHienTai: `Khởi đầu tuần 1: Bắt tay triển khai hợp đồng HD-001, giữ chi phí tối thiểu bằng cách làm việc tại nhà, theo dõi dòng tiền chặt chẽ.`,
    lyDoHienTai: `Công ty mới thành lập, vốn ban đầu 500tr cần được bảo vệ cẩn trọng. Tôi sẽ trực tiếp code và quản lý dự án trước khi tính đến việc tuyển thêm người.`,

    ceoHoatDong: {
      hoatDongHienTai: 'Đang thiết lập môi trường làm việc và bắt đầu code dự án HD-001',
      trangThai: 'LAM',
      tu: now.toISOString(),
    },

    thangLienTiepLo: 0,
    tongTienDenBu: 0,
    lastTickAt: now.toISOString(),
    isDemo: false,
  };
}

// Singleton state
let currentDemoState: GameState | null = null;

export function getDemoState(): GameState {
  if (!currentDemoState) {
    currentDemoState = createFreshInitialState();
  }
  return currentDemoState;
}

export function resetDemoState(): GameState {
  const prevPersonality = currentDemoState?.personality;
  const prevName = currentDemoState?.aiName;
  currentDemoState = createFreshInitialState(prevName === 'Yuki' ? 'Alex' : 'Yuki', undefined, prevPersonality);
  return currentDemoState;
}
