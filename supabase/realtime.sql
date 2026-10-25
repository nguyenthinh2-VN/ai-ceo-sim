-- ============================================================
-- Supabase Realtime Setup cho AI CEO Simulator
-- Chạy script này SAU schema.sql, trong Supabase SQL Editor.
-- ============================================================
--
-- Script này làm 3 việc:
--   1. Bật replication cho 2 bảng lives + ticks để Supabase phát
--      sự kiện qua WebSocket mỗi khi server ghi tick mới.
--   2. Cho phép trình duyệt ĐỌC (chỉ đọc) 2 bảng này bằng anon key.
--   3. Giữ nguyên quyền GHI: chỉ service_role key ở server mới ghi được.
--
-- ⚠️ LƯU Ý VỀ QUYỀN RIÊNG TƯ
-- Sau khi chạy script này, nội dung bảng `ticks` và `lives` trở thành
-- CÔNG KHAI với bất kỳ ai có anon key (anon key vốn nằm trong bundle
-- JS của trình duyệt, ai cũng xem được). Điều này là CHỦ ĐÍCH: đây là
-- web khán giả xem AI làm CEO, người xem chỉ xem chứ không can thiệp.
-- Tuyệt đối KHÔNG đặt dữ liệu riêng tư (email, token, thông tin khách
-- hàng thật) vào 2 bảng này.

-- ------------------------------------------------------------
-- 1. Bật Realtime Replication
-- ------------------------------------------------------------
-- Publication `supabase_realtime` do Supabase tạo sẵn. ADD TABLE sẽ
-- báo lỗi nếu bảng đã có trong publication, nên phải kiểm tra trước.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ticks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lives'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lives;
  END IF;
END $$;

-- Gửi nguyên bản ghi (không chỉ khóa chính) trong payload realtime.
-- Client cần `payload.new.state` — tức toàn bộ GameState — chứ không
-- chỉ id, nên REPLICA IDENTITY FULL là bắt buộc cho UPDATE/DELETE.
ALTER TABLE public.ticks REPLICA IDENTITY FULL;
ALTER TABLE public.lives REPLICA IDENTITY FULL;

-- ------------------------------------------------------------
-- 2. Quyền đọc công khai (chỉ SELECT) cho trình duyệt
-- ------------------------------------------------------------
-- RLS đã được bật trong schema.sql. Không có policy nào nghĩa là
-- KHÔNG AI đọc được ngoài service_role — Realtime sẽ im lặng không
-- gửi event nào. Policy dưới đây mở đúng cánh cửa cần thiết.

DROP POLICY IF EXISTS "public_read_ticks" ON public.ticks;
CREATE POLICY "public_read_ticks"
  ON public.ticks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_lives" ON public.lives;
CREATE POLICY "public_read_lives"
  ON public.lives
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ------------------------------------------------------------
-- 3. Chặn ghi từ trình duyệt
-- ------------------------------------------------------------
-- RLS đã chặn sẵn vì không có policy INSERT/UPDATE/DELETE nào cho anon.
-- Thu hồi luôn ở tầng GRANT để chắc chắn, phòng trường hợp sau này
-- Supabase đổi mặc định quyền của schema public.

REVOKE INSERT, UPDATE, DELETE ON public.ticks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lives FROM anon, authenticated;

-- ------------------------------------------------------------
-- Kiểm tra kết quả
-- ------------------------------------------------------------
-- Chạy 2 truy vấn sau để xác nhận đã bật đúng:
--
--   SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
--   -- Kỳ vọng: ticks, lives
--
--   SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';
--   -- Kỳ vọng: public_read_ticks (SELECT), public_read_lives (SELECT)