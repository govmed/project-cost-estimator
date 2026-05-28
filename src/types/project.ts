/**
 * Project — top-level container. Holds metadata and the list of scenarios.
 *
 * KEY DESIGN CHOICE: a Project owns NO cost data directly. All resources,
 * cloud line items, and other costs live on Scenarios. The "current" or
 * "canonical" view of the project is whichever Scenario is marked `isBase`.
 *
 * This makes scenario switching trivial, cloning is just deep-copying a
 * scenario, and comparison is a structural diff between two scenarios.
 */

import { ProjectId, ScenarioId, UserId, OrgId, PhaseId } from './ids';
import { CurrencyCode } from './money';

export type EngagementType =
  | 'FixedFee'
  | 'TimeAndMaterials'
  | 'CappedTM'
  | 'Milestone'
  | 'OutcomeBased';

export type EngagementContext =
  | 'NewBuild'
  | 'Migration'
  | 'Modernization'
  | 'MAIntegration'
  | 'MACarveOut'
  | 'TSA'
  | 'RunOperate';

export type ProjectStatus = 'draft' | 'underReview' | 'approved' | 'archived';

export interface Project {
  readonly id: ProjectId;
  name: string;
  client: string;
  sowReference?: string;
  version: string;            // semver-ish: "1.0.0", "1.2.3-rc1"
  status: ProjectStatus;

  engagementType: EngagementType;
  engagementContext: EngagementContext;

  baseCurrency: CurrencyCode;
  /** FX rates relative to baseCurrency. e.g. for USD base: { EUR: 0.93 } */
  fxRates: Record<CurrencyCode, number>;

  /** Targets that flow into pricing math. All are percentages (0-100). */
  targetMarginPct: number;
  discountPct: number;
  contingencyPct: number;
  managementReservePct: number;

  phases: Phase[];
  activeScenarioId: ScenarioId;     // which scenario the UI is showing
  baseScenarioId: ScenarioId;       // the canonical / "default" scenario

  ownerId: UserId;
  orgId: OrgId;
  createdAt: string;                // ISO 8601
  updatedAt: string;                // ISO 8601
}

/**
 * Phase — an ordered chunk of the project timeline.
 *
 * Phases use RELATIVE timing (offset + duration) rather than absolute dates
 * so a project can be "slipped" or "compressed" by changing one field
 * without recalculating every date.
 */
export interface Phase {
  readonly id: PhaseId;
  name: string;
  order: number;                    // 1-indexed; defines phase sequence
  durationWeeks: number;
  /** Weeks from project start to phase start. Phase 1 has offset 0. */
  offsetWeeks: number;
  description?: string;
}

/**
 * Standard CMS/SDLC-friendly phase template. Used by the "new project"
 * wizard to pre-populate phases. Override per-project as needed.
 */
export const DEFAULT_PHASE_TEMPLATE: Omit<Phase, 'id'>[] = [
  { name: 'Discovery',  order: 1, durationWeeks: 4,  offsetWeeks: 0 },
  { name: 'Design',     order: 2, durationWeeks: 6,  offsetWeeks: 4 },
  { name: 'Build',      order: 3, durationWeeks: 16, offsetWeeks: 10 },
  { name: 'Test',       order: 4, durationWeeks: 6,  offsetWeeks: 22 },
  { name: 'Deploy',     order: 5, durationWeeks: 4,  offsetWeeks: 28 },
  { name: 'Hypercare',  order: 6, durationWeeks: 8,  offsetWeeks: 32 },
];
