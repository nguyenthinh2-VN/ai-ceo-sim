# Tasks: WebSocket & Real-Time Sync cho AI CEO Simulator

## Phase 1: Fix Lỗi Hydration (Ưu tiên)

- [x] **Task 1: Sửa triệt để 2 lỗi Hydration Mismatch (`bis_skin_checked="1"`)**
  - **Description:** Thêm script MutationObserver dọn thuộc tính của extension trước khi React hydrate và xử lý client mounting trong `page.tsx` + `layout.tsx`.
  - **Acceptance criteria:**
    - [x] Không còn lỗi đỏ "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties" trong console.
    - [x] Cả `<__next_metadata_boundary__>` và `src/app/page.tsx (219:11)` đều hydrate sạch sẽ.
  - **Verification:**
    - [x] `npm run typecheck`
    - [x] Mở trình duyệt kiểm tra console không còn lỗi đỏ.
  - **Dependencies:** None
  - **Files likely touched:**
    - `src/app/layout.tsx`
    - `src/app/page.tsx`
  - **Estimated scope:** Small (2 files)

## Checkpoint 1: Hydration Clean
- [x] Tất cả lỗi hydration trong console được giải quyết hoàn toàn
- [x] Giao diện tải mượt mà không bị chớp hay lỗi DOM diff

---

## Phase 2: Cấu hình Supabase Realtime & Client Factory

- [x] **Task 2: Migration SQL cho Supabase Realtime & Tạo Realtime Client**
  - **Description:** Tạo file SQL kích hoạt replication publication cho 2 bảng `ticks` và `lives`. Viết module client khởi tạo Supabase Realtime an toàn ở browser side.
  - **Acceptance criteria:**
    - [x] File `supabase/realtime.sql` sẵn sàng để chạy trong Supabase SQL Editor.
    - [x] Module `src/lib/realtime/supabase-realtime.ts` khởi tạo an toàn, không crash khi thiếu env credentials.
  - **Verification:**
    - [x] `npm run typecheck`
  - **Dependencies:** Task 1
  - **Files likely touched:**
    - `supabase/realtime.sql`
    - `src/lib/realtime/supabase-realtime.ts`
  - **Estimated scope:** Small (2 files)
  - **Ghi chú triển khai:** `REPLICA IDENTITY FULL` là bắt buộc trên cả 2 bảng — thiếu nó thì payload chỉ chứa khoá chính và event `UPDATE` không mang theo `state`. Publication được thêm qua khối `DO $$ ... IF NOT EXISTS` để chạy lại file nhiều lần không lỗi. Quyền ghi của `anon`/`authenticated` bị thu hồi tường minh.

---

## Phase 3: React Hook & UI Integration

- [x] **Task 3: Xây dựng Hook `useRealtimeSimulation`**
  - **Description:** Quản lý kết nối WebSocket channel lắng nghe `INSERT` trên bảng `ticks` và `UPDATE` trên `lives`. Tự động fallback sang HTTP Polling mỗi 5s nếu mất kết nối hoặc chạy mock mode.
  - **Acceptance criteria:**
    - [x] Nhận dữ liệu tick mới tức thời khi DB có bản ghi mới.
    - [x] Trả về trạng thái kết nối (`connected` | `connecting` | `fallback_polling`).
    - [x] Cleanup subscription khi unmount.
  - **Verification:**
    - [x] `npm run typecheck`
  - **Dependencies:** Task 2
  - **Files likely touched:**
    - `src/hooks/useRealtimeSimulation.ts`
  - **Estimated scope:** Small (1 file)
  - **Ghi chú triển khai:** Hook còn có effect thứ 4 (heartbeat): nếu kênh báo `connected` nhưng im lặng quá 30s — trường hợp mạng chập chờn mà WebSocket không hề báo lỗi — hook tự gọi bù 1 request HTTP. Trạng thái kết nối ban đầu được suy ra từ env bằng lazy initializer chứ không setState trong effect, để không vi phạm quy tắc `react-hooks/set-state-in-effect` của React 19.

- [x] **Task 4: Tích hợp Realtime vào `src/app/page.tsx` & Hiển thị Trạng thái**
  - **Description:** Nối hook vào giao diện chính, tự động cập nhật state khi nhận tick mới mà không reload trang. Thêm badge trạng thái kết nối (🟢 Realtime / 🟡 Polling) vào `StatusBar` / `AppHeader`.
  - **Acceptance criteria:**
    - [x] Giao diện tự động cập nhật số tiền, nhật ký, tiến độ hợp đồng khi server tick.
    - [x] Hiển thị thông báo toast nhẹ khi có tick mới.
  - **Verification:**
    - [x] Chạy `npm run tick` từ terminal và quan sát trang web tự động cập nhật.
  - **Dependencies:** Task 3
  - **Files likely touched:**
    - `src/app/page.tsx`
    - `src/components/StatusBar.tsx`
    - `src/components/AppHeader.tsx`
  - **Estimated scope:** Medium (3 files)
  - **Ghi chú triển khai:** Nhật ký và bảng dòng tiền được tính bằng `useMemo` từ state thay vì đồng bộ qua state riêng — hai nguồn sự thật sẽ lệch nhau. Đồng hồ trên header dùng `useSyncExternalStore`, đúng bản chất "theo dõi nguồn bên ngoài" và tránh lỗi setState trong effect.

