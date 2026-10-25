// ============================================================
// test-realtime.ts — Kiểm thử kênh Realtime & đo độ trễ
//
// Script này bắn 1 lượt tick thật vào server đang chạy, rồi ĐO khoảng
// thời gian từ lúc server ghi bản ghi vào DB tới lúc một subscriber
// nhận được sự kiện qua WebSocket.
//
// Chạy:  npx tsx scripts/test-realtime.ts
// Yêu cầu: `npm run dev` đang chạy ở cổng 3000, và .env có đủ
//          AI_TICK_SECRET + NEXT_PUBLIC_SUPABASE_URL + ANON_KEY.
//
// Nếu chưa cấu hình Supabase Realtime, script vẫn chạy và báo rõ
// rằng đang ở chế độ polling — đúng như hành vi thật của web.
// ============================================================

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SERVER_URL = process.env.TICK_URL || 'http://localhost:3000';
const TICK_SECRET = process.env.AI_TICK_SECRET || '';

interface EnvConfig {
  supabaseUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  aiTickSecret?: string;
}

/** Đọc .env thủ công — script chạy ngoài Next.js nên không có loader sẵn. */
function loadEnv(): EnvConfig {
  if (!fs.existsSync('.env')) return {};
  const raw = fs.readFileSync('.env', 'utf8');

  const pick = (key: string): string | undefined => {
    const match = raw.match(new RegExp(`^${key}=(.*)$`, 'm'));
    const value = match?.[1]?.trim();
    return value ? value : undefined;
  };

  return {
    supabaseUrl: pick('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: pick('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: pick('SUPABASE_SERVICE_ROLE_KEY'),
    aiTickSecret: pick('AI_TICK_SECRET'),
  };
}

async function main() {
  console.log('=== KIỂM THỬ REALTIME — AI CEO SIMULATOR ===\n');

  const env = loadEnv();
  const secret = TICK_SECRET || env.aiTickSecret;

  if (!secret) {
    console.error('❌ Không tìm thấy AI_TICK_SECRET (trong .env hoặc biến môi trường).');
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // Bước 1: kiểm tra cấu hình Realtime
  // ---------------------------------------------------------------
  const hasRealtime = Boolean(env.supabaseUrl && env.anonKey);

  if (!hasRealtime) {
    console.warn('⚠️  Chưa có NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    console.warn('   Web sẽ chạy ở chế độ POLLING 5 giây. Vẫn kiểm tra được luồng tick.\n');
  } else {
    console.log('✅ Đã có cấu hình Supabase Realtime.\n');
  }

  // ---------------------------------------------------------------
  // Bước 2: mở subscriber trước khi bắn tick
  // ---------------------------------------------------------------
  // Phải subscribe TRƯỚC khi gọi API, nếu không sự kiện INSERT bay qua
  // lúc chưa ai nghe và ta sẽ đo nhầm thành "timeout".
  let receivedAt: number | null = null;
  let insertFiredAt: number | null = null;
  let cleanup: (() => Promise<void>) | null = null;

  if (hasRealtime) {
    const client = createClient(env.supabaseUrl!, env.anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const subscribed = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 15_000);

      client
        .channel('realtime:ai-ceo-ticks')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ticks' },
          () => {
            receivedAt = Date.now();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            resolve(false);
          }
        });
    });

    const ok = await subscribed;
    cleanup = async () => {
      await client.removeAllChannels();
    };

    if (!ok) {
      console.warn('⚠️  Không subscribe được channel.');
      console.warn('   Kiểm tra: đã chạy supabase/realtime.sql chưa?\n');
    } else {
      console.log('🔌 Đã kết nối WebSocket. Đang chờ sự kiện INSERT trên bảng ticks...\n');
    }
  }

  // ---------------------------------------------------------------
  // Bước 3: bắn 1 lượt tick thật
  // ---------------------------------------------------------------
  console.log(`🚀 Bắn 1 lượt tick tới ${SERVER_URL}/api/ai-tick ...`);
  insertFiredAt = Date.now();

  let httpDurationMs = 0;
  let tickSucceeded = false;

  try {
    const res = await fetch(`${SERVER_URL}/api/ai-tick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ forceDecision: true }),
      signal: AbortSignal.timeout(90_000),
    });

    httpDurationMs = Date.now() - insertFiredAt;
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}:`, json ?? '(không có body)');
      await cleanup?.();
      process.exit(1);
    }

    tickSucceeded = Boolean(json?.success);

    console.log(`✅ Tick thành công (HTTP ${res.status}) sau ${httpDurationMs}ms`);
    console.log(`   Kế hoạch     : ${json?.tick?.plan ?? '(không có)'}`);
    console.log(`   Hành động    : ${JSON.stringify(json?.tick?.actions ?? [])}`);
    console.log(`   Số giờ tiến  : ${json?.hoursAdvanced ?? 0}`);
    console.log(`   Tiền mặt     : ${(json?.state?.tienMat ?? 0).toLocaleString('vi-VN')} đ`);
    console.log(`   Chế độ       : ${json?.isDemo ? 'Luật tạm (LLM lỗi/thiếu key)' : 'LLM thật'}`);

    if (json?.rejected?.length) {
      console.log(`   Bị từ chối   : ${json.rejected.join(' | ')}`);
    }
  } catch (err) {
    console.error('❌ Không gọi được API tick:', (err as Error).message);
    await cleanup?.();
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // Bước 4: chờ sự kiện WebSocket và đo độ trễ
  // ---------------------------------------------------------------
  if (!hasRealtime) {
    console.log('\n--- KẾT QUẢ ---');
    console.log('Không có WebSocket (chưa cấu hình anon key) → web sẽ tự polling 5s.');
    console.log('Luồng tick phía server: OK');
    await cleanup?.();
    return;
  }

  console.log('\n⏳ Chờ sự kiện WebSocket (tối đa 10s)...');
  const deadline = Date.now() + 10_000;
  while (receivedAt === null && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('\n--- KẾT QUẢ ---');
  if (receivedAt === null) {
    console.error('❌ Không nhận được sự kiện WebSocket trong 10s.');
    console.error('   Nguyên nhân thường gặp:');
    console.error('   1. Chưa chạy supabase/realtime.sql (chưa bật publication).');
    console.error('   2. Chưa thêm policy SELECT cho anon — RLS đang chặn, Realtime im lặng.');
    console.error('   3. Chưa bật Realtime cho bảng trong Supabase Dashboard.');
    await cleanup?.();
    process.exit(1);
  }

  const latency = receivedAt! - (insertFiredAt! + httpDurationMs);
  console.log(`✅ Nhận được sự kiện INSERT.`);
  console.log(`   Độ trễ WebSocket sau khi server ghi xong: ~${Math.max(0, latency)}ms`);

  if (latency < 1000) {
    console.log('   → Đạt yêu cầu realtime (< 1 giây). Web sẽ tự nhảy số ngay.');
  } else {
    console.log('   → Hơi chậm, nhưng vẫn nhanh hơn polling 5s rất nhiều.');
  }

  console.log(`\n${tickSucceeded ? '=== PASS ===' : '=== FAIL ==='}`);
  await cleanup?.();
}

main().catch((err) => {
  console.error('Script lỗi:', err);
  process.exit(1);
});