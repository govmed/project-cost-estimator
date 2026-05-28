/**
 * Assumption — a defensibility item attached to a scenario.
 *
 * Every "EDIT BEFORE USE" default the user accepts becomes an assumption.
 * Every override they make can be tagged as an assumption. The Assumption
 * Ledger screen lists them all and lets the user mark each as "validated"
 * (client confirmed, source documented) vs. "assumed" (educated guess).
 *
 * This is what makes the number defensible in a deal room.
 */

import { AssumptionId, AuditEntryId, ScenarioId, UserId } from './ids';

export type AssumptionSource =
  | 'assumed'              // Educated guess, not yet validated
  | 'validated'            // Internally validated against historical data
  | 'clientConfirmed'      // Client explicitly confirmed
  | 'industryBenchmark';   // Sourced from an external benchmark

export type AssumptionRiskLevel = 'low' | 'medium' | 'high';

export interface LinkedEntity {
  /** What kind of thing this assumption affects. */
  type: 'resource' | 'cloud' | 'otherCost' | 'project' | 'scenario';
  /** ID of the affected entity (as a plain string for portability). */
  id: string;
}

export interface Assumption {
  readonly id: AssumptionId;
  scenarioId: ScenarioId;

  topic: string;                    // Short title - e.g. "Offshore ratio"
  description: string;              // Full text of the assumption
  source: AssumptionSource;
  riskLevel: AssumptionRiskLevel;

  /** What does this assumption affect? Used for impact analysis. */
  linkedEntities: LinkedEntity[];

  /** Optional - URL or doc ref backing this up. */
  evidenceUrl?: string;

  createdBy: UserId;
  createdAt: string;
  lastReviewedAt?: string;
  reviewedBy?: UserId;
}

/**
 * AuditEntry — one record of one field change.
 *
 * Written by the calc engine / persistence layer on every mutation. The
 * Audit Log screen filters these. We keep before/after as JSON so we can
 * render any change regardless of the field's type.
 */
export interface AuditEntry {
  readonly id: AuditEntryId;
  scenarioId?: ScenarioId;          // optional - project-level edits don't have one

  timestamp: string;
  userId: UserId;

  entityType: string;               // "Resource", "CloudLineItem", "Project", etc.
  entityId: string;                 // ID of the changed entity
  field: string;                    // dotted path: "billRate.amount"
  before: unknown;                  // JSON value
  after: unknown;                   // JSON value

  /** Optional - user-supplied reason for the change. */
  reason?: string;
}
