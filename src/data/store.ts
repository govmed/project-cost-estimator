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
import type { Project, Phase, ProjectStatus, EngagementType, EngagementContext } from '@/types/project';
import type { Scenario, MAModeData } from '@/types/scenario';
import type { Resource } from '@/types/resource';
import type {
  CloudLineItem,
  CloudProvider,
  CloudCategory,
  PricingModel,
  Environment,
  RampCurve,
} from '@/types/cloud';
import type {
  OtherCostLineItem,
  OtherCostCategory,
  PricingUnit,
} from '@/types/other-costs';
import type { Money, CurrencyCode } from '@/types/money';
import type {
  ScenarioId,
  ResourceId,
  PhaseId,
  CloudLineItemId,
  OtherCostLineItemId,
} from '@/types/ids';
import { ResourceId as makeResourceId } from '@/types/ids';
import { CloudLineItemId as makeCloudLineItemId } from '@/types/ids';
import { OtherCostLineItemId as makeOtherCostLineItemId } from '@/types/ids';
import { PhaseId as makePhaseId } from '@/types/ids';
import { ScenarioId as makeScenarioId } from '@/types/ids';
import { AssumptionId as makeAssumptionId } from '@/types/ids';
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

export interface NewOtherCostInput {
  category: OtherCostCategory;
  name: string;
  unitCost: Money;
  quantity: number;
  pricingUnit: PricingUnit;
  vendor?: string;
  description?: string;
  userCount?: number;
  phaseId?: PhaseId;
  includeInRunRate?: boolean;
  markupPct?: number;
}

export type OtherCostField =
  | { kind: 'name'; value: string }
  | { kind: 'category'; value: OtherCostCategory }
  | { kind: 'vendor'; value: string }
  | { kind: 'description'; value: string }
  | { kind: 'unitCostAmount'; value: number }
  | { kind: 'quantity'; value: number }
  | { kind: 'pricingUnit'; value: PricingUnit }
  | { kind: 'userCount'; value: number }
  | { kind: 'phaseId'; value: PhaseId | null }
  | { kind: 'includeInRunRate'; value: boolean }
  | { kind: 'markupPct'; value: number }
  | { kind: 'notes'; value: string };

export type ProjectField =
  | { kind: 'name'; value: string }
  | { kind: 'client'; value: string }
  | { kind: 'sowReference'; value: string }
  | { kind: 'version'; value: string }
  | { kind: 'status'; value: ProjectStatus }
  | { kind: 'engagementType'; value: EngagementType }
  | { kind: 'engagementContext'; value: EngagementContext }
  | { kind: 'targetMarginPct'; value: number }
  | { kind: 'discountPct'; value: number }
  | { kind: 'contingencyPct'; value: number }
  | { kind: 'managementReservePct'; value: number };

export type PhaseField =
  | { kind: 'name'; value: string }
  | { kind: 'durationWeeks'; value: number }
  | { kind: 'offsetWeeks'; value: number }
  | { kind: 'order'; value: number }
  | { kind: 'description'; value: string };

export interface NewPhaseInput {
  name: string;
  durationWeeks: number;
  offsetWeeks: number;
  order?: number;
  description?: string;
}

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

  // Other-cost actions (M3c)
  addOtherCostLineItem(scenarioId: ScenarioId, input: NewOtherCostInput): OtherCostLineItemId;
  deleteOtherCostLineItem(scenarioId: ScenarioId, lineItemId: OtherCostLineItemId): void;
  duplicateOtherCostLineItem(scenarioId: ScenarioId, lineItemId: OtherCostLineItemId): OtherCostLineItemId | null;
  updateOtherCostLineItemField(
    scenarioId: ScenarioId,
    lineItemId: OtherCostLineItemId,
    field: OtherCostField,
  ): void;

  // Project / phase / FX edits (M3c)
  updateProjectField(field: ProjectField): void;
  updateFxRate(currency: CurrencyCode, rate: number): void;
  addPhase(input: NewPhaseInput): PhaseId;
  deletePhase(phaseId: PhaseId): void;
  updatePhase(phaseId: PhaseId, field: PhaseField): void;

  // Scenario lifecycle (M4a)
  cloneScenario(fromScenarioId: ScenarioId, newName?: string): ScenarioId | null;
  deleteScenario(scenarioId: ScenarioId): void;
  renameScenario(scenarioId: ScenarioId, newName: string): void;
  setBaseScenario(scenarioId: ScenarioId): void;

  // M&A overlay (M4d). Replaces the scenario's maData wholesale.
  // Pass null to clear.
  updateMAData(scenarioId: ScenarioId, maData: MAModeData | null): void;
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

