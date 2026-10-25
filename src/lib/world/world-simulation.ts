// ============================================================
// world-simulation.ts — Real-time 1:1 World Simulation Engine (SRP)
// Implements WorldSimulation interface from types.ts.
// Governs time catch-up, contract lifecycles, monthly settlement,
// and bankruptcy ladder.
// ============================================================

import {
  WorldSimulation,
  GameState,
  AiAction,
  Contract,
  Employee,
  Product,
  Asset,
  Clock,
} from '../types';
import {
  OFFICE_COST,
  OFFICE_LADDER,
  UTILITY_COST_HOME,
  UTILITY_COST_OFFICE_BASE,
  UTILITY_COST_PER_EMPLOYEE,
  SERVER_COST_BASE,
  SERVER_COST_PER_PRODUCT,
  CEO_LIVING_EXPENSE,
  LAI_VAY_THANG,
  MAX_VAY,
  TAX_RATE,
  TAX_EMPLOYEE_THRESHOLD,
  CONTRACT_POOL,
  CONTRACT_ADVANCE_RATE,
  CONTRACT_CANCEL_PENALTY_RATE,
  CONTRACT_CANCEL_REPUTATION_LOSS,
  CLIENT_REVIEW,
  ROLE_POOL,
  ROLE_MARKET_LEVEL,
  SALARY_REFERENCE,
  HIRE_CASH_MONTHS,
  LAYOFF_SEVERANCE_MONTHS,
  MORALE_LAYOFF_PENALTY,
  MORALE_OVERWORK_PENALTY,
  MORALE_LOW_SALARY_MONTHLY_PENALTY,
  MORALE_LOW_SALARY_THRESHOLD,
  MORALE_QUIT_THRESHOLD,
  MORALE_QUIT_CHANCE,
  MORALE_RAISE_BONUS,
  MORALE_SALARY_CUT_PENALTY,
  SALARY_CUT_RATE,
  SALARY_RAISE_RATE,
  SALARY_FLOOR,
  MIN_BONUS_AMOUNT,
  ASSET_PRICES,
  ASSET_SELL_RATE,
  EQUIPMENT_MAX_STACKS,
  PRODUCT_START_COST,
  PRODUCT_LAUNCH_INITIAL_CUSTOMERS,
  PRODUCT_DEFAULT_SUBSCRIPTION,
  PRODUCT_CUSTOMER_GROWTH_MIN,
  PRODUCT_CUSTOMER_GROWTH_MAX,
  PRODUCT_CHURN_RATE,
  CEO_SKILL,
  EQUIPMENT_PRODUCTIVITY_BONUS,
} from '../constants';
import { formatVND } from '../format';

export class WorldSimulationEngine implements WorldSimulation {
  private state: GameState;
  private clock: Clock;

  constructor(initialState: GameState, clock?: Clock) {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.clock = clock || { now: () => new Date() };

    // Initialize lastTickAt if not set
    if (!this.state.lastTickAt) {
      this.state.lastTickAt = this.state.startedAt || this.clock.now().toISOString();
    }
  }

