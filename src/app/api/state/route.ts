import { NextResponse } from 'next/server';
import { getStateRepository } from '@/lib/db';
import { getDemoState } from '@/lib/mock-data';
import { LifeData, TickData } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const _url = new URL(req.url);
    const repo = getStateRepository();
    let currentLife = await repo.getCurrentLife();

    // Nếu DB trống (lần đầu chạy): seed 1 đời từ mock-data
    if (!currentLife) {
      const demoState = getDemoState();
      const lifeId = demoState.lifeId || crypto.randomUUID();
      demoState.lifeId = lifeId;

      const seededLife: LifeData = {
        id: lifeId,
        aiName: demoState.aiName,
        companyName: demoState.companyName,
        personality: demoState.personality,
        startedAt: demoState.startedAt,
        status: 'SONG',
      };
      await repo.createLife(seededLife);

      const initialTick: TickData = {
        id: crypto.randomUUID(),
        lifeId: lifeId,
        week: demoState.tuanHienTai,
        plan: demoState.keHoachHienTai,
        reason: demoState.lyDoHienTai,
        diary: demoState.nhatKy,
        actions: [],
        state: demoState,
        createdAt: new Date().toISOString(),
      };
      await repo.saveTick(initialTick);
      currentLife = seededLife;
    }

    let latestTick = await repo.getLatestTick(currentLife.id);

    // Fallback if life exists but tick is missing
    if (!latestTick) {
      const demoState = getDemoState();
      demoState.lifeId = currentLife.id;
      demoState.aiName = currentLife.aiName;
      demoState.companyName = currentLife.companyName;
      demoState.personality = currentLife.personality;

      const fallbackTick: TickData = {
        id: crypto.randomUUID(),
        lifeId: currentLife.id,
        week: demoState.tuanHienTai,
        plan: demoState.keHoachHienTai,
        reason: demoState.lyDoHienTai,
        diary: demoState.nhatKy,
        actions: [],
        state: demoState,
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
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API /api/state GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching game state' },
      { status: 500 }
    );
  }
}
