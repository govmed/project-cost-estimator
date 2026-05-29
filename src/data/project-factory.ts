/**
 * Project factory (M5c).
 *
 * Pure function that takes a wizard input and produces a fresh
 * `{ project, scenarios }` pair ready for the store. No side effects -
 * the factory does not touch storage, the audit log, or React. The
 * `createProject` store action calls this, then commits the result
 * to state.
 *
 * Conservatively defaults FX rates to 1:1 for every supported currency
 * if the user provided only the base. The user can refine these later
 * on the Project Setup screen.
 */

import type {
  Project,
  EngagementType,
  EngagementContext,
  Phase,
} from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { CurrencyCode } from '@/types/money';
import {
  ProjectId as makeProjectId,
  ScenarioId as makeScenarioId,
  PhaseId as makePhaseId,
} from '@/types/ids';

export interface NewProjectInput {
  name: string;
  client: string;
  baseCurrency: CurrencyCode;
  engagementType: EngagementType;
  engagementContext: EngagementContext;
  targetMarginPct: number;
  contingencyPct: number;
  managementReservePct: number;
  /** Phases the wizard captured. Order matters; durationWeeks must be >= 1. */
  phases: WizardPhase[];
}

export interface WizardPhase {
  name: string;
  durationWeeks: number;
}

/** The six standard phases used as the wizard's pre-fill. */
export const DEFAULT_PHASES: WizardPhase[] = [
  { name: 'Discovery', durationWeeks: 4 },
  { name: 'Design', durationWeeks: 6 },
  { name: 'Build', durationWeeks: 16 },
  { name: 'Test', durationWeeks: 6 },
  { name: 'Deploy', durationWeeks: 4 },
  { name: 'Hypercare', durationWeeks: 8 },
];

export interface CreatedProject {
  project: Project;
  scenarios: Scenario[];
}

/**
 * Build a fresh project + a single empty base scenario from wizard input.
 *
 * IDs are derived from a slug of the project name + a timestamp suffix so
 * they're stable within one creation call and unlikely to collide with the
 * seed project. Phases get short, name-derived IDs (`ph_discovery`, etc.)
 * - readable in the audit log.
 */
export function createProjectFromWizard(input: NewProjectInput): CreatedProject {
  const slug = slugify(input.name) || 'project';
  const ts = Date.now();
  const projectIdStr = `proj_${slug}_${ts}`;
  const projectId = makeProjectId(projectIdStr);

  const baseScenarioId = makeScenarioId(`sc_base_${ts}`);

  // Phases get sequential offsetWeeks (cumulative duration of preceding phases),
  // 1-indexed order to match the existing seed convention.
  let cumulative = 0;
  const phases: Phase[] = input.phases.map((p, i) => {
    const dur = Math.max(1, Math.round(p.durationWeeks));
    const phase: Phase = {
      id: makePhaseId(`ph_${slugify(p.name) || `phase${i + 1}`}_${ts}_${i}`),
      name: p.name,
      durationWeeks: dur,
      offsetWeeks: cumulative,
      order: i + 1,
    };
    cumulative += dur;
    return phase;
  });

  const nowIso = new Date().toISOString();

  const project: Project = {
    id: projectId,
    name: input.name.trim(),
    client: input.client.trim(),
    version: '1.0.0',
    status: 'draft',
    engagementType: input.engagementType,
    engagementContext: input.engagementContext,
    baseCurrency: input.baseCurrency,
    fxRates: defaultFxRates(input.baseCurrency),
    targetMarginPct: clampPct(input.targetMarginPct),
    discountPct: 0,
    contingencyPct: clampPct(input.contingencyPct),
    managementReservePct: clampPct(input.managementReservePct),
    phases,
    activeScenarioId: baseScenarioId,
    baseScenarioId: baseScenarioId,
    // Mirror the seed shape - ownerId/orgId are required, use placeholders
    // (the app is single-user / local-storage today, so these are bookkeeping).
    ownerId: 'usr_local' as any,
    orgId: 'org_local' as any,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const baseScenario: Scenario = {
    id: baseScenarioId,
    projectId,
    name: 'Base Case',
    isBase: true,
    order: 1,
    resources: [],
    cloudLineItems: [],
    otherCostLineItems: [],
    assumptions: [],
    overrides: {},
    createdBy: project.ownerId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return { project, scenarios: [baseScenario] };
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function clampPct(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** All 7 supported currencies with a 1.0 entry for the base + reasonable
 *  defaults for the others (mid-2026 rates, user can refine later). */
function defaultFxRates(base: CurrencyCode): Record<CurrencyCode, number> {
  // Rates expressed as: 1 unit of base = N units of target.
  // For non-USD bases we convert via USD as a pivot.
  const usdRates: Record<CurrencyCode, number> = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    INR: 83.5,
    CAD: 1.36,
    AUD: 1.52,
    BRL: 5.10,
  };
  if (base === 'USD') return usdRates;

  // Convert: rate(X, Y) = rate(USD, Y) / rate(USD, X)
  const baseInUsd = 1 / usdRates[base];
  const out = {} as Record<CurrencyCode, number>;
  for (const c of Object.keys(usdRates) as CurrencyCode[]) {
    out[c] = c === base ? 1 : usdRates[c] * baseInUsd;
  }
  return out;
}
