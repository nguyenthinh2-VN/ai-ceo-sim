# Implementation Plan: WebSocket & Real-Time Sync cho AI CEO Simulator

## Overview
Hiện tại, trang web AI CEO Simulator chỉ tải dữ liệu một lần duy nhất khi mở trang (`GET /api/state`). Khi AI thực hiện các hành động mới qua lệnh `npm run tick`, background worker hoặc cron job, người xem trên web phải bấm F5 thủ công để thấy thay đổi. 

Kế hoạch này triển khai **kết nối thời gian thực qua WebSocket (sử dụng Supabase Realtime)** kết hợp cơ chế **tự phục hồi (Adaptive Fallback Polling)**:
1. Trình duyệt mở kết nối WebSocket tới Supabase Realtime channel `realtime:ai-ceo-ticks`.
2. Khi server lưu tick mới vào bảng `ticks` hoặc cập nhật `lives`, Supabase tự động push bản ghi qua WebSocket tới trình duyệt trong < 100ms.
3. Giao diện tự động cập nhật số tiền, tiến độ hợp đồng, nhật ký, trạng thái CEO (làm việc/nghỉ ngơi) mà không cần tải lại trang.
4. Nếu môi trường local chưa cấu hình Supabase hoặc mất kết nối mạng, hệ thống tự động hạ cấp an toàn sang Polling mỗi 5-10s với đèn báo trạng thái trực quan.

Đồng thời, kế hoạch này bao gồm việc xử lý dứt điểm **2 lỗi React 19 / Next.js Hydration Mismatch** do browser extension (Bitwarden `bis_skin_checked="1"`) chèn vào DOM.

---

## Architecture Decisions

1. **Sử dụng Supabase Realtime (WebSocket) thay vì custom Node WebSocket server**:
   - Project đã tích hợp sẵn `@supabase/supabase-js@2.118.0`.
   - Next.js chạy trên Vercel/serverless không hỗ trợ persistent WebSocket socket server truyền thống; Supabase Realtime chạy trên hạ tầng WebSocket riêng biệt của Supabase, không tốn thêm server, không sợ disconnect khi serverless đóng băng.
   - Khi bất kỳ process nào (Next.js API route, cron job, CLI script `tsx scripts/run-tick.ts`) ghi dữ liệu vào Supabase, PostgreSQL replication trigger sẽ tự động phát sự kiện tới mọi client đang mở web.

2. **Cơ chế Hybrid: WebSocket Primary + Polling Fallback**:
   - Khi WebSocket kết nối thành công: Nhận push tức thì qua WebSocket, không tốn request HTTP định kỳ.
   - Khi mất kết nối hoặc chạy ở chế độ Mock Local (chưa có Supabase keys): Tự động bật polling `/api/state` 5s/lần, đảm bảo web luôn hoạt động mượt mà trong mọi hoàn cảnh.

3. **Xử lý triệt để Hydration Error do Browser Extensions**:
   - Injected script chạy siêu sớm trong `<head>` sử dụng `MutationObserver` để tự động loại bỏ các thuộc tính rác như `bis_skin_checked`, `bis_register` trước khi React 19 thực hiện hydration.
   - Thêm `suppressHydrationWarning` và kiểm soát client-mount an toàn cho component tải ban đầu.

---

## Dependency Graph

```
Database (Supabase PostgreSQL)
    │
    ├── Enable Realtime Replication: ALTER PUBLICATION supabase_realtime ADD TABLE ticks, lives
    │
    └── Client Realtime Layer (src/lib/realtime/supabase-realtime.ts)
            │
            ├── React Custom Hook (src/hooks/useRealtimeSimulation.ts)
            │       │
            │       ├── State Update Handler (tự động unpack payload.new.state)
            │       └── Connection Status Tracking ('connected' | 'connecting' | 'fallback_polling')
            │
            └── UI Integration
                    ├── src/app/page.tsx (tự động cập nhật state khi nhận tick)
                    └── src/components/StatusBar.tsx (hiển thị indicator 🟢 Realtime / 🟡 Polling)
```

---

## Task List