function updateScenarioOtherCosts(
  scenario: Scenario,
  lineItemId: OtherCostLineItemId,
  mutate: (item: OtherCostLineItem) => OtherCostLineItem,
): Scenario {
  const idx = scenario.otherCostLineItems.findIndex((i) => i.id === lineItemId);
  if (idx === -1) return scenario;
  const next = scenario.otherCostLineItems.slice();
  next[idx] = mutate(next[idx]);
  return { ...scenario, otherCostLineItems: next, updatedAt: nowIso() };
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

function genOtherCostLineItemId(): OtherCostLineItemId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makeOtherCostLineItemId(`oci_${Date.now()}_${random}`);
}

function genPhaseId(): PhaseId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makePhaseId(`phase_${Date.now()}_${random}`);
}

function genScenarioId(): ScenarioId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makeScenarioId(`scn_${Date.now()}_${random}`);
}

function genAssumptionId(): import('@/types/ids').AssumptionId {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return makeAssumptionId(`asm_${Date.now()}_${random}`);
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

  // -----------------------------------------------------------------
  // Other-cost line item actions (M3c)
  // -----------------------------------------------------------------

  addOtherCostLineItem(scenarioId, input) {
    const state = get();
    if (!state.project) return genOtherCostLineItemId();
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return genOtherCostLineItemId();

    const newId = genOtherCostLineItemId();
    const newItem: OtherCostLineItem = {
      id: newId,
      scenarioId,
      category: input.category,
      name: input.name,
      description: input.description,
      vendor: input.vendor,
      unitCost: input.unitCost,
      quantity: input.quantity,
      pricingUnit: input.pricingUnit,
      userCount: input.userCount,
      phaseId: input.phaseId,
      includeInRunRate: input.includeInRunRate ?? false,
      markupPct: input.markupPct,
    };

    const updatedScenario: Scenario = {
      ...scenario,
      otherCostLineItems: [...scenario.otherCostLineItems, newItem],
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'otherCost.add',
      lineItemId: newId,
      item: newItem,
    });
    return newId;
  },

  deleteOtherCostLineItem(scenarioId, lineItemId) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const idx = scenario.otherCostLineItems.findIndex((i) => i.id === lineItemId);
    if (idx === -1) return;
    const removed = scenario.otherCostLineItems[idx];

    const updatedScenario: Scenario = {
      ...scenario,
      otherCostLineItems: scenario.otherCostLineItems.filter((i) => i.id !== lineItemId),
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'otherCost.delete',
      lineItemId,
      item: removed,
    });
  },

  duplicateOtherCostLineItem(scenarioId, lineItemId) {
    const state = get();
    if (!state.project) return null;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    const source = scenario.otherCostLineItems.find((i) => i.id === lineItemId);
    if (!source) return null;

    const newId = genOtherCostLineItemId();
    const copy: OtherCostLineItem = {
      ...source,
      id: newId,
      scenarioId,
      name: `${source.name} (copy)`,
    };

    const sourceIdx = scenario.otherCostLineItems.findIndex((i) => i.id === lineItemId);
    const next = [...scenario.otherCostLineItems];
    next.splice(sourceIdx + 1, 0, copy);

    const updatedScenario: Scenario = {
      ...scenario,
      otherCostLineItems: next,
      updatedAt: nowIso(),
    };
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'otherCost.duplicate',
      fromLineItemId: lineItemId,
      toLineItemId: newId,
      item: copy,
    });
    return newId;
  },

  updateOtherCostLineItemField(scenarioId, lineItemId, field) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const item = scenario.otherCostLineItems.find((i) => i.id === lineItemId);
    if (!item) return;

    let updated: OtherCostLineItem | null = null;
    let oldValue: unknown = null;
    let newValue: unknown = null;

    switch (field.kind) {
      case 'name': {
        if (item.name === field.value) return;
        oldValue = item.name;
        newValue = field.value;
        updated = { ...item, name: field.value };
        break;
      }
      case 'category': {
        if (item.category === field.value) return;
        oldValue = item.category;
        newValue = field.value;
        updated = { ...item, category: field.value };
        break;
      }
      case 'vendor': {
        const cur = item.vendor ?? '';
        if (cur === field.value) return;
        oldValue = cur;
        newValue = field.value;
        updated = { ...item, vendor: field.value || undefined };
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
      case 'unitCostAmount': {
        const next = Math.max(0, field.value);
        if (item.unitCost.amount === next) return;
        oldValue = item.unitCost.amount;
        newValue = next;
        updated = { ...item, unitCost: { ...item.unitCost, amount: next } };
        break;
      }
      case 'quantity': {
        const next = Math.max(0, field.value);
        if (item.quantity === next) return;
        oldValue = item.quantity;
        newValue = next;
        updated = { ...item, quantity: next };
        break;
      }
      case 'pricingUnit': {
        if (item.pricingUnit === field.value) return;
        oldValue = item.pricingUnit;
        newValue = field.value;
        updated = { ...item, pricingUnit: field.value };
        break;
      }
      case 'userCount': {
        const cur = item.userCount ?? 0;
        const next = Math.max(0, Math.round(field.value));
        if (cur === next) return;
        oldValue = cur;
        newValue = next;
        updated = { ...item, userCount: next || undefined };
        break;
      }
      case 'phaseId': {
        const cur = item.phaseId ?? null;
        if (cur === field.value) return;
        oldValue = cur;
        newValue = field.value;
        updated = { ...item, phaseId: field.value ?? undefined };
        break;
      }
      case 'includeInRunRate': {
        if (item.includeInRunRate === field.value) return;
        oldValue = item.includeInRunRate;
        newValue = field.value;
        updated = { ...item, includeInRunRate: field.value };
        break;
      }
      case 'markupPct': {
        const cur = item.markupPct ?? 0;
        const next = Math.max(0, field.value);
        if (cur === next) return;
        oldValue = cur;
        newValue = next;
        updated = { ...item, markupPct: next || undefined };
        break;
      }
      case 'notes': {
        const cur = item.notes ?? '';
        if (cur === field.value) return;
        oldValue = cur;
        newValue = field.value;
        updated = { ...item, notes: field.value || undefined };
        break;
      }
    }

    if (!updated) return;

    const updatedScenario = updateScenarioOtherCosts(scenario, lineItemId, () => updated);
    const nextScenarios = replaceScenario(state.scenarios, updatedScenario);
    const nextProject = bumpProject(state.project);

    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'otherCost.field.update',
      lineItemId,
      field: field.kind,
      oldValue,
      newValue,
    });
  },

  // -----------------------------------------------------------------
  // Project / phase / FX edits (M3c)
  // -----------------------------------------------------------------

  updateProjectField(field) {
    const state = get();
    if (!state.project) return;
    const project = state.project;

    let updated: Project | null = null;
    let oldValue: unknown = null;
    const newValue = field.value;

    switch (field.kind) {
      case 'name':
        if (project.name === field.value) return;
        oldValue = project.name;
        updated = { ...project, name: field.value };
        break;
      case 'client':
        if (project.client === field.value) return;
        oldValue = project.client;
        updated = { ...project, client: field.value };
        break;
      case 'sowReference': {
        const cur = project.sowReference ?? '';
        if (cur === field.value) return;
        oldValue = cur;
        updated = { ...project, sowReference: field.value || undefined };
        break;
      }
      case 'version':
        if (project.version === field.value) return;
        oldValue = project.version;
        updated = { ...project, version: field.value };
        break;
      case 'status':
        if (project.status === field.value) return;
        oldValue = project.status;
        updated = { ...project, status: field.value };
        break;
      case 'engagementType':
        if (project.engagementType === field.value) return;
        oldValue = project.engagementType;
        updated = { ...project, engagementType: field.value };
        break;
      case 'engagementContext':
        if (project.engagementContext === field.value) return;
        oldValue = project.engagementContext;
        updated = { ...project, engagementContext: field.value };
        break;
      case 'targetMarginPct': {
        const next = Math.max(-100, Math.min(99, field.value));
        if (project.targetMarginPct === next) return;
        oldValue = project.targetMarginPct;
        updated = { ...project, targetMarginPct: next };
        break;
      }
      case 'discountPct': {
        const next = Math.max(0, Math.min(100, field.value));
        if (project.discountPct === next) return;
        oldValue = project.discountPct;
        updated = { ...project, discountPct: next };
        break;
      }
      case 'contingencyPct': {
        const next = Math.max(0, Math.min(100, field.value));
        if (project.contingencyPct === next) return;
        oldValue = project.contingencyPct;
        updated = { ...project, contingencyPct: next };
        break;
      }
      case 'managementReservePct': {
        const next = Math.max(0, Math.min(100, field.value));
        if (project.managementReservePct === next) return;
        oldValue = project.managementReservePct;
        updated = { ...project, managementReservePct: next };
        break;
      }
    }

    if (!updated) return;
    const nextProject = bumpProject(updated);
    set({ project: nextProject });
    void storage.save(nextProject);
    appendAudit(nextProject.id, state.activeScenarioId ?? nextProject.activeScenarioId, {
      kind: 'project.field.update',
      field: field.kind,
      oldValue,
      newValue,
    });
  },

  updateFxRate(currency, rate) {
    const state = get();
    if (!state.project) return;
    const project = state.project;
    if (currency === project.baseCurrency) return; // Can't edit base FX (always 1.0)
    const oldRate = project.fxRates[currency] ?? 0;
    const next = Math.max(0, rate);
    if (oldRate === next) return;
    const updated: Project = {
      ...project,
      fxRates: { ...project.fxRates, [currency]: next },
    };
    const nextProject = bumpProject(updated);
    set({ project: nextProject });
    void storage.save(nextProject);
    appendAudit(nextProject.id, state.activeScenarioId ?? nextProject.activeScenarioId, {
      kind: 'project.fx.update',
      currency,
      oldRate,
      newRate: next,
    });
  },

  addPhase(input) {
    const state = get();
    if (!state.project) return genPhaseId();
    const project = state.project;
    const newId = genPhaseId();
    const nextOrder = input.order ?? (project.phases.length + 1);
    const newPhase: Phase = {
      id: newId,
      name: input.name,
      order: nextOrder,
      durationWeeks: input.durationWeeks,
      offsetWeeks: input.offsetWeeks,
      description: input.description,
    };
    const updated: Project = {
      ...project,
      phases: [...project.phases, newPhase].sort((a, b) => a.order - b.order),
    };
    const nextProject = bumpProject(updated);
    set({ project: nextProject });
    void storage.save(nextProject);
    appendAudit(nextProject.id, state.activeScenarioId ?? nextProject.activeScenarioId, {
      kind: 'phase.add',
      phaseId: newId,
      phase: newPhase,
    });
    return newId;
  },

  deletePhase(phaseId) {
    const state = get();
    if (!state.project) return;
    const project = state.project;
    const removed = project.phases.find((p) => p.id === phaseId);
    if (!removed) return;
    const updated: Project = {
      ...project,
      phases: project.phases.filter((p) => p.id !== phaseId),
    };
    const nextProject = bumpProject(updated);
    set({ project: nextProject });
    void storage.save(nextProject);
    appendAudit(nextProject.id, state.activeScenarioId ?? nextProject.activeScenarioId, {
      kind: 'phase.delete',
      phaseId,
      phase: removed,
    });
  },

  updatePhase(phaseId, field) {
    const state = get();
    if (!state.project) return;
    const project = state.project;
    const phase = project.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    let updatedPhase: Phase | null = null;
    let oldValue: unknown = null;
    const newValue = field.value;

    switch (field.kind) {
      case 'name':
        if (phase.name === field.value) return;
        oldValue = phase.name;
        updatedPhase = { ...phase, name: field.value };
        break;
      case 'durationWeeks': {
        const next = Math.max(0, field.value);
        if (phase.durationWeeks === next) return;
        oldValue = phase.durationWeeks;
        updatedPhase = { ...phase, durationWeeks: next };
        break;
      }
      case 'offsetWeeks': {
        const next = Math.max(0, field.value);
        if (phase.offsetWeeks === next) return;
        oldValue = phase.offsetWeeks;
        updatedPhase = { ...phase, offsetWeeks: next };
        break;
      }
      case 'order': {
        const next = Math.max(1, Math.round(field.value));
        if (phase.order === next) return;
        oldValue = phase.order;
        updatedPhase = { ...phase, order: next };
        break;
      }
      case 'description': {
        const cur = phase.description ?? '';
        if (cur === field.value) return;
        oldValue = cur;
        updatedPhase = { ...phase, description: field.value || undefined };
        break;
      }
    }
    if (!updatedPhase) return;

    const updated: Project = {
      ...project,
      phases: project.phases
        .map((p) => (p.id === phaseId ? updatedPhase! : p))
        .sort((a, b) => a.order - b.order),
    };
    const nextProject = bumpProject(updated);
    set({ project: nextProject });
    void storage.save(nextProject);
    appendAudit(nextProject.id, state.activeScenarioId ?? nextProject.activeScenarioId, {
      kind: 'phase.field.update',
      phaseId,
      field: field.kind,
      oldValue,
      newValue,
    });
  },

  // -----------------------------------------------------------------
  // Scenario lifecycle (M4a)
  // -----------------------------------------------------------------

  cloneScenario(fromScenarioId, newName) {
    const state = get();
    if (!state.project) return null;
    const source = state.scenarios.find((s) => s.id === fromScenarioId);
    if (!source) return null;

    const newId = genScenarioId();
    const projectId = state.project.id;

    // Deep-clone every nested item with a fresh ID and rewritten scenarioId.
    // Without this, edits in the clone would mutate the source via shared refs.
    const newResources: Resource[] = source.resources.map((r) => ({
      ...r,
      id: genResourceId(),
      scenarioId: newId,
      allocations: r.allocations.map((a) => ({ ...a })),
    }));
    const newCloudItems: CloudLineItem[] = source.cloudLineItems.map((c) => ({
      ...c,
      id: genCloudLineItemId(),
      scenarioId: newId,
    }));
    const newOtherCosts: OtherCostLineItem[] = source.otherCostLineItems.map((o) => ({
      ...o,
      id: genOtherCostLineItemId(),
      scenarioId: newId,
    }));
    const newAssumptions = source.assumptions.map((a) => ({
      ...a,
      id: genAssumptionId(),
      scenarioId: newId,
    }));

    const maxOrder = state.scenarios.reduce((acc, s) => Math.max(acc, s.order), 0);
    const finalName = newName?.trim() || `${source.name} (copy)`;

    const newScenario: Scenario = {
      ...source,
      id: newId,
      projectId,
      name: finalName,
      isBase: false,                 // clones are never base
      parentScenarioId: source.id,
      order: maxOrder + 1,
      resources: newResources,
      cloudLineItems: newCloudItems,
      otherCostLineItems: newOtherCosts,
      assumptions: newAssumptions,
      overrides: { ...source.overrides },
      maData: source.maData ? { ...source.maData } : undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const nextScenarios = [...state.scenarios, newScenario];
    const nextProject = bumpProject(state.project);
    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, fromScenarioId, {
      kind: 'scenario.clone',
      fromScenarioId,
      toScenarioId: newId,
      name: finalName,
    });
    return newId;
  },

  deleteScenario(scenarioId) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    // Refuse to delete the last scenario or the base scenario.
    if (state.scenarios.length <= 1) return;
    if (scenario.isBase) return;

    const nextScenarios = state.scenarios.filter((s) => s.id !== scenarioId);

    // If the deleted scenario was active, switch to base.
    let nextActiveId = state.activeScenarioId;
    if (nextActiveId === scenarioId) {
      nextActiveId = state.project.baseScenarioId;
    }

    const nextProject: Project = {
      ...state.project,
      activeScenarioId: nextActiveId ?? state.project.baseScenarioId,
      updatedAt: nowIso(),
    };

    set({
      project: nextProject,
      scenarios: nextScenarios,
      activeScenarioId: nextActiveId,
    });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'scenario.delete',
      scenarioId,
      name: scenario.name,
    });
  },

  renameScenario(scenarioId, newName) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === scenario.name) return;

    const oldName = scenario.name;
    const updated: Scenario = { ...scenario, name: trimmed, updatedAt: nowIso() };
    const nextScenarios = state.scenarios.map((s) =>
      s.id === scenarioId ? updated : s,
    );
    const nextProject = bumpProject(state.project);
    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'scenario.rename',
      scenarioId,
      oldName,
      newName: trimmed,
    });
  },

  setBaseScenario(scenarioId) {
    const state = get();
    if (!state.project) return;
    const target = state.scenarios.find((s) => s.id === scenarioId);
    if (!target) return;
    if (state.project.baseScenarioId === scenarioId) return; // no-op

    const oldBaseId = state.project.baseScenarioId;
    const nextScenarios = state.scenarios.map((s) => {
      if (s.id === scenarioId) return { ...s, isBase: true, updatedAt: nowIso() };
      if (s.isBase) return { ...s, isBase: false, updatedAt: nowIso() };
      return s;
    });
    const nextProject: Project = {
      ...state.project,
      baseScenarioId: scenarioId,
      updatedAt: nowIso(),
    };
    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);
    appendAudit(nextProject.id, scenarioId, {
      kind: 'scenario.setBase',
      oldBaseScenarioId: oldBaseId,
      newBaseScenarioId: scenarioId,
    });
  },

  // -----------------------------------------------------------------
  // M&A overlay (M4d)
  // -----------------------------------------------------------------

  updateMAData(scenarioId, maData) {
    const state = get();
    if (!state.project) return;
    const scenario = state.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const oldData = scenario.maData;
    // No-op if no change. Shallow equality check on JSON is good enough for these
    // small POJOs and avoids spurious updates / audit entries.
    if (JSON.stringify(oldData) === JSON.stringify(maData)) return;

    const updated: Scenario = {
      ...scenario,
      maData: maData ?? undefined,
      updatedAt: nowIso(),
    };
    const nextScenarios = state.scenarios.map((s) =>
      s.id === scenarioId ? updated : s,
    );
    const nextProject = bumpProject(state.project);
    set({ project: nextProject, scenarios: nextScenarios });
    void storage.save(nextProject);

    if (maData) {
      appendAudit(nextProject.id, scenarioId, {
        kind: 'scenario.maData.set',
        scenarioId,
        mode: maData.mode,
        data: maData,
      });
    } else {
      appendAudit(nextProject.id, scenarioId, {
        kind: 'scenario.maData.clear',
        scenarioId,
        oldData,
      });
    }
  },
}));

export function selectActiveScenario(
  state: Pick<ProjectState, 'scenarios' | 'activeScenarioId'>,
): Scenario | null {
  if (!state.activeScenarioId) return null;
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
}
