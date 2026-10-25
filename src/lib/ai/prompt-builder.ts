// ============================================================
// prompt-builder.ts — Build System & User Messages for LLM (SRP)
// Only concatenates system prompt, current state, allowed actions,
// and day X of startup. No money logic, no direct API calls.
// ============================================================

import { GameState, AiAction } from '../types';
import { buildSystemPrompt } from './system-prompt';
import { formatVND, getStartupDay, formatVietnameseTime } from '../format';
import {
  CONTRACT_POOL,
  ROLE_POOL,
  ROLE_MARKET_LEVEL,
  SALARY_REFERENCE,
  HIRE_CASH_MONTHS,
  MAX_VAY,
  ASSET_PRICES,
  ASSET_SELL_RATE,
  OFFICE_LADDER,
  OFFICE_COST,
  UTILITY_COST_HOME,
  UTILITY_COST_OFFICE_BASE,
  UTILITY_COST_PER_EMPLOYEE,
  SERVER_COST_BASE,
  SERVER_COST_PER_PRODUCT,
  CEO_LIVING_EXPENSE,
  LAI_VAY_THANG,
  TAX_EMPLOYEE_THRESHOLD,
  MAX_ACTIONS_PER_WEEK,
  PRODUCT_START_COST,
  SALARY_CUT_RATE,
  SALARY_RAISE_RATE,
  SALARY_FLOOR,
  MIN_BONUS_AMOUNT,
  EQUIPMENT_MAX_STACKS,
} from '../constants';

export interface BuiltPrompt {
  systemPrompt: string;
  userMessage: string;
  allowedActions: AiAction[];
}

