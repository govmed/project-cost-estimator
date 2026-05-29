/**
 * Engine output types.
 *
 * The engine is pure: given a Scenario (+ Project context), it returns a
 * tree of derived totals. Every field here is a *result*, not an input.
 * Inputs live in src/types/.
 */

import { Money } from '../types/money';
import { ResourceId, CloudLineItemId, OtherCostLineItemId, PhaseId, ScenarioId } from '../types/ids';

/** Totals for a single resource, computed across all phases. */
export interface ResourceTotals {
  resourceId: ResourceId;
  totalHours: number;
  internalCost: Money;
  billedAmount: Money;
  marginAmount: Money;
  marginPct: number;
  /** Hours and money broken out per phase. */
  perPhase: ResourcePhaseTotals[];
}

export interface ResourcePhaseTotals {
  phaseId: PhaseId;
  hours: number;
  internalCost: Money;
  billedAmount: Money;
}

/** Totals for one cloud line item, computed across the project duration. */
export interface CloudLineItemTotals {
  lineItemId: CloudLineItemId;
  monthlyAtSteadyState: Money;
  projectDurationCost: Money;
  /** Per-month spend across project months. Length = project months. */
  monthlyBurn: Money[];
  /** Monthly cost extended into run-rate (if includeInRunRate=true). */
  runRateMonthly: Money;
}

/** Totals for one other-cost line item. */
export interface OtherCostLineItemTotals {
  lineItemId: OtherCostLineItemId;
  totalCost: Money;
  /** Per-month spend. Length = project months. */
  monthlyBurn: Money[];
  /** Monthly cost extended into run-rate (if includeInRunRate=true). */
  runRateMonthly: Money;
}

/** One bucket of the monthly burn curve. */
export interface BurnCurveMonth {
  monthIndex: number;          // 0-based, month 0 = project start
  phaseId: PhaseId | null;     // which phase this month falls in (null = pre/post-project)
  resourceCost: Money;
  cloudCost: Money;
  otherCost: Money;
  totalCost: Money;
  /** Cumulative total cost from month 0 through this month. */
  cumulativeCost: Money;
}

/** Headcount on each month (for the FTE curve). */
export interface HeadcountMonth {
  monthIndex: number;
  totalFTE: number;
  /** Breakdown by geography. */
  byGeography: Record<string, number>;
}

/**
 * The full result of running the engine on a Scenario.
 */
export interface ScenarioTotals {
  scenarioId: ScenarioId;

  // Granular totals
  resources: ResourceTotals[];
  cloudLineItems: CloudLineItemTotals[];
  otherCostLineItems: OtherCostLineItemTotals[];

  // Aggregates (all in project baseCurrency)
  resourcesSubtotal: Money;
  cloudSubtotal: Money;
  otherCostsSubtotal: Money;
  baseCost: Money;

  // Reserves
  contingencyAmount: Money;
  managementReserveAmount: Money;

  // Final
  totalCost: Money;
  targetPrice: Money;          // before discount
  finalPrice: Money;           // after discount
  realizedMargin: Money;
  realizedMarginPct: number;

  // Derived metrics
  totalBillableHours: number;
  effectiveBlendedRate: Money; // finalPrice / totalBillableHours

  // Time-phased
  burnCurve: BurnCurveMonth[];
  headcountCurve: HeadcountMonth[];

  // Run-rate projection (months 1-36 after go-live)
  runRateMonthly: Money;
  runRateYear1: Money;
  runRateYear2: Money;
  runRateYear3: Money;

  // Breakdowns for reporting
  byPhase: PhaseTotals[];
  byGeography: Record<string, Money>;
  byCloudProvider: Record<string, Money>;
  byCloudCategory: Record<string, Money>;

  /**
   * M&A overlay impact (M4d). Optional; present only when the scenario has
   * maData configured. Does NOT roll into totalCost / finalPrice - the
   * overlay is a separate preview projection so the headline price stays
   * stable until the dealmaker explicitly wants to commit.
   */
  maOverlay?: import('./ma-overlay').MAOverlayTotals;
}

export interface PhaseTotals {
  phaseId: PhaseId;
  phaseName: string;
  durationWeeks: number;
  resourceCost: Money;
  cloudCost: Money;
  otherCost: Money;
  totalCost: Money;
  fteAverage: number;
}
