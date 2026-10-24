// ============================================================
// mock-state-repository.ts — In-Memory fallback implementation
// Used when Supabase env variables are not provided.
// ============================================================

import { StateRepository, LifeData, TickData, GameState } from '../types';
import { getDemoState } from '../mock-data';

export class MockStateRepository implements StateRepository {
  private lives: LifeData[] = [];
  private ticks: Map<string, TickData[]> = new Map();

  constructor() {
    this.seedDefaultIfEmpty();
  }

  private seedDefaultIfEmpty() {
    if (this.lives.length === 0) {
      const demoState = getDemoState();
      const lifeId = demoState.lifeId || 'mock-life-001';
      demoState.lifeId = lifeId;

      const initialLife: LifeData = {
        id: lifeId,
        aiName: demoState.aiName,
        companyName: demoState.companyName,
        personality: demoState.personality,
        startedAt: demoState.startedAt,
        status: 'SONG',
      };

      const initialTick: TickData = {
        id: 'mock-tick-001',
        lifeId: lifeId,
        week: demoState.tuanHienTai,
        plan: demoState.keHoachHienTai,
        reason: demoState.lyDoHienTai,
        diary: demoState.nhatKy,
        actions: [],
        state: demoState,
        createdAt: new Date().toISOString(),
      };

      this.lives.push(initialLife);
      this.ticks.set(lifeId, [initialTick]);
    }
  }

  async getCurrentLife(): Promise<LifeData | null> {
    const current = this.lives.find((l) => l.status === 'SONG');
    return current ? { ...current } : null;
  }

  async getLatestTick(lifeId: string): Promise<TickData | null> {
    const list = this.ticks.get(lifeId) || [];
    if (list.length === 0) return null;
    return { ...list[list.length - 1] };
  }

  async getAllTicks(lifeId: string): Promise<TickData[]> {
    const list = this.ticks.get(lifeId) || [];
    return list.map((t) => ({ ...t }));
  }

  async saveTick(tick: TickData): Promise<void> {
    const list = this.ticks.get(tick.lifeId) || [];
    list.push({ ...tick });
    this.ticks.set(tick.lifeId, list);
  }

  async createLife(life: LifeData): Promise<void> {
    // If there's an existing alive one, keep or let caller update status
    this.lives.push({ ...life });
    if (!this.ticks.has(life.id)) {
      this.ticks.set(life.id, []);
    }
  }

  async updateLifeStatus(
    lifeId: string,
    status: 'SONG' | 'PHA_SAN',
    summary?: LifeData['summary']
  ): Promise<void> {
    const target = this.lives.find((l) => l.id === lifeId);
    if (target) {
      target.status = status;
      if (summary) {
        target.summary = summary;
      }
    }
  }

  async getPastLives(): Promise<LifeData[]> {
    return this.lives
      .filter((l) => l.status === 'PHA_SAN')
      .map((l) => ({ ...l }));
  }
}

// Singleton instance for in-memory persistence during server lifecycle
let mockRepoInstance: MockStateRepository | null = null;

export function getMockStateRepository(): MockStateRepository {
  if (!mockRepoInstance) {
    mockRepoInstance = new MockStateRepository();
  }
  return mockRepoInstance;
}
