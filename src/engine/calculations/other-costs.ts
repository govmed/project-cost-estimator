/**
 * Other cost line item calculations.
 *
 * Each line is sized by pricingUnit:
 *   OneTime          : unitCost x quantity
 *   PerMonth         : unitCost x quantity x monthsInScope
 *   PerYear          : (unitCost / 12) x quantity x monthsInScope
 *   PerUser          : unitCost x quantity x userCount
 *   PerUserPerMonth  : unitCost x userCount x monthsInScope
 *   PerHour          : unitCost x quantity  (quantity is hours)
 *
 * markupPct (if set) is applied as the final step: total *= (1 + markup/100).
 *
 * phaseId scopes the cost to a single phase. If null, the cost spreads
 * across the full project duration.
 *
 * includeInRunRate flags whether this continues into steady-state. Only
 * meaningful for recurring pricingUnits (PerMonth, PerYear, PerUserPerMonth).
 */

import { OtherCostLineItem } from '../../types/other-costs';
import { Phase } from '../../types/project';
import { Money, money } from '../../types/money';
import { FxContext, toBase } from '../fx';
import { phaseMonthRanges, phaseDurationMonths } from '../time';
import { OtherCostLineItemTotals } from '../types';

/**
 * Calculate totals for a single other-cost line item.
 */
export function calculateOtherCostLineItem(
  item: OtherCostLineItem,
  phases: Phase[],
  totalProjectMonths: number,
  fx: FxContext,
): OtherCostLineItemTotals {
  const unitInBase = toBase(item.unitCost, fx).amount;

  // Determine "months in scope" and the [startMonth, endMonth) range
  // over which the burn should be spread.
  let monthsInScope: number;
  let startMonth = 0;
  let endMonth = totalProjectMonths;

  if (item.phaseId) {
    const ranges = phaseMonthRanges(phases);
    const range = ranges.get(item.phaseId);
    if (range) {
      [startMonth, endMonth] = range;
      const phase = phases.find(p => p.id === item.phaseId);
      monthsInScope = phase ? phaseDurationMonths(phase) : (endMonth - startMonth);
    } else {
      monthsInScope = totalProjectMonths;
    }
  } else {
    monthsInScope = totalProjectMonths;
  }

  // Compute total cost based on pricingUnit.
  let total = 0;
  let monthlyAmount = 0;     // for spreading across the burn curve
  let isRecurring = false;

  switch (item.pricingUnit) {
    case 'OneTime':
      total = unitInBase * item.quantity;
      break;
    case 'PerMonth':
      monthlyAmount = unitInBase * item.quantity;
      total = monthlyAmount * monthsInScope;
      isRecurring = true;
      break;
    case 'PerYear':
      monthlyAmount = (unitInBase / 12) * item.quantity;
      total = monthlyAmount * monthsInScope;
      isRecurring = true;
      break;
    case 'PerUser': {
      const users = item.userCount ?? 0;
      total = unitInBase * item.quantity * users;
      break;
    }
    case 'PerUserPerMonth': {
      const users = item.userCount ?? 0;
      monthlyAmount = unitInBase * users;
      total = monthlyAmount * monthsInScope;
      isRecurring = true;
      break;
    }
    case 'PerHour':
      // quantity is hours
      total = unitInBase * item.quantity;
      break;
  }

  // Apply markup (partner pass-through).
  if (item.markupPct && item.markupPct !== 0) {
    const factor = 1 + item.markupPct / 100;
    total *= factor;
    monthlyAmount *= factor;
  }

  // Build the monthly burn array.
  // OneTime / PerUser / PerHour: drop the whole cost in startMonth.
  // Recurring: spread evenly across [startMonth, endMonth).
  const monthlyBurn: Money[] = [];
  for (let i = 0; i < totalProjectMonths; i++) {
    let amt = 0;
    if (isRecurring) {
      if (i >= startMonth && i < endMonth) {
        amt = monthlyAmount;
      }
    } else {
      // One-shot. Land it in the first month of scope.
      if (i === startMonth) amt = total;
    }
    monthlyBurn.push(money(amt, fx.baseCurrency));
  }

  const runRate: Money = item.includeInRunRate && isRecurring
    ? money(monthlyAmount, fx.baseCurrency)
    : money(0, fx.baseCurrency);

  return {
    lineItemId: item.id,
    totalCost: money(total, fx.baseCurrency),
    monthlyBurn,
    runRateMonthly: runRate,
  };
}

export function calculateAllOtherCostLineItems(
  items: OtherCostLineItem[],
  phases: Phase[],
  totalProjectMonths: number,
  fx: FxContext,
): OtherCostLineItemTotals[] {
  return items.map(i => calculateOtherCostLineItem(i, phases, totalProjectMonths, fx));
}
