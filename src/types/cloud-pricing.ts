/**
 * CloudPricingCatalog - the seed-data shape for AWS / Azure / etc. pricing
 * tables shipped in `seed/cloud-pricing/`.
 *
 * Separate from `CloudLineItem` (which is the per-scenario line item the
 * user builds). The catalog is what the Cloud Planner's "Add from {provider}
 * catalog" picker reads from. When the user picks an entry, the planner
 * pre-fills a new CloudLineItem with the catalog entry's data.
 *
 * The catalog is also the seam where, in Phase 2, the live AWS Pricing API
 * and Azure Retail Prices API will plug in - they produce the same shape
 * via an adapter.
 */

import { CurrencyCode } from './money';
import { CloudProvider, CloudCategory, PricingModel, Environment } from './cloud';

export interface CloudPricingCatalogEntry {
  category: CloudCategory;
  service: string;
  /** Specific SKU / instance type, when relevant. */
  sku?: string;
  pricingModel: PricingModel;
  unitCost: number;
  unitName: string;
  notes?: string;
}

export interface CloudPricingCatalog {
  provider: CloudProvider;
  region: string;
  regionDisplayName?: string;
  currency: CurrencyCode;
  effectiveDate: string;          // ISO date
  version: string;
  isIllustrative: boolean;
  environmentMultiplierDefaults: Record<Environment, number>;
  /** Reference info only, NOT applied by the engine. */
  reservedDiscountReference?: Record<string, number>;
  entries: CloudPricingCatalogEntry[];
}
