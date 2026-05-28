/**
 * Scenario — a named variant of the project's cost model.
 *
 * Scenarios own all the cost data: resources, cloud line items, other costs,
 * and any scenario-specific overrides to project-level settings (margin,
 * contingency, FX rates).
 *
 * The Project holds a list of scenarios and points to one as the "base".
 * Switching scenarios in the UI just changes which scenario is being viewed.
 */

import { ScenarioId, ProjectId, UserId } from './ids';
import { Resource } from './resource';
import { CloudLineItem } from './cloud';
import { OtherCostLineItem } from './other-costs';
import { Assumption } from './assumption';
import { CurrencyCode } from './money';

/**
 * Per-scenario overrides for project-level settings. If a field is `undefined`,
 * the scenario inherits the project's value. If set, it overrides it.
 *
 * This is the *only* place where deltas are tracked — for cost data we keep
 * full copies because deep diffing is annoying and storage is cheap.
 */
export interface ScenarioOverrides {
  targetMarginPct?: number;
  discountPct?: number;
  contingencyPct?: number;
  managementReservePct?: number;
  fxRates?: Partial<Record<CurrencyCode, number>>;
}

/** Optional M&A-mode-specific data, only populated if relevant. */
export interface MAModeData {
  mode: 'TSA' | 'CarveOut' | 'Integration';

  // TSA-specific
  tsaDurationMonths?: number;
  tsaExitRampPct?: number;        // % cost reduction per quarter post-day-1
  tsaServiceTowers?: string[];    // ["Infrastructure", "Apps", "Data", ...]

  // Carve-out-specific
  separationOneTimeCostMultiplier?: number;
  dissynergiesAnnualPct?: number;

  // Integration-specific
  synergyTargetAnnual?: number;
  synergyRealizationMonths?: number;
  oneTimeIntegrationCost?: number;
}

export interface Scenario {
  readonly id: ScenarioId;
  projectId: ProjectId;

  name: string;
  description?: string;

  /** Exactly one scenario per project has isBase=true. */
  isBase: boolean;

  /** If this scenario was cloned, the source scenario it came from. */
  parentScenarioId?: ScenarioId;

  /** Order in the scenario picker UI. */
  order: number;

  // Cost data
  resources: Resource[];
  cloudLineItems: CloudLineItem[];
  otherCostLineItems: OtherCostLineItem[];

  // Defensibility
  assumptions: Assumption[];

  // Overrides on project-level settings
  overrides: ScenarioOverrides;

  // Optional M&A overlay
  maData?: MAModeData;

  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
}
