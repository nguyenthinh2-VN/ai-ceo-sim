-- ============================================================
-- Supabase Schema for AI CEO Simulator
-- Chạy script này trong Supabase SQL Editor
-- ============================================================

-- Bảng lives: Quản lý từng đời AI CEO
CREATE TABLE IF NOT EXISTS lives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_name text NOT NULL,
  company_name text NOT NULL,
  personality text NOT NULL,
  started_at timestamptz NOT NULL,
  status text CHECK (status IN ('SONG', 'PHA_SAN')) DEFAULT 'SONG',
  summary jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng ticks: Quản lý lịch sử từng tuần/lượt tự chạy của đời AI
CREATE TABLE IF NOT EXISTS ticks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_id uuid REFERENCES lives(id) ON DELETE CASCADE,
  week int NOT NULL,
  plan text,
  reason text,
  diary jsonb,
  actions jsonb,
  state jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index tăng tốc truy vấn tick mới nhất của mỗi đời AI
CREATE INDEX IF NOT EXISTS idx_ticks_life_created ON ticks(life_id, created_at DESC);

-- Bật Row Level Security (RLS)
-- Server-only access via Service Role Key (không cần anon policy)
ALTER TABLE lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticks ENABLE ROW LEVEL SECURITY;
