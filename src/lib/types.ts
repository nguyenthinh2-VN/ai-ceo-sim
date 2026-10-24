// ============================================================
// types.ts — All TypeScript interfaces and types (SRP)
// ============================================================

export type AiStatus = 'DANG_LAM' | 'DANG_NGU' | 'NGHI_TRUA' | 'GIAI_LAO' | 'GIAI_TRI' | 'PHA_SAN' | 'CHO_AI_MOI';

export type ContractStatus = 'DANG_LAM' | 'BAN_GIAO' | 'KHACH_XEM' | 'CHOT' | 'HOAN_THANH' | 'HUY';

export type DiaryType = 'HOP_DONG' | 'TUYEN_DUNG' | 'CHI_PHI' | 'NGHI_NGOI' | 'TAI_SAN' | 'SU_KIEN' | 'CANH_BAO' | 'PHA_SAN' | 'DEN_BU' | 'HOAT_DONG';

export type ActionCode =
  | 'NGHI_NGOI'
  | 'LAM_VIEC'
  | 'CAY'
  | 'TIM_HOP_DONG'
  | 'THUE_NGUOI'
  | 'SA_THAI'
  | 'CAT_GIAM_LUONG'
  | 'CHUYEN_VAN_PHONG_NHO'
  | 'TAM_DUNG_SAN_PHAM'
  | 'HUY_HOP_DONG_LO'
  | 'BAN_GIAO_HOP_DONG'
  | 'BAN_TAI_SAN'
  | 'TANG_LUONG'
  | 'THUONG'
  | 'BAT_DAU_SAN_PHAM'
  | 'MUA_TAI_SAN'
  | 'VAY_NGAN_HANG'
  | 'TRA_NO'
  | 'KHONG_LAM_GI';

export type LiveStatus = 'LAM' | 'NGU' | 'NGHI' | 'VUA_XONG';

export interface Employee {
  id: string;
  name: string;
  role: string;
  skill: number; // 1-5
  salary: number;
  morale: number; // 0-100
  monthsWorked: number;
  hoatDongHienTai: string;
  trangThai: LiveStatus;
  tu: string; // ISO timestamp of when activity started
}

export interface Contract {
  id: string;
  name: string;
  clientType: string;
  value: number;
  advancePaid: number; // 30% received
  remainingPayment: number; // 70% to be received
  progress: number; // 0-100
  status: ContractStatus;
  weeksEstimate: number;
  weeksElapsed: number;
  minTeam: number;
  penaltyPaid: number; // amount of penalty if cancelled
  clientReviewWeeks: number; // weeks client has been reviewing
}

export interface Product {
  id: string;
  name: string;
  progress: number; // 0-100
  subscriptionPrice: number;
  customers: number;
  mrr: number; // monthly recurring revenue
  launched: boolean;
  paused: boolean;
}

export interface Asset {
  id: string;
  name: string;
  purchasePrice: number;
  currentValue: number;
  purchasedAt: number; // week number
}

export interface HourBreakdown {
  lamViec: number;
  hop: number;
  ngu: number;
  nghiTrua: number;
  giaiLao: number;
  giaiTri: number;
}

export interface DiaryEntry {
  week: number;
  type: DiaryType;
  content: string;
  timestamp: string;
}

export interface MonthlyExpense {
  category: string;
  amount: number;
  description: string;
}

export interface GameState {
  // Identity
  aiName: string;
  companyName: string;
  personality: string;
  lifeId: string;
  startedAt: string; // ISO timestamp

  // Core metrics
  tienMat: number;
  noVay: number;
  doanhThuTichLuy: number;
  chiPhiTichLuy: number;
  doanhThuThangNay: number;
  chiPhiThangNay: number;

  // Status
  tuanHienTai: number;
  nangLuong: number;
  danhTieng: number;
  trangThaiAi: AiStatus;

  // People
  nhanVien: Employee[];

  // Business
  hopDong: Contract[];
  sanPham: Product[];
  taiSan: Asset[];

  // Office
  vanPhong: string;

  // Time tracking
  gioSongTuanNay: HourBreakdown;
  gioSongTichLuy: HourBreakdown;
  lichSuTien: number[];

  // Diary
  nhatKy: DiaryEntry[];

  // Current plan
  keHoachHienTai: string;
  lyDoHienTai: string;

  // Live activity for each person
  ceoHoatDong: {
    hoatDongHienTai: string;
    trangThai: LiveStatus;
    tu: string;
  };

  // Monthly tracking
  thangLienTiepLo: number; // consecutive loss months
  tongTienDenBu: number; // total penalty paid

  // Bankruptcy info
  bankruptcyInfo?: {
    week: number;
    debt: number;
    reason: string;
    totalWeeks: number;
    totalEmployeesEver: number;
    totalProjectsCompleted: number;
    totalAssetsEver: string[];
    peakNetWorth: number;
  };
}

export interface AiAction {
  code: ActionCode;
  contractId?: string;
  employeeId?: string;
  assetName?: string;
  amount?: number;
  productName?: string;
}

export interface AiDecision {
  plan: string;
  reason: string;
  actions: AiAction[];
  diary: string[];
}

export interface TickData {
  id: string;
  lifeId: string;
  week: number;
  plan: string;
  reason: string;
  diary: DiaryEntry[];
  actions: AiAction[];
  state: GameState;
  createdAt: string;
}

export interface LifeData {
  id: string;
  aiName: string;
  personality: string;
  companyName: string;
  startedAt: string;
  status: 'SONG' | 'PHA_SAN';
  summary?: {
    totalWeeks: number;
    peakNetWorth: number;
    totalProjects: number;
    assetsOwned: string[];
  };
}

// --- Interfaces for DIP (Dependency Inversion) ---

export interface WorldSimulation {
  getState(): Promise<GameState>;
  applyActions(actions: AiAction[]): Promise<{ state: GameState; rejected: string[] }>;
  settleMonthIfNeeded(): Promise<GameState>;
  checkBankruptcy(): Promise<boolean>;
}

export interface AiBrain {
  decide(state: GameState): Promise<AiDecision>;
}

export interface LlmClient {
  chat(system: string, user: string): Promise<string>;
}

export interface Clock {
  now(): Date;
}

export interface StateRepository {
  getCurrentLife(): Promise<LifeData | null>;
  getLatestTick(lifeId: string): Promise<TickData | null>;
  getAllTicks(lifeId: string): Promise<TickData[]>;
  saveTick(tick: TickData): Promise<void>;
  createLife(life: LifeData): Promise<void>;
  updateLifeStatus(lifeId: string, status: 'SONG' | 'PHA_SAN', summary?: LifeData['summary']): Promise<void>;
  getPastLives(): Promise<LifeData[]>;
}
