/**
 * Cloud line item calculations.
 *
 * Each line item has:
 *   unitCost x quantity x environmentMultiplier = STEADY-STATE MONTHLY COST
 *
 * The rampCurve describes what fraction of steady-state is incurred in
 * each project month. Returns 0.0 to 1.0 per month.
 *
 * Total project cost = sum over project months of (steadyState × rampFactor[month])
 *
 * Run-rate cost = if includeInRunRate, steadyState continues after project end.
 */

import { CloudLineItem, RampCurve } from '../../types/cloud';
import { Phase } from '../../types/project';
import { Money, money } from '../../types/money';
import { FxContext, toBase } from '../fx';
import { phaseStartMonth } from '../time';
import { CloudLineItemTotals } from '../types';

/**
 * For a given ramp curve, return the fraction of steady-state cost
 * incurred in month `i` of `n` total project months.
 *
 * Returns a value in [0, 1] (for 'flat' it's always 1).
 */
export function rampFactor(
  curve: RampCurve,
  monthIndex: number,
  totalMonths: number,
  rampStartMonth: number = 0,
): number {
  if (totalMonths <= 0) return 0;

  switch (curve) {
    case 'flat':
      return 1;

    case 'linear': {
      // 0 at month 0, 1 at month (totalMonths - 1).
      if (totalMonths === 1) return 1;
      return monthIndex / (totalMonths - 1);
    }

    case 'sCurve': {
      // Logistic centered at midpoint, scaled to [0, 1].
      const mid = (totalMonths - 1) / 2;
      const k = 8 / Math.max(totalMonths, 1); // steepness
      const raw = 1 / (1 + Math.exp(-k * (monthIndex - mid)));
      // Normalize so month 0 ≈ 0 and month (n-1) ≈ 1.
      const at0 = 1 / (1 + Math.exp(-k * (0 - mid)));
      const atEnd = 1 / (1 + Math.exp(-k * (totalMonths - 1 - mid)));
      return (raw - at0) / Math.max(atEnd - at0, 1e-9);
    }

    case 'step': {
      return monthIndex >= rampStartMonth ? 1 : 0;
    }

    case 'frontLoaded': {
      // Full at start, declining linearly to ~0 at end.
      if (totalMonths === 1) return 1;
      return 1 - (monthIndex / (totalMonths - 1));
    }

    case 'backLoaded': {
      // Stays low, ramps in the last third.
      const knee = Math.floor(totalMonths * 2 / 3);
      if (monthIndex < knee) return 0.1;
      const tailLen = Math.max(totalMonths - knee - 1, 1);
      return 0.1 + 0.9 * Math.min((monthIndex - knee) / tailLen, 1);
    }
  }
}

/** Compute steady-state monthly cost (in base currency) for a line item. */
export function steadyStateMonthly(item: CloudLineItem, fx: FxContext): Money {
  const unitInBase = toBase(item.unitCost, fx).amount;
  const monthlyAmount =
    unitInBase * item.quantity * item.environmentMultiplier;
  return money(monthlyAmount, fx.baseCurrency);
}

/**
 * Per-cloud-line-item totals across the project duration.
 */
export function calculateCloudLineItem(
  item: CloudLineItem,
  phases: Phase[],
  totalProjectMonths: number,
  fx: FxContext,
): CloudLineItemTotals {
  const steady = steadyStateMonthly(item, fx);

  // Compute the ramp-start month if curve is 'step'.
  let rampStart = 0;
  if (item.rampCurve === 'step' && item.rampStartPhaseId) {
    rampStart = phaseStartMonth(phases, item.rampStartPhaseId);
  }

  const monthlyBurn: Money[] = [];
  let projectTotal = 0;
  for (let i = 0; i < totalProjectMonths; i++) {
    const factor = rampFactor(item.rampCurve, i, totalProjectMonths, rampStart);
    const monthAmt = steady.amount * factor;
    monthlyBurn.push(money(monthAmt, fx.baseCurrency));
    projectTotal += monthAmt;
  }

  const runRate: Money = item.includeInRunRate
    ? steady
    : money(0, fx.baseCurrency);

  return {
    lineItemId: item.id,
    monthlyAtSteadyState: steady,
    projectDurationCost: money(projectTotal, fx.baseCurrency),
    monthlyBurn,
    runRateMonthly: runRate,
  };
}

/** Calculate totals for every cloud line item. */
export function calculateAllCloudLineItems(
  items: CloudLineItem[],
  phases: Phase[],
  totalProjectMonths: number,
  fx: FxContext,
): CloudLineItemTotals[] {
  return items.map(i => calculateCloudLineItem(i, phases, totalProjectMonths, fx));
}
