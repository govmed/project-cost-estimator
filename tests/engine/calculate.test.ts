/**
 * Integration test: run calculate() against the seed scenario from #3.
 *
 * The seed scenario is the regression test for the data model AND the
 * engine. If the engine can't read it and produce sensible numbers,
 * something's broken.
 *
 * These assertions are ROUGH RANGES, not exact values. The seed is
 * illustrative and the goal here is "is the math in the right ballpark
 * and internally consistent?", not "does it match a hand-calculated $X".
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { calculate } from '../../src/engine/calculate';
import type { Project } from '../../src/types/project';
import type { Scenario } from '../../src/types/scenario';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../fixtures/example-modernization.json');

interface Seed {
  project: Project;
  scenarios: Scenario[];
}
const seed: Seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
const baseScenario = seed.scenarios.find(s => s.isBase)!;

describe('calculate(seed scenario)', () => {
  const totals = calculate(seed.project, baseScenario);

  it('produces a positive baseCost', () => {
    expect(totals.baseCost.amount).toBeGreaterThan(0);
    expect(totals.baseCost.currency).toBe('USD');
  });

  it('baseCost = resources + cloud + other (internally consistent)', () => {
    const sum =
      totals.resourcesSubtotal.amount +
      totals.cloudSubtotal.amount +
      totals.otherCostsSubtotal.amount;
    expect(totals.baseCost.amount).toBeCloseTo(sum, 2);
  });

  it('totalCost = baseCost + contingency + reserve', () => {
    const expected =
      totals.baseCost.amount +
      totals.contingencyAmount.amount +
      totals.managementReserveAmount.amount;
    expect(totals.totalCost.amount).toBeCloseTo(expected, 2);
  });

  it('seed scenario lands roughly in the $2M-$3.5M total price range', () => {
    // The seed is a mid-cap engagement: ~$1.6M baseCost, ~10 month duration,
    // peak ~11 FTE. After 11% reserves and 25% margin, final price lands
    // around $2.3-2.4M. This is the correct sizing — my Deliverable #3 commentary
    // overstated it at $4-5M; the seed itself is internally consistent.
    expect(totals.finalPrice.amount).toBeGreaterThan(2_000_000);
    expect(totals.finalPrice.amount).toBeLessThan(3_500_000);
  });

  it('realized margin matches the project target (no discount in base)', () => {
    expect(totals.realizedMarginPct).toBeCloseTo(seed.project.targetMarginPct, 4);
  });

  it('has a populated burn curve', () => {
    expect(totals.burnCurve.length).toBeGreaterThan(0);
    // Cumulative should be non-decreasing.
    for (let i = 1; i < totals.burnCurve.length; i++) {
      expect(totals.burnCurve[i].cumulativeCost.amount).toBeGreaterThanOrEqual(
        totals.burnCurve[i - 1].cumulativeCost.amount - 0.01, // tiny FP slop
      );
    }
    // Last month's cumulative should equal sum of monthly totals.
    const sumMonthly = totals.burnCurve.reduce((acc, m) => acc + m.totalCost.amount, 0);
    expect(totals.burnCurve[totals.burnCurve.length - 1].cumulativeCost.amount).toBeCloseTo(
      sumMonthly,
      2,
    );
  });

  it('has a populated headcount curve with reasonable FTE', () => {
    expect(totals.headcountCurve.length).toBeGreaterThan(0);
    // Peak FTE on a 12-resource mid-cap project should be roughly 5-20.
    const peak = Math.max(...totals.headcountCurve.map(h => h.totalFTE));
    expect(peak).toBeGreaterThan(3);
    expect(peak).toBeLessThan(25);
  });

  it('per-phase breakdown sums to baseCost', () => {
    const sumPhases = totals.byPhase.reduce((acc, p) => acc + p.totalCost.amount, 0);
    expect(sumPhases).toBeCloseTo(totals.baseCost.amount, 1);
  });

  it('geography breakdown sums to resourcesSubtotal', () => {
    const sumGeo = Object.values(totals.byGeography).reduce(
      (acc, m) => acc + m.amount,
      0,
    );
    expect(sumGeo).toBeCloseTo(totals.resourcesSubtotal.amount, 2);
  });

  it('cloud provider breakdown sums to cloudSubtotal', () => {
    const sumProv = Object.values(totals.byCloudProvider).reduce(
      (acc, m) => acc + m.amount,
      0,
    );
    expect(sumProv).toBeCloseTo(totals.cloudSubtotal.amount, 2);
  });

  it('has positive run-rate (includes prod cloud + Datadog)', () => {
    expect(totals.runRateMonthly.amount).toBeGreaterThan(0);
    expect(totals.runRateYear1.amount).toBeCloseTo(totals.runRateMonthly.amount * 12, 2);
  });

  it('computes a sensible effective blended rate', () => {
    expect(totals.totalBillableHours).toBeGreaterThan(0);
    expect(totals.effectiveBlendedRate.amount).toBeGreaterThan(50);
    expect(totals.effectiveBlendedRate.amount).toBeLessThan(500);
  });

  it('contains all 12 resources from the seed', () => {
    expect(totals.resources.length).toBe(12);
  });

  it('contains all 8 cloud line items from the seed', () => {
    expect(totals.cloudLineItems.length).toBe(8);
  });

  it('mixed geography: offshore line items have lower cost than onshore for same hours', () => {
    // The seed has both onshore (US) and offshore (India) resources.
    // Confirm offshore costs less per hour.
    const onshoreRes = baseScenario.resources.find(r => r.geography === 'US-Onshore');
    const offshoreRes = baseScenario.resources.find(r => r.geography === 'India-Offshore');
    expect(onshoreRes!.billRate.amount).toBeGreaterThan(offshoreRes!.billRate.amount);
  });

  it('deterministic: two runs produce identical totals', () => {
    const a = calculate(seed.project, baseScenario);
    const b = calculate(seed.project, baseScenario);
    expect(a.finalPrice.amount).toBe(b.finalPrice.amount);
    expect(a.totalCost.amount).toBe(b.totalCost.amount);
    expect(a.realizedMarginPct).toBe(b.realizedMarginPct);
  });
});
