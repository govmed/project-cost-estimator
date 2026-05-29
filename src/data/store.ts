/**
 * Project store - the single source of truth for "what is the user viewing."
 *
 * Holds the Project, its scenarios, and which scenario is active. Engine
 * output is NOT stored here - it's derived via calculate() at the component
 * boundary.
 *
 * M2b added resource edit actions: updateResourceAllocation, updateResourceField.
 * M2c added resource lifecycle: addResource, deleteResource, duplicateResource.
 * M3b adds cloud line item lifecycle + field updates.
 *
 * Persistence is via the Storage interface; LocalStorageProvider in Phase 1,
 * BackendApiProvider in Phase 2.
 */

import { create } from 'zustand';
import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { Resource } from '@/types/resource';
import type {
  CloudLineItem,
  CloudProvider,
  CloudCategory,
  PricingModel,
  Environment,
  RampCurve,
} from '@/types/cloud';
import type { Money } from '@/types/money';
import type {
  ScenarioId,
  ResourceId,
  PhaseId,
  CloudLineItemId,
} from '@/types/ids';
import { ResourceId as makeResourceId } from '@/types/ids';
import { CloudLineItemId as makeCloudLineItemId } from '@/types/ids';
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

export interface NewResourceInput {
  role: Resource['role'];
  skillLevel: Resource['skillLevel'];
  geography: Resource['geography'];
  billRate: Resource['billRate'];
  internalCostRate: Resource['internalCostRate'];
  name?: string;
  defaultAllocationPct?: number;
}

export interface NewCloudLineItemInput {
  provider: CloudProvider;
  category: CloudCategory;
  service: string;
  sku?: string;
  region: string;
  pricingModel: PricingModel;
  environment: Environment;
  environmentMultiplier: number;
  unitCost: Money;
  quantity: number;
  unitName: string;
  rampCurve?: RampCurve;
  includeInRunRate?: boolean;
  description?: string;
}

export type CloudLineItemField =
  | { kind: 'service'; value: string }
  | { kind: 'sku'; value: string }
  | { kind: 'region'; value: string }
  | { kind: 'category'; value: CloudCategory }
  | { kind: 'pricingModel'; value: PricingModel }
  | { kind: 'environment'; value: Environment }
  | { kind: 'environmentMultiplier'; value: number }
  | { kind: 'unitCostAmount'; value: number }
  | { kind: 'quantity'; value: number }
  | { kind: 'unitName'; value: string }
  | { kind: 'rampCurve'; value: RampCurve }
  | { kind: 'includeInRunRate'; value: boolean }
  | { kind: 'description'; value: string };

interface ProjectState {
  project: Project | null;
  scenarios: Scenario[];
  activeScenarioId: ScenarioId | null;

  setProject(project: Project, scenarios: Scenario[]): void;
  setActiveScenario(scenarioId: ScenarioId): void;
  reset(): void;

  // Resource actions (M2b/M2c)
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
  addResource(scenarioId: ScenarioId, input: NewResourceInput): ResourceId;
  deleteResource(scenarioId: ScenarioId, resourceId: ResourceId): void;
  duplicateResource(scenarioId: ScenarioId, resourceId: ResourceId): ResourceId | null;

  // Cloud line item actions (M3b)
  addCloudLineItem(scenarioId: ScenarioId, input: NewCloudLineItemInput): CloudLineItemId;
  deleteCloudLineItem(scenarioId: ScenarioId, lineItemId: CloudLineItemId): void;
  duplicateCloudLineItem(scenarioId: ScenarioId, lineItemId: CloudLineItemId): CloudLineItemId | null;
  updateCloudLineItemField(
    scenarioId: ScenarioId,
    lineItemId: CloudLineItemId,
    field: CloudLineItemField,
  ): void;
}

function clampAllocation(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
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

function updateScenarioCloudItems(
  scenario: Scenario,
  lineItemId: CloudLineItemId,
  mutate: (item: CloudLineItem) => CloudLineItem,
): Scenario {
  const idx = scenario.cloudLineItems.findIndex((i) => i.id === lineItemId);
  if (idx === -1) return scenario;
  const next = scenario.cloudLineItems.slice();
  next[idx] = mutate(next[idx]);
  return { ...scenario, cloudLineItems: next, updatedAt: nowIso() };
}

function replaceScenario(scenarios: Scenario[], updated: Scenario): Scenario[] {
  return scenarios.map((s) => (s.id === updated.id ? updated : s));
}

function genResourceId(): ResourceId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makeResourceId(`res_${Date.now()}_${random}`);
}