### Phase 1: Fix Lỗi Hydration (Ưu tiên số 1)
- [x] **Task 1: Sửa triệt để 2 lỗi Hydration Mismatch (`bis_skin_checked="1"`)**
  - **Mô tả:** Thêm script MutationObserver dọn thuộc tính của extension trước khi React hydrate và xử lý client mounting trong `page.tsx` + `layout.tsx`.
  - **Acceptance criteria:**
    - Không còn thông báo lỗi đỏ "A tree hydrated but some attributes... bis_skin_checked" trong console dev.
    - Cả `<__next_metadata_boundary__>` và `src/app/page.tsx (219:11)` đều hydrate sạch sẽ.

### Checkpoint 1: Hydration Clean
- [x] Chạy `npm run typecheck` không lỗi.
- [x] Mở trình duyệt không còn popup lỗi đỏ hydration của Next.js.

---

### Phase 2: Cấu hình Supabase Realtime & Client Factory
- [ ] **Task 2: Migration SQL cho Supabase Realtime & Tạo Realtime Client**
  - **Mô tả:** Viết script SQL `supabase/realtime.sql` kích hoạt publication realtime cho 2 bảng `ticks` và `lives`. Xây dựng module client-side Supabase Realtime `src/lib/realtime/supabase-realtime.ts`.
  - **Acceptance criteria:**
    - File `supabase/realtime.sql` sẵn sàng để chạy trong Supabase SQL Editor.
    - Module `getBrowserRealtimeClient()` khởi tạo an toàn ở client, không bị crash nếu thiếu credentials.

### Phase 3: React Hook & UI Integration
- [ ] **Task 3: Xây dựng Hook `useRealtimeSimulation`**
  - **Mô tả:** Hook quản lý vòng đời WebSocket channel: lắng nghe sự kiện `INSERT` trên bảng `ticks` và `UPDATE` trên bảng `lives`. Nếu mất kết nối, tự động kích hoạt polling fallback `/api/state` mỗi 5s.
  - **Acceptance criteria:**
    - Trả về `{ state, connectionStatus, lastSyncTime }`.
    - Tự động hủy channel khi component unmount (clean cleanup, chống memory leak).

- [ ] **Task 4: Tích hợp Realtime vào `src/app/page.tsx` & Hiển thị Trạng thái Kết nối**
  - **Mô tả:** Nối hook vào `page.tsx` để cập nhật state, nhật ký, dòng tiền. Thêm badge hiển thị trạng thái kết nối trực tiếp (🟢 Realtime / 🟡 Polling) vào thanh StatusBar / AppHeader.
  - **Acceptance criteria:**
    - Khi có tick mới, giao diện tự động cập nhật ngay lập tức mà không cần F5.
    - Hiển thị toast thông báo nhẹ: "⚡ AI vừa có quyết định mới!" khi nhận tick qua WebSocket.

### Checkpoint 2: Realtime Live Flow
- [ ] Chạy `npm run tick` từ terminal, trang web đang mở tự động nhảy số tiền và nhật ký mới trong 1 giây.
- [ ] Tắt mạng hoặc tắt Supabase keys, web tự động chuyển sang chế độ Polling an toàn.

---

### Phase 4: Verification & Test Automation
- [ ] **Task 5: Script Test Realtime Simulation (`scripts/test-realtime.ts`)**
  - **Mô tả:** Viết script kiểm thử tự động bắn 1 tick thử nghiệm và đo độ trễ từ lúc insert DB đến lúc nhận event.
  - **Acceptance criteria:**
    - `npm run test` hoặc `npx tsx scripts/test-realtime.ts` chạy thành công.
    - Tài liệu hướng dẫn bật Realtime trong Supabase Dashboard được cập nhật vào README/setup.

---

## Risks and Mitigations

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|---|---|---|
| Người dùng chưa bật Realtime trong bảng điều khiển Supabase | Trung bình | Cung cấp sẵn file `supabase/realtime.sql` (1 lệnh duy nhất) và tự động fallback sang HTTP Polling nếu Realtime channel không phản hồi. |
| Nhiều tab trình duyệt mở cùng lúc gây vượt quota Realtime | Thấp | Supabase free tier cho phép 200 concurrent connections và 2 triệu message/tháng, hoàn toàn dư thừa cho ứng dụng mô phỏng. |
| Mất gói tin mạng tạm thời (chập chờn) | Thấp | Hook có heartbeat kiểm tra; nếu không nhận được tick quá 30 giây trong giờ làm việc, tự động gọi 1 request HTTP `/api/state` đồng bộ bù. |
