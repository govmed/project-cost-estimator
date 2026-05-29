/**
 * Rate card lookup with lazy loading.
 *
 * The full rate card JSON is ~540KB (1,953 entries). It's only needed when
 * the user opens the Add Resource modal, so we lazy-load via dynamic import.
 * That keeps the initial bundle small.
 *
 * loadRateCard() returns a promise; the modal awaits it before populating
 * the dropdowns. Subsequent calls reuse the cached module.
 *
 * Phase 2 will replace this with a backend fetch through the Storage seam.
 */

import type { Role, SkillLevel, Geography } from '@/types/resource';
import type { Money } from '@/types/money';
import type { RateCardEntry } from '@/types/rate-card';

interface RateCardShape {
  entries: RateCardEntry[];
}

let cached: RateCardShape | null = null;
let loading: Promise<RateCardShape> | null = null;

async function ensureLoaded(): Promise<RateCardShape> {
  if (cached) return cached;
  if (loading) return loading;
  loading = import('@/../seed/rate-cards/standard-2026-q1.json').then((mod) => {
    cached = mod.default as unknown as RateCardShape;
    loading = null;
    return cached;
  });
  return loading;
}

export interface RateCardMatch {
  billRate: Money;
  internalCostRate: Money;
}

export async function lookupRate(
  role: Role,
  level: SkillLevel,
  geography: Geography,
): Promise<RateCardMatch | null> {
  const card = await ensureLoaded();
  const entry = card.entries.find(
    (e) => e.role === role && e.skillLevel === level && e.geography === geography,
  );
  if (!entry) return null;
  return {
    billRate: entry.billRate,
    internalCostRate: entry.internalCostRate,
  };
}

export async function allRoles(): Promise<Role[]> {
  const card = await ensureLoaded();
  const set = new Set<Role>();
  for (const e of card.entries) set.add(e.role);
  return Array.from(set).sort();
}

export async function levelsForRole(role: Role): Promise<SkillLevel[]> {
  const card = await ensureLoaded();
  const set = new Set<SkillLevel>();
  for (const e of card.entries) {
    if (e.role === role) set.add(e.skillLevel);
  }
  const order: SkillLevel[] = ['Associate', 'Professional', 'Senior', 'Advisor', 'Principal'];
  return order.filter((l) => set.has(l));
}

export async function geographiesForRoleLevel(
  role: Role,
  level: SkillLevel,
): Promise<Geography[]> {
  const card = await ensureLoaded();
  const set = new Set<Geography>();
  for (const e of card.entries) {
    if (e.role === role && e.skillLevel === level) set.add(e.geography);
  }
  return Array.from(set).sort();
}
