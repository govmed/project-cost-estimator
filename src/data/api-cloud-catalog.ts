/**
 * API-backed cloud pricing catalog.
 *
 * In OIDC mode (AUTH_MODE=oidc) the SPA fetches catalog data from the
 * cost-estimator-api backend, which proxies Azure live pricing and serves
 * the bundled AWS seed. Falls back to the static seed JSON files on error
 * or in standalone mode.
 *
 * The cache TTL mirrors the backend's 24-hour cache — we don't need to
 * re-fetch on every page load.
 */

import { API_BASE_URL, AUTH_MODE } from '@/auth/oidc-config';
import type { CloudProvider } from '@/types/cloud';
import type { ProviderCatalog } from './cloud-catalog-lookup';

const _apiCache = new Map<string, { fetchedAt: number; catalog: ProviderCatalog }>();
const API_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour client-side (server caches 24h)

function getToken(): string | null {
  // Late-bind to avoid circular import with store.ts
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useProjectStore } = require('@/data/store') as typeof import('@/data/store');
    // Token lives in the OIDC context, not the project store.
    // We read it from the module-level _accessToken exposed by initStorageToken.
    void useProjectStore;
  } catch {
    // ignore
  }
  // Access token is available globally via the OIDC context.
  // We use a WeakRef-style getter exposed at module level in store.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.__sowCalcToken ?? null;
}

export function setGlobalToken(token: string | null): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__sowCalcToken = token;
}

async function fetchCatalogFromApi(provider: CloudProvider): Promise<ProviderCatalog | null> {
  const token = getToken();
  if (!token) return null;

  const region = provider === 'aws' ? 'us-east-1' : 'eastus';
  const url = `${API_BASE_URL}/pricing/${provider}/${region}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json() as ProviderCatalog;
  } catch {
    return null;
  }
}

export async function getCatalogFromApi(provider: CloudProvider): Promise<ProviderCatalog | null> {
  if (AUTH_MODE !== 'oidc') return null;

  const key = provider;
  const cached = _apiCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < API_CACHE_TTL_MS) {
    return cached.catalog;
  }

  const catalog = await fetchCatalogFromApi(provider);
  if (catalog) {
    _apiCache.set(key, { fetchedAt: Date.now(), catalog });
  }
  return catalog;
}
