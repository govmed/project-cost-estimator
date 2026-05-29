/**
 * Audit log - the queue of "what changed."
 *
 * M2b started writing entries; M2c adds resource lifecycle actions
 * (add / delete / duplicate). M5 will render an Audit Log screen
 * against these entries.
 *
 * Storage layout: append-only to localStorage key sow-calc:audit:<projectId>.
 * Capped at AUDIT_CAP entries with oldest-first eviction (per the data model
 * in #3 and the Phase 1 audit weakness disclosed in #9).
 */

import type { ProjectId, ResourceId, ScenarioId, PhaseId } from '@/types/ids';
import type { Resource } from '@/types/resource';

export type AuditAction =
  | { kind: 'resource.allocation.update'; resourceId: ResourceId; phaseId: PhaseId; oldPct: number; newPct: number }
  | { kind: 'resource.rate.update'; resourceId: ResourceId; field: 'billRate' | 'internalCostRate'; oldAmount: number; newAmount: number }
  | { kind: 'resource.utilization.update'; resourceId: ResourceId; oldPct: number; newPct: number }
  | { kind: 'resource.hoursPerWeek.update'; resourceId: ResourceId; oldHours: number; newHours: number }
  | { kind: 'resource.name.update'; resourceId: ResourceId; oldName: string; newName: string }
  | { kind: 'resource.notes.update'; resourceId: ResourceId; oldNotes: string; newNotes: string }
  | { kind: 'resource.add'; resourceId: ResourceId; resource: Resource }
  | { kind: 'resource.delete'; resourceId: ResourceId; resource: Resource }
  | { kind: 'resource.duplicate'; fromResourceId: ResourceId; toResourceId: ResourceId; resource: Resource };

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
    // localStorage full; M5 will surface
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
