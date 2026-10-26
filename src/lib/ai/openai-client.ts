// ============================================================
// openai-client.ts — OpenAI SDK implementation of LlmClient
// Server-only: reads OPENAI_API_KEY from environment.
// ============================================================

import OpenAI from 'openai';
import { LlmClient } from '../types';

/**
 * Trần thời gian cho một lượt gọi LLM.
 *
 * Route `/api/ai-tick` khai báo `maxDuration = 60` vì Vercel mặc định chỉ
 * cho 10s. Vượt hạn này thì Vercel giết cả function — lượt tick mất trắng,
 * không kịp ghi gì vào DB. Chặn ở 50s để còn 10s cho phần còn lại của lượt
 * tick (đọc/ghi DB, settle tháng).
 *
 * Vượt hạn thì `chat()` ném lỗi và `AiBrainImpl` hạ cấp về RuleBasedBrain —
 * lượt tick vẫn hoàn thành và vẫn được lưu.
 *
 * Đo thực tế ngày 25/10/2026: gateway đang mất **~56 giây** cho một lượt,
 * chậm bất thường so với mức 5–15s thường thấy của gpt-4o-mini. Nếu thấy
 * nhật ký đầy dòng `[Sự cố LLM] ... timed out`, hãy đo lại bằng
 * `npm run tick` và đổi `LLM_TIMEOUT_MS`, hoặc xem lại `LLM_MODEL` /
 * `OPENAI_BASE_URL` — chứ đừng nâng số này lên sát 60s, Vercel sẽ giết
 * function giữa chừng và lượt tick đó mất sạch.
 */
function readTimeoutMs(): number {
  const raw = process.env.LLM_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 50_000;
  // Kẹp lại để một giá trị sai trong env không thể vượt trần của Vercel.
  return Math.min(parsed, 55_000);
}

const LLM_TIMEOUT_MS = readTimeoutMs();

export class OpenAiClient implements LlmClient {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || process.env.LLM_MODEL || 'creq/deepseek-v4.1-flash-req';
    const rawBaseUrl = baseUrl || process.env.OPENAI_BASE_URL;
    const baseURL = rawBaseUrl && rawBaseUrl.trim().length > 0 ? rawBaseUrl.trim() : undefined;

    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        ...(baseURL ? { baseURL } : {}),
        // `maxRetries: 0` là chủ đích: SDK mặc định thử lại 2 lần, và mỗi
        // lần lại có thể ngốn thêm 45s — tổng vượt xa maxDuration của
        // Vercel. Thà một lần thử rồi hạ cấp về luật cứng, còn hơn để
        // function bị giết giữa chừng và mất cả lượt tick.
        maxRetries: 0,
      });
    }
  }

  async chat(systemPrompt: string, stateJson: string): Promise<string> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const res = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: stateJson },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      },
      { timeout: LLM_TIMEOUT_MS }
    );

    return res.choices[0]?.message?.content ?? '';
  }
}