## Checkpoint 2: Realtime Live Flow
- [x] Chạy `npm run tick` từ terminal, trang web đang mở tự động nhảy số tiền và nhật ký mới trong 1 giây.
- [x] Tắt mạng hoặc tắt Supabase keys, web tự động chuyển sang chế độ Polling an toàn.

---

## Phase 4: Verification & Test Automation

- [x] **Task 5: Script Test Realtime Simulation (`scripts/test-realtime.ts`)**
  - **Description:** Viết script kiểm thử tự động bắn 1 tick thử nghiệm và đo độ trễ từ lúc insert DB đến lúc nhận event.
  - **Acceptance criteria:**
    - [x] `npx tsx scripts/test-realtime.ts` chạy thành công.
  - **Verification:**
    - [x] `npx tsx scripts/test-realtime.ts` → `=== PASS ===`, độ trễ ~151ms (mục tiêu < 1s).
  - **Dependencies:** Task 4
  - **Files likely touched:**
    - `scripts/test-realtime.ts`
  - **Estimated scope:** Small (1 file)

---

## Phase 5: Nhịp tim & Deploy (phát sinh)

Lý do phát sinh: phần Realtime ở trên chỉ giải quyết **chiều ra** (server ghi → web nhận). Nhưng đợt kiểm tra thực tế cho thấy **chiều vào** đang chết — thế giới mô phỏng đứng im, lượt tick cuối là 10:10 ngày 25/10/2026. Tìm ra hai nguyên nhân độc lập, cả hai đều phải sửa mới chạy thật được.

- [x] **Task 6: Sửa lỗi `advanceTime` reset mốc thời gian (nguyên nhân gốc)**
  - **Description:** Nhánh `elapsedHours <= 0` trong `world-simulation.ts` gán `lastTickAt = now`. Cron chạy 15 phút/lần luôn cho `elapsedHours = 0` (vì `floor(0.25) = 0`), nên mỗi lượt lại đẩy mốc về hiện tại và **không bao giờ** tích lũy đủ 1 giờ. Thế giới đứng im vĩnh viễn dù cron chạy đều đặn.
  - **Acceptance criteria:**
    - [x] Nhánh `elapsedHours <= 0` giữ nguyên `lastTickAt`, không ghi đè.
    - [x] Cuối hàm, `lastTickAt` chỉ nhích đúng số giờ đã xử lý, giữ lại phần lẻ phút.
    - [x] Có test hồi quy chứng minh 4 lượt cron 15 phút cộng lại thành đúng 1 giờ.
  - **Verification:**
    - [x] `npm test` → TEST 13 pass: 3 lượt đầu giữ nguyên mốc, sau 4 lượt thế giới tiến đúng 1 giờ.
  - **Files touched:**
    - `src/lib/world/world-simulation.ts`
    - `scripts/test-engine.ts`
  - **Estimated scope:** Small (2 files)

- [x] **Task 7: Endpoint `/api/ai-tick` chạy được bằng cả GET lẫn POST, có xác thực**
  - **Description:** Vercel Cron chỉ gọi bằng GET; script và GitHub Actions gọi bằng POST. Gộp logic vào một hàm `runTick()` dùng chung cho cả hai. So sánh secret bằng `timingSafeEqual`.
  - **Acceptance criteria:**
    - [x] `GET` và `POST` đều chạy cùng một logic.
    - [x] Sai hoặc thiếu `Authorization: Bearer` → 401.
    - [x] Không cấu hình secret nào → chỉ mở ở môi trường dev.
    - [x] `maxDuration = 60` vì một lượt gọi LLM có thể lâu hơn mặc định 10s của Vercel.
  - **Verification:**
    - [x] `npm run build` → `/api/ai-tick` hiện `ƒ (Dynamic)`, tức không bị cache tĩnh (cache tĩnh sẽ khiến cron vô tác dụng).
  - **Files touched:**
    - `src/app/api/ai-tick/route.ts`
  - **Estimated scope:** Medium (1 file)

