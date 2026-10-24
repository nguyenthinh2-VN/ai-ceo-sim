// ============================================================
// db/index.ts — Repository Factory
// Selects SupabaseStateRepository if env credentials exist,
// otherwise falls back to MockStateRepository without crashing.
// ============================================================

import { StateRepository } from '../types';
import { SupabaseStateRepository } from './supabase-state-repository';
import { getMockStateRepository } from './mock-state-repository';

let cachedRepo: StateRepository | null = null;
let hasWarnedMock = false;

export function getStateRepository(): StateRepository {
  if (cachedRepo) {
    return cachedRepo;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    cachedRepo = new SupabaseStateRepository(supabaseUrl, serviceRoleKey);
    return cachedRepo;
  }

  if (!hasWarnedMock) {
    console.warn(
      '⚠️ [StateRepository] Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) not found. Falling back to In-Memory Mock Repository for local development.'
    );
    hasWarnedMock = true;
  }

  cachedRepo = getMockStateRepository();
  return cachedRepo;
}
