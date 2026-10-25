// ============================================================
// ai-response-parser.ts — Parse & Validate LLM output (SRP)
// Validates JSON structure, action codes, domain constraints.
// Rejects illegal actions and logs reasons, never trusts output blindly.
// ============================================================

import { AiDecision, AiAction, ActionCode, GameState } from '../types';
import { MAX_VAY, HIRE_CASH_MONTHS, SALARY_REFERENCE, ROLE_MARKET_LEVEL, MIN_BONUS_AMOUNT, SALARY_FLOOR, PRODUCT_START_COST, ASSET_PRICES, MAX_ACTIONS_PER_WEEK } from '../constants';
import { formatVND } from '../format';

/** Định dạng tiền gọn cho thông báo từ chối. */
const formatShort = (n: number) => formatVND(n);

// --- Chuẩn hóa kiểu từ JSON thô của LLM -----------------------------
// Trả về `undefined` thay vì ném lỗi: một trường sai kiểu chỉ nên làm hỏng
// chính hành động đó, không được kéo sập cả phản hồi.

/** Nhận chuỗi khác rỗng, cắt khoảng trắng thừa. */
function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Nhận số hữu hạn; loại NaN và Infinity vì chúng phá vỡ mọi phép tính tiền. */
function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Nhận mã hành động dạng chuỗi; việc kiểm tra thuộc VALID_ACTION_CODES làm sau. */
function asActionCode(value: unknown): ActionCode | undefined {
  return typeof value === 'string' && value.trim() ? (value.trim() as ActionCode) : undefined;
}

const VALID_ACTION_CODES: Set<ActionCode> = new Set([
  'NGHI_NGOI',
  'LAM_VIEC',
  'CAY',
  'TIM_HOP_DONG',
  'THUE_NGUOI',
  'SA_THAI',
  'CAT_GIAM_LUONG',
  'CHUYEN_VAN_PHONG_NHO',
  'TAM_DUNG_SAN_PHAM',
  'HUY_HOP_DONG_LO',
  'BAN_GIAO_HOP_DONG',
  'BAN_TAI_SAN',
  'TANG_LUONG',
  'THUONG',
  'BAT_DAU_SAN_PHAM',
  'MUA_TAI_SAN',
  'VAY_NGAN_HANG',
  'TRA_NO',
  'KHONG_LAM_GI',
]);

export interface ParseResult {
  success: boolean;
  decision: AiDecision;
  rejected: string[];
  rawText?: string;
}

