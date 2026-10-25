// ============================================================
// /api/ai-tick/route.ts — Server-only automated tick runner (SRP)
// Authorized by Bearer AI_TICK_SECRET.
// Coordinates StateRepository, AiBrain, and WorldSimulation.
// ============================================================

import { NextResponse } from 'next/server';
import { getStateRepository } from '@/lib/db';
import { AiBrainImpl } from '@/lib/ai/ai-brain';
import { WorldSimulationEngine } from '@/lib/world/world-simulation';
import { TickData, GameState } from '@/lib/types';
import { getDemoState } from '@/lib/mock-data';

export async function POST(req: Request) {
  try {
    // 1. Check Authorization: Bearer <AI_TICK_SECRET>
    const authHeader = req.headers.get('authorization') || '';
    const configuredSecret = process.env.AI_TICK_SECRET || 'dev-ai-tick-secret';

    if (authHeader !== `Bearer ${configuredSecret}`) {
      // Return 401 immediately without logging the secret
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional test/cron body overrides
    const body = await req.json().catch(() => ({}));

    // 2. Load active life from repository
    const repo = getStateRepository();
    const currentLife = await repo.getCurrentLife();

    if (!currentLife || currentLife.status !== 'SONG') {
      return NextResponse.json(
        { error: 'No active AI CEO life found.' },
        { status: 404 }
      );
    }

    // 3. Load latest tick state
    let latestTick = await repo.getLatestTick(currentLife.id);
    let state: GameState;

    if (!latestTick) {
      state = getDemoState();
      state.lifeId = currentLife.id;
      state.aiName = currentLife.aiName;
      state.companyName = currentLife.companyName;
      state.personality = currentLife.personality;
    } else {
      state = latestTick.state;
    }

    // 4. Calculate elapsed time for real-time 1:1 catch-up
    const now = new Date();
    let hoursToAdvance: number;

    if (typeof body.overrideElapsedHours === 'number') {
      hoursToAdvance = body.overrideElapsedHours;
    } else {
      const lastTickDate = state.lastTickAt
        ? new Date(state.lastTickAt)
        : new Date(now.getTime() - 3600 * 1000);
      hoursToAdvance = Math.max(0, Math.floor((now.getTime() - lastTickDate.getTime()) / (3600 * 1000)));
      // If run frequently within same hour without override, advance 0 or process actions
    }

    // 5. Initialize World Simulation & AI Brain
    const simulation = new WorldSimulationEngine(state);
    const brain = new AiBrainImpl();

    // 6. Request AI decision if needed
    const forceDecision = body.forceDecision === true;
    const decision = await brain.decide(state, forceDecision);

    // 7. Apply decisions to world
    const { rejected } = await simulation.applyActions(decision.actions);

    // 8. Advance time 1:1 catch-up
    simulation.advanceTime(hoursToAdvance, now);

    // 9. Settle month if rollover reached
    await simulation.settleMonthIfNeeded();

    // 10. Check bankruptcy condition
    const isBankrupt = await simulation.checkBankruptcy();
    const finalState = await simulation.getState();

    // Attach decision and demo flag
    finalState.keHoachHienTai = decision.plan;
    finalState.lyDoHienTai = decision.reason;
    if (decision.isDemo) {
      finalState.isDemo = true;
    }

    // Append decision diary entries if present
    if (decision.diary && decision.diary.length > 0) {
      for (const entry of decision.diary) {
        finalState.nhatKy.unshift({
          week: finalState.tuanHienTai,
          type: 'HOAT_DONG',
          content: entry,
          timestamp: now.toISOString(),
        });
      }
    }

    // 11. If bankrupt, update life status
    if (isBankrupt) {
      await repo.updateLifeStatus(currentLife.id, 'PHA_SAN', {
        totalWeeks: finalState.tuanHienTai,
        peakNetWorth: Math.max(...finalState.lichSuTien),
        totalProjects: finalState.hopDong.filter((c) => c.status === 'HOAN_THANH').length,
        assetsOwned: finalState.taiSan.map((a) => a.name),
      });
    }

    // 12. Save new tick
    const newTick: TickData = {
      id: crypto.randomUUID(),
      lifeId: currentLife.id,
      week: finalState.tuanHienTai,
      plan: finalState.keHoachHienTai,
      reason: finalState.lyDoHienTai,
      diary: finalState.nhatKy,
      actions: decision.actions,
      state: finalState,
      createdAt: now.toISOString(),
    };

    await repo.saveTick(newTick);

    return NextResponse.json({
      success: true,
      tick: newTick,
      state: finalState,
      isDemo: finalState.isDemo ?? false,
      rejected,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API /api/ai-tick POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error while executing AI tick' },
      { status: 500 }
    );
  }
}
