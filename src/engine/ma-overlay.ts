/**
 * M&A overlay math (M4d).
 *
 * Computes the financial impact of an M&A engagement context on top of the
 * base project totals. Pure function - given the same project + scenario it
 * always returns the same MAOverlayTotals.
 *
 * Three modes are supported (matching MAModeData.mode):
 *
 *  - TSA: vendor runs operations for a period post-Day-1, with an optional
 *    exit ramp that reduces the monthly cost each quarter. Output is the
 *    total run-out cost over the TSA period, the per-month projection, and
 *    the effective cost in month 1 vs the last month.
 *
 *  - CarveOut: separating an entity. Inputs are a one-time setup cost
 *    multiplier applied to the in-build resource cost, an ongoing annual
 *    dis-synergy percentage applied to the base run-rate, and a list of
 *    explicit one-time separation costs (sourced from other-cost line items
 *    in the base scenario that the user has tagged as separation-related).
 *
 *    For M4d we don't yet support tagging other-cost items as separation-
 *    related from the planner; the user enters explicit one-time amounts on
 *    the M&A page itself. The math is identical either way.
 *
 *  - Integration: synergy realization curve plus one-time integration costs.
 *    Synergy target is annual run-rate $; the realization curve spreads that
 *    over a configurable number of months. Three curve shapes: linear,
 *    s-curve (the default; backloaded), and step (full at end of timeline).
 *
 * IMPORTANT: M4d does NOT roll the overlay into ScenarioTotals.finalPrice.
 * The original design called for the overlay to be a "preview" feature that
 * informs the dealmaker but doesn't change the headline KPIs in the top rail.
 * This matches the wireframe's banner: "M&A overlay math is in preview.
 * Numbers shown here are projections based on your inputs; they don't yet
 * flow into the top-rail KPIs." Adding the overlay to finalPrice is a Phase 2
 * feature that needs explicit per-scenario opt-in.
 */

import type { Scenario, MAModeData } from '../types/scenario';
import type { Project } from '../types/project';
import { money } from '../types/money';
import type { Money } from '../types/money';

/**
 * Per-month projection point for an overlay timeline.
 */
export interface MAOverlayMonth {
  monthIndex: number;        // 0-based, month 0 is the first month of overlay
  cost: Money;               // gross cost for this month (positive)
  synergy: Money;            // realized synergy for this month (positive)
  netImpact: Money;          // cost - synergy. Positive = bad, negative = good.
  cumulativeNet: Money;
}

/**
 * Roll-up of overlay impact for a scenario. Currency = project base currency.
 */
export interface MAOverlayTotals {
  mode: 'TSA' | 'CarveOut' | 'Integration';

  // The per-month timeline (length depends on mode).
  monthly: MAOverlayMonth[];

  // Totals
  oneTimeCost: Money;            // sum of one-time costs (e.g. separation, integration setup)
  recurringCost: Money;          // sum of all recurring costs across the timeline (TSA monthly, dis-synergies)
  realizedSynergy: Money;        // sum of synergy realized across timeline (Integration only)
  netImpact: Money;              // oneTime + recurring - realizedSynergy. Positive = bad.

  // Headline metrics for the impact-summary panel
  timelineMonths: number;
  breakevenMonthIndex: number | null;   // month at which cumulativeNet crosses 0 (Integration). null if never breaks even.
}

const SUPPORTED_MODES: ReadonlyArray<MAModeData['mode']> = ['TSA', 'CarveOut', 'Integration'];

/**
 * Compute overlay totals. Returns null if the scenario has no M&A configuration,
 * or if the configured mode lacks the minimum fields needed for math.
 */
