/**
 * Resource guardrail rule tests.
 *
 * Each rule is a pure function over (Project, Scenario, ScenarioTotals).
 * We synthesize minimal test inputs rather than going through the full
 * engine, so these tests are fast and focused on the rule logic.
 */

import { describe, it, expect } from 'vitest';
import {
  offshoreHeavyRule,
  marginBelowFloorRule,
  missingOnshoreLeadRule,
  evaluateGuardrails,
} from '../../src/engine/guardrails/resource-guardrails';
import type { Project } from '../../src/types/project';
import type { Scenario } from '../../src/types/scenario';
import type { Resource } from '../../src/types/resource';
import type { ScenarioTotals } from '../../src/engine/types';

// Minimal fixtures - cast through unknown to avoid filling every required field.
const project = {} as Project;

function makeResource(
  geography: Resource['geography'],
  skillLevel: Resource['skillLevel'],
): Resource {
  return {
    geography,
    skillLevel,
    role: 'Software Engineer',
    id: 'r1' as Resource['id'],
    scenarioId: 's1' as Resource['scenarioId'],
    defaultAllocationPct: 100,
    allocations: [],
    billRate: { amount: 200, currency: 'USD' },
    internalCostRate: { amount: 120, currency: 'USD' },
    hoursPerWeek: 40,
    utilizationPct: 80,
    billRateOverridden: false,
  } as Resource;
}

function makeScenario(resources: Resource[]): Scenario {
  return { resources } as unknown as Scenario;
}

function makeTotals(
  byGeographyDollars: Record<string, number>,
  realizedMarginPct = 25,
): ScenarioTotals {
  const byGeography: ScenarioTotals['byGeography'] = {};
  for (const [g, amount] of Object.entries(byGeographyDollars)) {
    byGeography[g] = { amount, currency: 'USD' };
  }
  return {
    byGeography,
    realizedMarginPct,
  } as unknown as ScenarioTotals;
}

describe('offshoreHeavyRule', () => {
  it('fires when offshore > 50% of resource cost', () => {
    const totals = makeTotals({ 'US-Onshore': 100, 'India-Offshore': 200 });
    const result = offshoreHeavyRule(project, makeScenario([]), totals);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('warn');
    expect(result?.id).toBe('offshore_heavy');
  });

  it('does not fire at exactly 50%', () => {
    const totals = makeTotals({ 'US-Onshore': 100, 'India-Offshore': 100 });
    const result = offshoreHeavyRule(project, makeScenario([]), totals);
    expect(result).toBeNull();
  });

  it('does not fire with no offshore', () => {
    const totals = makeTotals({ 'US-Onshore': 1000 });
    expect(offshoreHeavyRule(project, makeScenario([]), totals)).toBeNull();
  });

  it('Philippines and Vietnam count as offshore', () => {
    const totals = makeTotals({
      'US-Onshore': 100,
      'Philippines-Offshore': 150,
      'Vietnam-Offshore': 100,
    });
    expect(offshoreHeavyRule(project, makeScenario([]), totals)).not.toBeNull();
  });
});

describe('marginBelowFloorRule', () => {
  it('fires when margin < 15%', () => {
    const totals = makeTotals({ 'US-Onshore': 100 }, 10);
    const result = marginBelowFloorRule(project, makeScenario([]), totals);
    expect(result?.severity).toBe('warn');
  });

  it('escalates to bad when margin < 0', () => {
    const totals = makeTotals({ 'US-Onshore': 100 }, -5);
    const result = marginBelowFloorRule(project, makeScenario([]), totals);
    expect(result?.severity).toBe('bad');
  });

  it('does not fire at exactly 15%', () => {
    const totals = makeTotals({ 'US-Onshore': 100 }, 15);
    expect(marginBelowFloorRule(project, makeScenario([]), totals)).toBeNull();
  });
});

describe('missingOnshoreLeadRule', () => {
  it('fires when only offshore Associates exist', () => {
    const totals = makeTotals({ 'India-Offshore': 100 });
    const scenario = makeScenario([makeResource('India-Offshore', 'Associate')]);
    expect(missingOnshoreLeadRule(project, scenario, totals)).not.toBeNull();
  });

  it('does not fire when there is a Senior US-Onshore', () => {
    const totals = makeTotals({ 'US-Onshore': 100 });
    const scenario = makeScenario([makeResource('US-Onshore', 'Senior')]);
    expect(missingOnshoreLeadRule(project, scenario, totals)).toBeNull();
  });

  it('does not fire when there is an EU-Onshore Advisor', () => {
    const totals = makeTotals({ 'EU-Onshore': 100 });
    const scenario = makeScenario([makeResource('EU-Onshore', 'Advisor')]);
    expect(missingOnshoreLeadRule(project, scenario, totals)).toBeNull();
  });

  it('does not fire with empty resource list (vacuously fine)', () => {
    const totals = makeTotals({});
    expect(missingOnshoreLeadRule(project, makeScenario([]), totals)).toBeNull();
  });

  it('fires when only US-Onshore Associates exist (no senior)', () => {
    const totals = makeTotals({ 'US-Onshore': 100 });
    const scenario = makeScenario([makeResource('US-Onshore', 'Associate')]);
    expect(missingOnshoreLeadRule(project, scenario, totals)).not.toBeNull();
  });
});

describe('evaluateGuardrails', () => {
  it('returns all firing rules', () => {
    // Offshore-heavy + low margin + no onshore lead
    const totals = makeTotals(
      { 'India-Offshore': 1000 },
      5,
    );
    const scenario = makeScenario([makeResource('India-Offshore', 'Associate')]);
    const result = evaluateGuardrails(project, scenario, totals);
    expect(result).toHaveLength(3);
  });

  it('returns empty when all rules pass', () => {
    const totals = makeTotals({ 'US-Onshore': 1000 }, 25);
    const scenario = makeScenario([makeResource('US-Onshore', 'Senior')]);
    expect(evaluateGuardrails(project, scenario, totals)).toEqual([]);
  });
});
