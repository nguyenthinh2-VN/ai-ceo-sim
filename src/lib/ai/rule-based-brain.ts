// ============================================================
// rule-based-brain.ts — Rule-based AI Brain (Fallback/Demo mode)
// Used when OPENAI_API_KEY is not configured or OpenAI fails.
// Returns transparent demo flag (demo: true), never pretends to be LLM.
// ============================================================

import { GameState, AiDecision, AiAction } from '../types';
import { formatVND } from '../format';

export class RuleBasedBrain {
  decide(state: GameState, reasonPrefix?: string): AiDecision & { isDemo: true } {
    const actions: AiAction[] = [];
    const diary: string[] = [];

    // 1. Check contracts ready for handover
    const readyContracts = state.hopDong.filter(
      (c) => c.status === 'DANG_LAM' && c.progress >= 100
    );
    for (const c of readyContracts) {
      actions.push({ code: 'BAN_GIAO_HOP_DONG', contractId: c.id });
      diary.push(
        `Tuần ${state.tuanHienTai}: Tôi hoàn thành và bàn giao hợp đồng ${c.id} (${c.name}), đang chờ khách xem và nghiệm thu đợt cuối ${formatVND(c.remainingPayment)}.`
      );
    }

    // 2. Check energy level
    if (state.nangLuong < 30) {
      actions.push({ code: 'NGHI_NGOI' });
      diary.push(
        `Tuần ${state.tuanHienTai}: Năng lượng tôi chỉ còn ${state.nangLuong}/100. Tôi quyết định nghỉ ngơi để phục hồi sức khỏe.`
      );
    } else if (state.hopDong.filter((c) => c.status === 'DANG_LAM').length === 0) {
      // 3. No active contracts -> find new contract
      actions.push({ code: 'TIM_HOP_DONG', contractId: `HD-00${state.tuanHienTai + 1}` });
      actions.push({ code: 'LAM_VIEC' });
      diary.push(
        `Tuần ${state.tuanHienTai}: Team đang trống việc. Tôi chủ động tìm kiếm thêm hợp đồng phần mềm mới để duy trì doanh thu.`
      );
    } else {
      // 4. Default: Work normally
      actions.push({ code: 'LAM_VIEC' });
      diary.push(
        `Tuần ${state.tuanHienTai}: Tôi cùng ${state.nhanVien.length} nhân sự tiếp tục tập trung code và bám sát tiến độ hợp đồng.`
      );
    }

    const note = reasonPrefix ? `[Demo fallback: ${reasonPrefix}] ` : '[Chế độ Luật Tạm — Demo] ';

    return {
      plan: `${note}Tập trung tối ưu vận hành và đảm bảo an toàn dòng tiền.`,
      reason: `${note}Hệ thống đang hoạt động theo luật tự hành chuẩn khi chưa kết nối LLM trực tiếp.`,
      actions,
      diary,
      isDemo: true,
    };
  }
}
