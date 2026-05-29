/**
 * M&A overlay math tests (M4d).
 *
 * Pure-function engine tests for the three modes: TSA, CarveOut, Integration.
 * Each mode has different math; tests cover the basic shape, boundary cases,
 * and a few invariants.
 */

import { describe, it, expect } from 'vitest';
import { calculateMAOverlay } from '../../src/engine/ma-overlay';
import type { Project } from '../../src/types/project';
import type { Scenario, MAModeData } from '../../src/types/scenario';
import type {
  ProjectId,
  ScenarioId,
  UserId,
  OrgId,
} from '../../src/types/ids';

// Minimal project + scenario fixtures. Use casts because the M&A overlay only
// reads project.baseCurrency and the scenario's maData; nothing else.
function fixture(maData: MAModeData | undefined): {
  project: Project;
  scenario: Scenario;
} {
  const project = {
    id: 'proj_test' as ProjectId,
    name: 'Test',
    client: 'Test',
    version: '1.0.0',
    status: 'draft' as const,
    engagementType: 'FixedFee' as const,
    engagementContext: 'MAIntegration' as const,
    baseCurrency: 'USD' as const,
    fxRates: { USD: 1, EUR: 0.93, GBP: 0.79, INR: 83.5, CAD: 1.36, AUD: 1.52, BRL: 5.1 },
    targetMarginPct: 25,
    discountPct: 0,
    contingencyPct: 0,
    managementReservePct: 0,
    phases: [],
    activeScenarioId: 'sc_test' as ScenarioId,
    baseScenarioId: 'sc_test' as ScenarioId,
    ownerId: 'usr_test' as UserId,
    orgId: 'org_test' as OrgId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Project;

  const scenario = {
    id: 'sc_test' as ScenarioId,
    projectId: 'proj_test' as ProjectId,
    name: 'Test',
    isBase: true,
    order: 1,
    resources: [],
    cloudLineItems: [],
    otherCostLineItems: [],
    assumptions: [],
    overrides: {},
    maData,
    createdBy: 'usr_test' as UserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Scenario;

  return { project, scenario };
}

describe('M&A overlay - no maData', () => {
  it('returns null when scenario has no maData', () => {
    const { project, scenario } = fixture(undefined);
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).toBeNull();
  });
});

describe('M&A overlay - TSA', () => {
  it('computes a 12-month TSA with 0% exit ramp at constant cost', () => {
    const { project, scenario } = fixture({
      mode: 'TSA',
      tsaDurationMonths: 12,
      tsaExitRampPct: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('TSA');
    expect(result!.monthly.length).toBe(12);
    // Every month should be 100,000
    for (const m of result!.monthly) {
      expect(m.cost.amount).toBeCloseTo(100_000, 2);
    }
    expect(result!.recurringCost.amount).toBeCloseTo(1_200_000, 2);
    expect(result!.oneTimeCost.amount).toBe(0);
  });

  it('exit ramp reduces cost each quarter (compounding)', () => {
    const { project, scenario } = fixture({
      mode: 'TSA',
      tsaDurationMonths: 12,
      tsaExitRampPct: 10, // 10% reduction per quarter
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    // Q1: months 1-3 at $100k
    expect(result!.monthly[0].cost.amount).toBeCloseTo(100_000, 2);
    expect(result!.monthly[2].cost.amount).toBeCloseTo(100_000, 2);
    // Q2 (months 4-6): $100k * 0.9 = $90k
    expect(result!.monthly[3].cost.amount).toBeCloseTo(90_000, 2);
    // Q4 (months 10-12): $100k * 0.9^3 = $72.9k
    expect(result!.monthly[11].cost.amount).toBeCloseTo(72_900, 2);
  });

  it('zero duration returns null', () => {
    const { project, scenario } = fixture({
      mode: 'TSA',
      tsaDurationMonths: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).toBeNull();
  });

  it('zero base run-rate yields empty monthly with timeline metadata preserved', () => {
    const { project, scenario } = fixture({
      mode: 'TSA',
      tsaDurationMonths: 18,
      tsaExitRampPct: 5,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.monthly.length).toBe(0);
    expect(result!.timelineMonths).toBe(18);
    expect(result!.recurringCost.amount).toBe(0);
  });
});

describe('M&A overlay - CarveOut', () => {
  it('separation multiplier of 1.0 produces zero stand-up extra', () => {
    const { project, scenario } = fixture({
      mode: 'CarveOut',
      separationOneTimeCostMultiplier: 1.0,
      dissynergiesAnnualPct: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    expect(result!.oneTimeCost.amount).toBe(0);
  });

  it('1.4x multiplier produces +40% of in-build resource cost as stand-up extra', () => {
    const { project, scenario } = fixture({
      mode: 'CarveOut',
      separationOneTimeCostMultiplier: 1.4,
      dissynergiesAnnualPct: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    expect(result!.oneTimeCost.amount).toBeCloseTo(400_000, 2);
    // Stand-up extra is in month 0
    expect(result!.monthly[0].cost.amount).toBeCloseTo(400_000, 2);
  });

  it('5% annual dis-synergies on $100k/mo run-rate add $60k/year', () => {
    const { project, scenario } = fixture({
      mode: 'CarveOut',
      separationOneTimeCostMultiplier: 1.0,
      dissynergiesAnnualPct: 5,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    // 5% of (100k * 12) = $60k over 12 months
    expect(result!.recurringCost.amount).toBeCloseTo(60_000, 2);
    // Each month: $5k
    expect(result!.monthly[5].cost.amount).toBeCloseTo(5_000, 2);
  });

  it('combined multiplier + dis-synergy', () => {
    const { project, scenario } = fixture({
      mode: 'CarveOut',
      separationOneTimeCostMultiplier: 1.4,
      dissynergiesAnnualPct: 5,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 100_000,
      baseInBuildResourceCost: 1_000_000,
    });
    expect(result).not.toBeNull();
    expect(result!.oneTimeCost.amount).toBeCloseTo(400_000, 2);
    expect(result!.recurringCost.amount).toBeCloseTo(60_000, 2);
    expect(result!.netImpact.amount).toBeCloseTo(460_000, 2);
  });
});

describe('M&A overlay - Integration', () => {
  it('zero synergy + zero one-time produces flat zero timeline', () => {
    const { project, scenario } = fixture({
      mode: 'Integration',
      synergyTargetAnnual: 0,
      synergyRealizationMonths: 24,
      oneTimeIntegrationCost: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.oneTimeCost.amount).toBe(0);
    expect(result!.realizedSynergy.amount).toBe(0);
    for (const m of result!.monthly) {
      expect(m.cost.amount).toBe(0);
      expect(m.synergy.amount).toBe(0);
    }
  });

  it('synergy realizes via S-curve - by realization month, ~full monthly synergy', () => {
    const { project, scenario } = fixture({
      mode: 'Integration',
      synergyTargetAnnual: 12_000_000, // $1M/month at full realization
      synergyRealizationMonths: 12,
      oneTimeIntegrationCost: 0,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    // First month should be much less than $1M (s-curve start)
    expect(result!.monthly[0].synergy.amount).toBeLessThan(500_000);
    // By month 11 (last realization month, 0-indexed), synergy should be close to $1M/mo
    expect(result!.monthly[11].synergy.amount).toBeCloseTo(1_000_000, -3);
    // After realization (month 12+), should be at exactly $1M/month
    expect(result!.monthly[12].synergy.amount).toBeCloseTo(1_000_000, 2);
    expect(result!.monthly[20].synergy.amount).toBeCloseTo(1_000_000, 2);
  });

  it('one-time integration cost is charged to month 0', () => {
    const { project, scenario } = fixture({
      mode: 'Integration',
      synergyTargetAnnual: 0,
      synergyRealizationMonths: 12,
      oneTimeIntegrationCost: 2_500_000,
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.monthly[0].cost.amount).toBe(2_500_000);
    for (let m = 1; m < result!.monthly.length; m++) {
      expect(result!.monthly[m].cost.amount).toBe(0);
    }
    expect(result!.oneTimeCost.amount).toBe(2_500_000);
  });

  it('breakeven detected when cumulative net crosses zero', () => {
    const { project, scenario } = fixture({
      mode: 'Integration',
      synergyTargetAnnual: 12_000_000, // $1M/mo
      synergyRealizationMonths: 6,
      oneTimeIntegrationCost: 3_000_000, // Should break even somewhere in months 4-7
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.breakevenMonthIndex).not.toBeNull();
    expect(result!.breakevenMonthIndex!).toBeGreaterThanOrEqual(0);
    expect(result!.breakevenMonthIndex!).toBeLessThan(12);
  });

  it('no breakeven when synergy never overtakes one-time cost', () => {
    const { project, scenario } = fixture({
      mode: 'Integration',
      synergyTargetAnnual: 100_000, // tiny synergy
      synergyRealizationMonths: 12,
      oneTimeIntegrationCost: 10_000_000, // huge one-time
    });
    const result = calculateMAOverlay(project, scenario, {
      baseRunRateMonthly: 0,
      baseInBuildResourceCost: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.breakevenMonthIndex).toBeNull();
    // Net impact remains net negative (positive = net cost)
    expect(result!.netImpact.amount).toBeGreaterThan(0);
  });

  it('timelineMonths is max(36, realizationMonths + 12)', () => {
    {
      const { project, scenario } = fixture({
        mode: 'Integration',
        synergyTargetAnnual: 1_000_000,
        synergyRealizationMonths: 12,
        oneTimeIntegrationCost: 0,
      });
      const result = calculateMAOverlay(project, scenario, {
        baseRunRateMonthly: 0,
        baseInBuildResourceCost: 0,
      });
      expect(result!.timelineMonths).toBe(36); // max(36, 24) = 36
    }
    {
      const { project, scenario } = fixture({
        mode: 'Integration',
        synergyTargetAnnual: 1_000_000,
        synergyRealizationMonths: 36,
        oneTimeIntegrationCost: 0,
      });
      const result = calculateMAOverlay(project, scenario, {
        baseRunRateMonthly: 0,
        baseInBuildResourceCost: 0,
      });
      expect(result!.timelineMonths).toBe(48); // max(36, 48) = 48
    }
  });
});

describe('M&A overlay - integration with calculate()', () => {
  it('finalPrice is unaffected by maData (overlay is preview only)', async () => {
    // Use the seed project + base scenario to verify finalPrice is invariant
    // whether maData is set or not.
    const { calculate } = await import('../../src/engine/calculate');
    const seed = await import('../../seed/scenarios/example-modernization.json');
    const project = (seed.default as any).project;
    const base = (seed.default as any).scenarios.find((s: any) => s.isBase);

    const withoutMaData = calculate(project, base);
    const baseFinalPrice = withoutMaData.finalPrice.amount;
    expect(withoutMaData.maOverlay).toBeUndefined();

    const baseWithMA = {
      ...base,
      maData: {
        mode: 'Integration' as const,
        synergyTargetAnnual: 5_000_000,
        synergyRealizationMonths: 24,
        oneTimeIntegrationCost: 2_000_000,
      },
    };
    const withMaData = calculate(project, baseWithMA);

    expect(withMaData.finalPrice.amount).toBe(baseFinalPrice); // invariant!
    expect(withMaData.maOverlay).toBeDefined();
    expect(withMaData.maOverlay!.mode).toBe('Integration');
    expect(withMaData.maOverlay!.oneTimeCost.amount).toBe(2_000_000);
  });
});
