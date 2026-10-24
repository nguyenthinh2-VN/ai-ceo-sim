# AI CEO Simulator — AI tự làm CEO công ty IT

Web 1 trang: AI đóng vai CEO công ty IT, tự quyết định mọi thứ (thuê người, nhận hợp đồng, ngủ, làm việc, phá sản). Người xem CHỈ XEM, không can thiệp.

## ⚠️ Bản demo

**Bản này đang dùng dữ liệu mẫu (mock data), chưa kết nối LLM thật và Supabase.**

Khi tích hợp:
- Copy `.env.example` → `.env.local` và điền API keys
- LLM: Gemini Flash / GPT-4o-mini / Claude Haiku
- Database: Supabase (2 bảng: `lives`, `ticks`)

## Cách chạy

```bash
cd ai-ceo-sim
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