export function buildPrompt(state: GameState, now: Date = new Date()): BuiltPrompt {
  const systemPrompt = buildSystemPrompt(
    state.aiName,
    state.companyName,
    state.personality
  );

  const startupDay = getStartupDay(state.startedAt);
  const timeStr = formatVietnameseTime(now);

  const totalSalary = state.nhanVien.reduce((sum, e) => sum + e.salary, 0);
  const totalAssetValue = state.taiSan.reduce((sum, a) => sum + a.currentValue, 0);
  const netWorth = state.tienMat - state.noVay + totalAssetValue;
  const monthlyProfit = state.doanhThuThangNay - state.chiPhiThangNay;

  // Running & completed contracts
  const runningContracts = state.hopDong.filter(
    (c) => c.status === 'DANG_LAM' || c.status === 'BAN_GIAO' || c.status === 'KHACH_XEM'
  );
  const finishedContracts = state.hopDong.filter(
    (c) => c.status === 'HOAN_THANH' || c.status === 'HUY'
  );

  // Recent diary logs (last 5)
  const recentDiary = state.nhatKy.slice(0, 5).map((d) => `Tuần ${d.week}: ${d.content}`);

  // Build Allowed Actions
  const allowedActions: AiAction[] = [
    { code: 'LAM_VIEC' },
    { code: 'CAY' },
    { code: 'NGHI_NGOI' },
  ];

  const allowedActionDescriptions: string[] = [
    '- LAM_VIEC: Làm việc bình thường',
    '- CAY: Cày ngày cày đêm (tiến độ tăng mạnh, tốn nhiều năng lượng)',
    '- NGHI_NGOI: Nghỉ ngơi cả tuần (hồi phục năng lượng cao, không có tiến độ công việc)',
  ];

  // BAN_GIAO_HOP_DONG: contracts with progress >= 100% and status == DANG_LAM
  const readyToDeliver = state.hopDong.filter(
    (c) => c.status === 'DANG_LAM' && c.progress >= 100
  );
  for (const c of readyToDeliver) {
    allowedActions.push({ code: 'BAN_GIAO_HOP_DONG', contractId: c.id });
    allowedActionDescriptions.push(
      `- BAN_GIAO_HOP_DONG: [${c.id}] ${c.name} (đã xong 100%, bàn giao cho khách nghiệm thu để nhận ${formatVND(c.remainingPayment)})`
    );
  }

  // HUY_HOP_DONG_LO: running contracts
  const cancellableContracts = state.hopDong.filter((c) => c.status === 'DANG_LAM');
  for (const c of cancellableContracts) {
    allowedActions.push({ code: 'HUY_HOP_DONG_LO', contractId: c.id });
    const penalty = Math.round(c.advancePaid + c.value * 0.1);
    allowedActionDescriptions.push(
      `- HUY_HOP_DONG_LO: [${c.id}] ${c.name} (Hủy thì trả cọc 30% + đền bù 10% = ${formatVND(penalty)}, danh tiếng -5)`
    );
  }

  // TIM_HOP_DONG: available from pool if team is not overloaded
  CONTRACT_POOL.forEach((template, idx) => {
    const tempId = `HD-NEW-${state.tuanHienTai}-${idx + 1}`;
    allowedActions.push({ code: 'TIM_HOP_DONG', contractId: tempId });
    allowedActionDescriptions.push(
      `- TIM_HOP_DONG: [${tempId}] Loại ${template.type}, giá trị khoảng ${formatVND(template.valueMin)} - ${formatVND(template.valueMax)}, cần tối thiểu ${template.minTeam} người`
    );
  });

  // THUE_NGUOI: available if cash covers 3 months salary of the role's market band
  const maxHireableSalary = SALARY_REFERENCE.middle.max;
  if (state.tienMat >= maxHireableSalary * HIRE_CASH_MONTHS) {
    ROLE_POOL.forEach((role, idx) => {
      const level = ROLE_MARKET_LEVEL[role] || 'junior';
      const band = SALARY_REFERENCE[level] || SALARY_REFERENCE.junior;
      const candidateId = `cand-${role.toLowerCase()}-${idx}`;
      allowedActions.push({ code: 'THUE_NGUOI', employeeId: candidateId });
      allowedActionDescriptions.push(
        `- THUE_NGUOI: Ứng viên ${role} (mặt bằng ${level}: ${formatVND(band.min)} - ${formatVND(band.max)}/tháng, cần tối thiểu ${formatVND(band.max * HIRE_CASH_MONTHS)} tiền mặt)`
      );
    });
  } else {
    allowedActionDescriptions.push(
      `- THUE_NGUOI: KHÔNG KHẢ DỤNG — tiền mặt ${formatVND(state.tienMat)} chưa đủ 3 tháng lương cho bất kỳ vị trí nào`
    );
  }

  // SA_THAI: existing employees
  state.nhanVien.forEach((emp) => {
    allowedActions.push({ code: 'SA_THAI', employeeId: emp.id });
    allowedActionDescriptions.push(
      `- SA_THAI: [${emp.id}] ${emp.name} (${emp.role}, lương ${formatVND(emp.salary)}/tháng, trợ cấp thôi việc 1 tháng lương còn phải trả, cả team -10 morale)`
    );
  });

  // CAT_GIAM_LUONG: giảm 20% lương, chỉ khi lương còn trên sàn
  for (const emp of state.nhanVien) {
    const newSalary = Math.max(SALARY_FLOOR, Math.round(emp.salary * (1 - SALARY_CUT_RATE)));
    if (newSalary >= emp.salary) continue;
    allowedActions.push({ code: 'CAT_GIAM_LUONG', employeeId: emp.id });
    allowedActionDescriptions.push(
      `- CAT_GIAM_LUONG: [${emp.id}] ${emp.name} (${emp.role}) giảm lương ${formatVND(emp.salary)} → ${formatVND(newSalary)}/tháng, tiết kiệm ${formatVND(emp.salary - newSalary)}/tháng nhưng morale -15`
    );
  }

  // TANG_LUONG: tăng 10% lương, morale +10
  for (const emp of state.nhanVien) {
    const newSalary = Math.round(emp.salary * (1 + SALARY_RAISE_RATE));
    allowedActions.push({ code: 'TANG_LUONG', employeeId: emp.id });
    allowedActionDescriptions.push(
      `- TANG_LUONG: [${emp.id}] ${emp.name} (${emp.role}) tăng lương ${formatVND(emp.salary)} → ${formatVND(newSalary)}/tháng, morale +10`
    );
  }

  // THUONG: thưởng nóng, morale +10
  for (const emp of state.nhanVien) {
    const bonus = Math.max(MIN_BONUS_AMOUNT, emp.salary);
    if (state.tienMat < bonus) continue;
    allowedActions.push({ code: 'THUONG', employeeId: emp.id, amount: bonus });
    allowedActionDescriptions.push(
      `- THUONG: [${emp.id}] ${emp.name} thưởng nóng ${formatVND(bonus)} (trừ tiền mặt ngay, morale +10)`
    );
  }

  // VAY_NGAN_HANG: if current loan < MAX_VAY
  if (state.noVay < MAX_VAY) {
    const maxCanBorrow = MAX_VAY - state.noVay;
    allowedActions.push({ code: 'VAY_NGAN_HANG', amount: Math.min(50_000_000, maxCanBorrow) });
    allowedActionDescriptions.push(
      `- VAY_NGAN_HANG: Vay thêm vốn (tối đa vay thêm ${formatVND(maxCanBorrow)}, lãi 1,5%/tháng)`
    );
  }

  // TRA_NO: if has loan and cash > 0
  if (state.noVay > 0 && state.tienMat > 0) {
    const payAmount = Math.min(state.noVay, state.tienMat);
    allowedActions.push({ code: 'TRA_NO', amount: payAmount });
    allowedActionDescriptions.push(`- TRA_NO: Trả bớt nợ vay ngân hàng (${formatVND(payAmount)})`);
  }

  // BAN_TAI_SAN: bán tài sản đang có, thu về 70% giá trị
  for (const asset of state.taiSan) {
    const sellPrice = Math.round(asset.currentValue * ASSET_SELL_RATE);
    allowedActions.push({ code: 'BAN_TAI_SAN', assetName: asset.name });
    allowedActionDescriptions.push(
      `- BAN_TAI_SAN: "${asset.name}" thu về ${formatVND(sellPrice)} (bằng 70% giá trị, lỗ ${formatVND(asset.purchasePrice - sellPrice)})`
    );
  }

  // MUA_TAI_SAN: tài sản mua được bằng tiền mặt hiện có
  const equipStacks = state.taiSan.filter((a) => a.name === 'Nâng cấp thiết bị').length;
  for (const [assetName, spec] of Object.entries(ASSET_PRICES)) {
    if (assetName === 'Nâng cấp thiết bị' && equipStacks >= EQUIPMENT_MAX_STACKS) continue;
    if (state.tienMat < spec.price) continue;
    allowedActions.push({ code: 'MUA_TAI_SAN', assetName });
    allowedActionDescriptions.push(
      `- MUA_TAI_SAN: "${assetName}" giá ${formatVND(spec.price)} — ${spec.effect}`
    );
  }

  // BAT_DAU_SAN_PHAM: nếu đủ vốn khởi động và chưa có sản phẩm trùng tên
  if (state.tienMat >= PRODUCT_START_COST) {
    allowedActions.push({ code: 'BAT_DAU_SAN_PHAM', productName: 'Sản phẩm mới' });
    allowedActionDescriptions.push(
      `- BAT_DAU_SAN_PHAM: Bắt đầu làm sản phẩm riêng (cần ${formatVND(PRODUCT_START_COST)} vốn, sau đó tốn thêm ${formatVND(SERVER_COST_PER_PRODUCT)}/tháng server)`
    );
  }

  // TAM_DUNG_SAN_PHAM: chỉ khi có sản phẩm đang chạy
  const runningProducts = state.sanPham.filter((p) => !p.paused);
  if (runningProducts.length > 0) {
    allowedActions.push({ code: 'TAM_DUNG_SAN_PHAM' });
    allowedActionDescriptions.push(
      `- TAM_DUNG_SAN_PHAM: Tạm dừng ${runningProducts.length} sản phẩm đang chạy (${runningProducts.map((p) => p.name).join(', ')}), cắt ${formatVND(runningProducts.length * SERVER_COST_PER_PRODUCT)}/tháng tiền server`
    );
  }

  // CHUYEN_VAN_PHONG_NHO: hạ 1 bậc trong thang văn phòng
  const officeIdx = OFFICE_LADDER.indexOf(state.vanPhong);
  const canDowngrade = officeIdx > 0 || (officeIdx === -1 && state.vanPhong !== OFFICE_LADDER[0]);
  if (canDowngrade) {
    const nextOffice = officeIdx > 0 ? OFFICE_LADDER[officeIdx - 1] : OFFICE_LADDER[0];
    const saved = (OFFICE_COST[state.vanPhong] || 0) - (OFFICE_COST[nextOffice] || 0);
    allowedActions.push({ code: 'CHUYEN_VAN_PHONG_NHO' });
    allowedActionDescriptions.push(
      `- CHUYEN_VAN_PHONG_NHO: Dọn từ ${state.vanPhong} về ${nextOffice}, tiết kiệm ${formatVND(saved)}/tháng tiền thuê`
    );
  }

  // KHONG_LAM_GI: luôn có, nhưng nói rõ cái giá
  allowedActions.push({ code: 'KHONG_LAM_GI' });
  allowedActionDescriptions.push(
    '- KHONG_LAM_GI: Không làm gì cả tuần (không tiến độ, nhưng chi phí tháng vẫn trừ đủ)'
  );

  // Warning text if losing money or low cash
  // Burn-rate tính đúng theo công thức trong system prompt mục B, không ước lượng.
  const officeCost = OFFICE_COST[state.vanPhong] || 0;
  const utilityCost =
    state.vanPhong === 'Làm tại nhà'
      ? UTILITY_COST_HOME
      : UTILITY_COST_OFFICE_BASE + state.nhanVien.length * UTILITY_COST_PER_EMPLOYEE;
  const runningProductCount = state.sanPham.filter((p) => !p.paused).length;
  const serverCost = SERVER_COST_BASE + runningProductCount * SERVER_COST_PER_PRODUCT;
  const loanInterest = Math.round(state.noVay * LAI_VAY_THANG);
  const monthlyBurn =
    totalSalary + officeCost + utilityCost + serverCost + CEO_LIVING_EXPENSE + loanInterest;
  const runway = monthlyBurn > 0 ? state.tienMat / monthlyBurn : Infinity;
  const taxableNow =
    state.nhanVien.length >= TAX_EMPLOYEE_THRESHOLD && monthlyProfit > 0;

  const burnBreakdown =
    `- BURN-RATE THẬT CỦA BẠN (tự tính theo mục B): lương ${formatVND(totalSalary)} + ` +
    `văn phòng ${formatVND(officeCost)} + điện nước ${formatVND(utilityCost)} + ` +
    `server ${formatVND(serverCost)}${runningProductCount > 0 ? ` (${runningProductCount} sản phẩm)` : ''} + ` +
    `sinh hoạt ${formatVND(CEO_LIVING_EXPENSE)} + lãi vay ${formatVND(loanInterest)} = ${formatVND(monthlyBurn)}/tháng\n` +
    `- RUNWAY: ${state.tienMat < 0 ? 'ÂM' : runway.toFixed(1)} tháng${runway < 2 ? ' — VÙNG NGUY HIỂM, phải kích hoạt chế độ sinh tồn (mục F)' : ''}\n` +
    `- Thuế 5% doanh thu: ${taxableNow ? 'CÓ áp dụng tháng này (đang lãi và đã đủ ' + TAX_EMPLOYEE_THRESHOLD + ' nhân viên)' : 'không áp dụng'}\n` +
    `- Trần hành động: TỐI ĐA ${MAX_ACTIONS_PER_WEEK} hành động tuần này. Chọn dư sẽ bị hệ thống cắt bỏ.`;

  let warningText = '';
  if (monthlyProfit < 0 || runway < 2) {
    warningText = `\nCẢNH BÁO: BẠN ĐANG LỖ HOẶC TIỀN MẶT THẤP (còn ${formatVND(state.tienMat)}, đủ khoảng ${state.tienMat < 0 ? 'âm' : runway.toFixed(1)} tháng chi phí).\nHãy cân nhắc các hành động cứu công ty ở mục F của system prompt trước khi thuê thêm hay mua sắm.\n`;
  }

  // Build user message
  const userMessage = `TRẠNG THÁI HIỆN TẠI — NGÀY KHỞI NGHIỆP THỨ ${startupDay}, GIỜ THẬT HIỆN TẠI: ${timeStr}:
- Tiền mặt: ${formatVND(state.tienMat)}, Nợ vay: ${formatVND(state.noVay)}, Tổng tài sản ròng: ${formatVND(netWorth)}
- Doanh thu tích lũy: ${formatVND(state.doanhThuTichLuy)}, Chi phí tích lũy: ${formatVND(state.chiPhiTichLuy)}
- Lãi/lỗ tháng này: ${formatVND(monthlyProfit)} (${monthlyProfit < 0 ? 'tháng lỗ' : 'tháng lãi'})
- Nhân viên: ${state.nhanVien.length} người (${state.nhanVien.map((e) => `${e.name} - ${e.role}`).join(', ') || 'chưa có'}), tổng lương ${formatVND(totalSalary)}/tháng
- Năng lượng: ${state.nangLuong}/100, Danh tiếng: ${state.danhTieng}/100
- Hợp đồng đang chạy: ${runningContracts.map((c) => `[${c.id}] ${c.name} (trị giá ${formatVND(c.value)}, tiến độ ${c.progress}%, trạng thái ${c.status})`).join('; ') || 'Không có'}
- Hợp đồng đã xong / đã hủy: ${finishedContracts.map((c) => `[${c.id}] ${c.name} (${c.status})`).join('; ') || 'Chưa có'}
- Tổng tiền đền bù đã trả từ đầu: ${formatVND(state.tongTienDenBu)}
- Sản phẩm: ${state.sanPham.length > 0 ? state.sanPham.map((p) => p.name).join(', ') : 'Chưa có'}
- Văn phòng: ${state.vanPhong}
- Giờ sống tuần trước: làm ${state.gioSongTuanNay.lamViec}h, họp ${state.gioSongTuanNay.hop}h, ngủ ${state.gioSongTuanNay.ngu}h, nghỉ trưa ${state.gioSongTuanNay.nghiTrua}h, giải lao ${state.gioSongTuanNay.giaiLao}h, giải trí ${state.gioSongTuanNay.giaiTri}h
- Nhật ký gần nhất:
${recentDiary.map((l) => `  * ${l}`).join('\n') || '  * Bắt đầu khởi nghiệp'}

SỐ LIỆU TÀI CHÍNH BẮT BUỘC ĐỌC:
${burnBreakdown}
${warningText}
HÀNH ĐỘNG ĐƯỢC PHÉP TUẦN NÀY (chỉ chọn trong này):
${allowedActionDescriptions.join('\n')}
`;

  return {
    systemPrompt,
    userMessage,
    allowedActions,
  };
}