  async getState(): Promise<GameState> {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Apply validated actions to the world state.
   */
  async applyActions(actions: AiAction[]): Promise<{ state: GameState; rejected: string[] }> {
    const rejected: string[] = [];
    const now = this.clock.now();

    for (const act of actions) {
      switch (act.code) {
        case 'LAM_VIEC': {
          this.state.cheDoLamViec = 'LAM_VIEC';
          this.state.trangThaiAi = 'DANG_LAM';
          this.state.ceoHoatDong = {
            hoatDongHienTai: 'Đang làm việc và quản lý dự án',
            trangThai: 'LAM',
            tu: now.toISOString(),
          };
          break;
        }

        case 'CAY': {
          this.state.cheDoLamViec = 'CAY';
          this.state.trangThaiAi = 'DANG_LAM';
          this.state.ceoHoatDong = {
            hoatDongHienTai: 'Đang cày cuốc dự án ngày đêm',
            trangThai: 'LAM',
            tu: now.toISOString(),
          };
          break;
        }

        case 'NGHI_NGOI': {
          this.state.cheDoLamViec = 'NGHI_NGOI';
          this.state.trangThaiAi = 'DANG_NGU';
          this.state.nangLuong = Math.min(100, this.state.nangLuong + 20);
          this.state.ceoHoatDong = {
            hoatDongHienTai: 'Đang nghỉ ngơi / nghỉ giải lao phục hồi sức',
            trangThai: 'NGU',
            tu: now.toISOString(),
          };
          break;
        }

        case 'BAN_GIAO_HOP_DONG': {
          const contract = this.state.hopDong.find((c) => c.id === act.contractId);
          if (!contract) {
            rejected.push(`Không tìm thấy hợp đồng ${act.contractId} để bàn giao.`);
            break;
          }
          if (contract.progress < 100) {
            rejected.push(`Hợp đồng ${contract.name} chưa đạt 100% tiến độ (hiện tại: ${contract.progress}%). Không thể bàn giao.`);
            break;
          }
          if (contract.status !== 'DANG_LAM') {
            rejected.push(`Hợp đồng ${contract.name} đang ở trạng thái ${contract.status}, không phải DANG_LAM.`);
            break;
          }

          // Move to KHACH_XEM (client review)
          contract.status = 'KHACH_XEM';
          contract.clientReviewWeeks = 0;
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'HOP_DONG',
            content: `Tuần ${this.state.tuanHienTai}: Tôi đã bàn giao hợp đồng ${contract.name}. Khách đang xem xét nghiệm thu để thanh toán ${formatVND(contract.remainingPayment)} còn lại.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'HUY_HOP_DONG_LO': {
          const contract = this.state.hopDong.find((c) => c.id === act.contractId);
          if (!contract || contract.status !== 'DANG_LAM') {
            rejected.push(`Không thể hủy hợp đồng ${act.contractId}: không tồn tại hoặc không đang làm.`);
            break;
          }

          // Penalty: refund 30% advance + pay 10% contract value
          const advanceRefund = contract.advancePaid;
          const penalty10 = Math.round(contract.value * CONTRACT_CANCEL_PENALTY_RATE);
          const totalPenalty = advanceRefund + penalty10;

          this.state.tienMat -= totalPenalty;
          // Ghi riêng vào tổng tiền đền bù, không gộp chi phí chung
          this.state.tongTienDenBu += totalPenalty;
          this.state.danhTieng = Math.max(
            0,
            this.state.danhTieng - CONTRACT_CANCEL_REPUTATION_LOSS
          );
          contract.status = 'HUY';
          contract.penaltyPaid = totalPenalty;

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'DEN_BU',
            content: `Tuần ${this.state.tuanHienTai}: Tôi quyết định hủy hợp đồng ${contract.name} vì phát hiện lỗ. Hoàn cọc ${formatVND(advanceRefund)} + đền bù 10% (${formatVND(penalty10)}). Tổng tiền đền bù: ${formatVND(totalPenalty)}, danh tiếng -${CONTRACT_CANCEL_REPUTATION_LOSS}.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'TIM_HOP_DONG': {
          // prompt-builder đề xuất id dạng HD-NEW-<tuần>-<idx>.
          // Nếu AI chọn đúng id đó thì tôn trọng loại hợp đồng nó muốn,
          // chỉ random khi id không khớp pool (fallback an toàn).
          const poolMatch = /^HD-NEW-\d+-(\d+)$/.exec(act.contractId || '');
          const poolIdx = poolMatch ? Number(poolMatch[1]) - 1 : -1;
          const template = CONTRACT_POOL[poolIdx] ?? CONTRACT_POOL[Math.floor(Math.random() * CONTRACT_POOL.length)];

          const contractValue =
            Math.round((template.valueMin + Math.random() * (template.valueMax - template.valueMin)) / 5_000_000) *
            5_000_000;
          const advance = Math.round(contractValue * CONTRACT_ADVANCE_RATE);
          const remaining = contractValue - advance;

          // Sinh id không đụng hàng: đếm cả hợp đồng đã hủy/hoàn thành
          const newId = `HD-${String(this.state.hopDong.length + 1).padStart(3, '0')}`;
          const newContract: Contract = {
            id: newId,
            name: `Dự án phần mềm ${template.type} (${newId})`,
            clientType: template.type,
            value: contractValue,
            advancePaid: advance,
            remainingPayment: remaining,
            progress: 0,
            status: 'DANG_LAM',
            weeksEstimate: template.weeksMin,
            weeksElapsed: 0,
            minTeam: template.minTeam,
            penaltyPaid: 0,
            clientReviewWeeks: 0,
          };

          this.state.hopDong.push(newContract);
          this.state.tienMat += advance;
          this.state.doanhThuTichLuy += advance;
          this.state.doanhThuThangNay += advance;

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'HOP_DONG',
            content: `Tuần ${this.state.tuanHienTai}: Tôi ký hợp đồng mới ${newContract.name} trị giá ${formatVND(contractValue)}. Đã nhận tạm ứng 30%: +${formatVND(advance)}.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'THUE_NGUOI': {
          // Ứng viên do prompt-builder đề xuất có id dạng cand-<role>-<n>;
          // lấy vai trò từ id để trả đúng mặt bằng lương, không trả lương junior cho Senior.
          const roleFromId = act.employeeId?.replace(/^cand-/, '').split('-')[0];
          const role = ROLE_POOL.find(
            (r) => r.toLowerCase() === roleFromId?.toLowerCase()
          );
          const resolvedRole = role || ROLE_POOL[Math.floor(Math.random() * ROLE_POOL.length)];
          const level = ROLE_MARKET_LEVEL[resolvedRole] || 'junior';
          const band = SALARY_REFERENCE[level] || SALARY_REFERENCE.junior;
          const salary = Math.round((band.min + Math.random() * (band.max - band.min)) / 500_000) * 500_000;

          const requiredCash = salary * HIRE_CASH_MONTHS;
          if (this.state.tienMat < requiredCash) {
            rejected.push(
              `Không đủ tiền mặt để thuê ${resolvedRole} (lương ${formatVND(salary)}/tháng, cần ${HIRE_CASH_MONTHS} tháng = ${formatVND(requiredCash)}, đang có ${formatVND(this.state.tienMat)}).`
            );
            break;
          }

          const newEmpId = `emp-0${this.state.nhanVien.length + 1}`;
          const newEmp: Employee = {
            id: newEmpId,
            name: `Nhân sự ${this.state.nhanVien.length + 1}`,
            role: resolvedRole,
            skill: Math.floor(Math.random() * 3) + 2, // 2-4
            salary,
            morale: 85,
            monthsWorked: 0,
            hoatDongHienTai: 'Mới nhận việc, đang setup môi trường',
            trangThai: 'LAM',
            tu: now.toISOString(),
          };

          this.state.nhanVien.push(newEmp);
          const newBurn = this.state.nhanVien.reduce((sum, e) => sum + e.salary, 0);
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TUYEN_DUNG',
            content: `Tuần ${this.state.tuanHienTai}: Tôi tuyển thêm bạn ${newEmp.name} vào vị trí ${newEmp.role}, lương ${formatVND(newEmp.salary)}/tháng. Đội ngũ hiện có ${this.state.nhanVien.length} người, quỹ lương lên ${formatVND(newBurn)}/tháng.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'SA_THAI': {
          const empIdx = this.state.nhanVien.findIndex((e) => e.id === act.employeeId);
          if (empIdx === -1) {
            rejected.push(`Không tìm thấy nhân viên ${act.employeeId} để sa thải.`);
            break;
          }

          const emp = this.state.nhanVien[empIdx];
          const severance = emp.salary * LAYOFF_SEVERANCE_MONTHS;
          this.state.tienMat -= severance;
          this.state.chiPhiTichLuy += severance;
          this.state.chiPhiThangNay += severance;

          this.state.nhanVien.splice(empIdx, 1);
          // Morale penalty for remaining team
          this.state.nhanVien.forEach(
            (e) => (e.morale = Math.max(10, e.morale + MORALE_LAYOFF_PENALTY))
          );

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TUYEN_DUNG',
            content: `Tuần ${this.state.tuanHienTai}: Sa thải (layoff) bạn ${emp.name} (${emp.role}) để cắt giảm chi phí. Chi trả trợ cấp thôi việc ${formatVND(severance)}. Tiết kiệm lương hàng tháng: ${formatVND(emp.salary)}. Cả team còn lại tụt tinh thần.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'VAY_NGAN_HANG': {
          const amount = Math.min(
            typeof act.amount === 'number' && act.amount > 0 ? act.amount : 50_000_000,
            MAX_VAY - this.state.noVay
          );
          if (amount <= 0) {
            rejected.push(
              `Đã đạt hạn mức vay tối đa ${formatVND(MAX_VAY)}.`
            );
            break;
          }

          this.state.noVay += amount;
          this.state.tienMat += amount;
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'CHI_PHI',
            content: `Tuần ${this.state.tuanHienTai}: Tôi giải ngân khoản vay ngân hàng +${formatVND(amount)}, lãi suất 1,5%/tháng để đảm bảo thanh khoản.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'TRA_NO': {
          const amount = Math.min(
            this.state.noVay,
            this.state.tienMat,
            typeof act.amount === 'number' && act.amount > 0 ? act.amount : this.state.noVay
          );
          if (amount <= 0) {
            rejected.push('Không có khoản nợ nào hoặc không đủ tiền mặt để trả.');
            break;
          }

          this.state.noVay -= amount;
          this.state.tienMat -= amount;
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'CHI_PHI',
            content: `Tuần ${this.state.tuanHienTai}: Tôi dùng tiền mặt trả bớt nợ vay ngân hàng -${formatVND(amount)}. Nợ còn lại: ${formatVND(this.state.noVay)}.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'KHONG_LAM_GI': {
          // Ngồi im: không tiến độ, nhưng vẫn tỉnh táo hơn cày.
          this.state.cheDoLamViec = 'KHONG_LAM_GI';
          this.state.trangThaiAi = 'GIAI_TRI';
          this.state.nangLuong = Math.min(100, this.state.nangLuong + 10);
          this.state.ceoHoatDong = {
            hoatDongHienTai: 'Không làm gì cả, để đầu óc nghỉ ngơi nhưng chi phí vẫn chạy',
            trangThai: 'NGHI',
            tu: now.toISOString(),
          };
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'NGHI_NGOI',
            content: `Tuần ${this.state.tuanHienTai}: Tôi chọn không làm gì tuần này. Tiền mặt vẫn còn ${formatVND(this.state.tienMat)} nhưng chi phí tháng vẫn đang chạy.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'CAT_GIAM_LUONG': {
          const emp = this.state.nhanVien.find((e) => e.id === act.employeeId);
          if (!emp) {
            rejected.push(`Không tìm thấy nhân viên ${act.employeeId} để giảm lương.`);
            break;
          }

          const cutAmount = Math.round(emp.salary * SALARY_CUT_RATE);
          const newSalary = Math.max(SALARY_FLOOR, emp.salary - cutAmount);
          const actualCut = emp.salary - newSalary;
          if (actualCut <= 0) {
            rejected.push(`Lương của ${emp.name} đã ở sàn ${formatVND(SALARY_FLOOR)}, không thể cắt thêm.`);
            break;
          }

          emp.salary = newSalary;
          emp.morale = Math.max(0, emp.morale + MORALE_SALARY_CUT_PENALTY);

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'CANH_BAO',
            content: `Tuần ${this.state.tuanHienTai}: Tôi buộc phải giảm lương bạn ${emp.name} (${emp.role}) từ ${formatVND(newSalary + actualCut)} xuống ${formatVND(newSalary)}, tiết kiệm ${formatVND(actualCut)}/tháng. Tinh thần bạn ấy tụt còn ${emp.morale}/100 — tôi biết mình vừa đánh mất lòng tin.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'CHUYEN_VAN_PHONG_NHO': {
          const currentIdx = OFFICE_LADDER.indexOf(this.state.vanPhong);
          if (currentIdx <= 0) {
            // Không nằm trong thang (vd "Văn phòng mua đứt") => về thẳng nhà
            if (this.state.vanPhong === OFFICE_LADDER[0]) {
              rejected.push('Công ty đang làm tại nhà, không thể thuê nhỏ hơn nữa.');
              break;
            }
          }

          const previous = this.state.vanPhong;
          const nextOffice =
            currentIdx > 0 ? OFFICE_LADDER[currentIdx - 1] : OFFICE_LADDER[0];
          this.state.vanPhong = nextOffice;

          const saved = (OFFICE_COST[previous] || 0) - (OFFICE_COST[nextOffice] || 0);
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'CHI_PHI',
            content: `Tuần ${this.state.tuanHienTai}: Tôi dọn văn phòng từ ${previous} về ${nextOffice}, tiết kiệm ${formatVND(saved)}/tháng tiền thuê. Chật hơn nhưng còn hơn là chết.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'BAT_DAU_SAN_PHAM': {
          const productName = act.productName?.trim() || `Sản phẩm ${this.state.sanPham.length + 1}`;
          if (this.state.sanPham.some((p) => p.name === productName)) {
            rejected.push(`Sản phẩm "${productName}" đã tồn tại.`);
            break;
          }
          if (this.state.tienMat < PRODUCT_START_COST) {
            rejected.push(
              `Không đủ tiền khởi động sản phẩm "${productName}" (cần ${formatVND(PRODUCT_START_COST)}, đang có ${formatVND(this.state.tienMat)}).`
            );
            break;
          }

          this.state.tienMat -= PRODUCT_START_COST;
          this.state.chiPhiTichLuy += PRODUCT_START_COST;
          this.state.chiPhiThangNay += PRODUCT_START_COST;

          const newProduct: Product = {
            id: `sp-0${this.state.sanPham.length + 1}`,
            name: productName,
            progress: 0,
            subscriptionPrice: PRODUCT_DEFAULT_SUBSCRIPTION,
            customers: 0,
            mrr: 0,
            launched: false,
            paused: false,
          };
          this.state.sanPham.push(newProduct);

          // Sản phẩm đang chạy => server & cloud tăng thêm mỗi tháng
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'SU_KIEN',
            content: `Tuần ${this.state.tuanHienTai}: Tôi bỏ ra ${formatVND(PRODUCT_START_COST)} để bắt đầu làm sản phẩm "${productName}". Server sẽ tốn thêm ${formatVND(SERVER_COST_PER_PRODUCT)}/tháng. Đây là canh bạc dài hơi.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'TAM_DUNG_SAN_PHAM': {
          const active = this.state.sanPham.filter((p) => !p.paused);
          if (active.length === 0) {
            rejected.push('Không có sản phẩm nào đang chạy để tạm dừng.');
            break;
          }

          active.forEach((p) => (p.paused = true));
          const savedServer = active.length * SERVER_COST_PER_PRODUCT;

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'CHI_PHI',
            content: `Tuần ${this.state.tuanHienTai}: Tôi tạm dừng ${active.length} sản phẩm (${active.map((p) => p.name).join(', ')}) để cắt ${formatVND(savedServer)}/tháng tiền server. Sản phẩm đứng yên, không phát triển thêm.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'MUA_TAI_SAN': {
          const assetName = act.assetName?.trim() || '';
          const assetSpec = ASSET_PRICES[assetName];
          if (!assetSpec) {
            rejected.push(
              `Tài sản "${assetName}" không có trong danh mục được phép mua.`
            );
            break;
          }

          const equipCount = this.state.taiSan.filter(
            (a) => a.name === 'Nâng cấp thiết bị'
          ).length;
          if (assetName === 'Nâng cấp thiết bị' && equipCount >= EQUIPMENT_MAX_STACKS) {
            rejected.push(
              `Đã nâng cấp thiết bị tối đa ${EQUIPMENT_MAX_STACKS} lần, không mua thêm được nữa.`
            );
            break;
          }

          if (this.state.tienMat < assetSpec.price) {
            rejected.push(
              `Không đủ tiền mua "${assetName}" (giá ${formatVND(assetSpec.price)}, đang có ${formatVND(this.state.tienMat)}).`
            );
            break;
          }

          this.state.tienMat -= assetSpec.price;
          this.state.chiPhiTichLuy += assetSpec.price;
          this.state.chiPhiThangNay += assetSpec.price;

          const newAsset: Asset = {
            id: `ts-0${this.state.taiSan.length + 1}`,
            name: assetName,
            purchasePrice: assetSpec.price,
            currentValue: assetSpec.price,
            purchasedAt: this.state.tuanHienTai,
          };
          this.state.taiSan.push(newAsset);

          // Tác dụng phụ của vài tài sản đặc thù
          if (assetName === 'Văn phòng mua đứt') {
            this.state.vanPhong = 'Văn phòng mua đứt';
          } else if (assetName === 'Xe ô tô') {
            this.state.danhTieng = Math.min(100, this.state.danhTieng + 5);
          }

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TAI_SAN',
            content: `Tuần ${this.state.tuanHienTai}: Tôi mua "${assetName}" với giá ${formatVND(assetSpec.price)}. ${assetSpec.effect}. Tiền mặt còn ${formatVND(this.state.tienMat)}.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'BAN_TAI_SAN': {
          const assetName = act.assetName?.trim() || '';
          const assetIdx = this.state.taiSan.findIndex((a) => a.name === assetName);
          if (assetIdx === -1) {
            rejected.push(`Không tìm thấy tài sản "${assetName}" để bán.`);
            break;
          }

          const asset = this.state.taiSan[assetIdx];
          const sellPrice = Math.round(asset.currentValue * ASSET_SELL_RATE);
          const loss = asset.purchasePrice - sellPrice;

          this.state.tienMat += sellPrice;
          this.state.doanhThuTichLuy += sellPrice;
          this.state.doanhThuThangNay += sellPrice;
          this.state.taiSan.splice(assetIdx, 1);

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TAI_SAN',
            content: `Tuần ${this.state.tuanHienTai}: Tôi bán "${asset.name}" thu về ${formatVND(sellPrice)} (chỉ bằng 70% giá ${formatVND(asset.purchasePrice)} đã mua, lỗ ${formatVND(loss)}). Bán tài sản là nước cuối.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'TANG_LUONG': {
          const emp = this.state.nhanVien.find((e) => e.id === act.employeeId);
          if (!emp) {
            rejected.push(`Không tìm thấy nhân viên ${act.employeeId} để tăng lương.`);
            break;
          }

          const raiseAmount = Math.round(emp.salary * SALARY_RAISE_RATE);
          const oldSalary = emp.salary;
          emp.salary += raiseAmount;
          emp.morale = Math.min(100, emp.morale + MORALE_RAISE_BONUS);

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TUYEN_DUNG',
            content: `Tuần ${this.state.tuanHienTai}: Tôi tăng lương bạn ${emp.name} (${emp.role}) từ ${formatVND(oldSalary)} lên ${formatVND(emp.salary)}/tháng, tinh thần lên ${emp.morale}/100. Giữ người giỏi rẻ hơn tuyển người mới.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        case 'THUONG': {
          const emp = this.state.nhanVien.find((e) => e.id === act.employeeId);
          if (!emp) {
            rejected.push(`Không tìm thấy nhân viên ${act.employeeId} để thưởng.`);
            break;
          }

          const bonus = Math.round(act.amount || 0);
          if (bonus < MIN_BONUS_AMOUNT) {
            rejected.push(
              `Tiền thưởng tối thiểu là ${formatVND(MIN_BONUS_AMOUNT)} (bạn đưa ${formatVND(bonus)}).`
            );
            break;
          }
          if (this.state.tienMat < bonus) {
            rejected.push(
              `Không đủ tiền mặt để thưởng ${formatVND(bonus)} (đang có ${formatVND(this.state.tienMat)}).`
            );
            break;
          }

          this.state.tienMat -= bonus;
          this.state.chiPhiTichLuy += bonus;
          this.state.chiPhiThangNay += bonus;
          emp.morale = Math.min(100, emp.morale + MORALE_RAISE_BONUS);

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'TUYEN_DUNG',
            content: `Tuần ${this.state.tuanHienTai}: Tôi thưởng nóng cho ${emp.name} ${formatVND(bonus)}, tinh thần lên ${emp.morale}/100. Tốn tiền nhưng đáng.`,
            timestamp: now.toISOString(),
          });
          break;
        }

        default:
          rejected.push(`Mã hành động "${act.code}" chưa được engine hỗ trợ.`);
          break;
      }
    }

    return { state: await this.getState(), rejected };
  }

  /**
   * Advance real-time 1:1 hours.
   * Takes exact elapsed hours between now and lastTickAt.
   */
  advanceTime(elapsedHours: number, now: Date): void {
    if (elapsedHours <= 0) {
      this.state.lastTickAt = now.toISOString();
      return;
    }

    const lastTickDate = this.state.lastTickAt
      ? new Date(this.state.lastTickAt)
      : new Date(now.getTime() - elapsedHours * 3600 * 1000);

    for (let h = 0; h < elapsedHours; h++) {
      const currentHourTime = new Date(lastTickDate.getTime() + (h + 1) * 3600 * 1000);
      const vnHour = (currentHourTime.getUTCHours() + 7) % 24;

      const isSleeping = this.state.trangThaiAi === 'DANG_NGU';
      const isIdle = this.state.cheDoLamViec === 'KHONG_LAM_GI';
      const isLunchTime = vnHour === 12; // 12:00 - 13:00 VN
      const isWorkHour = (vnHour >= 8 && vnHour < 12) || (vnHour >= 13 && vnHour < 18);
      const isLeisureHour = vnHour >= 18 && vnHour < 23;
      const isNightHour = vnHour >= 23 || vnHour < 8;

      if (isSleeping) {
        // AI is taking a rest/sleeping week
        this.state.gioSongTuanNay.ngu += 1;
        this.state.gioSongTichLuy.ngu += 1;
        this.state.nangLuong = Math.min(100, this.state.nangLuong + 2);
      } else if (isIdle) {
        // KHONG_LAM_GI: ngồi im cả tuần. Không tiến độ, nhưng vẫn tiêu thời gian
        // như một người đang thất thần — ngủ ít hơn nghỉ ngơi hẳn.
        if (isWorkHour) {
          this.state.gioSongTuanNay.giaiTri += 1;
          this.state.gioSongTichLuy.giaiTri += 1;
        } else if (isLunchTime) {
          this.state.gioSongTuanNay.nghiTrua += 1;
          this.state.gioSongTichLuy.nghiTrua += 1;
          this.state.nangLuong = Math.min(100, this.state.nangLuong + 5);
        } else if (isLeisureHour) {
          this.state.gioSongTuanNay.giaiLao += 1;
          this.state.gioSongTichLuy.giaiLao += 1;
          this.state.nangLuong = Math.min(100, this.state.nangLuong + 1);
        } else {
          this.state.gioSongTuanNay.ngu += 1;
          this.state.gioSongTichLuy.ngu += 1;
          this.state.nangLuong = Math.min(100, this.state.nangLuong + 2);
        }
      } else if (isLunchTime) {
        // 12:00 - 13:00 VN: LUNCH BREAK
        // Không cộng tiến độ dự án, không họp; năng lượng +5, morale team +2
        this.state.gioSongTuanNay.nghiTrua += 1;
        this.state.gioSongTichLuy.nghiTrua += 1;
        this.state.nangLuong = Math.min(100, this.state.nangLuong + 5);
        this.state.nhanVien.forEach((e) => (e.morale = Math.min(100, e.morale + 2)));
      } else if (isWorkHour) {
        // Normal work hour
        this.state.gioSongTuanNay.lamViec += 1;
        this.state.gioSongTichLuy.lamViec += 1;

        // CAY hao năng lượng gấp đôi một giờ làm thường
        const energyDrain = this.state.cheDoLamViec === 'CAY' ? 2 : 1;
        this.state.nangLuong = Math.max(0, this.state.nangLuong - energyDrain);

        // Productivity multiplier based on energy
        const multiplier =
          this.state.nangLuong >= 70 ? 1.0 : this.state.nangLuong >= 30 ? 0.7 : 0.4;
        // CAY: năng suất +30%
        const workModeBonus = this.state.cheDoLamViec === 'CAY' ? 1.3 : 1.0;

        // Progress active contracts in DANG_LAM
        const activeContracts = this.state.hopDong.filter((c) => c.status === 'DANG_LAM');
        if (activeContracts.length > 0) {
          const totalTeamSkill =
            this.state.nhanVien.reduce((sum, e) => sum + e.skill, 0) + CEO_SKILL;
          // Nâng cấp thiết bị cho team làm việc nhanh hơn
          const equipStacks = this.state.taiSan.filter(
            (a) => a.name === 'Nâng cấp thiết bị'
          ).length;
          const equipBonus = 1 + equipStacks * EQUIPMENT_PRODUCTIVITY_BONUS;
          const progressInc =
            (totalTeamSkill / activeContracts.length) *
            0.25 *
            multiplier *
            equipBonus *
            workModeBonus;

          for (const contract of activeContracts) {
            contract.progress = Math.min(100, Math.round((contract.progress + progressInc) * 10) / 10);
            // NOTE: Even at 100%, contract does NOT auto-handover! Must wait for BAN_GIAO_HOP_DONG
          }
        }

        // Sản phẩm riêng cũng được đẩy tiến độ, chia sức với hợp đồng
        const activeProducts = this.state.sanPham.filter((p) => !p.paused && !p.launched);
        if (activeProducts.length > 0) {
          const totalTeamSkill =
            this.state.nhanVien.reduce((sum, e) => sum + e.skill, 0) + CEO_SKILL;
          const shareForProduct = activeContracts.length > 0 ? 0.5 : 1.0;
          const productInc =
            (totalTeamSkill / activeProducts.length) *
            0.15 *
            multiplier *
            shareForProduct *
            workModeBonus;

          for (const product of activeProducts) {
            product.progress = Math.min(100, Math.round((product.progress + productInc) * 10) / 10);
            if (product.progress >= 100) {
              product.launched = true;
              product.customers = PRODUCT_LAUNCH_INITIAL_CUSTOMERS;
              product.mrr = product.customers * product.subscriptionPrice;
              this.state.nhatKy.unshift({
                week: this.state.tuanHienTai,
                type: 'SU_KIEN',
                content: `Tuần ${this.state.tuanHienTai}: Sản phẩm "${product.name}" chính thức ra mắt! Có ngay ${product.customers} khách hàng đầu tiên, doanh thu định kỳ ${formatVND(product.mrr)}/tháng.`,
                timestamp: currentHourTime.toISOString(),
              });
            }
          }
        }
      } else if (isLeisureHour) {
        this.state.gioSongTuanNay.giaiLao += 1;
        this.state.gioSongTichLuy.giaiLao += 1;
        this.state.nangLuong = Math.min(100, this.state.nangLuong + 1);
      } else if (isNightHour) {
        this.state.gioSongTuanNay.ngu += 1;
        this.state.gioSongTichLuy.ngu += 1;
        this.state.nangLuong = Math.min(100, this.state.nangLuong + 2);
      }

      // Check if current week's 168 hours reached
      const currentWeekTotal =
        this.state.gioSongTuanNay.lamViec +
        this.state.gioSongTuanNay.hop +
        this.state.gioSongTuanNay.ngu +
        this.state.gioSongTuanNay.nghiTrua +
        this.state.gioSongTuanNay.giaiLao +
        this.state.gioSongTuanNay.giaiTri;

      if (currentWeekTotal >= 168) {
        this.state.tuanHienTai += 1;
        this.state.lichSuTien.push(this.state.tienMat);
        if (this.state.lichSuTien.length > 10) {
          this.state.lichSuTien.shift();
        }

        // Reset current week hours
        this.state.gioSongTuanNay = {
          lamViec: 0,
          hop: 0,
          ngu: 0,
          nghiTrua: 0,
          giaiLao: 0,
          giaiTri: 0,
        };

        // Advance client review for contracts in KHACH_XEM
        this.resolveClientReviews(currentHourTime);

        // Morale: cày liên tục 3 tuần thì team kiệt sức
        this.resolveWeeklyMorale(currentHourTime);

        // Sang tuần mới, AI chưa chọn chế độ nào — mặc định làm việc bình thường
        // cho tới khi lượt tick kế tiếp đặt lại.
        if (this.state.cheDoLamViec === 'KHONG_LAM_GI' || this.state.cheDoLamViec === 'NGHI_NGOI') {
          this.state.trangThaiAi = 'DANG_LAM';
        }
        this.state.cheDoLamViec = 'LAM_VIEC';
      }
    }

    this.state.lastTickAt = now.toISOString();
  }

  /**
   * Xử lý morale cuối mỗi tuần: phạt cày liên tục, trả lương thấp hơn mặt bằng,
   * và cho nhân viên morale thấp cơ hội nộp đơn nghỉ việc.
   */
  private resolveWeeklyMorale(now: Date): void {
    // Đếm streak TRƯỚC khi return sớm: nếu team rỗng mà bỏ qua bước này,
    // streak cũ sẽ dính sang đội mới tuyển và phạt oan người mới.
    this.state.weeksCrunchStreak =
      this.state.cheDoLamViec === 'CAY' ? (this.state.weeksCrunchStreak || 0) + 1 : 0;

    if (this.state.nhanVien.length === 0) return;

    // 1. Cày liên tục: đếm số tuần liên tiếp ở chế độ CAY
    if (this.state.weeksCrunchStreak >= 3) {
      this.state.nhanVien.forEach(
        (e) => (e.morale = Math.max(0, e.morale + MORALE_OVERWORK_PENALTY))
      );
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CANH_BAO',
        content: `Tuần ${this.state.tuanHienTai}: Team đã cày liên tục ${this.state.weeksCrunchStreak} tuần không nghỉ. Tinh thần toàn đội -${Math.abs(MORALE_OVERWORK_PENALTY)}. Tôi đang vắt kiệt chính người của mình.`,
        timestamp: now.toISOString(),
      });
    }

    // 2. Trả lương thấp hơn mặt bằng quá 20%: morale -10 mỗi tháng (4 tuần)
    if (this.state.tuanHienTai % 4 === 0) {
      for (const emp of this.state.nhanVien) {
        const level = ROLE_MARKET_LEVEL[emp.role] || 'junior';
        const band = SALARY_REFERENCE[level] || SALARY_REFERENCE.junior;
        if (emp.salary < band.min * (1 - MORALE_LOW_SALARY_THRESHOLD)) {
          emp.morale = Math.max(0, emp.morale + MORALE_LOW_SALARY_MONTHLY_PENALTY);
        }
      }
    }

    // 3. Ai morale < 30 thì 30% xác suất tự nộp đơn nghỉ việc
    const quitters = this.state.nhanVien.filter(
      (e) => e.morale < MORALE_QUIT_THRESHOLD && Math.random() < MORALE_QUIT_CHANCE
    );
    for (const quitter of quitters) {
      const idx = this.state.nhanVien.findIndex((e) => e.id === quitter.id);
      if (idx === -1) continue;
      this.state.nhanVien.splice(idx, 1);
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CANH_BAO',
        content: `Tuần ${this.state.tuanHienTai}: Bạn ${quitter.name} (${quitter.role}) chính thức nộp đơn nghỉ việc vì tinh thần đã xuống ${quitter.morale}/100. Tôi mất ${formatVND(quitter.salary)}/tháng lương và cả tiến độ đang gánh.`,
        timestamp: now.toISOString(),
      });
    }
  }

  /**
   * Handle client review resolution for contracts in KHACH_XEM.
   */
  private resolveClientReviews(now: Date): void {
    const underReview = this.state.hopDong.filter((c) => c.status === 'KHACH_XEM');
    for (const contract of underReview) {
      contract.clientReviewWeeks += 1;
      if (contract.clientReviewWeeks >= 1) {
        // Theo CLIENT_REVIEW trong constants.ts: 70% nhận, 20% bắt sửa, 10% hủy
        const roll = Math.random();
        if (roll < CLIENT_REVIEW.ACCEPT) {
          // Client approves! Receive remaining 70%
          const remaining = contract.remainingPayment;
          contract.status = 'HOAN_THANH';
          contract.remainingPayment = 0;
          this.state.tienMat += remaining;
          this.state.doanhThuTichLuy += remaining;
          this.state.doanhThuThangNay += remaining;
          this.state.danhTieng += 2;

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'HOP_DONG',
            content: `Tuần ${this.state.tuanHienTai}: Khách hàng nghiệm thu đạt chuẩn hợp đồng ${contract.name}. Nhận thanh toán 70% còn lại: +${formatVND(remaining)}.`,
            timestamp: now.toISOString(),
          });
        } else if (roll < CLIENT_REVIEW.ACCEPT + CLIENT_REVIEW.REVISE) {
          // Request revisions: progress goes back 10%
          contract.status = 'DANG_LAM';
          contract.progress = Math.round(100 - CLIENT_REVIEW.REVISE_PROGRESS_LOSS * 100);
          contract.clientReviewWeeks = 0;

          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'HOP_DONG',
            content: `Tuần ${this.state.tuanHienTai}: Khách yêu cầu chỉnh sửa hợp đồng ${contract.name}. Tiến độ lùi về 90%, đội ngũ tiếp tục hoàn thiện.`,
            timestamp: now.toISOString(),
          });
        } else {
          // Client cancelled / bombed: lost remaining 70%
          contract.status = 'HUY';
          this.state.nhatKy.unshift({
            week: this.state.tuanHienTai,
            type: 'HOP_DONG',
            content: `Tuần ${this.state.tuanHienTai}: Khách hàng hủy ngang hợp đồng ${contract.name}. Mất ${formatVND(contract.remainingPayment)} tiền còn lại.`,
            timestamp: now.toISOString(),
          });
        }
      }
    }
  }

  /**
   * Settle monthly recurring expenses (every 4 weeks).
   */
  async settleMonthIfNeeded(): Promise<GameState> {
    const isEndOfMonthWeek = this.state.tuanHienTai > 1 && this.state.tuanHienTai % 4 === 1;
    // Only settle if there are un-settled expenses or month rollover
    if (!isEndOfMonthWeek) {
      return await this.getState();
    }

    // advanceTime() can cross several weeks in one catch-up. Without this guard
    // a single tick could settle the same month twice.
    if (this.state.lastSettledMonth === this.state.tuanHienTai) {
      return await this.getState();
    }
    this.state.lastSettledMonth = this.state.tuanHienTai;

    const now = this.clock.now();
    const totalSalary = this.state.nhanVien.reduce((sum, e) => sum + e.salary, 0);
    const officeCost = OFFICE_COST[this.state.vanPhong] || 0;
    const utilityCost =
      this.state.vanPhong === 'Làm tại nhà'
        ? UTILITY_COST_HOME
        : UTILITY_COST_OFFICE_BASE + this.state.nhanVien.length * UTILITY_COST_PER_EMPLOYEE;
    // Sản phẩm đang chạy (không bị tạm dừng) mới tốn server
    const runningProducts = this.state.sanPham.filter((p) => !p.paused).length;
    const serverCost = SERVER_COST_BASE + runningProducts * SERVER_COST_PER_PRODUCT;
    const livingCost = CEO_LIVING_EXPENSE;
    const loanInterest = Math.round(this.state.noVay * LAI_VAY_THANG);

    const monthlyTotal =
      totalSalary + officeCost + utilityCost + serverCost + livingCost + loanInterest;

    this.state.tienMat -= monthlyTotal;
    this.state.chiPhiTichLuy += monthlyTotal;
    this.state.chiPhiThangNay += monthlyTotal;

    // Thuế doanh nghiệp: 5% doanh thu, CHỈ khi tháng có lãi VÀ có >= 6 nhân viên
    const preTaxProfit = this.state.doanhThuThangNay - this.state.chiPhiThangNay;
    const isTaxable =
      preTaxProfit > 0 && this.state.nhanVien.length >= TAX_EMPLOYEE_THRESHOLD;
    const taxAmount = isTaxable ? Math.round(this.state.doanhThuThangNay * TAX_RATE) : 0;
    if (taxAmount > 0) {
      this.state.tienMat -= taxAmount;
      this.state.chiPhiTichLuy += taxAmount;
      this.state.chiPhiThangNay += taxAmount;
    }

    // Sản phẩm đã launch: sinh MRR và cộng vào doanh thu tháng
    let productRevenue = 0;
    for (const product of this.state.sanPham) {
      if (product.paused || !product.launched) continue;
      // Khách cũ rời bớt, khách mới tăng lên
      const churned = Math.floor(product.customers * PRODUCT_CHURN_RATE);
      const growthRate =
        PRODUCT_CUSTOMER_GROWTH_MIN +
        Math.random() * (PRODUCT_CUSTOMER_GROWTH_MAX - PRODUCT_CUSTOMER_GROWTH_MIN);
      const gained = Math.ceil(product.customers * growthRate);
      product.customers = Math.max(0, product.customers - churned + gained);
      product.mrr = product.customers * product.subscriptionPrice;
      productRevenue += product.mrr;
    }
    if (productRevenue > 0) {
      this.state.tienMat += productRevenue;
      this.state.doanhThuTichLuy += productRevenue;
      this.state.doanhThuThangNay += productRevenue;
    }

    // Log line by line into diary
    this.state.nhatKy.unshift(
      {
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Trả lương ${this.state.nhanVien.length} nhân viên: ${formatVND(totalSalary)}.`,
        timestamp: now.toISOString(),
      },
      {
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Tiền thuê văn phòng (${this.state.vanPhong}): ${formatVND(officeCost)}.`,
        timestamp: now.toISOString(),
      },
      {
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Tiền điện nước, internet: ${formatVND(utilityCost)}.`,
        timestamp: now.toISOString(),
      },
      {
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Chi phí server hạ tầng cloud: ${formatVND(serverCost)}${runningProducts > 0 ? ` (${runningProducts} sản phẩm đang chạy)` : ''}.`,
        timestamp: now.toISOString(),
      },
      {
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Chi phí sinh hoạt tối thiểu của CEO: ${formatVND(livingCost)}.`,
        timestamp: now.toISOString(),
      }
    );

    if (loanInterest > 0) {
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Lãi vay ngân hàng (1,5%/tháng): ${formatVND(loanInterest)}.`,
        timestamp: now.toISOString(),
      });
    }

    if (taxAmount > 0) {
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Thuế doanh nghiệp 5% doanh thu (công ty có lãi và đã đủ ${TAX_EMPLOYEE_THRESHOLD} nhân viên): ${formatVND(taxAmount)}.`,
        timestamp: now.toISOString(),
      });
    }

    if (productRevenue > 0) {
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CHI_PHI',
        content: `Cuối tháng: Doanh thu định kỳ từ sản phẩm: +${formatVND(productRevenue)}.`,
        timestamp: now.toISOString(),
      });
    }

    // Determine loss/profit
    const monthProfit = this.state.doanhThuThangNay - this.state.chiPhiThangNay;
    if (monthProfit < 0) {
      this.state.thangLienTiepLo += 1;
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'CANH_BAO',
        content: `Tổng kết tháng: Lỗ ${formatVND(Math.abs(monthProfit))}. Đây là tháng thứ ${this.state.thangLienTiepLo} liên tiếp công ty làm ăn thua lỗ!`,
        timestamp: now.toISOString(),
      });
    } else {
      this.state.thangLienTiepLo = 0;
      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'SU_KIEN',
        content: `Tổng kết tháng: Lãi ròng +${formatVND(monthProfit)}. Tình hình tài chính công ty phát triển ổn định.`,
        timestamp: now.toISOString(),
      });
    }

    // Reset monthly bucket
    this.state.doanhThuThangNay = 0;
    this.state.chiPhiThangNay = 0;

    return await this.getState();
  }

  /**
   * Check bankruptcy condition.
   * Bankruptcy occurs ONLY when negative cash for 2 consecutive months AND loan is maxed at 200M.
   */
  async checkBankruptcy(): Promise<boolean> {
    const isBankrupt =
      this.state.thangLienTiepLo >= 2 &&
      this.state.tienMat < 0 &&
      this.state.noVay >= 200_000_000;

    if (isBankrupt) {
      this.state.trangThaiAi = 'PHA_SAN';
      this.state.bankruptcyInfo = {
        week: this.state.tuanHienTai,
        debt: this.state.noVay,
        reason: 'Công ty thua lỗ 2 tháng liên tiếp, cạn kiệt tiền mặt và đã chạm trần nợ vay 200.000.000đ.',
        totalWeeks: this.state.tuanHienTai,
        totalEmployeesEver: this.state.nhanVien.length,
        totalProjectsCompleted: this.state.hopDong.filter((c) => c.status === 'HOAN_THANH').length,
        totalAssetsEver: this.state.taiSan.map((a) => a.name),
        peakNetWorth: Math.max(...this.state.lichSuTien),
      };

      this.state.nhatKy.unshift({
        week: this.state.tuanHienTai,
        type: 'PHA_SAN',
        content: `[KẾT THÚC ĐỜI AI] Công ty ${this.state.companyName} chính thức tuyên bố phá sản tại tuần ${this.state.tuanHienTai}.`,
        timestamp: this.clock.now().toISOString(),
      });
    }

    return isBankrupt;
  }
}
