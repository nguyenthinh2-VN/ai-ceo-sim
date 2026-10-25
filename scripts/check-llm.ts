// ============================================================
// check-llm.ts — Đo độ trễ thật của LLM và kích thước prompt
//
// Chạy:  npx tsx scripts/check-llm.ts
//
// Vì sao cần script này: `/api/ai-tick` khai báo `maxDuration = 60` (Vercel
// mặc định chỉ 10s), và `openai-client.ts` chặn lượt gọi ở LLM_TIMEOUT_MS.
// Nếu gateway trả lời chậm hơn hạn đó, MỌI lượt đều hạ cấp về luật cứng và
// AI không bao giờ thật sự suy nghĩ — web vẫn chạy nhưng mất hết phần AI.
//
// Đổi LLM_MODEL hoặc OPENAI_BASE_URL thì chạy lại script này để biết có cần
// nâng LLM_TIMEOUT_MS hay không. Đừng nâng quá 55s: Vercel sẽ giết function
// giữa chừng và lượt tick đó mất sạch, không kịp ghi gì vào DB.
//
// Đây là script chẩn đoán — nó GỌI LLM THẬT nên có tốn tiền (1 lượt).
// ============================================================

import fs from 'fs';
import OpenAI from 'openai';
import { buildPrompt } from '../src/lib/ai/prompt-builder';
import { getDemoState } from '../src/lib/mock-data';

/**
 * Đọc .env thủ công — script chạy ngoài Next.js nên không có loader sẵn.
 * Không in giá trị ra màn hình: file này chứa key thật.
 */
function loadEnv(): Record<string, string | undefined> {
  if (!fs.existsSync('.env')) return {};
  const raw = fs.readFileSync('.env', 'utf8');
  const pick = (key: string): string | undefined => {
    const match = raw.match(new RegExp(`^${key}=(.*)$`, 'm'));
    const value = match?.[1]?.trim();
    return value ? value : undefined;
  };
  return {
    OPENAI_API_KEY: pick('OPENAI_API_KEY'),
    LLM_MODEL: pick('LLM_MODEL'),
    OPENAI_BASE_URL: pick('OPENAI_BASE_URL'),
    LLM_TIMEOUT_MS: pick('LLM_TIMEOUT_MS'),
  };
}

/** Ngưỡng cảnh báo: vượt mức này thì lượt tick có nguy cơ bị Vercel giết. */
const VERCEL_MAX_DURATION_MS = 60_000;

async function main() {
  const env = loadEnv();

  if (!env.OPENAI_API_KEY) {
    console.error('❌ Không tìm thấy OPENAI_API_KEY trong .env');
    process.exit(1);
  }

  const model = env.LLM_MODEL || 'gpt-4o-mini';
  const configuredTimeout = env.LLM_TIMEOUT_MS
    ? Number.parseInt(env.LLM_TIMEOUT_MS, 10)
    : 50_000;

  console.log('=== ĐO ĐỘ TRỄ LLM ===\n');
  console.log(`Model            : ${model}`);
  console.log(`Base URL         : ${env.OPENAI_BASE_URL || '(mặc định OpenAI)'}`);
  console.log(`LLM_TIMEOUT_MS   : ${configuredTimeout}ms`);
  console.log(`Trần của Vercel  : ${VERCEL_MAX_DURATION_MS}ms (maxDuration = 60)\n`);

  // Dựng prompt từ state mẫu — đúng thứ route thật gửi đi, nên đo được
  // luôn ảnh hưởng của kích thước prompt lên thời gian trả lời.
  const state = getDemoState();
  const { systemPrompt, userMessage } = buildPrompt(state, new Date());

  console.log('Kích thước prompt:');
  console.log(`  systemPrompt : ${systemPrompt.length} ký tự (~${Math.round(systemPrompt.length / 3.5)} token)`);
  console.log(`  userMessage  : ${userMessage.length} ký tự (~${Math.round(userMessage.length / 3.5)} token)`);
  console.log(`  tổng         : ~${Math.round((systemPrompt.length + userMessage.length) / 3.5)} token\n`);

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
    maxRetries: 0,
  });

  console.log('Đang gọi LLM thật (không giới hạn thời gian)...');
  const startedAt = Date.now();

  try {
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const elapsed = Date.now() - startedAt;
    console.log(`\n✅ Trả lời sau ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`   prompt_tokens     : ${res.usage?.prompt_tokens ?? '?'}`);
    console.log(`   completion_tokens : ${res.usage?.completion_tokens ?? '?'}`);
    console.log(`   độ dài trả lời    : ${res.choices[0]?.message?.content?.length ?? 0} ký tự`);

    // Kết luận: lượt gọi này có sống sót qua các hạn chót không?
    console.log('\n--- KẾT LUẬN ---');
    if (elapsed > VERCEL_MAX_DURATION_MS) {
      console.log(`❌ CHẬM HƠN TRẦN CỦA VERCEL (${VERCEL_MAX_DURATION_MS}ms).`);
      console.log('   Mọi lượt tick sẽ bị giết giữa chừng và mất sạch, không kịp ghi DB.');
      console.log('   Phải đổi model hoặc gateway nhanh hơn.');
    } else if (elapsed > configuredTimeout) {
      console.log(`⚠️  CHẬM HƠN LLM_TIMEOUT_MS (${configuredTimeout}ms).`);
      console.log('   Mọi lượt đều hết hạn và hạ cấp về luật cứng — AI không bao giờ');
      console.log(`   thật sự suy nghĩ. Nâng LLM_TIMEOUT_MS lên ít nhất ${Math.ceil(elapsed / 1000) + 5}s`);
      console.log(`   (nhưng đừng quá 55s), hoặc đổi model nhanh hơn.`);
    } else {
      const headroom = configuredTimeout - elapsed;
      console.log(`✅ Đạt: nằm trong LLM_TIMEOUT_MS, còn dư ${headroom}ms trước khi hết hạn.`);
      console.log('   AI sẽ suy nghĩ thật ở những lượt được gọi.');
    }
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    console.log(`\n❌ Lỗi sau ${elapsed}ms`);
    console.log(`   ${error instanceof Error ? error.message : String(error)}`);

    console.log('\n--- CHẨN ĐOÁN ---');
    console.log('   Kiểm tra: model có tồn tại trên gateway không, key còn tiền không,');
    console.log('   và OPENAI_BASE_URL có đúng không.');
    process.exit(1);
  }
}

main();