export function parseAiResponse(
  rawText: string,
  state: GameState,
  allowedActions?: AiAction[]
): ParseResult {
  const rejected: string[] = [];

  // LLM trả về JSON tùy ý, không có schema bảo đảm — mọi trường đều được
  // kiểm tra kiểu trước khi dùng. Ép về Record<string, unknown> để truy cập
  // được thuộc tính mà không cần `any`, và mọi giá trị vẫn là `unknown`
  // buộc phải kiểm tra trước khi dùng.
  let parsed: Record<string, unknown>;
  try {
    const raw: unknown = JSON.parse(rawText);
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Phản hồi không phải một object JSON');
    }
    parsed = raw as Record<string, unknown>;
  } catch (err) {
    rejected.push(`Lỗi cú pháp JSON từ LLM: ${(err as Error).message}`);
    return {
      success: false,
      decision: {
        plan: 'Tiếp tục vận hành và kiểm tra tình hình công ty.',
        reason: 'Phát hiện lỗi định dạng phản hồi từ AI, tự động chuyển về chế độ làm việc chuẩn.',
        actions: [{ code: 'LAM_VIEC' }],
        diary: [`Tuần ${state.tuanHienTai}: AI gặp sự cố định dạng output, tự động chuyển về làm việc an toàn.`],
      },
      rejected,
      rawText,
    };
  }

  // Validate plan and reason
  const rawPlan = parsed.plan;
  const plan = typeof rawPlan === 'string' && rawPlan.trim()
    ? rawPlan.trim()
    : 'Tập trung duy trì và thúc đẩy công việc.';
  const rawReason = parsed.reason;
  const reason = typeof rawReason === 'string' && rawReason.trim()
    ? rawReason.trim()
    : 'Dựa trên phân tích số liệu tài chính và tiến độ hiện tại.';

  // Validate actions
  const validActions: AiAction[] = [];
  const rawActions: unknown[] = Array.isArray(parsed.actions) ? parsed.actions : [];

  for (const rawAct of rawActions) {
    if (!rawAct || typeof rawAct !== 'object' || Array.isArray(rawAct)) {
      rejected.push(`Bỏ qua action không hợp lệ: ${JSON.stringify(rawAct)}`);
      continue;
    }

    // Chuẩn hóa từng trường về đúng kiểu của AiAction. LLM có thể nhét số,
    // null hay object lồng vào bất kỳ trường nào, nên không được tin vào một
    // lần ép kiểu duy nhất cho cả object — sai kiểu ở `contractId` sẽ lọt
    // xuống tận engine và so sánh chuỗi với số một cách âm thầm.
    const fields = rawAct as Record<string, unknown>;
    const code = asActionCode(fields.code);
    if (!code) {
      rejected.push(`Bỏ qua action không hợp lệ: ${JSON.stringify(rawAct)}`);
      continue;
    }
    if (!VALID_ACTION_CODES.has(code)) {
      rejected.push(`Mã hành động không tồn tại trong luật game: ${code}`);
      continue;
    }

    const act: AiAction = {
      code,
      contractId: asNonEmptyString(fields.contractId),
      employeeId: asNonEmptyString(fields.employeeId),
      assetName: asNonEmptyString(fields.assetName),
      amount: asFiniteNumber(fields.amount),
      productName: asNonEmptyString(fields.productName),
    };

    // Specific domain validations:
    // 1. BAN_GIAO_HOP_DONG: Must have contractId, contract must exist and progress >= 100%
    if (code === 'BAN_GIAO_HOP_DONG') {
      const contract = state.hopDong.find((c) => c.id === act.contractId);
      if (!contract) {
        rejected.push(`Hành động BAN_GIAO_HOP_DONG bị từ chối: Hợp đồng ${act.contractId} không tồn tại`);
        continue;
      }
      if (contract.progress < 100) {
        rejected.push(`Hành động BAN_GIAO_HOP_DONG bị từ chối: Hợp đồng ${contract.id} chưa đạt 100% (hiện tại: ${contract.progress}%)`);
        continue;
      }
      if (contract.status !== 'DANG_LAM') {
        rejected.push(`Hành động BAN_GIAO_HOP_DONG bị từ chối: Hợp đồng ${contract.id} không ở trạng thái DANG_LAM (hiện tại: ${contract.status})`);
        continue;
      }
    }

    // 2. HUY_HOP_DONG_LO: Must have contractId, contract must exist and in DANG_LAM
    if (code === 'HUY_HOP_DONG_LO') {
      const contract = state.hopDong.find((c) => c.id === act.contractId);
      if (!contract) {
        rejected.push(`Hành động HUY_HOP_DONG_LO bị từ chối: Hợp đồng ${act.contractId} không tồn tại`);
        continue;
      }
      if (contract.status !== 'DANG_LAM') {
        rejected.push(`Hành động HUY_HOP_DONG_LO bị từ chối: Hợp đồng ${contract.id} không ở trạng thái DANG_LAM`);
        continue;
      }
    }

    // 4. VAY_NGAN_HANG: Total debt cannot exceed MAX_VAY
    if (code === 'VAY_NGAN_HANG') {
      const borrowAmount = typeof act.amount === 'number' && act.amount > 0 ? act.amount : 50_000_000;
      if (state.noVay + borrowAmount > MAX_VAY) {
        rejected.push(`Hành động VAY_NGAN_HANG bị từ chối: Tổng nợ vay vượt mức trần ${formatShort(MAX_VAY)}`);
        continue;
      }
    }

    // 5. THUE_NGUOI: Must have enough cash for 3 months of that role's market salary
    if (code === 'THUE_NGUOI') {
      const roleFromId = act.employeeId?.replace(/^cand-/, '').split('-')[0] || '';
      const level = ROLE_MARKET_LEVEL[roleFromId] || 'junior';
      const band = SALARY_REFERENCE[level] || SALARY_REFERENCE.junior;
      const required = band.max * HIRE_CASH_MONTHS;
      if (state.tienMat < required) {
        rejected.push(
          `Hành động THUE_NGUOI bị từ chối: Tiền mặt ${formatShort(state.tienMat)} không đủ ${HIRE_CASH_MONTHS} tháng lương vị trí ${roleFromId || 'này'} (cần ${formatShort(required)})`
        );
        continue;
      }
    }

    // 6. SA_THAI / CAT_GIAM_LUONG / TANG_LUONG / THUONG: employee must exist
    if (
      code === 'SA_THAI' ||
      code === 'CAT_GIAM_LUONG' ||
      code === 'TANG_LUONG' ||
      code === 'THUONG'
    ) {
      const emp = state.nhanVien.find((e) => e.id === act.employeeId);
      if (!emp) {
        rejected.push(`Hành động ${code} bị từ chối: Nhân viên ${act.employeeId} không tồn tại`);
        continue;
      }
      if (code === 'CAT_GIAM_LUONG') {
        const newSalary = Math.max(SALARY_FLOOR, Math.round(emp.salary * 0.8));
        if (newSalary >= emp.salary) {
          rejected.push(
            `Hành động CAT_GIAM_LUONG bị từ chối: Lương ${emp.name} đã chạm sàn ${formatShort(SALARY_FLOOR)}`
          );
          continue;
        }
      }
      if (code === 'THUONG') {
        const bonus = Math.round(act.amount || 0);
        if (bonus < MIN_BONUS_AMOUNT) {
          rejected.push(
            `Hành động THUONG bị từ chối: Tiền thưởng tối thiểu ${formatShort(MIN_BONUS_AMOUNT)}`
          );
          continue;
        }
        if (state.tienMat < bonus) {
          rejected.push(
            `Hành động THUONG bị từ chối: Không đủ tiền mặt thưởng ${formatShort(bonus)}`
          );
          continue;
        }
      }
    }

    // 7. MUA_TAI_SAN / BAN_TAI_SAN: tài sản phải có thật trong danh mục
    if (code === 'MUA_TAI_SAN') {
      const spec = act.assetName ? ASSET_PRICES[act.assetName] : undefined;
      if (!spec) {
        rejected.push(`Hành động MUA_TAI_SAN bị từ chối: Không có tài sản "${act.assetName}"`);
        continue;
      }
      if (state.tienMat < spec.price) {
        rejected.push(
          `Hành động MUA_TAI_SAN bị từ chối: Không đủ tiền mua "${act.assetName}" (giá ${formatShort(spec.price)})`
        );
        continue;
      }
    }
    if (code === 'BAN_TAI_SAN') {
      const owned = state.taiSan.find((a) => a.name === act.assetName);
      if (!owned) {
        rejected.push(`Hành động BAN_TAI_SAN bị từ chối: Không sở hữu tài sản "${act.assetName}"`);
        continue;
      }
    }

    // 8. BAT_DAU_SAN_PHAM: phải đủ vốn khởi động
    if (code === 'BAT_DAU_SAN_PHAM') {
      if (state.tienMat < PRODUCT_START_COST) {
        rejected.push(
          `Hành động BAT_DAU_SAN_PHAM bị từ chối: Cần ${formatShort(PRODUCT_START_COST)} vốn khởi động`
        );
        continue;
      }
    }

    // 9. Hành động phải nằm trong danh sách engine thực sự cho phép tuần này
    if (allowedActions && allowedActions.length > 0) {
      const isAllowed = allowedActions.some(
        (a) =>
          a.code === code &&
          (a.contractId ?? undefined) === (act.contractId ?? undefined) &&
          (a.employeeId ?? undefined) === (act.employeeId ?? undefined) &&
          (a.assetName ?? undefined) === (act.assetName ?? undefined)
      );
      if (!isAllowed) {
        rejected.push(
          `Hành động ${code}${act.contractId ? ` (${act.contractId})` : ''}${act.employeeId ? ` (${act.employeeId})` : ''} bị từ chối: không nằm trong danh sách được phép tuần này`
        );
        continue;
      }
    }

    validActions.push(act);
  }

  // Trần hành động: AI chỉ được chọn tối đa 3 hành động/tuần.
  // Bàn giao là hành động BẮT BUỘC (mục G) nên được ưu tiên giữ lại khi phải cắt;
  // cắt mất nó là mất luôn 70% tiền còn lại của hợp đồng.
  if (validActions.length > MAX_ACTIONS_PER_WEEK) {
    const mustKeep = validActions.filter((a) => a.code === 'BAN_GIAO_HOP_DONG');
    const optional = validActions.filter((a) => a.code !== 'BAN_GIAO_HOP_DONG');
    const kept = [
      ...mustKeep.slice(0, MAX_ACTIONS_PER_WEEK),
      ...optional.slice(0, Math.max(0, MAX_ACTIONS_PER_WEEK - mustKeep.length)),
    ];
    const keptSet = new Set(kept);
    const dropped = validActions.filter((a) => !keptSet.has(a));

    validActions.length = 0;
    validActions.push(...kept);

    rejected.push(
      `Vượt trần ${MAX_ACTIONS_PER_WEEK} hành động/tuần: đã bỏ ${dropped.map((a) => a.code).join(', ')}`
    );
  }

  // If no valid actions survive, default to LAM_VIEC
  if (validActions.length === 0) {
    validActions.push({ code: 'LAM_VIEC' });
  }

  // Validate diary entries
  const diary: string[] = [];
  const rawDiary: unknown[] = Array.isArray(parsed.diary) ? parsed.diary : [];
  for (const d of rawDiary) {
    const line = asNonEmptyString(d);
    if (line) {
      diary.push(line);
    }
  }

  // If rejected actions occurred, append a note to diary
  if (rejected.length > 0) {
    diary.push(`[Hệ thống] Đã từ chối ${rejected.length} hành động vi phạm luật: ${rejected.join('; ')}`);
  }

  return {
    success: rejected.length === 0,
    decision: {
      plan,
      reason,
      actions: validActions,
      diary,
    },
    rejected,
    rawText,
  };
}
