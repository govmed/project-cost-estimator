/**
 * Audit log - the queue of "what changed."
 *
 * M2b: resource updates. M2c: resource lifecycle. M3b: cloud lifecycle + updates.
 * M3c adds: other-cost lifecycle, other-cost field updates, project-level edits
 * (commercials, identity, FX), and phase lifecycle.
 *
 * Storage: append-only to localStorage key sow-calc:audit:<projectId>.
 * Capped at AUDIT_CAP entries with FIFO eviction.
 */

import type {
  ProjectId,
  ResourceId,
  ScenarioId,
  PhaseId,
  CloudLineItemId,
  OtherCostLineItemId,
} from '@/types/ids';
import type { Resource } from '@/types/resource';
import type { CloudLineItem } from '@/types/cloud';
import type { OtherCostLineItem } from '@/types/other-costs';
import type { Phase } from '@/types/project';

export type AuditAction =
  // Resource updates (M2b)
  | { kind: 'resource.allocation.update'; resourceId: ResourceId; phaseId: PhaseId; oldPct: number; newPct: number }
  | { kind: 'resource.rate.update'; resourceId: ResourceId; field: 'billRate' | 'internalCostRate'; oldAmount: number; newAmount: number }
  | { kind: 'resource.utilization.update'; resourceId: ResourceId; oldPct: number; newPct: number }
  | { kind: 'resource.hoursPerWeek.update'; resourceId: ResourceId; oldHours: number; newHours: number }
  | { kind: 'resource.name.update'; resourceId: ResourceId; oldName: string; newName: string }
  | { kind: 'resource.notes.update'; resourceId: ResourceId; oldNotes: string; newNotes: string }
  // Resource lifecycle (M2c)
  | { kind: 'resource.add'; resourceId: ResourceId; resource: Resource }
  | { kind: 'resource.delete'; resourceId: ResourceId; resource: Resource }
  | { kind: 'resource.duplicate'; fromResourceId: ResourceId; toResourceId: ResourceId; resource: Resource }
  // Cloud lifecycle (M3b)
  | { kind: 'cloud.add'; lineItemId: CloudLineItemId; item: CloudLineItem }
  | { kind: 'cloud.delete'; lineItemId: CloudLineItemId; item: CloudLineItem }
  | { kind: 'cloud.duplicate'; fromLineItemId: CloudLineItemId; toLineItemId: CloudLineItemId; item: CloudLineItem }
  | { kind: 'cloud.field.update'; lineItemId: CloudLineItemId; field: string; oldValue: unknown; newValue: unknown }
  // Other-cost lifecycle (M3c)
  | { kind: 'otherCost.add'; lineItemId: OtherCostLineItemId; item: OtherCostLineItem }
  | { kind: 'otherCost.delete'; lineItemId: OtherCostLineItemId; item: OtherCostLineItem }
  | { kind: 'otherCost.duplicate'; fromLineItemId: OtherCostLineItemId; toLineItemId: OtherCostLineItemId; item: OtherCostLineItem }
  | { kind: 'otherCost.field.update'; lineItemId: OtherCostLineItemId; field: string; oldValue: unknown; newValue: unknown }
  // Project / phase / FX edits (M3c)
  | { kind: 'project.field.update'; field: string; oldValue: unknown; newValue: unknown }
  | { kind: 'project.fx.update'; currency: string; oldRate: number; newRate: number }
  | { kind: 'phase.add'; phaseId: PhaseId; phase: Phase }
  | { kind: 'phase.delete'; phaseId: PhaseId; phase: Phase }
  | { kind: 'phase.field.update'; phaseId: PhaseId; field: string; oldValue: unknown; newValue: unknown };

export interface AuditEntry {
  id: string;
  timestamp: string;
  projectId: ProjectId;
  scenarioId: ScenarioId;
  action: AuditAction;
}

const AUDIT_CAP = 1000;
const BUCKET = (projectId: ProjectId) => `sow-calc:audit:${projectId}`;

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function appendAudit(
  projectId: ProjectId,
  scenarioId: ScenarioId,
  action: AuditAction,
): void {
  if (typeof localStorage === 'undefined') return;

  const entry: AuditEntry = {
    id: genId(),
    timestamp: new Date().toISOString(),
    projectId,
    scenarioId,
    action,
  };

  const key = BUCKET(projectId);
  let entries: AuditEntry[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) entries = JSON.parse(raw);
  } catch {
    entries = [];
  }
  entries.push(entry);

  if (entries.length > AUDIT_CAP) {
    entries = entries.slice(-AUDIT_CAP);
  }

  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // localStorage full
  }
}

export function readAudit(projectId: ProjectId): AuditEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const key = BUCKET(projectId);
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAudit(projectId: ProjectId): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(BUCKET(projectId));
}
