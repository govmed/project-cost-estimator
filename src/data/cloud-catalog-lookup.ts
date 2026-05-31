/**
 * Cloud catalog lookup.
 *
 * B5.c: In OIDC mode, tries the API backend first (live Azure pricing).
 * Falls back to the bundled seed JSON files in standalone mode or on error.
 */

import type { CloudProvider, CloudCategory, PricingModel, Environment } from '@/types/cloud';
import type { Money, CurrencyCode } from '@/types/money';
import { getCatalogFromApi } from './api-cloud-catalog';

export interface CatalogEntry {
  category: CloudCategory;
  service: string;
  sku?: string;
  pricingModel: PricingModel;
  unitCost: number;
  unitName: string;
  notes?: string;
}

export interface ProviderCatalog {
  provider: CloudProvider;
  region: string;
  regionDisplayName?: string;
  currency: CurrencyCode;
  effectiveDate: string;
  isIllustrative: boolean;
  environmentMultiplierDefaults: Record<Environment, number>;
  entries: CatalogEntry[];
}

const cached: Partial<Record<CloudProvider, ProviderCatalog>> = {};
const loading: Partial<Record<CloudProvider, Promise<ProviderCatalog>>> = {};

async function load(provider: CloudProvider): Promise<ProviderCatalog> {
  if (cached[provider]) return cached[provider]!;
  if (loading[provider]) return loading[provider]!;

  // B5.c: try live API first (OIDC mode); fall through to seed on failure.
  const apiCatalog = await getCatalogFromApi(provider);
  if (apiCatalog) {
    cached[provider] = apiCatalog;
    return apiCatalog;
  }

  let promise: Promise<ProviderCatalog>;
  if (provider === 'aws') {
    promise = import('@/../seed/cloud-pricing/aws-us-east-1.json').then(
      (mod) => mod.default as unknown as ProviderCatalog,
    );
  } else if (provider === 'azure') {
    promise = import('@/../seed/cloud-pricing/azure-eastus.json').then(
      (mod) => mod.default as unknown as ProviderCatalog,
    );
  } else {
    // GCP / Other don't have catalogs in Phase 1; return an empty one.
    promise = Promise.resolve({
      provider,
      region: '',
      currency: 'USD',
      effectiveDate: '',
      isIllustrative: true,
      environmentMultiplierDefaults: {
        dev: 0.3,
        test: 0.4,
        staging: 0.6,
        prod: 1.0,
        dr: 0.45,
      },
      entries: [],
    });
  }

  loading[provider] = promise;
  const catalog = await promise;
  cached[provider] = catalog;
  delete loading[provider];
  return catalog;
}

/** Available providers for the Add Cloud picker. */
export const CATALOG_PROVIDERS: CloudProvider[] = ['aws', 'azure'];

export async function getCatalog(provider: CloudProvider): Promise<ProviderCatalog> {
  return load(provider);
}

export async function getCategoriesFor(provider: CloudProvider): Promise<CloudCategory[]> {
  const catalog = await load(provider);
  const set = new Set<CloudCategory>();
  for (const e of catalog.entries) set.add(e.category);
  // Stable order
  const order: CloudCategory[] = [
    'Compute',
    'Storage',
    'Database',
    'Networking',
    'Security',
    'Integration',
    'Observability',
    'AI/ML',
    'Backup/DR',
    'Other',
  ];
  return order.filter((c) => set.has(c));
}

export async function getEntriesFor(
  provider: CloudProvider,
  category?: CloudCategory,
): Promise<CatalogEntry[]> {
  const catalog = await load(provider);
  if (!category) return catalog.entries;
  return catalog.entries.filter((e) => e.category === category);
}

export async function getEnvDefaults(
  provider: CloudProvider,
): Promise<Record<Environment, number>> {
  const catalog = await load(provider);
  return catalog.environmentMultiplierDefaults;
}

export async function getRegionFor(provider: CloudProvider): Promise<string> {
  const catalog = await load(provider);
  return catalog.region;
}

export function asMoney(amount: number, currency: CurrencyCode): Money {
  return { amount, currency };
}
