/**
 * Engine entry point.
 *
 *   calculate(project, scenario) -> ScenarioTotals
 *
 * Pure function. No I/O, no Date.now(), no globals. Given the same inputs
 * it always returns the same outputs. This is the contract the UI relies on.
 *
 * The function composes everything in src/engine/calculations/*.
 */

import { Project } from '../types/project';
import { Scenario } from '../types/scenario';
import { money } from '../types/money';
import { FxContext } from './fx';
import {
  projectDurationMonths,
  RUN_RATE_HORIZON_MONTHS,
} from './time';
import { calculateAllResources } from './calculations/resource';
import { calculateAllCloudLineItems } from './calculations/cloud';
import { calculateAllOtherCostLineItems } from './calculations/other-costs';
import { buildBurnCurve, buildHeadcountCurve } from './calculations/burn-curve';
import {
  resolveOverrides,
  sumResourceCost,
  sumResourceBilled,
  sumCloudCost,
  sumOtherCost,
  sumBillableHours,
  sumRunRateMonthly,
  applyPricing,
  rollUpByPhase,
  rollUpByGeography,
  rollUpByCloudProvider,
  rollUpByCloudCategory,
} from './calculations/totals';
import { ScenarioTotals } from './types';
import { calculateMAOverlay } from './ma-overlay';

export function calculate(project: Project, scenario: Scenario): ScenarioTotals {
  // FX context derived from project.
  const fx: FxContext = {
    baseCurrency: project.baseCurrency,
    fxRates: { ...project.fxRates, ...(scenario.overrides.fxRates ?? {}) } as Record<
      typeof project.baseCurrency,
      number
    >,
  };

  const totalProjectMonths = projectDurationMonths(project.phases);

  // 1. Per-line-item totals.
  const resourceTotals = calculateAllResources(scenario.resources, project.phases, fx);
  const cloudTotals = calculateAllCloudLineItems(
    scenario.cloudLineItems,
    project.phases,
    totalProjectMonths,
    fx,
  );
  const otherCostTotals = calculateAllOtherCostLineItems(
    scenario.otherCostLineItems,
    project.phases,
    totalProjectMonths,
    fx,
  );

  // 2. Subtotals.
  const resourcesSubtotal = sumResourceCost(resourceTotals, fx);
  const resourceBilledSubtotal = sumResourceBilled(resourceTotals, fx);
  const cloudSubtotal = sumCloudCost(cloudTotals, fx);
  const otherCostsSubtotal = sumOtherCost(otherCostTotals, fx);
  const baseCost = money(
    resourcesSubtotal.amount + cloudSubtotal.amount + otherCostsSubtotal.amount,
    project.baseCurrency,
  );

  // 3. M&A overlay (computed before pricing so opt-in can affect finalPrice).
  const maOverlayPreview = calculateMAOverlay(project, scenario, {
    baseRunRateMonthly: 0, // placeholder — run-rate not yet computed at this point
    baseInBuildResourceCost: resourcesSubtotal.amount,
  });

  // If the scenario opts in (includeInPrice=true), add overlay net impact to baseCost.
  const maAdjustment =
    scenario.maData?.includeInPrice && maOverlayPreview
      ? maOverlayPreview.netImpact.amount
      : 0;

  const adjustedBaseCost = money(baseCost.amount + maAdjustment, project.baseCurrency);

  // 4. Pricing math (uses adjustedBaseCost when MA is opted in).
  const eff = resolveOverrides(project, scenario);
  const pricing = applyPricing(
    adjustedBaseCost,
    eff.contingencyPct,
    eff.managementReservePct,
    eff.targetMarginPct,
    eff.discountPct,
    fx,
  );

  // 5. Effective blended rate.
  //    Defined as the resource-portion of price divided by total billable hours.
  //    We approximate: scale finalPrice by the resource share of baseCost.
  const totalBillableHours = sumBillableHours(resourceTotals);
  const resourceShareOfBase = baseCost.amount > 0
    ? resourcesSubtotal.amount / baseCost.amount
    : 0;
  const resourcePortionOfPrice = pricing.finalPrice.amount * resourceShareOfBase;
  const effectiveBlendedRate = totalBillableHours > 0
    ? money(resourcePortionOfPrice / totalBillableHours, project.baseCurrency)
    : money(0, project.baseCurrency);

  // 6. Time-phased curves.
  const burnCurve = buildBurnCurve(
    scenario.resources,
    resourceTotals,
    cloudTotals,
    otherCostTotals,
    project.phases,
    totalProjectMonths,
    fx,
  );
  const headcountCurve = buildHeadcountCurve(
    scenario.resources,
    project.phases,
    totalProjectMonths,
  );

  // 7. Run-rate projection.
  const runRateMonthly = sumRunRateMonthly(cloudTotals, otherCostTotals, fx);
  const runRateAnnual = runRateMonthly.amount * 12;
  const runRateYear1 = money(runRateAnnual, project.baseCurrency);
  const runRateYear2 = money(runRateAnnual, project.baseCurrency);
  const runRateYear3 = money(runRateAnnual, project.baseCurrency);

  // 8. Breakdowns.
  const byPhase = rollUpByPhase(
    project,
    resourceTotals,
    cloudTotals,
    otherCostTotals,
    headcountCurve,
    fx,
  );
  const byGeography = rollUpByGeography(scenario.resources, resourceTotals, fx);
  const byCloudProvider = rollUpByCloudProvider(scenario.cloudLineItems, cloudTotals, fx);
  const byCloudCategory = rollUpByCloudCategory(scenario.cloudLineItems, cloudTotals, fx);

  // Touch resourceBilledSubtotal so the linter sees it used (it's a useful sanity field).
  void resourceBilledSubtotal;
  void RUN_RATE_HORIZON_MONTHS;

  return {
    scenarioId: scenario.id,

    resources: resourceTotals,
    cloudLineItems: cloudTotals,
    otherCostLineItems: otherCostTotals,

    resourcesSubtotal,
    cloudSubtotal,
    otherCostsSubtotal,
    baseCost,

    contingencyAmount: pricing.contingencyAmount,
    managementReserveAmount: pricing.managementReserveAmount,

    totalCost: pricing.totalCost,
    targetPrice: pricing.targetPrice,
    finalPrice: pricing.finalPrice,
    realizedMargin: pricing.realizedMargin,
    realizedMarginPct: pricing.realizedMarginPct,

    totalBillableHours,
    effectiveBlendedRate,

    burnCurve,
    headcountCurve,

    runRateMonthly,
    runRateYear1,
    runRateYear2,
    runRateYear3,

    byPhase,
    byGeography,
    byCloudProvider,
    byCloudCategory,

    // M&A overlay — recomputed with the real run-rate now available.
    // includeInPrice scenarios use adjustedBaseCost in pricing (above);
    // the overlay itself is always the full calculation.
    maOverlay: calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: runRateMonthly.amount,
      baseInBuildResourceCost: resourcesSubtotal.amount,
    }) ?? undefined,
  };
}
