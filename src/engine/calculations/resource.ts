/**
 * Resource calculations.
 *
 * For each resource, compute hours and money per phase, then aggregate.
 *
 * Allocation precedence:
 *   1. If resource.allocations[] has an entry for this phase, use it.
 *   2. Otherwise, use resource.defaultAllocationPct.
 *
 * Note: allocationPct can exceed 100 (it represents combined FTE for a
 * "team" resource like "4 offshore developers" = 400%).
 *
 * Hours per phase formula:
 *   hours = durationWeeks
 *         × hoursPerWeek
 *         × (allocationPct / 100)
 *         × (utilizationPct / 100)
 */

import { Resource, ResourceAllocation } from '../../types/resource';
import { Phase } from '../../types/project';
import { PhaseId } from '../../types/ids';
import { Money, money, zero } from '../../types/money';
import { FxContext, toBase, mul } from '../fx';
import { ResourceTotals, ResourcePhaseTotals } from '../types';

/** Look up allocation% for a resource on a given phase. */
export function allocationForPhase(resource: Resource, phaseId: PhaseId): number {
  const override = resource.allocations.find(a => a.phaseId === phaseId);
  if (override) return override.allocationPct;
  return resource.defaultAllocationPct;
}

/** Hours a resource will work in a single phase. */
export function hoursInPhase(resource: Resource, phase: Phase): number {
  const alloc = allocationForPhase(resource, phase.id);
  return (
    phase.durationWeeks *
    resource.hoursPerWeek *
    (alloc / 100) *
    (resource.utilizationPct / 100)
  );
}

/**
 * Per-resource totals across all phases.
 *
 * Returns totals in the project base currency. The resource's billRate and
 * internalCostRate may be in any currency — they're converted to base
 * before any summing.
 */
export function calculateResource(
  resource: Resource,
  phases: Phase[],
  fx: FxContext,
): ResourceTotals {
  const perPhase: ResourcePhaseTotals[] = [];
  let totalHours = 0;
  let totalInternalCost = 0;
  let totalBilled = 0;

  // Convert rates to base currency ONCE (resources have single rates, not per-phase).
  const billRateInBase = toBase(resource.billRate, fx).amount;
  const costRateInBase = toBase(resource.internalCostRate, fx).amount;

  for (const phase of phases) {
    const hrs = hoursInPhase(resource, phase);
    const phaseCost = hrs * costRateInBase;
    const phaseBill = hrs * billRateInBase;

    totalHours += hrs;
    totalInternalCost += phaseCost;
    totalBilled += phaseBill;

    perPhase.push({
      phaseId: phase.id,
      hours: hrs,
      internalCost: money(phaseCost, fx.baseCurrency),
      billedAmount: money(phaseBill, fx.baseCurrency),
    });
  }

  const marginAmt = totalBilled - totalInternalCost;
  const marginPct = totalBilled > 0 ? (marginAmt / totalBilled) * 100 : 0;

  return {
    resourceId: resource.id,
    totalHours,
    internalCost: money(totalInternalCost, fx.baseCurrency),
    billedAmount: money(totalBilled, fx.baseCurrency),
    marginAmount: money(marginAmt, fx.baseCurrency),
    marginPct,
    perPhase,
  };
}

/** Calculate totals for every resource in the scenario. */
export function calculateAllResources(
  resources: Resource[],
  phases: Phase[],
  fx: FxContext,
): ResourceTotals[] {
  return resources.map(r => calculateResource(r, phases, fx));
}
