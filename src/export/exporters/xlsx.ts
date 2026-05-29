/**
 * XLSX exporter (M5b).
 *
 * Builds a multi-sheet workbook with everything a finance / PMO person
 * needs to validate the estimate:
 *
 *   1. Summary       - headline KPIs (project name, scenario, $$ totals, hours, margin)
 *   2. Resources     - one row per resource with rate-card + computed totals
 *   3. Cloud         - one row per cloud line item with unit cost + computed totals
 *   4. Other Costs   - one row per other-cost line item with computed totals
 *   5. By Phase      - one row per phase with resource/cloud/other/total breakdown
 *   6. Assumptions   - one row per assumption (current scenario)
 *   7. Audit Log     - reverse-chrono log of every change (full project history)
 *
 * Uses `@e965/xlsx` (the maintained SheetJS fork; the public `xlsx`
 * package on npm is stale at 0.18.5 from 2022). API mirrors SheetJS.
 *
 * This module dynamic-imports xlsx so the heavy dep only loads when the
 * user clicks Export. The XLSX library is ~400KB raw / ~115KB gzipped.
 */

import type { ScenarioTotals } from '@/engine/types';
import type { Scenario } from '@/types/scenario';
import type { Project } from '@/types/project';
import type { AuditEntry } from '@/data/audit-log';
import { labelForAuditAction } from '@/ui/components/audit/AuditActionLabel';

export interface XlsxExportInput {
  project: Project;
  scenario: Scenario;
  totals: ScenarioTotals;
  audit: AuditEntry[];
  scenariosForAuditNames: Scenario[];
}

/**
 * Build an XLSX workbook as a Uint8Array. Returns the bytes; the caller
 * is responsible for wrapping in a Blob and triggering a download.
 *
 * Dynamic import keeps the xlsx dep out of the main bundle.
 */
export async function buildXlsxExport(input: XlsxExportInput): Promise<Uint8Array> {
  const XLSX = await import('@e965/xlsx');
  const wb = XLSX.utils.book_new();

  // Build each sheet from rows of plain values.
  XLSX.utils.book_append_sheet(wb, summarySheet(XLSX, input), 'Summary');
  XLSX.utils.book_append_sheet(wb, resourcesSheet(XLSX, input), 'Resources');
  XLSX.utils.book_append_sheet(wb, cloudSheet(XLSX, input), 'Cloud');
  XLSX.utils.book_append_sheet(wb, otherCostsSheet(XLSX, input), 'Other Costs');
  XLSX.utils.book_append_sheet(wb, byPhaseSheet(XLSX, input), 'By Phase');
  XLSX.utils.book_append_sheet(wb, assumptionsSheet(XLSX, input), 'Assumptions');
  XLSX.utils.book_append_sheet(wb, auditSheet(XLSX, input), 'Audit Log');

  // `type: 'array'` returns an ArrayBuffer; wrap in Uint8Array for portability.
  const ab = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(ab);
}

// -----------------------------------------------------------------
// Sheet builders
// -----------------------------------------------------------------

type XlsxLib = typeof import('@e965/xlsx');

