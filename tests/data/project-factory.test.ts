/**
 * project-factory unit tests (M5c).
 *
 * The factory is pure (no I/O), so these are fast and deterministic.
 * We cover:
 *  - shape correctness (Project + base Scenario, required fields present)
 *  - phase ordering: offsetWeeks is cumulative, order is 1-indexed
 *  - FX rate generation: base currency is 1.0, USD pivot for non-USD bases
 *  - input clamping: target margin > 99 capped, durationWeeks < 1 raised, etc.
 *  - ID stability: IDs include a slug from the name and a timestamp
 */

import { describe, it, expect } from 'vitest';
import {
  createProjectFromWizard,
  DEFAULT_PHASES,
  type NewProjectInput,
} from '@/data/project-factory';

function input(overrides: Partial<NewProjectInput> = {}): NewProjectInput {
  return {
    name: 'Test Project',
    client: 'Test Client',
    baseCurrency: 'USD',
    engagementType: 'FixedFee',
    engagementContext: 'Modernization',
    targetMarginPct: 25,
    contingencyPct: 8,
    managementReservePct: 0,
    phases: [...DEFAULT_PHASES],
    ...overrides,
  };
}

describe('createProjectFromWizard - shape', () => {
  it('returns a Project + exactly one base scenario', () => {
    const { project, scenarios } = createProjectFromWizard(input());
    expect(project).toBeDefined();
    expect(scenarios.length).toBe(1);
    expect(scenarios[0].isBase).toBe(true);
    expect(scenarios[0].name).toBe('Base Case');
  });

  it('the base scenario\'s projectId matches the project id', () => {
    const { project, scenarios } = createProjectFromWizard(input());
    expect(scenarios[0].projectId).toBe(project.id);
  });

  it('Project.baseScenarioId and activeScenarioId both point at the base', () => {
    const { project, scenarios } = createProjectFromWizard(input());
    expect(project.baseScenarioId).toBe(scenarios[0].id);
    expect(project.activeScenarioId).toBe(scenarios[0].id);
  });

  it('base scenario starts empty (no resources, cloud, or other costs)', () => {
    const { scenarios } = createProjectFromWizard(input());
    expect(scenarios[0].resources).toEqual([]);
    expect(scenarios[0].cloudLineItems).toEqual([]);
    expect(scenarios[0].otherCostLineItems).toEqual([]);
    expect(scenarios[0].assumptions).toEqual([]);
  });

  it('trims whitespace on name and client', () => {
    const { project } = createProjectFromWizard(
      input({ name: '  Trimmed  ', client: '  Client  ' }),
    );
    expect(project.name).toBe('Trimmed');
    expect(project.client).toBe('Client');
  });
});

describe('createProjectFromWizard - phases', () => {
  it('default phases produce 1-indexed order and cumulative offsetWeeks', () => {
    const { project } = createProjectFromWizard(input());
    expect(project.phases.length).toBe(DEFAULT_PHASES.length);

    // First phase: order=1, offset=0
    expect(project.phases[0].order).toBe(1);
    expect(project.phases[0].offsetWeeks).toBe(0);

    // Second phase: offset = first phase's duration
    expect(project.phases[1].offsetWeeks).toBe(DEFAULT_PHASES[0].durationWeeks);

    // Last phase: offset is cumulative through n-1 durations
    const lastIdx = project.phases.length - 1;
    const expectedLastOffset = DEFAULT_PHASES.slice(0, lastIdx).reduce(
      (acc, p) => acc + p.durationWeeks,
      0,
    );
    expect(project.phases[lastIdx].offsetWeeks).toBe(expectedLastOffset);
  });

  it('phase IDs contain slugified names', () => {
    const { project } = createProjectFromWizard(input());
    expect(project.phases[0].id).toMatch(/^ph_discovery_/);
    expect(project.phases[1].id).toMatch(/^ph_design_/);
    expect(project.phases[2].id).toMatch(/^ph_build_/);
  });

  it('raises sub-1 durationWeeks to 1', () => {
    const { project } = createProjectFromWizard(
      input({
        phases: [
          { name: 'Tiny', durationWeeks: 0 },
          { name: 'Negative', durationWeeks: -3 },
        ],
      }),
    );
    expect(project.phases[0].durationWeeks).toBe(1);
    expect(project.phases[1].durationWeeks).toBe(1);
  });

  it('rounds fractional durations', () => {
    const { project } = createProjectFromWizard(
      input({ phases: [{ name: 'A', durationWeeks: 3.4 }] }),
    );
    expect(project.phases[0].durationWeeks).toBe(3);
  });
});

describe('createProjectFromWizard - FX rates', () => {
  it('USD base: USD = 1.0 and other currencies have nonzero rates', () => {
    const { project } = createProjectFromWizard(input({ baseCurrency: 'USD' }));
    expect(project.fxRates.USD).toBe(1);
    expect(project.fxRates.EUR).toBeGreaterThan(0);
    expect(project.fxRates.INR).toBeGreaterThan(50);
  });

  it('EUR base: EUR = 1.0; rates are recomputed via USD pivot', () => {
    const { project } = createProjectFromWizard(input({ baseCurrency: 'EUR' }));
    expect(project.fxRates.EUR).toBe(1);
    // 1 EUR > 1 USD always not true; with our default rates 1 EUR ≈ 1.075 USD
    expect(project.fxRates.USD).toBeGreaterThan(1);
    // 1 EUR ≈ ~89 INR via USD pivot
    expect(project.fxRates.INR).toBeGreaterThan(50);
  });

  it('all 7 currencies are populated regardless of base', () => {
    const { project } = createProjectFromWizard(input({ baseCurrency: 'GBP' }));
    expect(Object.keys(project.fxRates).sort()).toEqual(
      ['AUD', 'BRL', 'CAD', 'EUR', 'GBP', 'INR', 'USD'],
    );
  });
});

describe('createProjectFromWizard - clamping', () => {
  it('caps targetMarginPct at 100', () => {
    const { project } = createProjectFromWizard(input({ targetMarginPct: 250 }));
    expect(project.targetMarginPct).toBe(100);
  });

  it('floors targetMarginPct at 0', () => {
    const { project } = createProjectFromWizard(input({ targetMarginPct: -10 }));
    expect(project.targetMarginPct).toBe(0);
  });

  it('NaN values become 0', () => {
    const { project } = createProjectFromWizard(
      input({ contingencyPct: NaN, managementReservePct: Infinity }),
    );
    expect(project.contingencyPct).toBe(0);
    expect(project.managementReservePct).toBe(0);
  });
});

describe('createProjectFromWizard - IDs', () => {
  it('project ID uses a slug from the name', () => {
    const { project } = createProjectFromWizard(input({ name: 'Acme Modernization 2026' }));
    expect(project.id).toMatch(/^proj_acme_modernization_2026_\d+$/);
  });

  it('strips special characters from slug', () => {
    const { project } = createProjectFromWizard(input({ name: 'Acme!!! @2026' }));
    expect(project.id).toMatch(/^proj_acme_2026_\d+$/);
  });

  it('falls back to "project" if name has no usable characters', () => {
    const { project } = createProjectFromWizard(input({ name: '!!!' }));
    expect(project.id).toMatch(/^proj_project_\d+$/);
  });
});
