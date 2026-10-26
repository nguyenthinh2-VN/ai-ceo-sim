import { getCeoStatusDisplay } from '../src/lib/format';
import { WorldSimulationEngine } from '../src/lib/world/world-simulation';
import { createInitialState } from '../src/lib/mock-data';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('❌ FAILED:', msg);
    process.exit(1);
  }
  console.log('✅ PASSED:', msg);
}

console.log('--- TEST 1: getCeoStatusDisplay ---');

// Test Giờ giải trí 19h VN (12:00 UTC)
const d19h = new Date('2026-10-26T12:30:00Z'); // 19:30 VN
const res19h = getCeoStatusDisplay(null, d19h);
assert(res19h.label === 'Đang nghỉ ngơi', '19h VN must be Đang nghỉ ngơi');
assert(res19h.tag === '[NGHỈ NGƠI]', '19h VN tag must be [NGHỈ NGƠI]');
assert(!res19h.isWorking, '19h VN isWorking must be false');

// Test Đêm 23h VN (16:00 UTC)
const d23h = new Date('2026-10-26T16:00:00Z'); // 23:00 VN
const res23h = getCeoStatusDisplay(null, d23h);
assert(res23h.label === 'Đang ngủ', '23h VN must be Đang ngủ');
assert(res23h.tag === '[NGỦ]', '23h VN tag must be [NGỦ]');
assert(!res23h.isWorking, '23h VN isWorking must be false');

// Test Đêm 2h sáng VN (19:00 UTC hôm trước)
const d02h = new Date('2026-10-25T19:00:00Z'); // 02:00 VN
const res02h = getCeoStatusDisplay(null, d02h);
assert(res02h.label === 'Đang ngủ', '02h VN must be Đang ngủ');
assert(!res02h.isWorking, '02h VN isWorking must be false');

// Test Giờ làm việc 9h sáng VN (02:00 UTC)
const d09h = new Date('2026-10-26T02:00:00Z'); // 09:00 VN
const res09h = getCeoStatusDisplay(null, d09h);
assert(res09h.label === 'Đang làm việc', '09h VN must be Đang làm việc');
assert(res09h.tag === '[WORK]', '09h VN tag must be [WORK]');
assert(res09h.isWorking, '09h VN isWorking must be true');

// Test Nghỉ trưa 12h30 VN (05:30 UTC)
const d12h = new Date('2026-10-26T05:30:00Z'); // 12:30 VN
const res12h = getCeoStatusDisplay(null, d12h);
assert(res12h.label === 'Đang nghỉ trưa', '12h30 VN must be Đang nghỉ trưa');
assert(res12h.tag === '[NGHỈ TRƯA]', '12h30 VN tag must be [NGHỈ TRƯA]');
assert(!res12h.isWorking, '12h30 VN isWorking must be false');

// Test Giờ làm việc chiều 14h VN (07:00 UTC)
const d14h = new Date('2026-10-26T07:00:00Z'); // 14:00 VN
const res14h = getCeoStatusDisplay(null, d14h);
assert(res14h.label === 'Đang làm việc', '14h VN must be Đang làm việc');
assert(res14h.isWorking, '14h VN isWorking must be true');

console.log('\n--- TEST 2: advanceTime in WorldSimulationEngine ---');

const baseState = createInitialState('Yuki', 'GreenBit');
baseState.trangThaiAi = 'DANG_LAM'; // Giả sử AI đang trong chế độ làm việc tuần
const sim = new WorldSimulationEngine(baseState);

// Tick 0 giờ lúc 19:30 VN
sim.advanceTime(0, d19h);
sim.getState().then((s1) => {
  assert(s1.ceoHoatDong.hoatDongHienTai === 'Đang nghỉ ngơi', 'Tick 0h at 19:30 VN sets ceoHoatDong to Đang nghỉ ngơi');
  assert(s1.ceoHoatDong.trangThai === 'NGHI', 'Tick 0h at 19:30 VN sets trangThai to NGHI');
  assert(s1.trangThaiAi === 'DANG_LAM', 'trangThaiAi MUST remain DANG_LAM (unaffected)');

  // Tick 0 giờ lúc 23:00 VN
  sim.advanceTime(0, d23h);
  return sim.getState();
}).then((s2) => {
  assert(s2.ceoHoatDong.hoatDongHienTai === 'Đang ngủ', 'Tick 0h at 23:00 VN sets ceoHoatDong to Đang ngủ');
  assert(s2.ceoHoatDong.trangThai === 'NGU', 'Tick 0h at 23:00 VN sets trangThai to NGU');
  assert(s2.trangThaiAi === 'DANG_LAM', 'trangThaiAi MUST remain DANG_LAM');

  // Tick 0 giờ lúc 09:00 VN
  sim.advanceTime(0, d09h);
  return sim.getState();
}).then((s3) => {
  assert(s3.ceoHoatDong.hoatDongHienTai === 'Đang làm việc', 'Tick 0h at 09:00 VN sets ceoHoatDong to Đang làm việc');
  assert(s3.ceoHoatDong.trangThai === 'LAM', 'Tick 0h at 09:00 VN sets trangThai to LAM');

  // Tick 0 giờ lúc 12:30 VN
  sim.advanceTime(0, d12h);
  return sim.getState();
}).then((s4) => {
  assert(s4.ceoHoatDong.hoatDongHienTai === 'Đang nghỉ trưa', 'Tick 0h at 12:30 VN sets ceoHoatDong to Đang nghỉ trưa');
  assert(s4.ceoHoatDong.trangThai === 'NGHI', 'Tick 0h at 12:30 VN sets trangThai to NGHI');

  // Tick 5 giờ từ 16:00 đến 21:00 VN
  // 16:00 VN = 09:00 UTC
  const d16h = new Date('2026-10-26T09:00:00Z');
  const d21h = new Date('2026-10-26T14:00:00Z');
  s4.lastTickAt = d16h.toISOString();
  const simCatchup = new WorldSimulationEngine(s4);
  simCatchup.advanceTime(5, d21h);
  return simCatchup.getState();
}).then((s5) => {
  assert(s5.ceoHoatDong.hoatDongHienTai === 'Đang nghỉ ngơi', 'Catchup 5 hours reaching 21:00 VN ends in Đang nghỉ ngơi');
  assert(s5.ceoHoatDong.trangThai === 'NGHI', 'Catchup 5 hours trangThai is NGHI');
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
});
