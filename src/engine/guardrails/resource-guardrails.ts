/**
 * Resource Planner guardrails.
 *
 * Each rule is a pure function that takes a Project + Scenario + ScenarioTotals
 * and returns either null (no warning) or a Guardrail describing what's wrong.
 *
 * The strip at the bottom of the Resource Planner shows all firing rules.
 * Each rule maps to a specific defensibility risk from Deliverable #9.
 *
 * M2c ships three rules. Future milestones can add more without touching
 * the table or the page (just append to RESOURCE_GUARDRAIL_RULES).
 */

import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { ScenarioTotals } from '@/engine/types';

export type GuardrailSeverity = 'info' | 'warn' | 'bad';

export interface Guardrail {
  id: string;
  severity: GuardrailSeverity;
  title: string;
  message: string;
  /** Which line of attack from #9 this defends against. */
  defendsAgainst: string;
}

export type GuardrailRule = (
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
) => Guardrail | null;

const OFFSHORE_PREFIXES = ['India-', 'Philippines-', 'Vietnam-'];
const ONSHORE_PREFIXES = ['US-', 'CA-', 'EU-', 'UK-'];
const ONSHORE_LEAD_LEVELS = ['Senior', 'Advisor', 'Principal'];

const OFFSHORE_RATIO_THRESHOLD = 0.5;    // >50% offshore -> warn
const MARGIN_FLOOR_PCT = 15;             // <15% realized margin -> bad

function isOffshoreGeo(geo: string): boolean {
  return OFFSHORE_PREFIXES.some((p) => geo.startsWith(p));
}
function isOnshoreGeo(geo: string): boolean {
  return ONSHORE_PREFIXES.some((p) => geo.startsWith(p));
}

/** Rule 1: offshore ratio > 50% of resource cost. */
export const offshoreHeavyRule: GuardrailRule = (_project, _scenario, totals) => {
  let offshore = 0;
  let total = 0;
  for (const [geo, money] of Object.entries(totals.byGeography)) {
    total += money.amount;
    if (isOffshoreGeo(geo)) offshore += money.amount;
  }
  if (total === 0) return null;
  const ratio = offshore / total;
  if (ratio <= OFFSHORE_RATIO_THRESHOLD) return null;
  return {
    id: 'offshore_heavy',
    severity: 'warn',
    title: 'Offshore-heavy mix',
    message: `Offshore is ${(ratio * 100).toFixed(0)}% of resource cost (threshold ${(OFFSHORE_RATIO_THRESHOLD * 100).toFixed(0)}%). Have a non-offshore-heavy alternative scenario ready before pricing conversations.`,
    defendsAgainst: 'Attack #2: "Your offshore mix is too aggressive"',
  };
};

/** Rule 2: realized margin below floor. */
export const marginBelowFloorRule: GuardrailRule = (_project, _scenario, totals) => {
  const m = totals.realizedMarginPct;
  if (m >= MARGIN_FLOOR_PCT) return null;
  return {
    id: 'margin_below_floor',
    severity: m < 0 ? 'bad' : 'warn',
    title: m < 0 ? 'Negative margin' : 'Margin below floor',
    message: `Realized margin is ${m.toFixed(1)}% (floor ${MARGIN_FLOOR_PCT}%). Check discount, contingency, and rate overrides before sharing this number.`,
    defendsAgainst: 'Attack #6: "Your margin is too high" → discounted too far',
  };
};

/** Rule 3: no onshore lead at Senior+ in any onshore geo. */
export const missingOnshoreLeadRule: GuardrailRule = (_project, scenario) => {
  const hasOnshoreLead = scenario.resources.some(
    (r) => isOnshoreGeo(r.geography) && ONSHORE_LEAD_LEVELS.includes(r.skillLevel),
  );
  if (hasOnshoreLead) return null;
  if (scenario.resources.length === 0) return null;
  return {
    id: 'missing_onshore_lead',
    severity: 'warn',
    title: 'No onshore lead',
    message: `No Senior+ resource in US / CA / EU / UK. Most clients expect a senior onshore lead even on offshore-heavy engagements.`,
    defendsAgainst: 'Attack #2: client expects an onshore point of contact',
  };
};

export const RESOURCE_GUARDRAIL_RULES: GuardrailRule[] = [
  offshoreHeavyRule,
  marginBelowFloorRule,
  missingOnshoreLeadRule,
];

export function evaluateGuardrails(
  project: Project,
  scenario: Scenario,
  totals: ScenarioTotals,
): Guardrail[] {
  const result: Guardrail[] = [];
  for (const rule of RESOURCE_GUARDRAIL_RULES) {
    const fired = rule(project, scenario, totals);
    if (fired) result.push(fired);
  }
  return result;
}
