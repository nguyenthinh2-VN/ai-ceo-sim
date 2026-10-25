// ============================================================
// supabase-state-repository.ts — Supabase implementation of StateRepository
// Maps DB snake_case <-> TypeScript camelCase
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StateRepository, LifeData, TickData, GameState, DiaryEntry, AiAction } from '../types';

interface DbLifeRow {
  id: string;
  ai_name: string;
  company_name: string;
  personality: string;
  started_at: string;
  status: 'SONG' | 'PHA_SAN';
  summary: LifeData['summary'] | null;
  created_at: string;
  updated_at: string;
}

interface DbTickRow {
  id: string;
  life_id: string;
  week: number;
  plan: string | null;
  reason: string | null;
  // Cột jsonb: kiểu thật do DB quyết định lúc ghi, không được tin vào `select *`.
  diary: DiaryEntry[] | null;
  actions: AiAction[] | null;
  state: GameState;
  created_at: string;
}

export class SupabaseStateRepository implements StateRepository {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async getCurrentLife(): Promise<LifeData | null> {
    const { data, error } = await this.client
      .from('lives')
      .select('*')
      .eq('status', 'SONG')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseStateRepository] getCurrentLife error:', error);
      throw error;
    }

    if (!data) return null;

    const row = data as DbLifeRow;
    return {
      id: row.id,
      aiName: row.ai_name,
      companyName: row.company_name,
      personality: row.personality,
      startedAt: row.started_at,
      status: row.status,
      summary: row.summary ?? undefined,
    };
  }

  async getLatestTick(lifeId: string): Promise<TickData | null> {
    const { data, error } = await this.client
      .from('ticks')
      .select('*')
      .eq('life_id', lifeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseStateRepository] getLatestTick error:', error);
      throw error;
    }

    if (!data) return null;

    const row = data as DbTickRow;
    return {
      id: row.id,
      lifeId: row.life_id,
      week: row.week,
      plan: row.plan ?? '',
      reason: row.reason ?? '',
      diary: row.diary ?? [],
      actions: row.actions ?? [],
      state: row.state as GameState,
      createdAt: row.created_at,
    };
  }

  async getAllTicks(lifeId: string): Promise<TickData[]> {
    const { data, error } = await this.client
      .from('ticks')
      .select('*')
      .eq('life_id', lifeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[SupabaseStateRepository] getAllTicks error:', error);
      throw error;
    }

    return (data || []).map((row: DbTickRow) => ({
      id: row.id,
      lifeId: row.life_id,
      week: row.week,
      plan: row.plan ?? '',
      reason: row.reason ?? '',
      diary: row.diary ?? [],
      actions: row.actions ?? [],
      state: row.state as GameState,
      createdAt: row.created_at,
    }));
  }

  async saveTick(tick: TickData): Promise<void> {
    const isValidUuid = (id?: string) =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const tickId = isValidUuid(tick.id) ? tick.id : crypto.randomUUID();
    tick.id = tickId;

    const { error } = await this.client.from('ticks').insert({
      id: tickId,
      life_id: tick.lifeId,
      week: tick.week,
      plan: tick.plan,
      reason: tick.reason,
      diary: tick.diary,
      actions: tick.actions,
      state: tick.state,
      created_at: tick.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('[SupabaseStateRepository] saveTick error:', error);
      throw error;
    }
  }

  async createLife(life: LifeData): Promise<void> {
    const isValidUuid = (id?: string) =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const lifeId = isValidUuid(life.id) ? life.id : crypto.randomUUID();
    life.id = lifeId;

    const { error } = await this.client.from('lives').insert({
      id: lifeId,
      ai_name: life.aiName,
      company_name: life.companyName,
      personality: life.personality,
      started_at: life.startedAt,
      status: life.status,
      summary: life.summary ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[SupabaseStateRepository] createLife error:', error);
      throw error;
    }
  }

  async updateLifeStatus(
    lifeId: string,
    status: 'SONG' | 'PHA_SAN',
    summary?: LifeData['summary']
  ): Promise<void> {
    // Kiểu tường minh theo đúng các cột sẽ ghi, thay vì Record<string, any>:
    // một khoá gõ sai tên sẽ lộ ra ngay ở đây thay vì âm thầm thành cột mới.
    const updatePayload: {
      status: 'SONG' | 'PHA_SAN';
      updated_at: string;
      summary?: LifeData['summary'];
    } = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (summary !== undefined) {
      updatePayload.summary = summary;
    }

    const { error } = await this.client
      .from('lives')
      .update(updatePayload)
      .eq('id', lifeId);

    if (error) {
      console.error('[SupabaseStateRepository] updateLifeStatus error:', error);
      throw error;
    }
  }

  async getPastLives(): Promise<LifeData[]> {
    const { data, error } = await this.client
      .from('lives')
      .select('*')
      .eq('status', 'PHA_SAN')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseStateRepository] getPastLives error:', error);
      throw error;
    }

    return (data || []).map((row: DbLifeRow) => ({
      id: row.id,
      aiName: row.ai_name,
      companyName: row.company_name,
      personality: row.personality,
      startedAt: row.started_at,
      status: row.status,
      summary: row.summary ?? undefined,
    }));
  }
}
