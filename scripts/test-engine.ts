import { parseAiResponse } from '../src/lib/ai/ai-response-parser';
import { WorldSimulationEngine } from '../src/lib/world/world-simulation';
import { AiBrainImpl } from '../src/lib/ai/ai-brain';
import { getDemoState, createFreshInitialState } from '../src/lib/mock-data';
import { LlmClient } from '../src/lib/types';
import { buildPrompt } from '../src/lib/ai/prompt-builder';
import { ASSET_SELL_RATE, MAX_ACTIONS_PER_WEEK, SALARY_FLOOR } from '../src/lib/constants';

export async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN ENGINE & AI BRAIN ===\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, desc: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // TEST 1: Parser rejects illegal actions
  console.log('--- TEST 1: Parser & Validator ---');
  {
    const state = getDemoState();
    // Simulate illegal JSON from LLM:
    // 1. BAN_GIAO_HOP_DONG on a contract that is not 100%
    // 2. An invented action code not in game rules
    // 3. SA_THAI non-existent employee
    const rawIllegalResponse = JSON.stringify({
      plan: 'Kế hoạch ảo tưởng',
      reason: 'Lý do tự nghĩ',
      actions: [
        { code: 'BAN_GIAO_HOP_DONG', contractId: 'HD-001' }, // HD-001 is only 65%
        { code: 'HACK_TIEN_NGAN_HANG', amount: 999999999 }, // Illegal code
        { code: 'SA_THAI', employeeId: 'emp-unknown' },      // Unknown emp
        { code: 'LAM_VIEC' },                                // Valid
      ],
      diary: ['Tuần 5: Tôi thử làm điều phi lý.'],
    });

    const parsed = parseAiResponse(rawIllegalResponse, state);
    assert(parsed.rejected.length === 3, 'Parser phát hiện và từ chối đúng 3 hành động sai luật');
    assert(
      parsed.decision.actions.length === 1 && parsed.decision.actions[0].code === 'LAM_VIEC',
      'Chỉ giữ lại hành động LAM_VIEC hợp lệ'
    );
    assert(
      parsed.decision.diary.some((d) => d.includes('[Hệ thống] Đã từ chối')),
      'Nhật ký ghi rõ lý do từ chối các hành động sai luật'
    );
  }

  // TEST 2: Contract lifecycle — 100% progress without handover cannot receive remaining 70%
  console.log('\n--- TEST 2: Vòng đời hợp đồng & Điều kiện nhận 70% ---');
  {
    const state = getDemoState();
    // Set contract HD-001 to 100% progress while in DANG_LAM
    const contract = state.hopDong.find((c) => c.id === 'HD-001')!;
    contract.progress = 100;
    const cashBefore = state.tienMat;

    const sim = new WorldSimulationEngine(state);

    // Advance 1 hour without handover
    sim.advanceTime(1, new Date());
    const stateAfterTick = await sim.getState();
    const contractAfter = stateAfterTick.hopDong.find((c) => c.id === 'HD-001')!;

    assert(contractAfter.status === 'DANG_LAM', 'Hợp đồng dù 100% vẫn giữ DANG_LAM nếu chưa BAN_GIAO');
    assert(stateAfterTick.tienMat === cashBefore, 'Tiền mặt không tự động tăng thêm 70% nếu chưa có hành động bàn giao');

    // Now execute BAN_GIAO_HOP_DONG
    await sim.applyActions([{ code: 'BAN_GIAO_HOP_DONG', contractId: 'HD-001' }]);
    const stateAfterHandover = await sim.getState();
    const contractHandedOver = stateAfterHandover.hopDong.find((c) => c.id === 'HD-001')!;

    assert(contractHandedOver.status === 'KHACH_XEM', 'Hợp đồng chuyển sang KHACH_XEM sau khi bàn giao');
    assert(stateAfterHandover.tienMat === cashBefore, 'Lúc khách xem vẫn chưa nhận tiền 70% còn lại');
  }

  // TEST 3: Catch-up 2 real-time hours
  console.log('\n--- TEST 3: 1:1 Catch-up 2 Giờ Thật ---');
  {
    const state = getDemoState();
    const now = new Date();
    // Simulate lastTickAt 2 hours ago
    state.lastTickAt = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();

    const totalBefore =
      state.gioSongTuanNay.lamViec +
      state.gioSongTuanNay.hop +
      state.gioSongTuanNay.ngu +
      state.gioSongTuanNay.nghiTrua +
      state.gioSongTuanNay.giaiLao +
      state.gioSongTuanNay.giaiTri;

    const sim = new WorldSimulationEngine(state);
    sim.advanceTime(2, now);
    const updatedState = await sim.getState();

    const totalAfter =
      updatedState.gioSongTuanNay.lamViec +
      updatedState.gioSongTuanNay.hop +
      updatedState.gioSongTuanNay.ngu +
      updatedState.gioSongTuanNay.nghiTrua +
      updatedState.gioSongTuanNay.giaiLao +
      updatedState.gioSongTuanNay.giaiTri;

    const hoursAdded = totalAfter - totalBefore;
    assert(
      hoursAdded === 2 || (hoursAdded <= 168 && totalAfter <= 168),
      'Tổng giờ tăng đúng 2 giờ catch-up và tổng giờ tuần <= 168'
    );
  }

  // TEST 4: No OpenAI key -> Fallback to Rule-Based Brain with isDemo: true
  console.log('\n--- TEST 4: Chế độ không key OpenAI ---');
  {
    delete process.env.OPENAI_API_KEY;
    const state = getDemoState();
    const brain = new AiBrainImpl(undefined, { now: () => new Date('2026-10-25T08:00:00+07:00') });
    const decision = await brain.decide(state, true);

    assert(decision.isDemo === true, 'Trả về cờ isDemo: true khi không có key OpenAI');
    assert(decision.actions.length > 0, 'Rule-based brain đưa ra được hành động hợp lệ');
    assert(decision.diary.length > 0, 'Có nhật ký bằng giọng Tôi của đời AI');
  }

  // TEST 5: OpenAI error (bad key / quota) -> Fallback without crash, logs error to diary
  console.log('\n--- TEST 5: Xử lý lỗi OpenAI (Bad Key / Timeout) ---');
  {
    const mockFailingLlm: LlmClient = {
      chat: async () => {
        throw new Error('Incorrect API key provided (invalid_api_key)');
      },
    };

    const state = getDemoState();
    process.env.OPENAI_API_KEY = 'invalid-key';
    const brain = new AiBrainImpl(mockFailingLlm, { now: () => new Date('2026-10-25T08:00:00+07:00') });
    const decision = await brain.decide(state, true);

    assert(decision.isDemo === true, 'Khi OpenAI lỗi, tự động fallback sang RuleBasedBrain');
    assert(decision.diary.some((d) => d.includes('[Sự cố LLM]')), 'Ghi nhận lỗi OpenAI vào nhật ký mà không làm crash tick');
  }

  // TEST 6: 9 hành động trước đây engine bỏ qua nay phải thật sự có hiệu lực
  console.log('\n--- TEST 6: 9 Action Code còn thiếu ở engine ---');
  {
    const state = createFreshInitialState('Khoa', 'VietCode', 'Test');
    // 2 nhân viên để test đường lương
    state.nhanVien = [
      {
        id: 'emp-01', name: 'Lan', role: 'Backend', skill: 3, salary: 25_000_000,
        morale: 80, monthsWorked: 1, hoatDongHienTai: 'Đang code', trangThai: 'LAM',
        tu: new Date().toISOString(),
      },
      {
        id: 'emp-02', name: 'Minh', role: 'Tester', skill: 2, salary: 14_000_000,
        morale: 25, monthsWorked: 1, hoatDongHienTai: 'Đang test', trangThai: 'LAM',
        tu: new Date().toISOString(),
      },
    ];
    state.tienMat = 2_000_000_000;

    // CAT_GIAM_LUONG
    {
      const sim = new WorldSimulationEngine(state);
      const before = state.nhanVien[0].salary;
      const { rejected } = await sim.applyActions([
        { code: 'CAT_GIAM_LUONG', employeeId: 'emp-01' },
      ]);
      const after = (await sim.getState()).nhanVien[0];
      assert(rejected.length === 0, 'CAT_GIAM_LUONG được engine chấp nhận (không còn rơi vào default)');
      assert(after.salary < before, `CAT_GIAM_LUONG thật sự giảm lương (${before} → ${after.salary})`);
      assert(after.morale < 80, 'CAT_GIAM_LUONG làm morale nhân viên tụt');
    }

    // TANG_LUONG + THUONG
    {
      const sim = new WorldSimulationEngine(state);
      const beforeSalary = state.nhanVien[0].salary;
      await sim.applyActions([{ code: 'TANG_LUONG', employeeId: 'emp-01' }]);
      const s = await sim.getState();
      assert(s.nhanVien[0].salary > beforeSalary, 'TANG_LUONG thật sự tăng lương');

      const cashBefore = s.tienMat;
      await sim.applyActions([{ code: 'THUONG', employeeId: 'emp-01', amount: 5_000_000 }]);
      const s2 = await sim.getState();
      assert(s2.tienMat === cashBefore - 5_000_000, 'THUONG trừ đúng tiền mặt và cộng morale');
    }

    // CHUYEN_VAN_PHONG_NHO
    {
      const officeState = JSON.parse(JSON.stringify(state));
      officeState.vanPhong = 'Văn phòng vừa';
      const sim = new WorldSimulationEngine(officeState);
      await sim.applyActions([{ code: 'CHUYEN_VAN_PHONG_NHO' }]);
      const s = await sim.getState();
      assert(s.vanPhong === 'Văn phòng nhỏ', 'CHUYEN_VAN_PHONG_NHO hạ đúng 1 bậc trong thang văn phòng');
    }

    // MUA_TAI_SAN + BAN_TAI_SAN
    {
      const sim = new WorldSimulationEngine(state);
      const cashBefore = state.tienMat;
      const { rejected } = await sim.applyActions([
        { code: 'MUA_TAI_SAN', assetName: 'Xe ô tô' },
      ]);
      const s = await sim.getState();
      assert(rejected.length === 0, 'MUA_TAI_SAN mua được tài sản có thật trong danh mục');
      assert(s.taiSan.length === 1, 'Tài sản được ghi vào state');
      assert(s.danhTieng > 10, 'Xe ô tô cộng danh tiếng +5 như luật');
      assert(s.tienMat === cashBefore - 800_000_000, 'MUA_TAI_SAN trừ đúng giá tiền mặt');

      await sim.applyActions([{ code: 'BAN_TAI_SAN', assetName: 'Xe ô tô' }]);
      const s2 = await sim.getState();
      assert(s2.taiSan.length === 0, 'BAN_TAI_SAN xóa tài sản khỏi state');
      assert(
        s2.tienMat === s.tienMat + 800_000_000 * ASSET_SELL_RATE,
        'BAN_TAI_SAN thu về đúng 70% giá mua'
      );
    }

    // BAT_DAU_SAN_PHAM + TAM_DUNG_SAN_PHAM
    {
      const sim = new WorldSimulationEngine(state);
      const { rejected } = await sim.applyActions([
        { code: 'BAT_DAU_SAN_PHAM', productName: 'App của tôi' },
      ]);
      const s = await sim.getState();
      assert(rejected.length === 0, 'BAT_DAU_SAN_PHAM khởi động được sản phẩm mới');
      assert(s.sanPham.length === 1 && s.sanPham[0].name === 'App của tôi', 'Sản phẩm vào state đúng tên');

      await sim.applyActions([{ code: 'TAM_DUNG_SAN_PHAM' }]);
      const s2 = await sim.getState();
      assert(s2.sanPham[0].paused === true, 'TAM_DUNG_SAN_PHAM đánh dấu sản phẩm đang dừng');
    }

    // KHONG_LAM_GI
    {
      const sim = new WorldSimulationEngine(createFreshInitialState());
      const { rejected } = await sim.applyActions([{ code: 'KHONG_LAM_GI' }]);
      const s = await sim.getState();
      assert(rejected.length === 0, 'KHONG_LAM_GI được chấp nhận');
      assert(s.cheDoLamViec === 'KHONG_LAM_GI', 'KHONG_LAM_GI ghi chế độ tuần vào state');
    }

    // Không hành động nào còn rơi vào default (im lặng)
    {
      const sim = new WorldSimulationEngine(JSON.parse(JSON.stringify(state)));
      const { rejected } = await sim.applyActions([
        { code: 'SA_THAI', employeeId: 'emp-999' },
      ]);
      assert(
        rejected.some((r) => r.includes('Không tìm thấy nhân viên emp-999')),
        'Hành động sai vẫn bị từ chối kèm lý do, không im lặng bỏ qua'
      );
    }
  }

  // TEST 7: Sản phẩm tự chạy tiến độ và ra mắt được
  console.log('\n--- TEST 7: Vòng đời sản phẩm ---');
  {
    const state = createFreshInitialState();
    state.sanPham = [
      {
        id: 'sp-01', name: 'SaaS', progress: 99, subscriptionPrice: 200_000,
        customers: 0, mrr: 0, launched: false, paused: false,
      },
    ];
    // Ghim lastTickAt vào 09:00 giờ VN (02:00 UTC) TRƯỚC khi dựng engine,
    // để giờ kế tiếp chắc chắn rơi vào giờ làm việc.
    state.lastTickAt = '2026-10-25T02:00:00.000Z';
    const sim = new WorldSimulationEngine(state);
    sim.advanceTime(1, new Date('2026-10-25T03:00:00.000Z'));
    const s = await sim.getState();
    assert(
      s.sanPham[0].progress > 99 || s.sanPham[0].launched,
      'Sản phẩm được đẩy tiến độ trong giờ làm việc'
    );
  }

  // TEST 8: Chốt sổ tháng không bị chạy 2 lần
  console.log('\n--- TEST 8: Chống settle trùng tháng ---');
  {
    const state = createFreshInitialState();
    state.tuanHienTai = 5; // tuần 5 = 5 % 4 === 1 => mốc chốt sổ
    const sim = new WorldSimulationEngine(state);
    const afterFirst = await sim.settleMonthIfNeeded();
    const afterSecond = await sim.settleMonthIfNeeded();
    assert(
      afterFirst.tienMat === afterSecond.tienMat,
      'Gọi settleMonthIfNeeded 2 lần trong cùng tuần chỉ trừ tiền đúng 1 lần'
    );
  }

  // TEST 9: Trần 3 hành động/tuần được thực thi
  console.log('\n--- TEST 9: Trần hành động mỗi tuần ---');
  {
    const state = getDemoState();
    const raw = JSON.stringify({
      plan: 'Làm nhiều thứ một lúc',
      reason: 'Tham lam',
      actions: [
        { code: 'LAM_VIEC' },
        { code: 'CAY' },
        { code: 'NGHI_NGOI' },
        { code: 'KHONG_LAM_GI' },
        { code: 'LAM_VIEC' },
      ],
      diary: ['Tuần 3: Tôi ôm đồm quá nhiều.'],
    });
    const parsed = parseAiResponse(raw, state);
    assert(
      parsed.decision.actions.length <= MAX_ACTIONS_PER_WEEK,
      `Parser cắt đúng trần ${MAX_ACTIONS_PER_WEEK} hành động/tuần`
    );

    // Bàn giao bắt buộc phải sống sót qua lần cắt trần
    const state2 = createFreshInitialState();
    state2.hopDong[0].progress = 100;
    const raw2 = JSON.stringify({
      plan: 'Bàn giao và ôm đồm',
      reason: 'Tham lam',
      actions: [
        { code: 'LAM_VIEC' },
        { code: 'CAY' },
        { code: 'NGHI_NGOI' },
        { code: 'BAN_GIAO_HOP_DONG', contractId: 'HD-001' },
      ],
      diary: ['Tuần 4: Tôi vừa bàn giao vừa ôm đồm.'],
    });
    const parsed2 = parseAiResponse(raw2, state2);
    assert(
      parsed2.decision.actions.some((a) => a.code === 'BAN_GIAO_HOP_DONG'),
      'BAN_GIAO_HOP_DONG không bị cắt trần loại bỏ (mất nó là mất 70% tiền hợp đồng)'
    );
  }

  // TEST 10: Prompt builder chỉ đề xuất hành động engine thật sự làm được
  console.log('\n--- TEST 10: Prompt builder & Engine khớp nhau ---');
  {
    const state = createFreshInitialState();
    state.tienMat = 3_000_000_000;
    state.vanPhong = 'Văn phòng vừa';
    state.taiSan = [
      {
        id: 'ts-01', name: 'Xe ô tô', purchasePrice: 800_000_000,
        currentValue: 800_000_000, purchasedAt: 1,
      },
    ];
    state.sanPham = [
      {
        id: 'sp-01', name: 'SaaS', progress: 40, subscriptionPrice: 200_000,
        customers: 0, mrr: 0, launched: false, paused: false,
      },
    ];
    state.nhanVien = [
      {
        id: 'emp-01', name: 'Lan', role: 'Backend', skill: 3, salary: 25_000_000,
        morale: 80, monthsWorked: 1, hoatDongHienTai: 'Đang code', trangThai: 'LAM',
        tu: new Date().toISOString(),
      },
    ];

    const { allowedActions } = buildPrompt(state, new Date());
    const codes = new Set(allowedActions.map((a) => a.code));

    // Mọi action prompt đề xuất phải được engine xử lý, không im lặng bỏ qua
    const sim = new WorldSimulationEngine(JSON.parse(JSON.stringify(state)));
    const { rejected } = await sim.applyActions(allowedActions);
    assert(
      !rejected.some((r) => r.includes('chưa được engine hỗ trợ')),
      'Mọi hành động prompt-builder đề xuất đều được engine xử lý thật'
    );

    assert(
      codes.has('CAT_GIAM_LUONG') && codes.has('CHUYEN_VAN_PHONG_NHO') &&
      codes.has('TAM_DUNG_SAN_PHAM') && codes.has('BAN_TAI_SAN') &&
      codes.has('TANG_LUONG') && codes.has('THUONG') && codes.has('BAT_DAU_SAN_PHAM') &&
      codes.has('MUA_TAI_SAN') && codes.has('KHONG_LAM_GI'),
      'Cả 9 hành động trước đây bị bỏ quên nay đều được prompt-builder đề xuất'
    );

    // Sàn lương phải được tôn trọng
    const cheapEmp = state.nhanVien[0];
    cheapEmp.salary = SALARY_FLOOR;
    const sim2 = new WorldSimulationEngine(JSON.parse(JSON.stringify(state)));
    const res2 = await sim2.applyActions([
      { code: 'CAT_GIAM_LUONG', employeeId: 'emp-01' },
    ]);
    assert(
      res2.rejected.some((r) => r.includes('sàn')),
      'Không thể cắt lương xuống dưới sàn'
    );
  }

  // TEST 11: Morale cuối tuần — cày 3 tuần liên tiếp phải bị phạt
  console.log('\n--- TEST 11: Luật morale cuối tuần ---');
  {
    const state = createFreshInitialState();
    state.nhanVien = [
      {
        id: 'emp-01', name: 'Lan', role: 'Backend', skill: 3, salary: 25_000_000,
        morale: 90, monthsWorked: 1, hoatDongHienTai: 'Đang code', trangThai: 'LAM',
        tu: new Date().toISOString(),
      },
    ];
    state.weeksCrunchStreak = 2; // đã cày 2 tuần, tuần này là tuần thứ 3
    // WorldSimulationEngine clone state trong constructor, nên phải đặt chế độ
    // trên chính object đưa vào engine — không phải qua applyActions của engine khác.
    state.cheDoLamViec = 'CAY';
    state.lastTickAt = '2026-10-18T17:00:00.000Z';
    const sim2 = new WorldSimulationEngine(state);
    sim2.advanceTime(168, new Date('2026-10-25T17:00:00.000Z'));

    const s = await sim2.getState();
    assert(
      (s.weeksCrunchStreak ?? 0) >= 3,
      `Đếm đúng số tuần cày liên tiếp (${s.weeksCrunchStreak})`
    );
    assert(
      s.nhanVien.length === 0 || s.nhanVien[0].morale < 90 || s.nhatKy.some((d) => d.content.includes('cày liên tục')),
      'Cày 3 tuần liên tiếp bị ghi nhận phạt morale team'
    );
  }

  // TEST 12: CAY phải thật sự nhanh hơn LAM_VIEC
  console.log('\n--- TEST 12: Hiệu lực của chế độ CAY ---');
  {
    function runWeek(mode: 'LAM_VIEC' | 'CAY') {
      const s = createFreshInitialState();
      s.hopDong[0].progress = 0;
      s.cheDoLamViec = mode;
      s.lastTickAt = '2026-10-18T17:00:00.000Z';
      const sim = new WorldSimulationEngine(s);
      sim.advanceTime(168, new Date('2026-10-25T17:00:00.000Z'));
      return sim.getState();
    }

    const normal = await runWeek('LAM_VIEC');
    const crunch = await runWeek('CAY');

    assert(
      crunch.hopDong[0].progress > normal.hopDong[0].progress,
      `CAY đẩy tiến độ nhanh hơn LAM_VIEC (${crunch.hopDong[0].progress}% vs ${normal.hopDong[0].progress}%)`
    );
    assert(
      crunch.nangLuong < normal.nangLuong,
      `CAY hao năng lượng nhiều hơn (${crunch.nangLuong} vs ${normal.nangLuong})`
    );
  }

  console.log(`\n=== TẤT CẢ TEST ĐÃ HOÀN TẤT THÀNH CÔNG: ${passedCount}/${totalCount} TESTS PASSED ===\n`);
}

runTests().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
