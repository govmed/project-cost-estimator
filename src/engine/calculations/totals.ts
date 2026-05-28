/**
 * Scenario totals roll-up.
 *
 * Math (gross-margin / margin-on-price convention):
 *
 *   baseCost      = resourcesSubtotal + cloudSubtotal + otherCostsSubtotal
 *   contingency   = baseCost x contingencyPct / 100
 *   mgmtReserve   = baseCost x managementReservePct / 100
 *   totalCost     = baseCost + contingency + mgmtReserve
 *
 *   targetPrice   = totalCost / (1 - targetMarginPct/100)
 *   finalPrice    = targetPrice x (1 - discountPct/100)
 *
 *   realizedMargin    = finalPrice - totalCost
 *   realizedMarginPct = realizedMargin / finalPrice x 100
 *
 *   effectiveBlendedRate = finalPriceForResources / totalBillableHours
 *
 * NOTE: realized margin can be NEGATIVE if the discount is large enough.
 * The engine reports this honestly — that's the whole point.
 */

import { Project } from '../../types/project';
import { Scenario, ScenarioOverrides } from '../../types/scenario';
import { Money, money } from '../../types/money';
import { FxContext } from '../fx';
import { phaseAtMonth } from '../time';
import {
  ResourceTotals,
  CloudLineItemTotals,
  OtherCostLineItemTotals,
  PhaseTotals,
  HeadcountMonth,
} from '../types';

/**
 * Resolve a scenario's effective overrides against the project's defaults.
 */
export function resolveOverrides(project: Project, scenario: Scenario) {
  const o: ScenarioOverrides = scenario.overrides ?? {};
  return {
    targetMarginPct: o.targetMarginPct ?? project.targetMarginPct,
    discountPct: o.discountPct ?? project.discountPct,
    contingencyPct: o.contingencyPct ?? project.contingencyPct,
    managementReservePct: o.managementReservePct ?? project.managementReservePct,
  };
}

/** Sum of internal costs from resource totals (already in base). */
export function sumResourceCost(rts: ResourceTotals[], fx: FxContext): Money {
  let total = 0;
  for (const r of rts) total += r.internalCost.amount;
  return money(total, fx.baseCurrency);
}

/** Sum of billed amounts from resource totals (already in base). */
export function sumResourceBilled(rts: ResourceTotals[], fx: FxContext): Money {
  let total = 0;
  for (const r of rts) total += r.billedAmount.amount;
  return money(total, fx.baseCurrency);
}

export function sumCloudCost(cts: CloudLineItemTotals[], fx: FxContext): Money {
  let total = 0;
  for (const c of cts) total += c.projectDurationCost.amount;
  return money(total, fx.baseCurrency);
}

export function sumOtherCost(ots: OtherCostLineItemTotals[], fx: FxContext): Money {
  let total = 0;
  for (const o of ots) total += o.totalCost.amount;
  return money(total, fx.baseCurrency);
}

/** Total billable hours across all resources. */
export function sumBillableHours(rts: ResourceTotals[]): number {
  let total = 0;
  for (const r of rts) total += r.totalHours;
  return total;
}

/**
 * Run-rate monthly cost (sum of items that flagged includeInRunRate=true).
 */
export function sumRunRateMonthly(
  cloudTotals: CloudLineItemTotals[],
  otherTotals: OtherCostLineItemTotals[],
  fx: FxContext,
): Money {
  let total = 0;
  for (const c of cloudTotals) total += c.runRateMonthly.amount;
  for (const o of otherTotals) total += o.runRateMonthly.amount;
  return money(total, fx.baseCurrency);
}

/**
 * Apply pricing math: contingency, margin, discount.
 */
export function applyPricing(
  baseCost: Money,
  contingencyPct: number,
  managementReservePct: number,
  targetMarginPct: number,
  discountPct: number,
  fx: FxContext,
) {
  const base = baseCost.amount;
  const contingencyAmount = base * (contingencyPct / 100);
  const managementReserveAmount = base * (managementReservePct / 100);
  const totalCost = base + contingencyAmount + managementReserveAmount;

  const marginDivisor = 1 - targetMarginPct / 100;
  const targetPrice = marginDivisor > 0 ? totalCost / marginDivisor : totalCost;
  const finalPrice = targetPrice * (1 - discountPct / 100);
  const realizedMargin = finalPrice - totalCost;
  const realizedMarginPct = finalPrice > 0 ? (realizedMargin / finalPrice) * 100 : 0;

  return {
    contingencyAmount: money(contingencyAmount, fx.baseCurrency),
    managementReserveAmount: money(managementReserveAmount, fx.baseCurrency),
    totalCost: money(totalCost, fx.baseCurrency),
    targetPrice: money(targetPrice, fx.baseCurrency),
    finalPrice: money(finalPrice, fx.baseCurrency),
    realizedMargin: money(realizedMargin, fx.baseCurrency),
    realizedMarginPct,
  };
}

