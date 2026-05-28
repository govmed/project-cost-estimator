/**
 * OtherCostLineItem — anything that's not labor or cloud.
 *
 * Kept deliberately flat. The category drives reporting roll-ups but doesn't
 * constrain the math: every line is just `unitCost x quantity x months`,
 * with `pricingUnit` describing what "quantity" means.
 */

import { OtherCostLineItemId, ScenarioId, PhaseId } from './ids';
import { Money } from './money';

export type OtherCostCategory =
  | 'SoftwareLicense'
  | 'SaaSSubscription'
  | 'Hardware'
  | 'Endpoint'
  | 'TravelExpense'
  | 'Training'
  | 'KnowledgeTransfer'
  | 'Subcontractor'
  | 'PartnerPassthrough'
  | 'Compliance'
  | 'Insurance'
  | 'Other';

export type PricingUnit =
  | 'OneTime'        // single charge regardless of duration
  | 'PerMonth'       // unitCost is monthly; multiplied by months in scope
  | 'PerYear'        // unitCost is annual; converted to monthly internally
  | 'PerUser'        // requires userCount
  | 'PerUserPerMonth'
  | 'PerHour';       // for subcontractors

export interface OtherCostLineItem {
  readonly id: OtherCostLineItemId;
  scenarioId: ScenarioId;

  category: OtherCostCategory;
  name: string;
  description?: string;
  vendor?: string;

  unitCost: Money;
  quantity: number;
  pricingUnit: PricingUnit;

  /** For PerUser / PerUserPerMonth. */
  userCount?: number;

  /**
   * If set, this cost is scoped to a single phase. If null, it's spread
   * across the full project. OneTime costs typically pin to a single phase.
   */
  phaseId?: PhaseId;

  /** Whether this cost continues into steady-state operation. */
  includeInRunRate: boolean;

  /** Optional markup (%) applied for partner pass-through with management fee. */
  markupPct?: number;

  notes?: string;
}
