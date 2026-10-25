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

- [ ] **Task 2: Migration SQL cho Supabase Realtime & Tạo Realtime Client**
  - **Description:** Tạo file SQL kích hoạt replication publication cho 2 bảng `ticks` và `lives`. Viết module client khởi tạo Supabase Realtime an toàn ở browser side.
  - **Acceptance criteria:**
    - [ ] File `supabase/realtime.sql` sẵn sàng để chạy trong Supabase SQL Editor.
    - [ ] Module `src/lib/realtime/supabase-realtime.ts` khởi tạo an toàn, không crash khi thiếu env credentials.
  - **Verification:**
    - [ ] `npm run typecheck`
  - **Dependencies:** Task 1
  - **Files likely touched:**
    - `supabase/realtime.sql`
    - `src/lib/realtime/supabase-realtime.ts`
  - **Estimated scope:** Small (2 files)

---

## Phase 3: React Hook & UI Integration

- [ ] **Task 3: Xây dựng Hook `useRealtimeSimulation`**
  - **Description:** Quản lý kết nối WebSocket channel lắng nghe `INSERT` trên bảng `ticks` và `UPDATE` trên `lives`. Tự động fallback sang HTTP Polling mỗi 5s nếu mất kết nối hoặc chạy mock mode.
  - **Acceptance criteria:**
    - [ ] Nhận dữ liệu tick mới tức thời khi DB có bản ghi mới.
    - [ ] Trả về trạng thái kết nối (`connected` | `connecting` | `fallback_polling`).
    - [ ] Cleanup subscription khi unmount.
  - **Verification:**
    - [ ] `npm run typecheck`
  - **Dependencies:** Task 2
  - **Files likely touched:**
    - `src/hooks/useRealtimeSimulation.ts`
  - **Estimated scope:** Small (1 file)

- [ ] **Task 4: Tích hợp Realtime vào `src/app/page.tsx` & Hiển thị Trạng thái**
  - **Description:** Nối hook vào giao diện chính, tự động cập nhật state khi nhận tick mới mà không reload trang. Thêm badge trạng thái kết nối (🟢 Realtime / 🟡 Polling) vào `StatusBar` / `AppHeader`.
  - **Acceptance criteria:**
    - [ ] Giao diện tự động cập nhật số tiền, nhật ký, tiến độ hợp đồng khi server tick.
    - [ ] Hiển thị thông báo toast nhẹ khi có tick mới.
  - **Verification:**
    - [ ] Chạy `npm run tick` từ terminal và quan sát trang web tự động cập nhật.
  - **Dependencies:** Task 3
  - **Files likely touched:**
    - `src/app/page.tsx`
    - `src/components/StatusBar.tsx`
    - `src/components/AppHeader.tsx`
  - **Estimated scope:** Medium (3 files)

## Checkpoint 2: Realtime Live Flow
- [ ] Chạy `npm run tick` từ terminal, trang web đang mở tự động nhảy số tiền và nhật ký mới trong 1 giây.
- [ ] Tắt mạng hoặc tắt Supabase keys, web tự động chuyển sang chế độ Polling an toàn.

---

## Phase 4: Verification & Test Automation

- [ ] **Task 5: Script Test Realtime Simulation (`scripts/test-realtime.ts`)**
  - **Description:** Viết script kiểm thử tự động bắn 1 tick thử nghiệm và đo độ trễ từ lúc insert DB đến lúc nhận event.
  - **Acceptance criteria:**
    - [ ] `npx tsx scripts/test-realtime.ts` chạy thành công.
  - **Verification:**
    - [ ] `npx tsx scripts/test-realtime.ts`
  - **Dependencies:** Task 4
  - **Files likely touched:**
    - `scripts/test-realtime.ts`
  - **Estimated scope:** Small (1 file)

## Checkpoint 3: Hoàn thành toàn diện
- [ ] Tất cả checklist hoàn tất
- [ ] Không có lỗi lint hoặc TypeScript
