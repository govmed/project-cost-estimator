/**
 * Project store - the single source of truth for "what is the user viewing."
 *
 * Holds the Project, its scenarios, and which scenario is active. Engine
 * output (totals, burn curve, etc.) is NOT stored here - it's derived from
 * (project, activeScenario) via calculate() at the component boundary.
 *
 * Persistence is via the Storage interface. M1a wired LocalStorageProvider;
 * Phase 2 will swap for a backend provider with no component changes.
 *
 * M2b adds edit actions: updateResourceAllocation, updateResourceField.
 * Each edit:
 *  1. Updates the scenario in the store immutably (clone the chain)
 *  2. Bumps Project.updatedAt
 *  3. Writes an audit entry
 *  4. Persists the Project to storage
 */

import { create } from 'zustand';
import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { Resource } from '@/types/resource';
import type { ScenarioId, ResourceId, PhaseId } from '@/types/ids';
import { LocalStorageProvider } from './local-storage-provider';
import type { Storage } from './storage';
import { appendAudit } from './audit-log';

const storage: Storage = new LocalStorageProvider();

export type ResourceField =
  | { kind: 'name'; value: string }
  | { kind: 'billRate'; amount: number }
  | { kind: 'internalCostRate'; amount: number }
  | { kind: 'utilizationPct'; value: number }
  | { kind: 'hoursPerWeek'; value: number }
  | { kind: 'notes'; value: string };

interface ProjectState {
  project: Project | null;
  scenarios: Scenario[];
  activeScenarioId: ScenarioId | null;

  setProject(project: Project, scenarios: Scenario[]): void;
  setActiveScenario(scenarioId: ScenarioId): void;
  reset(): void;

  // M2b edit actions
  updateResourceAllocation(
    scenarioId: ScenarioId,
    resourceId: ResourceId,
    phaseId: PhaseId,
    newPct: number,
  ): void;
  updateResourceField(
    scenarioId: ScenarioId,
    resourceId: ResourceId,
    field: ResourceField,
  ): void;
}

/** Clamp allocation % to [0, 100]. Round to nearest integer for display sanity. */
function clampAllocation(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  // Allow decimal but normalize trailing-zero noise; the UI renders as integer
  // but we preserve the user's intent at storage time.
  return Math.round(v * 100) / 100;
}

function nowIso(): string {
  return new Date().toISOString();
}

function bumpProject(project: Project): Project {
  return { ...project, updatedAt: nowIso() };
}

function updateScenarioResources(
  scenario: Scenario,
  resourceId: ResourceId,
  mutate: (r: Resource) => Resource,
): Scenario {
  const idx = scenario.resources.findIndex((r) => r.id === resourceId);
  if (idx === -1) return scenario;
  const nextResources = scenario.resources.slice();
  nextResources[idx] = mutate(nextResources[idx]);
  return { ...scenario, resources: nextResources, updatedAt: nowIso() };
}

function replaceScenario(scenarios: Scenario[], updated: Scenario): Scenario[] {
  return scenarios.map((s) => (s.id === updated.id ? updated : s));
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  scenarios: [],
  activeScenarioId: null,

  setProject(project, scenarios) {
    set({
      project,
      scenarios,
      activeScenarioId: project.activeScenarioId,
    });
    void storage.save(project);
  },

  setActiveScenario(scenarioId) {
    set({ activeScenarioId: scenarioId });
  },

  reset() {
    set({ project: null, scenarios: [], activeScenarioId: null });
  },

  updateResourceAllocation(scenarioId, resourceId, phaseId, newPct) {
    const state = get();
    if (!state.project) return;

    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const resource = scenario.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    // Look up the current allocation: explicit override or default fallback
    const existing = resource.allocations.find((a) => a.phaseId === phaseId);
    const oldPct = existing ? existing.allocationPct : resource.defaultAllocationPct;
    const cleaned = clampAllocation(newPct);
    if (oldPct === cleaned) return; // No-op; skip audit

    // Update or append the override
    const nextAllocations = existing
      ? resource.allocations.map((a) =>
          a.phaseId === phaseId ? { ...a, allocationPct: cleaned } : a,
        )
      : [...resource.allocations, { phaseId, allocationPct: cleaned }];

    const updatedScenario = updateScenarioResources(scenario, resourceId, (r) => ({
      ...r,
      allocations: nextAllocations,
    }));
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'resource.allocation.update',
      resourceId,
      phaseId,
      oldPct,
      newPct: cleaned,
    });
  },

  updateResourceField(scenarioId, resourceId, field) {
    const state = get();
    if (!state.project) return;

    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const resource = scenario.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    let updatedResource: Resource | null = null;
    let auditAction: Parameters<typeof appendAudit>[2] | null = null;

    switch (field.kind) {
      case 'name': {
        const currentName = resource.name ?? '';
        if (currentName === field.value) return;
        updatedResource = { ...resource, name: field.value };
        auditAction = {
          kind: 'resource.name.update',
          resourceId,
          oldName: currentName,
          newName: field.value,
        };
        break;
      }
      case 'billRate': {
        const next = Math.max(0, field.amount);
        if (resource.billRate.amount === next) return;
        updatedResource = {
          ...resource,
          billRate: { ...resource.billRate, amount: next },
          billRateOverridden: true,
        };
        auditAction = {
          kind: 'resource.rate.update',
          resourceId,
          field: 'billRate',
          oldAmount: resource.billRate.amount,
          newAmount: next,
        };
        break;
      }
      case 'internalCostRate': {
        const next = Math.max(0, field.amount);
        if (resource.internalCostRate.amount === next) return;
        updatedResource = {
          ...resource,
          internalCostRate: { ...resource.internalCostRate, amount: next },
        };
        auditAction = {
          kind: 'resource.rate.update',
          resourceId,
          field: 'internalCostRate',
          oldAmount: resource.internalCostRate.amount,
          newAmount: next,
        };
        break;
      }
      case 'utilizationPct': {
        const next = Math.max(0, Math.min(100, field.value));
        if (resource.utilizationPct === next) return;
        updatedResource = { ...resource, utilizationPct: next };
        auditAction = {
          kind: 'resource.utilization.update',
          resourceId,
          oldPct: resource.utilizationPct,
          newPct: next,
        };
        break;
      }
      case 'hoursPerWeek': {
        const next = Math.max(0, field.value);
        if (resource.hoursPerWeek === next) return;
        updatedResource = { ...resource, hoursPerWeek: next };
        auditAction = {
          kind: 'resource.hoursPerWeek.update',
          resourceId,
          oldHours: resource.hoursPerWeek,
          newHours: next,
        };
        break;
      }
      case 'notes': {
        if ((resource.notes ?? '') === field.value) return;
        updatedResource = { ...resource, notes: field.value };
        auditAction = {
          kind: 'resource.notes.update',
          resourceId,
          oldNotes: resource.notes ?? '',
          newNotes: field.value,
        };
        break;
      }
    }

    if (!updatedResource || !auditAction) return;

    const updatedScenario = updateScenarioResources(
      scenario,
      resourceId,
      () => updatedResource,
    );
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, auditAction);
  },
}));

export function selectActiveScenario(
  state: Pick<ProjectState, 'scenarios' | 'activeScenarioId'>,
): Scenario | null {
  if (!state.activeScenarioId) return null;
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
}