export function calculateMAOverlay(
  project: Project,
  scenario: Scenario,
  /** Base scenario totals used by some modes (e.g. dis-synergy as a % of run-rate). */
  context: {
    baseRunRateMonthly: number;     // amount in baseCurrency
    baseInBuildResourceCost: number; // amount in baseCurrency (sum of resource cost in phases 1-3 ish)
  },
): MAOverlayTotals | null {
  const maData = scenario.maData;
  if (!maData) return null;
  if (!SUPPORTED_MODES.includes(maData.mode)) return null;

  const currency = project.baseCurrency;

  switch (maData.mode) {
    case 'TSA':
      return calculateTSA(maData, currency, context.baseRunRateMonthly);
    case 'CarveOut':
      return calculateCarveOut(maData, currency, context.baseInBuildResourceCost, context.baseRunRateMonthly);
    case 'Integration':
      return calculateIntegration(maData, currency);
    default:
      return null;
  }
}

// -------------------------------------------------------------------------
// TSA math
// -------------------------------------------------------------------------

function calculateTSA(
  maData: MAModeData,
  currency: Money['currency'],
  baseRunRateMonthly: number,
): MAOverlayTotals | null {
  const duration = Math.max(0, Math.round(maData.tsaDurationMonths ?? 0));
  if (duration === 0) return null;

  // Exit ramp is per-quarter cost reduction. e.g. 8% per quarter -> month 1-3 at 100%,
  // months 4-6 at 92%, months 7-9 at 92*0.92=84.6%, etc.
  // We compound the rate so it's gentler than a flat subtraction.
  const exitRampPctPerQuarter = Math.max(0, Math.min(100, maData.tsaExitRampPct ?? 0)) / 100;

  // The TSA's month-1 cost is, by convention, the buyer's monthly burn rate for the
  // services it's still receiving. For M4d we approximate this as the base scenario's
  // run-rate (which already excludes one-time project work) - this is a sensible default;
  // the user will override per-tower in a later milestone.
  const month1Cost = baseRunRateMonthly;
  if (month1Cost <= 0) {
    // Render an empty projection rather than null - the user can still configure duration
    // and exit ramp, the numbers just become non-trivial once they populate run-rate.
    return {
      mode: 'TSA',
      monthly: [],
      oneTimeCost: money(0, currency),
      recurringCost: money(0, currency),
      realizedSynergy: money(0, currency),
      netImpact: money(0, currency),
      timelineMonths: duration,
      breakevenMonthIndex: null,
    };
  }

  const monthly: MAOverlayMonth[] = [];
  let cumulativeNet = 0;
  for (let m = 0; m < duration; m++) {
    const quartersElapsed = Math.floor(m / 3);
    const rampFactor = Math.pow(1 - exitRampPctPerQuarter, quartersElapsed);
    const cost = month1Cost * rampFactor;
    const netImpact = cost; // TSA has no synergy by definition
    cumulativeNet += netImpact;
    monthly.push({
      monthIndex: m,
      cost: money(cost, currency),
      synergy: money(0, currency),
      netImpact: money(netImpact, currency),
      cumulativeNet: money(cumulativeNet, currency),
    });
  }

  const recurringCost = monthly.reduce((acc, m) => acc + m.cost.amount, 0);
  return {
    mode: 'TSA',
    monthly,
    oneTimeCost: money(0, currency),
    recurringCost: money(recurringCost, currency),
    realizedSynergy: money(0, currency),
    netImpact: money(recurringCost, currency),
    timelineMonths: duration,
    breakevenMonthIndex: null,
  };
}

// -------------------------------------------------------------------------
// Carve-out math
// -------------------------------------------------------------------------

