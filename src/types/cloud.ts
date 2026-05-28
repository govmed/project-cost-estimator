/**
 * CloudLineItem — a single cloud infrastructure cost component.
 *
 * One row = one service in one environment at one pricing model. Multi-env
 * (dev/test/staging/prod) is modeled as separate rows, not a multiplier on
 * one row, so the user can independently size each environment.
 */

import { CloudLineItemId, ScenarioId, PhaseId } from './ids';
import { Money } from './money';

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'other';

/**
 * Pricing model. The unit cost on the line item is assumed to ALREADY
 * reflect the chosen pricing model — so a 3-year reserved EC2 row has a
 * lower unitCost than its on-demand equivalent. The pricing model is stored
 * for traceability, not as a multiplier.
 */
export type PricingModel =
  | 'OnDemand'
  | 'Reserved1yr'
  | 'Reserved3yr'
  | 'SavingsPlan1yr'
  | 'SavingsPlan3yr'
  | 'Spot'
  | 'BringYourOwn';

export type Environment = 'dev' | 'test' | 'staging' | 'prod' | 'dr';

/**
 * How spend ramps over the project timeline. The calc engine spreads the
 * monthly cost across the project months using this shape.
 */
export type RampCurve =
  | 'flat'         // constant from start to end
  | 'linear'       // 0 at start, full at end
  | 'sCurve'       // slow start, steep middle, plateau
  | 'step'         // 0 until rampStartPhaseId, full after;
  | 'frontLoaded'  // full at start, declining (e.g., migration spike)
  | 'backLoaded';  // 0 at start, full at end + beyond (steady-state ramp)

/** Category groupings used in roll-ups and the cloud catalog UI. */
export type CloudCategory =
  | 'Compute'
  | 'Storage'
  | 'Database'
  | 'Networking'
  | 'Security'
  | 'Integration'
  | 'Observability'
  | 'AI/ML'
  | 'Backup/DR'
  | 'Other';

export interface CloudLineItem {
  readonly id: CloudLineItemId;
  scenarioId: ScenarioId;

  provider: CloudProvider;
  category: CloudCategory;
  /** Service name as it appears in pricing tables (e.g., "EC2", "Azure SQL"). */
  service: string;
  /** Specific SKU / instance type if relevant (e.g., "m6i.large"). */
  sku?: string;
  region: string;                  // "us-east-1", "eastus", etc.
  pricingModel: PricingModel;

  environment: Environment;
  /**
   * Multiplier applied to the unit cost. Used to model "dev is 30% of prod"
   * without duplicating the whole row. Default 1.0.
   */
  environmentMultiplier: number;

  /** Cost per unit per month. */
  unitCost: Money;
  quantity: number;
  /** Free-text unit name, for display ("instance-month", "GB-month", "1M-requests"). */
  unitName: string;

  /** How spend ramps over time. */
  rampCurve: RampCurve;
  /** Only meaningful for 'step' curves. */
  rampStartPhaseId?: PhaseId;

  /** If true, this line item is included in steady-state run-rate projections. */
  includeInRunRate: boolean;

  description?: string;
  /** Set to true if unit cost was edited from the default. */
  unitCostOverridden: boolean;
}