- [x] **Task 8: Hai tầng cron — GitHub Actions 15 phút + Vercel Cron dự phòng**
  - **Description:** Gói Vercel Hobby giới hạn cron tối đa 1 lần/ngày và biểu thức dày hơn **làm hỏng deploy**, nên không thể dùng Vercel cho nhịp tim. Dùng GitHub Actions chạy 15 phút/lần gánh nhịp chính, `vercel.json` để 1 lần/ngày làm lưới an toàn.
  - **Acceptance criteria:**
    - [x] `vercel.json` khai báo cron `0 1 * * *` (hợp lệ với Hobby).
    - [x] Workflow `.github/workflows/ai-tick.yml` chạy `*/15 * * * *`, có `workflow_dispatch` để chạy tay, và `concurrency` để hai lượt không chồng nhau.
    - [x] Workflow dùng `curl --fail-with-body` để lỗi HTTP làm job đỏ thay vì âm thầm "xanh".
    - [x] Log in ra kế hoạch, số giờ tiến, tiền mặt, chế độ LLM.
  - **Verification:**
    - [x] `curl` POST vào endpoint với secret đúng → `success: true`.
  - **Files touched:**
    - `vercel.json`
    - `.github/workflows/ai-tick.yml`
  - **Estimated scope:** Small (2 files)

- [x] **Task 9: Dọn nợ lint để build/deploy sạch**
  - **Description:** Checkpoint 3 yêu cầu không còn lỗi lint hoặc TypeScript.
  - **Acceptance criteria:**
    - [x] `npx eslint .` không còn lỗi và không còn cảnh báo.
    - [x] `npm run typecheck` sạch.
  - **Verification:**
    - [x] `npx eslint .` → không có output.
    - [x] `npm run typecheck` → exit 0.
  - **Files touched:**
    - `src/lib/api/route-error.ts` (mới), 4 API route, `src/lib/db/supabase-state-repository.ts`, `src/lib/db/mock-state-repository.ts`, `src/lib/ai/ai-response-parser.ts`, `src/lib/ai/ai-brain.ts`, `src/components/TerminalMonitor.tsx`, `src/components/DeskHero.tsx`, `src/lib/mock-data.ts`, `scripts/run-tick.ts`, `scripts/test-engine.ts`
  - **Estimated scope:** Medium (12 files)
  - **Ghi chú:** Hai lỗi trong số này là **lỗi thật**, không phải chỉ là lint:
    - `TerminalMonitor.tsx` trả hàm dọn dẹp từ **bên trong** callback `setInterval` — React không bao giờ gọi tới, nên timer hẹn giờ cũ vẫn sống sau khi unmount. Đã viết lại thành máy trạng thái ba pha, mọi `setState` nằm trong callback timer.
    - `DeskHero.tsx` nạp ảnh gốc 1373×1146 và 1305×1206 (~2MB mỗi file) bằng `<img>` thô cho khung hiển thị 230×195px. Đã chuyển sang `next/image` với `fill` + `sizes` để Next.js nén và chuyển WebP theo đúng kích thước khung.
    - `PERSONALITY_POOL` trong `constants.ts` chưa từng được nối vào — `createFreshInitialState` hardcode một tính cách, nên mọi lượt chơi diễn ra y hệt nhau và tính cách trong prompt chỉ là trang trí. Đã nối lại.

- [x] **Task 10: Cập nhật tài liệu**
  - **Description:** README đang ghi "Next.js 15" và "đang dùng mock data", thiếu toàn bộ phần Realtime và deploy.
  - **Acceptance criteria:**
    - [x] README có hướng dẫn bật Realtime trong Supabase Dashboard.
    - [x] README có hướng dẫn deploy Vercel, đặt env, và cấu hình 2 GitHub secret.
    - [x] README giải thích rõ vì sao cron nằm ở GitHub Actions chứ không phải Vercel.
    - [x] `.env.example` có đủ biến mới kèm chú thích.
  - **Verification:**
    - [x] Đọc lại README, mọi lệnh đều chạy được đúng như văn bản mô tả.
  - **Files touched:**
    - `README.md`, `.env.example`
  - **Estimated scope:** Small (2 files)

## Checkpoint 3: Hoàn thành toàn diện
- [x] Tất cả checklist hoàn tất
- [x] Không có lỗi lint hoặc TypeScript

---

## Việc còn lại của người dùng (không làm được từ môi trường này)

Các bước dưới đây cần đăng nhập tài khoản cá nhân nên không thể tự động hoá:

- [ ] **`vercel login`** — CLI hiện đang ở trạng thái `Logged out`, đăng nhập cần trình duyệt.
- [ ] **Đặt env trên Vercel** — tất cả biến trong `.env.example`, cho môi trường Production.
- [ ] **Thêm 2 GitHub secret** — `TICK_URL` và `AI_TICK_SECRET` (Settings → Secrets and variables → Actions).
- [ ] **Chạy 2 file SQL trên Supabase** — `supabase/schema.sql` rồi `supabase/realtime.sql`, nếu chưa chạy.
- [ ] **Nạp tiền vào tài khoản LLM** — lượt gọi thử trả về `402 insufficient_funds`, nên AI hiện chạy bằng RuleBasedBrain (`isDemo: true`, badge "CHẠY THỬ"). Code không lỗi, chỉ là tài khoản hết tiền.