/**
 * Burn curve and headcount curve assembly.
 *
 * Resources distribute their cost across the phases they're allocated to.
 * For each phase, a resource's cost in that phase is spread evenly across
 * the months that phase spans.
 */

import { Resource } from '../../types/resource';
import { Phase } from '../../types/project';
import { Money, money } from '../../types/money';
import { FxContext } from '../fx';
import { phaseAtMonth, phaseMonthRanges } from '../time';
import {
  BurnCurveMonth,
  HeadcountMonth,
  ResourceTotals,
  CloudLineItemTotals,
  OtherCostLineItemTotals,
} from '../types';
import { allocationForPhase } from './resource';

/**
 * Build the monthly burn curve from the per-line-item totals.
 *
 * Each resource's per-phase cost is distributed evenly across the months
 * of that phase. Cloud and other costs already provide monthly arrays.
 */
export function buildBurnCurve(
  resources: Resource[],
  resourceTotals: ResourceTotals[],
  cloudTotals: CloudLineItemTotals[],
  otherCostTotals: OtherCostLineItemTotals[],
  phases: Phase[],
  totalProjectMonths: number,
  fx: FxContext,
): BurnCurveMonth[] {
  const ranges = phaseMonthRanges(phases);

  // Initialize buckets.
  const resourceByMonth = new Array(totalProjectMonths).fill(0);
  const cloudByMonth = new Array(totalProjectMonths).fill(0);
  const otherByMonth = new Array(totalProjectMonths).fill(0);

  // --- Resources: spread each per-phase cost across that phase's months.
  for (const rt of resourceTotals) {
    for (const pp of rt.perPhase) {
      const range = ranges.get(pp.phaseId);
      if (!range) continue;
      const [startM, endM] = range;
      const phaseMonths = Math.max(endM - startM, 1);
      const perMonth = pp.internalCost.amount / phaseMonths;
      for (let m = startM; m < endM && m < totalProjectMonths; m++) {
        resourceByMonth[m] += perMonth;
      }
    }
  }

  // --- Cloud: already monthly.
  for (const ct of cloudTotals) {
    for (let m = 0; m < ct.monthlyBurn.length && m < totalProjectMonths; m++) {
      cloudByMonth[m] += ct.monthlyBurn[m].amount;
    }
  }

  // --- Other costs: already monthly.
  for (const ot of otherCostTotals) {
    for (let m = 0; m < ot.monthlyBurn.length && m < totalProjectMonths; m++) {
      otherByMonth[m] += ot.monthlyBurn[m].amount;
    }
  }

  // Assemble the curve.
  const curve: BurnCurveMonth[] = [];
  let cumulative = 0;
  for (let m = 0; m < totalProjectMonths; m++) {
    const total = resourceByMonth[m] + cloudByMonth[m] + otherByMonth[m];
    cumulative += total;
    curve.push({
      monthIndex: m,
      phaseId: phaseAtMonth(phases, m),
      resourceCost: money(resourceByMonth[m], fx.baseCurrency),
      cloudCost: money(cloudByMonth[m], fx.baseCurrency),
      otherCost: money(otherByMonth[m], fx.baseCurrency),
      totalCost: money(total, fx.baseCurrency),
      cumulativeCost: money(cumulative, fx.baseCurrency),
    });
  }

  return curve;
}

/**
 * Headcount curve: total FTE per month.
 * FTE = allocationPct / 100 (so 100% = 1 FTE, 400% = 4 FTE).
 */
export function buildHeadcountCurve(
  resources: Resource[],
  phases: Phase[],
  totalProjectMonths: number,
): HeadcountMonth[] {
  const out: HeadcountMonth[] = [];
  for (let m = 0; m < totalProjectMonths; m++) {
    const phaseId = phaseAtMonth(phases, m);
    let totalFTE = 0;
    const byGeo: Record<string, number> = {};

    if (phaseId) {
      for (const r of resources) {
        const allocPct = allocationForPhase(r, phaseId);
        const fte = (allocPct / 100) * (r.utilizationPct / 100);
        totalFTE += fte;
        byGeo[r.geography] = (byGeo[r.geography] ?? 0) + fte;
      }
    }

    out.push({
      monthIndex: m,
      totalFTE,
      byGeography: byGeo,
    });
  }
  return out;
}
