// ============================================================
// route-error.ts — Xử lý lỗi dùng chung cho API route (DRY)
//
// Bốn route đều cần đúng một hành vi: chuyển tiếp lỗi điều khiển nội bộ
// của Next.js, còn lại thì log ở server và trả 500 với thông báo chung.
// Viết một lần ở đây để không phải nhớ quy tắc đó ở từng route.
// ============================================================

import { NextResponse } from 'next/server';

/**
 * Lỗi điều khiển nội bộ của Next.js (redirect, notFound, dùng API động
 * trong ngữ cảnh tĩnh...) mang thuộc tính `digest` bắt đầu bằng "NEXT_".
 * Nuốt những lỗi này sẽ biến một 404 thành 500, nên phải nhận diện để
 * ném tiếp nguyên trạng.
 */
function isNextInternalError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_');
}

/**
 * Chuẩn hóa lỗi của route thành response 500.
 *
 * `context` dùng cho log server (ví dụ 'GET /api/ticks'), `clientMessage`
 * là thứ người gọi nhận được. Hai thứ tách rời nhau có chủ đích: log giữ
 * đủ chi tiết để gỡ lỗi, còn response không lộ stack trace hay câu lệnh
 * SQL ra ngoài.
 *
 * @throws chính `error` nếu đó là lỗi điều khiển nội bộ của Next.js.
 */
export function handleRouteError(
  error: unknown,
  context: string,
  clientMessage: string
): NextResponse {
  if (isNextInternalError(error)) throw error;

  console.error(`API ${context} error:`, error);
  return NextResponse.json({ error: clientMessage }, { status: 500 });
}