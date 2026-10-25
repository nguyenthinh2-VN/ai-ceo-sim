import { NextResponse } from 'next/server';
import { getStateRepository } from '@/lib/db';
import { createFreshInitialState } from '@/lib/mock-data';
import { LifeData, TickData } from '@/lib/types';

export async function GET() {
  try {
    const repo = getStateRepository();
    const pastLives = await repo.getPastLives();
    const currentLife = await repo.getCurrentLife();
    return NextResponse.json({ currentLife, pastLives });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API /api/lives GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching lives' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const repo = getStateRepository();
    const currentLife = await repo.getCurrentLife();

    const body = await req.json().catch(() => ({}));
    const newStatus = body.status || 'PHA_SAN';
    const summary = body.summary;

    // Chuyển đời cũ sang PHA_SAN hoặc trạng thái chỉ định, lưu summary nếu có
    if (currentLife) {
      await repo.updateLifeStatus(currentLife.id, newStatus, summary);
    }

    // Tạo đời AI mới với thông tin từ body hoặc ngẫu nhiên
    const newState = createFreshInitialState(
      body.aiName,
      body.companyName,
      body.personality
    );

    const newLifeId = crypto.randomUUID();
    newState.lifeId = newLifeId;

    const newLife: LifeData = {
      id: newLifeId,
      aiName: newState.aiName,
      companyName: newState.companyName,
      personality: newState.personality,
      startedAt: newState.startedAt,
      status: 'SONG',
    };

    await repo.createLife(newLife);

    // Lưu tick khởi tạo cho đời mới
    const initialTick: TickData = {
      id: crypto.randomUUID(),
      lifeId: newLifeId,
      week: newState.tuanHienTai,
      plan: newState.keHoachHienTai,
      reason: newState.lyDoHienTai,
      diary: newState.nhatKy,
      actions: [],
      state: newState,
      createdAt: new Date().toISOString(),
    };

    await repo.saveTick(initialTick);

    return NextResponse.json({
      success: true,
      life: newLife,
      state: newState,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API /api/lives POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating new AI CEO life' },
      { status: 500 }
    );
  }
}
