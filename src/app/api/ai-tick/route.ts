// ============================================================
// /api/ai-tick/route.ts — Server-only automated tick runner (SRP)
//
// Hai đường vào, cùng một logic:
//   • GET  — Vercel Cron gọi (Vercel luôn dùng GET, kèm header
//            `Authorization: Bearer $CRON_SECRET`).
//   • POST — script thủ công `npm run tick` hoặc GitHub Actions.
//
// Xác thực: chấp nhận CRON_SECRET (Vercel tự gắn) hoặc AI_TICK_SECRET
// (script ngoài). So sánh bằng timingSafeEqual để không rò rỉ độ dài
// secret qua thời gian phản hồi.
// ============================================================

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getStateRepository } from '@/lib/db';
import { handleRouteError } from '@/lib/api/route-error';
import { AiBrainImpl } from '@/lib/ai/ai-brain';
import { WorldSimulationEngine } from '@/lib/world/world-simulation';
import { TickData, GameState } from '@/lib/types';
import { getDemoState } from '@/lib/mock-data';

// LLM có thể chậm; Vercel mặc định 10s là quá ngắn cho 1 lượt gọi GPT.
export const maxDuration = 60;

/** So sánh chuỗi mà không rò rỉ thông tin qua thời gian chạy. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Độ dài khác nhau thì timingSafeEqual ném lỗi — chặn trước.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Kiểm tra Bearer token có khớp secret hợp lệ nào không. */
function isAuthorized(authHeader: string): boolean {
  const secrets = [process.env.CRON_SECRET, process.env.AI_TICK_SECRET].filter(
    (s): s is string => Boolean(s)
  );

  if (secrets.length === 0) {
    // Không cấu hình secret nào: chỉ cho phép ở môi trường dev, để
    // production không bao giờ hở endpoint điều khiển AI.
    return process.env.NODE_ENV !== 'production';
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;

  return secrets.some((secret) => safeEqual(token, secret));
}

async function runTick(forceDecision: boolean, overrideElapsedHours?: number) {
  // 1. Load active life from repository
  const repo = getStateRepository();
  const currentLife = await repo.getCurrentLife();

  if (!currentLife || currentLife.status !== 'SONG') {
    return NextResponse.json(
      { error: 'No active AI CEO life found.' },
      { status: 404 }
    );
  }

  // 2. Load latest tick state
  const latestTick = await repo.getLatestTick(currentLife.id);
  let state: GameState;

  if (!latestTick) {
    state = getDemoState();
    state.lifeId = currentLife.id;
    state.aiName = currentLife.aiName;
    state.companyName = currentLife.companyName;
    state.personality = currentLife.personality;
  } else {
    state = latestTick.state;
  }

  // 3. Tính số giờ thật đã trôi qua kể từ lượt tick trước (1:1 thời gian thực).
  //    Làm tròn XUỐNG: 15 phút đầu tiên chưa đủ 1 giờ nên chưa tiến.
  //    Phần lẻ phút được giữ lại trong lastTickAt để cộng dồn cho lần sau.
  const now = new Date();
  let hoursToAdvance: number;

  if (typeof overrideElapsedHours === 'number') {
    hoursToAdvance = overrideElapsedHours;
  } else {
    const lastTickDate = state.lastTickAt
      ? new Date(state.lastTickAt)
      : new Date(now.getTime() - 3600 * 1000);
    hoursToAdvance = Math.max(
      0,
      Math.floor((now.getTime() - lastTickDate.getTime()) / (3600 * 1000))
    );
  }

  // 4. Initialize World Simulation & AI Brain
  const simulation = new WorldSimulationEngine(state);
  const brain = new AiBrainImpl();

  // 5. Request AI decision if needed.
  //    Truyền `hoursToAdvance` xuống: bằng 0 nghĩa là chưa giờ nào trôi qua
  //    kể từ lượt trước, state không đổi, nên không có gì mới để suy nghĩ.
  //    Vercel/hoặc GitHub Actions gọi 15 phút/lần (96 lượt/ngày) mà mỗi lượt
  //    gọi LLM mất ~56 giây — bỏ qua các lượt rỗng là điều kiện để dự án
  //    chạy nổi về mặt chi phí.
  const decision = await brain.decide(state, forceDecision, hoursToAdvance);

  // 6. Apply decisions to world
  const { rejected } = await simulation.applyActions(decision.actions);

  // 7. Advance time 1:1 catch-up
  simulation.advanceTime(hoursToAdvance, now);

  // 8. Settle month if rollover reached
  await simulation.settleMonthIfNeeded();

  // 9. Check bankruptcy condition
  const isBankrupt = await simulation.checkBankruptcy();
  const finalState = await simulation.getState();

  finalState.keHoachHienTai = decision.plan;
  finalState.lyDoHienTai = decision.reason;
  // isDemo phải được ghi lại mỗi lượt: nếu lượt trước dùng luật tạm mà lượt
  // này gọi được LLM thật thì cờ cũ phải tắt đi, không giữ mãi.
  finalState.isDemo = decision.isDemo === true;

  if (decision.diary && decision.diary.length > 0) {
    for (const entry of decision.diary) {
      finalState.nhatKy.unshift({
        week: finalState.tuanHienTai,
        type: 'HOAT_DONG',
        content: entry,
        timestamp: now.toISOString(),
      });
    }
  }

  // 10. If bankrupt, update life status
  if (isBankrupt) {
    await repo.updateLifeStatus(currentLife.id, 'PHA_SAN', {
      totalWeeks: finalState.tuanHienTai,
      peakNetWorth: Math.max(...finalState.lichSuTien, finalState.tienMat),
      totalProjects: finalState.hopDong.filter((c) => c.status === 'HOAN_THANH').length,
      assetsOwned: finalState.taiSan.map((a) => a.name),
    });
  }

  // 11. Save new tick
  const newTick: TickData = {
    id: crypto.randomUUID(),
    lifeId: currentLife.id,
    week: finalState.tuanHienTai,
    plan: finalState.keHoachHienTai,
    reason: finalState.lyDoHienTai,
    diary: finalState.nhatKy,
    actions: decision.actions,
    state: finalState,
    createdAt: now.toISOString(),
  };

  await repo.saveTick(newTick);

  return NextResponse.json({
    success: true,
    tick: newTick,
    state: finalState,
    isDemo: finalState.isDemo ?? false,
    rejected,
    hoursAdvanced: hoursToAdvance,
  });
}

/** Vercel Cron gọi bằng GET. */
export async function GET(req: Request) {
  try {
    if (!isAuthorized(req.headers.get('authorization') || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // KHÔNG ép gọi LLM: cron chỉ là nhịp tim, để `shouldInvokeLlm` quyết
    // định lượt nào thật sự cần suy nghĩ. Ép ở đây sẽ vô hiệu hóa toàn bộ
    // logic tiết kiệm và biến mỗi nhịp cron thành một lượt gọi LLM.
    return await runTick(false);
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'GET /api/ai-tick',
      'Internal server error while executing AI tick'
    );
  }
}

/** Script thủ công và GitHub Actions gọi bằng POST. */
export async function POST(req: Request) {
  try {
    if (!isAuthorized(req.headers.get('authorization') || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const forceDecision = body.forceDecision === true;

    return await runTick(forceDecision, body.overrideElapsedHours);
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'POST /api/ai-tick',
      'Internal server error while executing AI tick'
    );
  }
}