// ============================================================
// constants.ts — All game constants in one file (SRP)
// Change a number here, change it everywhere.
// ============================================================

// --- Initial state when creating a new AI life ---
export const INITIAL_STATE = {
  VON_BAN_DAU: 500_000_000,
  TIEN_MAT: 500_000_000,
  NO_VAY: 0,
  TUAN_HIEN_TAI: 1,
  NANG_LUONG: 100,
  DANH_TIENG: 10,
  NHAN_VIEN: [] as never[],
  VAN_PHONG: 'Làm tại nhà' as string,
  TAI_SAN: [] as never[],
  SAN_PHAM: [] as never[],
  HOP_DONG: [] as never[],
  LICH_SU_TIEN: [500_000_000],
  TRANG_THAI_AI: 'DANG_LAM' as string,
} as const;

// --- Max values ---
export const MAX_NANG_LUONG = 100;
export const MAX_DANH_TIENG = 100;
export const MAX_VAY = 200_000_000;
export const LAI_VAY_THANG = 0.015; // 1.5%/month

// --- Hours per week ---
export const HOURS_PER_WEEK = 168;
export const HOURS_PER_DAY = 24;

// --- Work mode hour distributions (total = 168) ---
export const WORK_MODE_HOURS = {
  CAY: { lamViec: 80, hop: 16, ngu: 42, nghiTrua: 7, giaiLao: 13, giaiTri: 10 },
  LAM_VIEC: { lamViec: 50, hop: 10, ngu: 56, nghiTrua: 7, giaiLao: 21, giaiTri: 24 },
  NGHI_NGOI: { lamViec: 0, hop: 0, ngu: 70, nghiTrua: 7, giaiLao: 35, giaiTri: 56 },
} as const;

// --- Energy changes per action ---
export const ENERGY_DELTA = {
  NGHI_NGOI: 40,
  LAM_VIEC: -15,
  CAY: -30,
} as const;

// --- Productivity multipliers by energy level ---
export const PRODUCTIVITY_MULTIPLIER = {
  HIGH: { threshold: 70, multiplier: 1.0 },
  MID: { threshold: 30, multiplier: 0.7 },
  LOW: { threshold: 0, multiplier: 0.4 },
} as const;

// --- Office costs per month ---
export const OFFICE_COST: Record<string, number> = {
  'Làm tại nhà': 0,
  'Văn phòng nhỏ': 8_000_000,
  'Văn phòng vừa': 20_000_000,
  'Văn phòng lớn': 45_000_000,
  'Văn phòng mua đứt': 0, // bought outright, maintenance only
};

// --- Utility costs ---
export const UTILITY_COST_HOME = 1_500_000;
export const UTILITY_COST_OFFICE_BASE = 2_000_000;
export const UTILITY_COST_PER_EMPLOYEE = 200_000;

// --- Living expenses for the CEO ---
export const CEO_LIVING_EXPENSE = 8_000_000;

// --- Server/cloud cost range ---
export const SERVER_COST_BASE = 2_000_000;
export const SERVER_COST_PER_PRODUCT = 3_000_000;

// --- Tax: 5% of revenue when profitable and >= 6 employees ---
export const TAX_EMPLOYEE_THRESHOLD = 6;
export const TAX_RATE = 0.05;

// --- Contract rules ---
export const CONTRACT_ADVANCE_RATE = 0.3; // 30% upfront
export const CONTRACT_REMAINING_RATE = 0.7; // 70% on completion
export const CONTRACT_CANCEL_REFUND_RATE = 0.3; // refund 30% advance
export const CONTRACT_CANCEL_PENALTY_RATE = 0.1; // + 10% penalty
export const CONTRACT_CANCEL_REPUTATION_LOSS = 5;

// --- Contract client review probabilities ---
export const CLIENT_REVIEW = {
  ACCEPT: 0.7,
  REVISE: 0.2,
  CANCEL: 0.1,
  REVISE_PROGRESS_LOSS: 0.1, // progress goes back 10%
};

// --- Employee rules ---
export const HIRE_CASH_MONTHS = 3; // must have 3 months salary in cash
export const LAYOFF_SEVERANCE_MONTHS = 1; // 1 month salary severance
export const MORALE_LAYOFF_PENALTY = -10;
export const MORALE_LOW_SALARY_THRESHOLD = 0.2; // 20% below market
export const MORALE_LOW_SALARY_MONTHLY_PENALTY = -10;
export const MORALE_OVERWORK_PENALTY = -15; // 3 weeks continuous work
export const MORALE_RAISE_BONUS = 10;
export const MORALE_QUIT_THRESHOLD = 30;
export const MORALE_QUIT_CHANCE = 0.3;