function summarySheet(XLSX: XlsxLib, { project, scenario, totals }: XlsxExportInput) {
  const data: (string | number)[][] = [
    ['SOW Cost Calculator Export'],
    [`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`],
    [],
    ['Project', project.name],
    ['Client', project.client],
    ['Status', project.status],
    ['Base currency', project.baseCurrency],
    ['Engagement type', project.engagementType],
    ['Engagement context', project.engagementContext],
    [],
    ['Active scenario', scenario.name],
    ['Is base scenario', String(scenario.isBase)],
    [],
    ['HEADLINE KPIs'],
    ['Final price', totals.finalPrice.amount],
    ['Total cost', totals.totalCost.amount],
    ['Target price', totals.targetPrice.amount],
    ['Realized margin', totals.realizedMargin.amount],
    ['Realized margin %', round(totals.realizedMarginPct, 2)],
    ['Total billable hours', round(totals.totalBillableHours, 1)],
    ['Effective blended rate', round(totals.effectiveBlendedRate.amount, 2)],
    [],
    ['SUBTOTALS'],
    ['Resources', totals.resourcesSubtotal.amount],
    ['Cloud', totals.cloudSubtotal.amount],
    ['Other costs', totals.otherCostsSubtotal.amount],
    ['Base cost', totals.baseCost.amount],
    ['Contingency', totals.contingencyAmount.amount],
    ['Management reserve', totals.managementReserveAmount.amount],
    [],
    ['RUN-RATE (after go-live)'],
    ['Monthly', totals.runRateMonthly.amount],
    ['Year 1', totals.runRateYear1.amount],
    ['Year 2', totals.runRateYear2.amount],
    ['Year 3', totals.runRateYear3.amount],
  ];
  if (totals.maOverlay) {
    data.push([]);
    data.push(['M&A OVERLAY (preview only — not in finalPrice)']);
    data.push(['Mode', totals.maOverlay.mode]);
    data.push(['One-time cost', totals.maOverlay.oneTimeCost.amount]);
    data.push(['Recurring cost', totals.maOverlay.recurringCost.amount]);
    data.push(['Realized synergy', totals.maOverlay.realizedSynergy.amount]);
    data.push(['Net impact', totals.maOverlay.netImpact.amount]);
    data.push(['Timeline months', totals.maOverlay.timelineMonths]);
    if (totals.maOverlay.breakevenMonthIndex !== null) {
      data.push(['Breakeven month', totals.maOverlay.breakevenMonthIndex + 1]);
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Widen the first column so labels are readable
  (ws as any)['!cols'] = [{ wch: 32 }, { wch: 28 }];
  return ws;
}

function resourcesSheet(XLSX: XlsxLib, { scenario, totals }: XlsxExportInput) {
  const header = [
    'ID', 'Name', 'Role', 'Skill', 'Geography',
    'Default Alloc %', 'Hrs/Week', 'Utilization %',
    'Currency', 'Bill Rate', 'Cost Rate',
    'Total Hours', 'Internal Cost', 'Billed', 'Margin $', 'Margin %',
  ];
  const totalsById = new Map(totals.resources.map((t) => [t.resourceId, t]));
  const rows = scenario.resources.map((r) => {
    const t = totalsById.get(r.id);
    return [
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
      round(t?.totalHours ?? 0, 1),
      round(t?.internalCost.amount ?? 0, 2),
      round(t?.billedAmount.amount ?? 0, 2),
      round(t?.marginAmount.amount ?? 0, 2),
      round(t?.marginPct ?? 0, 2),
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = header.map(() => ({ wch: 14 }));
  return ws;
}

function cloudSheet(XLSX: XlsxLib, { scenario, totals }: XlsxExportInput) {
  const header = [
    'ID', 'Service', 'SKU', 'Provider', 'Region', 'Category',
    'Environment', 'Env Multiplier', 'Pricing Model',
    'Currency', 'Unit Cost', 'Quantity', 'Unit',
    'Monthly @ Steady', 'Project Duration Cost', 'Run-Rate Monthly',
  ];
  const totalsById = new Map(totals.cloudLineItems.map((t) => [t.lineItemId, t]));
  const rows = scenario.cloudLineItems.map((c) => {
    const t = totalsById.get(c.id);
    return [
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
      round(t?.monthlyAtSteadyState.amount ?? 0, 2),
      round(t?.projectDurationCost.amount ?? 0, 2),
      round(t?.runRateMonthly.amount ?? 0, 2),
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = header.map(() => ({ wch: 14 }));
  return ws;
}

function otherCostsSheet(XLSX: XlsxLib, { scenario, totals }: XlsxExportInput) {
  const header = [
    'ID', 'Name', 'Category', 'Vendor', 'Description',
    'Currency', 'Unit Cost', 'Quantity', 'Pricing Unit',
    'User Count', 'Phase ID', 'Include In Run-Rate',
    'Total Cost', 'Run-Rate Monthly',
  ];
  const totalsById = new Map(totals.otherCostLineItems.map((t) => [t.lineItemId, t]));
  const rows = scenario.otherCostLineItems.map((o) => {
    const t = totalsById.get(o.id);
    return [
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
      String(o.includeInRunRate),
      round(t?.totalCost.amount ?? 0, 2),
      round(t?.runRateMonthly.amount ?? 0, 2),
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = header.map(() => ({ wch: 14 }));
  return ws;
}

function byPhaseSheet(XLSX: XlsxLib, { totals }: XlsxExportInput) {
  const header = [
    'Phase', 'Duration (weeks)', 'Resource $', 'Cloud $', 'Other $',
    'Total $', 'Avg FTE',
  ];
  const rows = totals.byPhase.map((p) => [
    p.phaseName,
    p.durationWeeks,
    round(p.resourceCost.amount, 2),
    round(p.cloudCost.amount, 2),
    round(p.otherCost.amount, 2),
    round(p.totalCost.amount, 2),
    round(p.fteAverage, 2),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = header.map(() => ({ wch: 16 }));
  return ws;
}

function assumptionsSheet(XLSX: XlsxLib, { scenario }: XlsxExportInput) {
  const header = [
    'Topic', 'Description', 'Source', 'Risk Level',
    'Linked Entities Count', 'Evidence URL',
    'Created At', 'Reviewed At',
  ];
  const rows = scenario.assumptions.map((a) => [
    a.topic,
    a.description,
    a.source,
    a.riskLevel,
    a.linkedEntities.length,
    a.evidenceUrl ?? '',
    a.createdAt,
    a.lastReviewedAt ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = header.map((_, i) =>
    i === 1 ? { wch: 60 } : { wch: 18 },
  );
  return ws;
}

function auditSheet(XLSX: XlsxLib, { audit, scenariosForAuditNames }: XlsxExportInput) {
  const header = ['Timestamp', 'Scenario', 'Category', 'Headline', 'Summary', 'Kind'];
  const scenarioNamesById = new Map(scenariosForAuditNames.map((s) => [s.id, s.name]));
  const rows = audit
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((e) => {
      const label = labelForAuditAction(e.action);
      return [
        e.timestamp,
        scenarioNamesById.get(e.scenarioId) ?? e.scenarioId,
        label.category,
        label.headline,
        label.summary,
        e.action.kind,
      ];
    });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  (ws as any)['!cols'] = [
    { wch: 22 }, // Timestamp
    { wch: 22 }, // Scenario
    { wch: 12 }, // Category
    { wch: 32 }, // Headline
    { wch: 50 }, // Summary
    { wch: 28 }, // Kind
  ];
  return ws;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function round(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}

export function xlsxBlob(bytes: Uint8Array): Blob {
  // Wrap a copy so we hand the Blob constructor a fresh ArrayBuffer.
  return new Blob([bytes.slice()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function xlsxFilename(project: Project): string {
  const safeName = project.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `${safeName}_${date}.xlsx`;
}
