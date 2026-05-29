/**
 * CSV exporters (M5b).
 *
 * Three flat CSV exports, joining the raw scenario data (which has the
 * descriptive fields: name, role, service, vendor) with the engine totals
 * (which has the computed amounts: hours, billed, cost).
 *
 * No dependencies. RFC-4180-compliant escaping: any field containing
 * comma, quote, or newline is wrapped in double quotes and inner quotes
 * doubled. UTF-8 BOM prepended on the Blob so Excel opens UTF-8 cleanly.
 */

import type { ScenarioTotals } from '@/engine/types';
import type { Scenario } from '@/types/scenario';
import type { Project } from '@/types/project';

function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(csvField).join(',');
}

// -----------------------------------------------------------------
// Resources
// -----------------------------------------------------------------

export function resourcesToCsv(scenario: Scenario, totals: ScenarioTotals): string {
  const header = [
    'id',
    'name',
    'role',
    'skillLevel',
    'geography',
    'defaultAllocationPct',
    'hoursPerWeek',
    'utilizationPct',
    'currency',
    'billRate',
    'internalCostRate',
    'totalHours',
    'internalCost',
    'billedAmount',
    'marginAmount',
    'marginPct',
  ];

  // Build a lookup from totals
  const totalsById = new Map(totals.resources.map((t) => [t.resourceId, t]));

  const rows = scenario.resources.map((r) => {
    const t = totalsById.get(r.id);
    return csvRow([
      r.id,
      r.name ?? '',
      r.role,
      r.skillLevel,
      r.geography,
      r.defaultAllocationPct,
      r.hoursPerWeek,
      r.utilizationPct,
      r.billRate.currency,
      r.billRate.amount,
      r.internalCostRate.amount,
      t?.totalHours ?? 0,
      t?.internalCost.amount ?? 0,
      t?.billedAmount.amount ?? 0,
      t?.marginAmount.amount ?? 0,
      t?.marginPct ?? 0,
    ]);
  });
  return [csvRow(header), ...rows].join('\n');
}

// -----------------------------------------------------------------
// Cloud line items
// -----------------------------------------------------------------

export function cloudToCsv(scenario: Scenario, totals: ScenarioTotals): string {
  const header = [
    'id',
    'service',
    'sku',
    'provider',
    'region',
    'category',
    'environment',
    'environmentMultiplier',
    'pricingModel',
    'currency',
    'unitCost',
    'quantity',
    'unitName',
    'monthlyAtSteadyState',
    'projectDurationCost',
    'runRateMonthly',
  ];

  const totalsById = new Map(totals.cloudLineItems.map((t) => [t.lineItemId, t]));

  const rows = scenario.cloudLineItems.map((c) => {
    const t = totalsById.get(c.id);
    return csvRow([
      c.id,
      c.service,
      c.sku ?? '',
      c.provider,
      c.region,
      c.category,
      c.environment,
      c.environmentMultiplier,
      c.pricingModel,
      c.unitCost.currency,
      c.unitCost.amount,
      c.quantity,
      c.unitName,
      t?.monthlyAtSteadyState.amount ?? 0,
      t?.projectDurationCost.amount ?? 0,
      t?.runRateMonthly.amount ?? 0,
    ]);
  });
  return [csvRow(header), ...rows].join('\n');
}

// -----------------------------------------------------------------
// Other cost line items
// -----------------------------------------------------------------

export function otherCostsToCsv(scenario: Scenario, totals: ScenarioTotals): string {
  const header = [
    'id',
    'name',
    'category',
    'vendor',
    'description',
    'currency',
    'unitCost',
    'quantity',
    'pricingUnit',
    'userCount',
    'phaseId',
    'includeInRunRate',
    'totalCost',
    'runRateMonthly',
  ];

  const totalsById = new Map(totals.otherCostLineItems.map((t) => [t.lineItemId, t]));

  const rows = scenario.otherCostLineItems.map((o) => {
    const t = totalsById.get(o.id);
    return csvRow([
      o.id,
      o.name,
      o.category,
      o.vendor ?? '',
      o.description ?? '',
      o.unitCost.currency,
      o.unitCost.amount,
      o.quantity,
      o.pricingUnit,
      o.userCount ?? '',
      o.phaseId ?? '',
      o.includeInRunRate,
      t?.totalCost.amount ?? 0,
      t?.runRateMonthly.amount ?? 0,
    ]);
  });
  return [csvRow(header), ...rows].join('\n');
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

export function csvBlob(text: string): Blob {
  // Prepend UTF-8 BOM so Excel opens UTF-8 CSVs correctly.
  return new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
}

export function csvFilename(
  project: Project,
  scenarioName: string,
  kind: 'resources' | 'cloud' | 'other-costs',
): string {
  const safeProject = project.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 30);
  const safeScenario = scenarioName.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 30);
  const date = new Date().toISOString().slice(0, 10);
  return `${safeProject}__${safeScenario}__${kind}_${date}.csv`;
}
