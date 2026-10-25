import { NextResponse } from 'next/server';
import { getStateRepository } from '@/lib/db';
import { createFreshInitialState } from '@/lib/mock-data';
import { handleRouteError } from '@/lib/api/route-error';
import { LifeData, TickData } from '@/lib/types';

export async function GET() {
  try {
    const repo = getStateRepository();
    let currentLife = await repo.getCurrentLife();

    // Nếu DB trống (lần đầu chạy): tạo 1 đời khởi nghiệp ban đầu
    if (!currentLife) {
      const freshState = createFreshInitialState();
      const lifeId = crypto.randomUUID();
      freshState.lifeId = lifeId;

      const seededLife: LifeData = {
        id: lifeId,
        aiName: freshState.aiName,
        companyName: freshState.companyName,
        personality: freshState.personality,
        startedAt: freshState.startedAt,
        status: 'SONG',
      };
      await repo.createLife(seededLife);

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
      await repo.saveTick(initialTick);
      currentLife = seededLife;
    }

    let latestTick = await repo.getLatestTick(currentLife.id);

    // Fallback if life exists but tick is missing
    if (!latestTick) {
      const freshState = createFreshInitialState(currentLife.aiName, currentLife.companyName, currentLife.personality);
      freshState.lifeId = currentLife.id;

      const fallbackTick: TickData = {
        id: crypto.randomUUID(),
        lifeId: currentLife.id,
        week: freshState.tuanHienTai,
        plan: freshState.keHoachHienTai,
        reason: freshState.lyDoHienTai,
        diary: freshState.nhatKy,
        actions: [],
        state: freshState,
        createdAt: new Date().toISOString(),
      };
      await repo.saveTick(fallbackTick);
      latestTick = fallbackTick;
    }

    const pastLives = await repo.getPastLives();

    return NextResponse.json({
      life: currentLife,
      state: latestTick.state,
      pastLives,
    });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'GET /api/state',
      'Internal server error while fetching game state'
    );
  }
}
