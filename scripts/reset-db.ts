import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { createFreshInitialState } from '../src/lib/mock-data';
import { LifeData, TickData } from '../src/lib/types';

import path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  console.log('Reading .env from:', envPath);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function resetDatabase() {
  console.log('🔄 Đang kết nối Supabase:', supabaseUrl);

  // 1. Kiểm tra số lượng bản ghi hiện có
  const { data: lives, error: livesErr } = await supabase.from('lives').select('id, ai_name, company_name, status');
  const { data: ticks, error: ticksErr } = await supabase.from('ticks').select('id, week');

  if (livesErr) console.error('Lỗi đọc bảng lives:', livesErr);
  if (ticksErr) console.error('Lỗi đọc bảng ticks:', ticksErr);

  console.log(`📊 Tìm thấy: ${lives?.length ?? 0} đời AI và ${ticks?.length ?? 0} ticks trong DB.`);

  // 2. Xóa toàn bộ ticks cũ
  console.log('🗑️ Đang xóa toàn bộ dữ liệu ticks cũ...');
  const { error: delTicksErr } = await supabase.from('ticks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delTicksErr) {
    console.error('Lỗi xóa ticks:', delTicksErr);
  } else {
    console.log('✅ Đã dọn sạch bảng ticks.');
  }

  // 3. Xóa toàn bộ lives cũ
  console.log('🗑️ Đang xóa toàn bộ dữ liệu lives cũ...');
  const { error: delLivesErr } = await supabase.from('lives').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delLivesErr) {
    console.error('Lỗi xóa lives:', delLivesErr);
  } else {
    console.log('✅ Đã dọn sạch bảng lives.');
  }

  // 4. Khởi tạo một AI CEO mới tinh hoàn toàn (Day 1, Week 1, 500tr)
  console.log('🌱 Đang khởi tạo AI CEO mới Ngày 1 Tuần 1...');
  const freshState = createFreshInitialState();
  const lifeId = crypto.randomUUID();
  freshState.lifeId = lifeId;

  const newLife: LifeData = {
    id: lifeId,
    aiName: freshState.aiName,
    companyName: freshState.companyName,
    personality: freshState.personality,
    startedAt: freshState.startedAt,
    status: 'SONG',
  };

  const { error: createLifeErr } = await supabase.from('lives').insert({
    id: newLife.id,
    ai_name: newLife.aiName,
    company_name: newLife.companyName,
    personality: newLife.personality,
    started_at: newLife.startedAt,
    status: newLife.status,
  });

  if (createLifeErr) {
    console.error('Lỗi tạo life mới:', createLifeErr);
    process.exit(1);
  }

  const initialTick: TickData = {
    id: crypto.randomUUID(),
    lifeId: lifeId,
    week: freshState.tuanHienTai,
    plan: freshState.keHoachHienTai,
    reason: freshState.lyDoHienTai,
    diary: freshState.nhatKy,
    actions: [],
    state: freshState,
    createdAt: new Date().toISOString(),
  };

  const { error: createTickErr } = await supabase.from('ticks').insert({
    id: initialTick.id,
    life_id: initialTick.lifeId,
    week: initialTick.week,
    plan: initialTick.plan,
    reason: initialTick.reason,
    diary: initialTick.diary,
    actions: initialTick.actions,
    state: initialTick.state,
    created_at: initialTick.createdAt,
  });

  if (createTickErr) {
    console.error('Lỗi tạo tick đầu tiên:', createTickErr);
    process.exit(1);
  }

  console.log('\n🎉 [HOÀN TẤT DỌN DẸP & KHỞI TẠO MỚI]');
  console.log(`- Tên AI: ${newLife.aiName}`);
  console.log(`- Công ty: ${newLife.companyName}`);
  console.log(`- Tính cách: ${newLife.personality}`);
  console.log(`- Vốn điều lệ ban đầu: 500.000.000đ`);
  console.log(`- Nhân sự: 0 người`);
  console.log(`- Hợp đồng: 0 hợp đồng`);
  console.log(`- Ngày bắt đầu: ${newLife.startedAt}`);
}

resetDatabase().catch((e) => {
  console.error('Lỗi không xác định:', e);
  process.exit(1);
});