function calculateCarveOut(
  maData: MAModeData,
  currency: Money['currency'],
  baseInBuildResourceCost: number,
  baseRunRateMonthly: number,
): MAOverlayTotals {
  const multiplier = Math.max(1, maData.separationOneTimeCostMultiplier ?? 1);
  // The multiplier is applied as an ADDITIONAL cost beyond what the base already includes.
  // e.g. multiplier 1.4 means the carve-out adds 40% to the resource cost in build phases.
  const standUpExtra = baseInBuildResourceCost * (multiplier - 1);

  // Dis-synergy: annual % of the base monthly run-rate, annualized.
  const dissynergiesAnnualPct = Math.max(0, maData.dissynergiesAnnualPct ?? 0) / 100;
  const dissynergyMonthly = baseRunRateMonthly * 12 * dissynergiesAnnualPct / 12;

  // For M4d we project carve-out impact over Year 1 (12 months) post-Day-1.
  // Year-1 dis-synergies + the one-time stand-up extra. We attribute the
  // stand-up extra to month 0 (a single up-front cost line).
  const timelineMonths = 12;
  const monthly: MAOverlayMonth[] = [];
  let cumulativeNet = 0;
  for (let m = 0; m < timelineMonths; m++) {
    const oneTime = m === 0 ? standUpExtra : 0;
    const cost = oneTime + dissynergyMonthly;
    const netImpact = cost;
    cumulativeNet += netImpact;
    monthly.push({
      monthIndex: m,
      cost: money(cost, currency),
      synergy: money(0, currency),
      netImpact: money(netImpact, currency),
      cumulativeNet: money(cumulativeNet, currency),
    });
  }

  return {
    mode: 'CarveOut',
    monthly,
    oneTimeCost: money(standUpExtra, currency),
    recurringCost: money(dissynergyMonthly * timelineMonths, currency),
    realizedSynergy: money(0, currency),
    netImpact: money(standUpExtra + dissynergyMonthly * timelineMonths, currency),
    timelineMonths,
    breakevenMonthIndex: null,
  };
}

// -------------------------------------------------------------------------
// Integration math
// -------------------------------------------------------------------------

function calculateIntegration(
  maData: MAModeData,
  currency: Money['currency'],
): MAOverlayTotals | null {
  const annualSynergyTarget = Math.max(0, maData.synergyTargetAnnual ?? 0);
  const realizationMonths = Math.max(1, Math.round(maData.synergyRealizationMonths ?? 0));
  const oneTimeCost = Math.max(0, maData.oneTimeIntegrationCost ?? 0);

  // Integration projects 36 months by default to show post-realization steady state.
  // If realization is shorter we still show 36 months; if longer we show realization + 12.
  const timelineMonths = Math.max(36, realizationMonths + 12);

  const monthlyTargetAtFullRealization = annualSynergyTarget / 12;

  // S-curve: a smooth ramp using a logistic-style function.
  // Realization fraction at month m (0-indexed):
  //   if m >= realizationMonths -> 1.0
  //   else: smooth(m / realizationMonths) where smooth is 3t^2 - 2t^3 (cubic ease)
  const realizationFraction = (m: number): number => {
    if (realizationMonths === 0) return 1;
    const t = Math.min(1, (m + 1) / realizationMonths);
    return 3 * t * t - 2 * t * t * t;
  };

  const monthly: MAOverlayMonth[] = [];
  let cumulativeNet = 0;
  let breakevenMonthIndex: number | null = null;

  for (let m = 0; m < timelineMonths; m++) {
    const oneTime = m === 0 ? oneTimeCost : 0;
    const synergyThisMonth = monthlyTargetAtFullRealization * realizationFraction(m);
    const cost = oneTime;
    const netImpact = cost - synergyThisMonth; // net to the buyer (positive = net cost)
    cumulativeNet += netImpact;
    monthly.push({
      monthIndex: m,
      cost: money(cost, currency),
      synergy: money(synergyThisMonth, currency),
      netImpact: money(netImpact, currency),
      cumulativeNet: money(cumulativeNet, currency),
    });
    if (breakevenMonthIndex === null && cumulativeNet <= 0 && oneTimeCost > 0) {
      breakevenMonthIndex = m;
    }
  }

  const totalSynergy = monthly.reduce((acc, m) => acc + m.synergy.amount, 0);
  const totalCost = oneTimeCost;
  const net = totalCost - totalSynergy;

  return {
    mode: 'Integration',
    monthly,
    oneTimeCost: money(totalCost, currency),
    recurringCost: money(0, currency),
    realizedSynergy: money(totalSynergy, currency),
    netImpact: money(net, currency),
    timelineMonths,
    breakevenMonthIndex,
  };
}
