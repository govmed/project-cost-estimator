/**
 * API-backed rate card lookup.
 *
 * In OIDC mode, when a resource is added the SPA can look up the bill rate
 * and internal cost rate from the active rate card stored in the backend.
 *
 * Falls back gracefully to the static seed rate card in standalone mode or
 * when the API lookup fails.
 */

import { API_BASE_URL, AUTH_MODE } from '@/auth/oidc-config';
import type { Geography, SkillLevel } from '@/types/resource';
import type { Money } from '@/types/money';

export interface ApiRateCardSummary {
  id: string;
  name: string;
  version: string;
  effective_date: string;
  is_illustrative: boolean;
  is_active: boolean;
  entry_count: number;
}

export interface ApiRateLookupResult {
  found: boolean;
  role: string;
  skillLevel: string;
  geography: string;
  billRate?: { amount: number; currency: string };
  internalCostRate?: { amount: number; currency: string };
  rateCardId?: string;
  rateCardName?: string;
}

function getToken(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__sowCalcToken ?? null;
}

async function apiFetch<T>(path: string): Promise<T | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

/** List all active rate cards for the org. */
export async function listRateCards(): Promise<ApiRateCardSummary[]> {
  if (AUTH_MODE !== 'oidc') return [];
  return await apiFetch<ApiRateCardSummary[]>('/rate-cards?active_only=true') ?? [];
}

/** Look up a specific rate card entry by role × skillLevel × geography. */
export async function lookupRate(
  cardId: string,
  role: string,
  skillLevel: SkillLevel,
  geography: Geography,
): Promise<ApiRateLookupResult | null> {
  if (AUTH_MODE !== 'oidc') return null;
  const params = new URLSearchParams({ role, skillLevel, geography });
  return apiFetch<ApiRateLookupResult>(`/rate-cards/${cardId}/lookup?${params}`);
}

/** Find the first active rate card and look up a rate, returning Money values. */
export async function resolveRate(
  role: string,
  skillLevel: SkillLevel,
  geography: Geography,
): Promise<{ billRate: Money; internalCostRate: Money; source: string } | null> {
  const cards = await listRateCards();
  if (cards.length === 0) return null;

  // Prefer the most recently effective non-illustrative card.
  const sorted = [...cards]
    .filter((c) => !c.is_illustrative)
    .sort((a, b) => b.effective_date.localeCompare(a.effective_date));

  const activeCard = sorted[0] ?? cards[0];
  const result = await lookupRate(activeCard.id, role, skillLevel, geography);

  if (!result?.found || !result.billRate || !result.internalCostRate) return null;

  return {
    billRate: {
      amount: result.billRate.amount,
      currency: result.billRate.currency as Money['currency'],
    },
    internalCostRate: {
      amount: result.internalCostRate.amount,
      currency: result.internalCostRate.currency as Money['currency'],
    },
    source: result.rateCardName ?? activeCard.name,
  };
}
