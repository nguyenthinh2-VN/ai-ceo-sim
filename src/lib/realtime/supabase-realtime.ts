// ============================================================
// supabase-realtime.ts — Browser-side Realtime client factory (SRP)
// Chỉ chạy ở trình duyệt. Dùng ANON key (công khai), TUYỆT ĐỐI không
// dùng service_role key ở đây — key đó chỉ sống ở server.
// Trả về null thay vì crash khi thiếu env, để hook tự hạ cấp sang polling.
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Tên channel; phải khớp giữa client subscribe và tài liệu setup. */
export const REALTIME_CHANNEL = 'realtime:ai-ceo-ticks';

/** Tên bảng lắng nghe sự kiện. */
export const TICKS_TABLE = 'ticks';
export const LIVES_TABLE = 'lives';

let browserClient: SupabaseClient | null = null;

/**
 * Realtime chỉ chạy được khi có đủ URL + anon key.
 * Thiếu một trong hai thì hook sẽ dùng polling thay thế.
 *
 * Hàm này chỉ đọc `process.env.NEXT_PUBLIC_*` — chuỗi được Next.js thay
 * thẳng vào bundle lúc build, nên giá trị giống nhau ở server và client,
 * gọi trong lúc render cũng không gây lệch hydration.
 */
export function isRealtimeConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Khởi tạo (và cache) Supabase client phía trình duyệt.
 * Trả về `null` đúng khi thiếu env — cùng điều kiện với
 * `isRealtimeConfigured()`, nên người gọi đã kiểm tra hàm đó thì
 * sẽ không bao giờ nhận `null`.
 */
export function getBrowserRealtimeClient(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      // Web khán giả: không có đăng nhập, không cần lưu session.
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      // Mỗi tick là 1 event, không có bão message. Giới hạn thấp cho nhẹ.
      params: { eventsPerSecond: 5 },
    },
  });

  return browserClient;
}