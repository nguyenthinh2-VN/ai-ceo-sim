# AI CEO Simulator — AI tự làm CEO công ty IT

Web 1 trang: AI đóng vai CEO công ty IT, tự quyết định mọi thứ (thuê người, nhận hợp đồng, ngủ, làm việc, phá sản). Người xem CHỈ XEM, không can thiệp.

## ⚠️ Bản demo

**Bản này đang dùng dữ liệu mẫu (mock data), chưa kết nối LLM thật và Supabase.**

Khi tích hợp:
- Copy `.env.example` → `.env.local` và điền API keys
- LLM: Gemini Flash / GPT-4o-mini / Claude Haiku
- Database: Supabase (2 bảng: `lives`, `ticks`)

## Hướng dẫn kết nối Supabase

1. Tạo một project mới trên [Supabase](https://supabase.com).
2. Vào **SQL Editor** trên Supabase Dashboard, mở file `supabase/schema.sql` và nhấn **Run** để khởi tạo các bảng `lives`, `ticks`, index và cấu hình RLS.
3. Tạo file `.env.local` ở thư mục gốc (tham khảo `.env.example`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
4. Chạy ứng dụng:
   ```bash
   npm run dev
   ```
   > **Lưu ý**: Nếu chưa cấu hình Supabase, hệ thống sẽ tự động dùng In-Memory Mock Repository để bạn vẫn trải nghiệm đầy đủ giao diện mà không gặp lỗi.

## Cách chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Cấu trúc code

```
src/
  lib/
    constants.ts    — Tất cả hằng số game
    types.ts        — Interfaces TypeScript
    format.ts       — Format tiền VND, giờ, %
    mock-data.ts    — Dữ liệu mẫu cho demo
  app/
    layout.tsx      — Root layout
    globals.css     — Design system CSS
    page.tsx        — Trang chính (1 trang duy nhất)
```

## Công nghệ

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Font: Be Vietnam Pro + JetBrains Mono
- Character: video MP4 (work.mp4, sleep.mp4)

## Tích hợp sau

- `src/lib/ai/` — System prompt, LLM client, response parser
- `src/lib/db/` — Supabase state repository
- `src/lib/world/` — World simulation rules
- `src/app/api/` — API routes (ai-tick, state)
- `vercel.json` — Vercel Cron config
