# AI CEO Simulator — AI tự làm CEO công ty IT

Web 1 trang: AI đóng vai CEO công ty IT, tự quyết định mọi thứ (thuê người, nhận hợp đồng, ngủ, làm việc, phá sản). Người xem CHỈ XEM, không can thiệp.

Mô phỏng chạy **1:1 thời gian thực**: 1 giờ ngoài đời = 1 giờ trong game, 168 giờ = 1 tuần. Thế giới tự tiến theo số giờ thật đã trôi qua kể từ lượt tick trước, nên nhịp tick dày hay thưa đều cho cùng kết quả.

## Kiến trúc

```
Người xem (trình duyệt)
    │  WebSocket — Supabase Realtime, nhận tick mới trong ~150ms
    │  (tự hạ cấp sang polling 5s nếu WebSocket hỏng)
    ▼
Supabase Postgres ── bảng lives, ticks
    ▲
    │  ghi tick mới
    │
/api/ai-tick  ◄── GitHub Actions (15 phút/lần) + Vercel Cron (1 lần/ngày, lưới an toàn)
    │
    ├── AiBrain: gọi LLM → parse JSON → kiểm tra luật game
    └── WorldSimulationEngine: tiến thời gian, trả lương, settle tháng, kiểm tra phá sản
```

AI suy nghĩ bằng LLM thật. Nếu LLM lỗi (hết tiền, mất mạng, JSON hỏng), hệ thống tự rơi về bộ luật `RuleBasedBrain` và ghi rõ sự cố vào nhật ký — web không bao giờ đứng im.

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền các biến bên dưới
npm run dev
```

Mở http://localhost:3000

Thiếu env cũng vẫn chạy: không có Supabase thì dùng In-Memory Mock Repository, không có OpenAI key thì dùng RuleBasedBrain. Giao diện đầy đủ trong mọi trường hợp.

## Biến môi trường

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Để lưu trữ thật | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Để bật WebSocket | **Công khai**, nhúng vào bundle trình duyệt. Thiếu key này web tự hạ cấp sang polling 5s |
| `SUPABASE_SERVICE_ROLE_KEY` | Để lưu trữ thật | **Tuyệt đối bí mật**, chỉ sống ở server. Không bao giờ đặt tiền tố `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | Để AI suy nghĩ thật | Hoặc key của gateway tương thích OpenAI SDK |
| `LLM_MODEL` | Không | Mặc định `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Không | Đổi sang gateway khác nếu cần |
| `CRON_SECRET` | Khi deploy | Vercel tự gắn vào header khi gọi cron |
| `AI_TICK_SECRET` | Khi deploy | Dùng cho `npm run tick` và GitHub Actions |

`/api/ai-tick` yêu cầu `Authorization: Bearer <secret>` và trả 401 nếu sai. Khi không cấu hình secret nào, endpoint chỉ mở ở môi trường dev.

## Hướng dẫn kết nối Supabase

1. Tạo một project mới trên [Supabase](https://supabase.com).
2. Vào **SQL Editor**, mở `supabase/schema.sql` và nhấn **Run** — tạo bảng `lives`, `ticks`, index và RLS.
3. Vẫn trong **SQL Editor**, mở `supabase/realtime.sql` và nhấn **Run** — bật publication để Postgres phát sự kiện qua WebSocket, cấp quyền SELECT công khai cho `anon`, và thu hồi quyền ghi.

   > ⚠️ Bước này khiến nội dung tick trở thành **công khai** với bất kỳ ai có anon key. Đó là chủ đích — đây là web khán giả. Tuyệt đối không đưa dữ liệu riêng tư vào 2 bảng này.

4. Điền `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào `.env.local`.

Kiểm tra WebSocket đã thông chưa:

```bash
npm run test:realtime
```

Script này mở kênh realtime trước, bắn một tick thử, rồi đo độ trễ từ lúc server ghi DB đến lúc trình duyệt nhận event. Đạt yêu cầu khi in ra `=== PASS ===` với độ trễ dưới 1 giây. Script cũng tự chẩn đoán 3 lỗi thường gặp: chưa thêm bảng vào publication, thiếu policy SELECT cho `anon`, và Realtime chưa bật cho bảng.

## Chạy thử một lượt tick

```bash
npm run tick          # server phải đang chạy ở localhost:3000
npm test              # 47 test của engine, không cần DB
```

## Deploy lên Vercel

### 1. Deploy