function genCloudLineItemId(): CloudLineItemId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makeCloudLineItemId(`cli_${Date.now()}_${random}`);
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

    const existing = resource.allocations.find((a) => a.phaseId === phaseId);
    const oldPct = existing ? existing.allocationPct : resource.defaultAllocationPct;
    const cleaned = clampAllocation(newPct);
    if (oldPct === cleaned) return;

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
        auditAction = { kind: 'resource.name.update', resourceId, oldName: currentName, newName: field.value };
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
        auditAction = { kind: 'resource.rate.update', resourceId, field: 'billRate', oldAmount: resource.billRate.amount, newAmount: next };
        break;
      }
      case 'internalCostRate': {
        const next = Math.max(0, field.amount);
        if (resource.internalCostRate.amount === next) return;
        updatedResource = { ...resource, internalCostRate: { ...resource.internalCostRate, amount: next } };
        auditAction = { kind: 'resource.rate.update', resourceId, field: 'internalCostRate', oldAmount: resource.internalCostRate.amount, newAmount: next };
        break;
      }
      case 'utilizationPct': {
        const next = Math.max(0, Math.min(100, field.value));
        if (resource.utilizationPct === next) return;
        updatedResource = { ...resource, utilizationPct: next };
        auditAction = { kind: 'resource.utilization.update', resourceId, oldPct: resource.utilizationPct, newPct: next };
        break;
      }
      case 'hoursPerWeek': {
        const next = Math.max(0, field.value);
        if (resource.hoursPerWeek === next) return;
        updatedResource = { ...resource, hoursPerWeek: next };
        auditAction = { kind: 'resource.hoursPerWeek.update', resourceId, oldHours: resource.hoursPerWeek, newHours: next };
        break;
      }
      case 'notes': {
        if ((resource.notes ?? '') === field.value) return;
        updatedResource = { ...resource, notes: field.value };
        auditAction = { kind: 'resource.notes.update', resourceId, oldNotes: resource.notes ?? '', newNotes: field.value };
        break;
      }
    }

    if (!updatedResource || !auditAction) return;

    const updatedScenario = updateScenarioResources(scenario, resourceId, () => updatedResource);
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, auditAction);
  },

  addResource(scenarioId, input) {
    const state = get();
    if (!state.project) return genResourceId();
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return genResourceId();

    const newId = genResourceId();
    const newResource: Resource = {
      id: newId,
      scenarioId,
      role: input.role,
      skillLevel: input.skillLevel,
      geography: input.geography,
      defaultAllocationPct: input.defaultAllocationPct ?? 100,
      allocations: [],
      billRate: input.billRate,
      internalCostRate: input.internalCostRate,
      hoursPerWeek: 40,
      utilizationPct: 80,
      name: input.name,
      billRateOverridden: false,
    };

    const updatedScenario: Scenario = {
      ...scenario,
      resources: [...scenario.resources, newResource],
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, { kind: 'resource.add', resourceId: newId, resource: newResource });
    return newId;
  },

  deleteResource(scenarioId, resourceId) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const idx = scenario.resources.findIndex((r) => r.id === resourceId);
    if (idx === -1) return;
    const removed = scenario.resources[idx];

    const updatedScenario: Scenario = {
      ...scenario,
      resources: scenario.resources.filter((r) => r.id !== resourceId),
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, { kind: 'resource.delete', resourceId, resource: removed });
  },

  duplicateResource(scenarioId, resourceId) {
    const state = get();
    if (!state.project) return null;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    const source = scenario.resources.find((r) => r.id === resourceId);
    if (!source) return null;

    const newId = genResourceId();
    const copy: Resource = {
      ...source,
      id: newId,
      scenarioId,
      allocations: source.allocations.map((a) => ({ ...a })),
      name: source.name ? `${source.name} (copy)` : undefined,
    };

    const sourceIdx = scenario.resources.findIndex((r) => r.id === resourceId);
    const nextResources = [...scenario.resources];
    nextResources.splice(sourceIdx + 1, 0, copy);

    const updatedScenario: Scenario = {
      ...scenario,
      resources: nextResources,
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'resource.duplicate',
      fromResourceId: resourceId,
      toResourceId: newId,
      resource: copy,
    });
    return newId;
  },

  // -----------------------------------------------------------------
  // Cloud line item actions (M3b)
  // -----------------------------------------------------------------

  addCloudLineItem(scenarioId, input) {
    const state = get();
    if (!state.project) return genCloudLineItemId();
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return genCloudLineItemId();

    const newId = genCloudLineItemId();
    const newItem: CloudLineItem = {
      id: newId,
      scenarioId,
      provider: input.provider,
      category: input.category,
      service: input.service,
      sku: input.sku,
      region: input.region,
      pricingModel: input.pricingModel,
      environment: input.environment,
      environmentMultiplier: input.environmentMultiplier,
      unitCost: input.unitCost,
      quantity: input.quantity,
      unitName: input.unitName,
      rampCurve: input.rampCurve ?? 'flat',
      includeInRunRate: input.includeInRunRate ?? (input.environment === 'prod'),
      description: input.description,
      unitCostOverridden: false,
    };

    const updatedScenario: Scenario = {
      ...scenario,
      cloudLineItems: [...scenario.cloudLineItems, newItem],
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'cloud.add',
      lineItemId: newId,
      item: newItem,
    });
    return newId;
  },

  deleteCloudLineItem(scenarioId, lineItemId) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const idx = scenario.cloudLineItems.findIndex((i) => i.id === lineItemId);
    if (idx === -1) return;
    const removed = scenario.cloudLineItems[idx];

    const updatedScenario: Scenario = {
      ...scenario,
      cloudLineItems: scenario.cloudLineItems.filter((i) => i.id !== lineItemId),
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'cloud.delete',
      lineItemId,
      item: removed,
    });
  },

  duplicateCloudLineItem(scenarioId, lineItemId) {
    const state = get();
    if (!state.project) return null;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    const source = scenario.cloudLineItems.find((i) => i.id === lineItemId);
    if (!source) return null;

    const newId = genCloudLineItemId();
    const copy: CloudLineItem = {
      ...source,
      id: newId,
      scenarioId,
      description: source.description ? `${source.description} (copy)` : undefined,
    };

    const sourceIdx = scenario.cloudLineItems.findIndex((i) => i.id === lineItemId);
    const next = [...scenario.cloudLineItems];
    next.splice(sourceIdx + 1, 0, copy);

    const updatedScenario: Scenario = {
      ...scenario,
      cloudLineItems: next,
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'cloud.duplicate',
      fromLineItemId: lineItemId,
      toLineItemId: newId,
      item: copy,
    });
    return newId;
  },

  updateCloudLineItemField(scenarioId, lineItemId, field) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const item = scenario.cloudLineItems.find((i) => i.id === lineItemId);
    if (!item) return;

    let updated: CloudLineItem | null = null;
    let oldValue: unknown = null;
    let newValue: unknown = null;

    switch (field.kind) {
      case 'service': {
        if (item.service === field.value) return;
        oldValue = item.service;
        newValue = field.value;
        updated = { ...item, service: field.value };
        break;
      }
      case 'sku': {
        const currentSku = item.sku ?? '';
        if (currentSku === field.value) return;
        oldValue = currentSku;
        newValue = field.value;
        updated = { ...item, sku: field.value || undefined };
        break;
      }
      case 'region': {
        if (item.region === field.value) return;
        oldValue = item.region;
        newValue = field.value;
        updated = { ...item, region: field.value };
        break;
      }
      case 'category': {
        if (item.category === field.value) return;
        oldValue = item.category;
        newValue = field.value;
        updated = { ...item, category: field.value };
        break;
      }
      case 'pricingModel': {
        if (item.pricingModel === field.value) return;
        oldValue = item.pricingModel;
        newValue = field.value;
        updated = { ...item, pricingModel: field.value };
        break;
      }
      case 'environment': {
        if (item.environment === field.value) return;
        oldValue = item.environment;
        newValue = field.value;
        updated = { ...item, environment: field.value };
        break;
      }
      case 'environmentMultiplier': {
        const next = Math.max(0, field.value);
        if (item.environmentMultiplier === next) return;
        oldValue = item.environmentMultiplier;
        newValue = next;
        updated = { ...item, environmentMultiplier: next };
        break;
      }
      case 'unitCostAmount': {
        const next = Math.max(0, field.value);
        if (item.unitCost.amount === next) return;
        oldValue = item.unitCost.amount;
        newValue = next;
        updated = {
          ...item,
          unitCost: { ...item.unitCost, amount: next },
          unitCostOverridden: true,
        };
        break;
      }
      case 'quantity': {
        const next = Math.max(0, Math.round(field.value));
        if (item.quantity === next) return;
        oldValue = item.quantity;
        newValue = next;
        updated = { ...item, quantity: next };
        break;
      }
      case 'unitName': {
        if (item.unitName === field.value) return;
        oldValue = item.unitName;
        newValue = field.value;
        updated = { ...item, unitName: field.value };
        break;
      }
      case 'rampCurve': {
        if (item.rampCurve === field.value) return;
        oldValue = item.rampCurve;
        newValue = field.value;
        updated = { ...item, rampCurve: field.value };
        break;
      }
      case 'includeInRunRate': {
        if (item.includeInRunRate === field.value) return;
        oldValue = item.includeInRunRate;
        newValue = field.value;
        updated = { ...item, includeInRunRate: field.value };
        break;
      }
      case 'description': {
        const cur = item.description ?? '';
        if (cur === field.value) return;
        oldValue = cur;
        newValue = field.value;
        updated = { ...item, description: field.value || undefined };
        break;
      }
    }

    if (!updated) return;

    const updatedScenario = updateScenarioCloudItems(scenario, lineItemId, () => updated);
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'cloud.field.update',
      lineItemId,
      field: field.kind,
      oldValue,
      newValue,
    });
  },
}));

export function selectActiveScenario(
  state: Pick<ProjectState, 'scenarios' | 'activeScenarioId'>,
): Scenario | null {
  if (!state.activeScenarioId) return null;
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
}