/**
 * Per-phase roll-up: cost by category, average FTE.
 *
 * Uses phaseAtMonth to deterministically assign each project month to exactly
 * one phase (via month midpoint), so cloud + other-cost burns don't get
 * double-counted at phase boundaries.
 */
export function rollUpByPhase(
  project: Project,
  resourceTotals: ResourceTotals[],
  cloudTotals: CloudLineItemTotals[],
  otherCostTotals: OtherCostLineItemTotals[],
  headcountCurve: HeadcountMonth[],
  fx: FxContext,
): PhaseTotals[] {
  const out: PhaseTotals[] = [];

  // For each month, determine which phase owns it (one and only one).
  const monthToPhase: Array<import('../../types/ids').PhaseId | null> = [];
  const totalMonths = Math.max(
    ...cloudTotals.map(c => c.monthlyBurn.length),
    ...otherCostTotals.map(o => o.monthlyBurn.length),
    headcountCurve.length,
    0,
  );
  for (let m = 0; m < totalMonths; m++) {
    monthToPhase.push(phaseAtMonth(project.phases, m));
  }

  for (const phase of project.phases) {
    // Resource cost in this phase: already broken out per phase in totals.
    let rCost = 0;
    for (const rt of resourceTotals) {
      const pp = rt.perPhase.find(p => p.phaseId === phase.id);
      if (pp) rCost += pp.internalCost.amount;
    }

    // Cloud + other cost: sum the months whose assigned phase is this one.
    let cCost = 0;
    let oCost = 0;
    let fteSum = 0;
    let fteCount = 0;
    for (let m = 0; m < totalMonths; m++) {
      if (monthToPhase[m] !== phase.id) continue;
      for (const ct of cloudTotals) {
        if (m < ct.monthlyBurn.length) cCost += ct.monthlyBurn[m].amount;
      }
      for (const ot of otherCostTotals) {
        if (m < ot.monthlyBurn.length) oCost += ot.monthlyBurn[m].amount;
      }
      if (m < headcountCurve.length) {
        fteSum += headcountCurve[m].totalFTE;
        fteCount++;
      }
    }
    const fteAvg = fteCount > 0 ? fteSum / fteCount : 0;

    out.push({
      phaseId: phase.id,
      phaseName: phase.name,
      durationWeeks: phase.durationWeeks,
      resourceCost: money(rCost, fx.baseCurrency),
      cloudCost: money(cCost, fx.baseCurrency),
      otherCost: money(oCost, fx.baseCurrency),
      totalCost: money(rCost + cCost + oCost, fx.baseCurrency),
      fteAverage: fteAvg,
    });
  }

  return out;
}

/** Cost by resource geography (in base currency). */
export function rollUpByGeography(
  resources: import('../../types/resource').Resource[],
  resourceTotals: ResourceTotals[],
  fx: FxContext,
): Record<string, Money> {
  const out: Record<string, number> = {};
  for (const r of resources) {
    const rt = resourceTotals.find(t => t.resourceId === r.id);
    if (!rt) continue;
    out[r.geography] = (out[r.geography] ?? 0) + rt.internalCost.amount;
  }
  const result: Record<string, Money> = {};
  for (const [geo, amt] of Object.entries(out)) {
    result[geo] = money(amt, fx.baseCurrency);
  }
  return result;
}

/** Cost by cloud provider. */
export function rollUpByCloudProvider(
  cloudItems: import('../../types/cloud').CloudLineItem[],
  cloudTotals: CloudLineItemTotals[],
  fx: FxContext,
): Record<string, Money> {
  const out: Record<string, number> = {};
  for (const item of cloudItems) {
    const ct = cloudTotals.find(t => t.lineItemId === item.id);
    if (!ct) continue;
    out[item.provider] = (out[item.provider] ?? 0) + ct.projectDurationCost.amount;
  }
  const result: Record<string, Money> = {};
  for (const [p, amt] of Object.entries(out)) {
    result[p] = money(amt, fx.baseCurrency);
  }
  return result;
}

/** Cost by cloud category. */
export function rollUpByCloudCategory(
  cloudItems: import('../../types/cloud').CloudLineItem[],
  cloudTotals: CloudLineItemTotals[],
  fx: FxContext,
): Record<string, Money> {
  const out: Record<string, number> = {};
  for (const item of cloudItems) {
    const ct = cloudTotals.find(t => t.lineItemId === item.id);
    if (!ct) continue;
    out[item.category] = (out[item.category] ?? 0) + ct.projectDurationCost.amount;
  }
  const result: Record<string, Money> = {};
  for (const [c, amt] of Object.entries(out)) {
    result[c] = money(amt, fx.baseCurrency);
  }
  return result;
}
