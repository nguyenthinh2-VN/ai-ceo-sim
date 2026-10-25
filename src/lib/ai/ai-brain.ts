// ============================================================
// ai-brain.ts — Orchestrator for AI CEO Decisions (SRP, DIP)
// Coordinates LlmClient, PromptBuilder, Parser, and Fallback.
// Does NOT touch DB directly, enabling unit testing with mock LLM.
// ============================================================

import { AiBrain, AiDecision, GameState, LlmClient, Clock } from '../types';
import { OpenAiClient } from './openai-client';
import { buildPrompt } from './prompt-builder';
import { parseAiResponse } from './ai-response-parser';
import { RuleBasedBrain } from './rule-based-brain';

export class AiBrainImpl implements AiBrain {
  private llmClient: LlmClient | null;
  private ruleBrain: RuleBasedBrain;
  private clock: Clock;

  constructor(llmClient?: LlmClient, clock?: Clock) {
    this.ruleBrain = new RuleBasedBrain();
    this.clock = clock || { now: () => new Date() };

    if (llmClient) {
      this.llmClient = llmClient;
    } else if (process.env.OPENAI_API_KEY) {
      this.llmClient = new OpenAiClient();
    } else {
      this.llmClient = null;
    }
  }

  /**
   * Determine if an LLM decision is needed this turn
   * (morning, events, critical cash, bankruptcy danger).
   *
   * `hoursElapsed` là số giờ game đã trôi qua kể từ lượt tick trước.
   * Bằng 0 nghĩa là thế giới chưa nhích giờ nào — state y hệt lượt trước,
   * không có thông tin mới nào để suy nghĩ. Cron 15 phút/lần cho ra 96 lượt
   * một ngày, trong đó chỉ ~24 lượt có giờ trôi qua; gọi LLM ở 72 lượt còn
   * lại là trả tiền cho 72 câu trả lời giống nhau.
   */
  shouldInvokeLlm(state: GameState, now: Date, hoursElapsed = 1): boolean {
    // 0. Không có giờ nào trôi qua thì không có gì mới để quyết định.
    //    Đặt trước mọi điều kiện khác, kể cả buổi sáng: một lượt cron lúc
    //    8:00 mà chưa đủ 1 giờ tích lũy vẫn là cùng một thế giới.
    if (hoursElapsed <= 0) return false;

    const vnHour = (now.getUTCHours() + 7) % 24;

    // 1. Morning start of work day (8:00 VN)
    if (vnHour === 8) return true;

    // 2. Any contract completed 100% needing handover
    const hasReadyContract = state.hopDong.some(
      (c) => c.status === 'DANG_LAM' && c.progress >= 100
    );
    if (hasReadyContract) return true;

    // 3. Any contract client review completed
    const hasReviewedContract = state.hopDong.some(
      (c) => c.status === 'KHACH_XEM' && c.clientReviewWeeks >= 1
    );
    if (hasReviewedContract) return true;

    // 4. Critical energy (< 30)
    if (state.nangLuong < 30) return true;

    // 5. Low runway (< 2 months burn)
    const monthlyBurn = state.nhanVien.reduce((sum, e) => sum + e.salary, 0) + 15_000_000;
    if (state.tienMat < monthlyBurn * 2) return true;

    // 6. Loss streak
    if (state.thangLienTiepLo >= 1) return true;

    // 7. No active projects
    const hasRunning = state.hopDong.some((c) => c.status === 'DANG_LAM');
    if (!hasRunning) return true;

    return false;
  }

  async decide(
    state: GameState,
    forceDecision?: boolean,
    hoursElapsed = 1
  ): Promise<AiDecision & { isDemo?: boolean }> {
    const now = this.clock.now();
    const needsDecision = forceDecision || this.shouldInvokeLlm(state, now, hoursElapsed);

    // If routine hour without new decision needed, continue work schedule without spending API tokens.
    // Trả về actions RỖNG, không phải LAM_VIEC: phát LAM_VIEC mỗi giờ sẽ ghi đè
    // chế độ AI đã chọn cho tuần này (CAY/NGHI_NGOI), khiến nó không sống nổi 1 giờ.
    if (!needsDecision) {
      return {
        plan: state.keHoachHienTai,
        reason: 'Tiếp tục thực hiện lịch trình làm việc đã đề ra.',
        actions: [],
        diary: [],
        // Giữ nguyên cờ của lượt trước. Lượt này không có quyết định nào cả,
        // nên nó không thể là bằng chứng rằng AI đang suy nghĩ thật — gán
        // false ở đây sẽ gỡ badge "CHẠY THỬ" ngay sau một lượt LLM lỗi.
        isDemo: state.isDemo,
      };
    }

    // Fallback if no OpenAI key
    if (!this.llmClient || !process.env.OPENAI_API_KEY) {
      return this.ruleBrain.decide(state, 'Chưa có OPENAI_API_KEY');
    }

    // Try calling LLM
    try {
      const { systemPrompt, userMessage, allowedActions } = buildPrompt(state, now);
      const rawResponse = await this.llmClient.chat(systemPrompt, userMessage);
      const parseResult = parseAiResponse(rawResponse, state, allowedActions);

      return parseResult.decision;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ [AiBrain] OpenAI call failed, falling back to RuleBasedBrain:', message);
      const fallback = this.ruleBrain.decide(state, `Lỗi OpenAI: ${message}`);
      fallback.diary.unshift(
        `Tuần ${state.tuanHienTai}: [Sự cố LLM] Kết nối OpenAI gặp lỗi (${message}). AI tạm thời kích hoạt luật an toàn.`
      );
      return fallback;
    }
  }
}