```bash
vercel login
vercel --prod
```

Hoặc nối repo GitHub với Vercel rồi để nó tự deploy mỗi lần push.

### 2. Đặt biến môi trường

Vercel Dashboard → Project → **Settings → Environment Variables**, thêm tất cả biến ở bảng trên cho môi trường **Production**. Sinh secret ngẫu nhiên bằng:

```bash
openssl rand -hex 32
```

`CRON_SECRET` và `AI_TICK_SECRET` có thể là hai chuỗi khác nhau — endpoint chấp nhận cả hai.

### 3. Cron — đọc kỹ phần này

`vercel.json` khai báo cron `/api/ai-tick` chạy **1 lần/ngày**. Đây là giới hạn cứng, không phải lựa chọn:

> **Gói Vercel Hobby giới hạn cron tối đa 1 lần/ngày.** Biểu thức dày hơn sẽ làm **hỏng deploy** (Hobby accounts are limited to daily cron jobs), chứ không phải chỉ chạy chậm. Gói Pro mới cho chạy mỗi phút.

Mà mô phỏng 1:1 cần tick dày để web "sống". Nên nhịp tim thật do **GitHub Actions** gánh, chạy 15 phút/lần miễn phí:

1. Repo GitHub → **Settings → Secrets and variables → Actions**, thêm 2 secrets:
   - `TICK_URL` — URL production, ví dụ `https://ai-ceo-sim.vercel.app`
   - `AI_TICK_SECRET` — phải **trùng** với biến cùng tên trên Vercel
2. Workflow `.github/workflows/ai-tick.yml` đã sẵn sàng, tự chạy theo lịch. Vào tab **Actions** để xem log từng lượt tick hoặc bấm chạy tay.

Hai cơ chế này chồng lấn an toàn vì engine tự cộng dồn số giờ đã trôi qua từ `lastTickAt`: tick thưa hay dày đều cho cùng kết quả, không nhân đôi tiến độ. Workflow còn khai báo `concurrency` để hai lượt không bao giờ chạy chồng nhau.

### 4. Kiểm tra sau khi deploy

```bash
curl -sS -X POST https://<your-app>.vercel.app/api/ai-tick \
  -H "Authorization: Bearer $AI_TICK_SECRET" | head -c 500
```

Phản hồi phải có `"success": true` và `hoursAdvanced`. Nếu nhận 401, secret trên Vercel và trong lệnh không khớp.

## Test

```bash
npm test              # 47 test engine: luật game, parser, settle tháng, tích lũy tick ngắn
npm run test:realtime # độ trễ WebSocket (cần Supabase đã cấu hình)
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm run build         # build production
```

## Cấu trúc code

```
src/
  lib/
    constants.ts       — Tất cả hằng số game
    types.ts           — Interfaces TypeScript (WorldSimulation, AiBrain, LlmClient, Clock, StateRepository)
    format.ts          — Format tiền VND, giờ, %
    mock-data.ts       — Dữ liệu mẫu cho demo
    ai/
      system-prompt.ts      — Prompt hệ thống (tính cách, luật game, định dạng JSON)
      ai-brain.ts           — Orchestrator: quyết định khi nào gọi LLM, fallback khi lỗi
      openai-client.ts      — LlmClient qua OpenAI SDK
      prompt-builder.ts     — Dựng prompt từ GameState
      ai-response-parser.ts — Kiểm tra JSON, mã hành động, ràng buộc luật game
      rule-based-brain.ts   — Bộ luật dự phòng khi LLM lỗi
    world/
      world-simulation.ts   — Tiến thời gian, tiền lương, settle tháng, phá sản
    db/
      supabase-state-repository.ts — StateRepository trên Supabase
      mock-state-repository.ts     — StateRepository in-memory
    realtime/
      supabase-realtime.ts  — Client WebSocket phía trình duyệt
    api/
      route-error.ts        — Xử lý lỗi dùng chung cho API route
  hooks/
    useRealtimeSimulation.ts — WebSocket + polling dự phòng + heartbeat
  app/
    layout.tsx          — Root layout
    globals.css         — Design system CSS
    page.tsx            — Trang chính (1 trang duy nhất)
    api/                — ai-tick, state, ticks, lives
```

## Công nghệ

- Next.js 16.4.3 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4
- Font: Be Vietnam Pro + JetBrains Mono
- Supabase (Postgres + Realtime)
- OpenAI SDK (hoặc gateway tương thích)