// --- Product rules ---
export const PRODUCT_PROGRESS_PER_WEEK_FACTOR = 0.05; // 5% per week base
export const PRODUCT_CUSTOMER_GROWTH_MIN = 0.05;
export const PRODUCT_CUSTOMER_GROWTH_MAX = 0.20;
export const PRODUCT_CHURN_RATE = 0.05;

// --- Asset prices ---
export const ASSET_PRICES: Record<string, { price: number; effect: string }> = {
  'Nhà riêng': { price: 2_000_000_000, effect: 'Không còn tiền thuê nhà cá nhân' },
  'Văn phòng mua đứt': { price: 5_000_000_000, effect: 'Tiền thuê VP = 0, bảo trì 2tr/tháng' },
  'Xe ô tô': { price: 800_000_000, effect: 'Danh tiếng +5' },
  'Nâng cấp thiết bị': { price: 50_000_000, effect: 'Năng suất team +10%, tối đa 3 lần' },
};
export const ASSET_SELL_RATE = 0.7; // sell at 70% of purchase price

// --- Bankruptcy rule ---
export const BANKRUPTCY_NEGATIVE_MONTHS = 2; // 2 consecutive months with negative cash

// --- Milestones (badges) ---
export const MILESTONES = [
  { threshold: 1_000_000_000, label: 'Thoát nghèo' },
  { threshold: 5_000_000_000, label: 'Triệu phú' },
  { threshold: 10_000_000_000, label: 'Đại gia IT' },
];

// --- Personality pool for random AI ---
export const PERSONALITY_POOL = [
  'Liều lĩnh — hay nhận hợp đồng lớn, vay nhiều, thích ăn to',
  'Cẩn thận — chỉ nhận job nhỏ, giữ tiền mặt cao, tránh rủi ro',
  'Ham làm — ít ngủ, cày liên tục, dễ kiệt sức nhưng tiến độ nhanh',
  'Lười biếng — hay nghỉ, tiến độ chậm, nhưng năng lượng luôn cao',
  'Thích sản phẩm — ưu tiên làm sản phẩm riêng hơn outsource',
  'Thích outsource — nhận nhiều hợp đồng, không quan tâm sản phẩm',
  'Tiết kiệm — chi tiêu tối thiểu, không thuê thêm nếu không cần thiết',
  'Hào phóng — thường xuyên tăng lương, thưởng, nhân viên vui nhưng tốn tiền',
];

// --- Name pool ---
export const NAME_POOL = [
  'Yuki', 'Minh', 'Khoa', 'Bảo', 'Phong', 'Tuấn', 'Đức', 'Long',
  'Linh', 'Thảo', 'Ngọc', 'Trang', 'Vy',
];

export const COMPANY_NAME_POOL = [
  'VietCode', 'SkyLab', 'NovaTech', 'GreenBit', 'CloudNine',
  'BlueOcean', 'RedFox', 'PixelWorks', 'ByteForge', 'DataStar',
];

// --- Employee role pool ---
export const ROLE_POOL = ['Backend', 'Frontend', 'Designer', 'Tester', 'PM', 'Sale', 'Kế toán'] as const;

// --- Salary reference by level ---
export const SALARY_REFERENCE: Record<string, { min: number; max: number }> = {
  intern: { min: 6_000_000, max: 6_000_000 },
  junior: { min: 12_000_000, max: 18_000_000 },
  middle: { min: 20_000_000, max: 30_000_000 },
  senior: { min: 35_000_000, max: 55_000_000 },
  pm_sale: { min: 25_000_000, max: 40_000_000 },
};

// --- Contract pool templates ---
export const CONTRACT_POOL = [
  { type: 'Cá nhân/Shop', valueMin: 20_000_000, valueMax: 50_000_000, weeksMin: 2, weeksMax: 4, minTeam: 1 },
  { type: 'Startup', valueMin: 80_000_000, valueMax: 200_000_000, weeksMin: 4, weeksMax: 8, minTeam: 2 },
  { type: 'Doanh nghiệp', valueMin: 300_000_000, valueMax: 800_000_000, weeksMin: 8, weeksMax: 16, minTeam: 4 },
];

// --- Lunch break ---
export const LUNCH_BREAK_ENERGY_RECOVERY = 5;
export const LUNCH_BREAK_TEAM_MORALE_RECOVERY = 2;
export const SKIP_LUNCH_ENERGY_PENALTY = -5;
export const SKIP_LUNCH_CONSECUTIVE_DAYS_THRESHOLD = 3;
export const SKIP_LUNCH_MORALE_PENALTY = -10;
export const SKIP_LUNCH_AFTERNOON_PRODUCTIVITY_LOSS = 0.2; // -20%
