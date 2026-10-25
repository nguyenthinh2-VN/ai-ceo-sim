import { NextResponse } from 'next/server';
import { getStateRepository } from '@/lib/db';
import { handleRouteError } from '@/lib/api/route-error';
import { TickData } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const repo = getStateRepository();
    const currentLife = await repo.getCurrentLife();
    if (!currentLife) {
      return NextResponse.json({ error: 'No active life found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      const ticks = await repo.getAllTicks(currentLife.id);
      return NextResponse.json({ ticks });
    }

    const latest = await repo.getLatestTick(currentLife.id);
    return NextResponse.json({ tick: latest });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'GET /api/ticks',
      'Internal server error while fetching ticks'
    );
  }
}

export async function POST(req: Request) {
  try {
    const repo = getStateRepository();
    const currentLife = await repo.getCurrentLife();
    if (!currentLife) {
      return NextResponse.json(
        { error: 'No active life found to append tick' },
        { status: 404 }
      );
    }

    const body = await req.json();
    if (!body || !body.state) {
      return NextResponse.json(
        { error: 'Missing required state object in body' },
        { status: 400 }
      );
    }

    const state = body.state;
    state.lifeId = currentLife.id;

    const tick: TickData = {
      id: body.id || crypto.randomUUID(),
      lifeId: currentLife.id,
      week: body.week ?? state.tuanHienTai,
      plan: body.plan ?? state.keHoachHienTai ?? '',
      reason: body.reason ?? state.lyDoHienTai ?? '',
      diary: body.diary ?? state.nhatKy ?? [],
      actions: body.actions ?? [],
      state: state,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await repo.saveTick(tick);

    return NextResponse.json({
      success: true,
      tick,
    });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'POST /api/ticks',
      'Internal server error while saving tick'
    );
  }
}
