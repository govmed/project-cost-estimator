import { describe, it, expect } from 'vitest';
import { calculateResource, hoursInPhase, allocationForPhase } from '../../src/engine/calculations/resource';
import { money } from '../../src/types/money';
import type { Resource } from '../../src/types/resource';
import type { Phase } from '../../src/types/project';
import { PhaseId, ResourceId, ScenarioId } from '../../src/types/ids';

const fx = { baseCurrency: 'USD' as const, fxRates: { USD: 1.0, EUR: 0.93, INR: 83.5 } as any };

const phases: Phase[] = [
  { id: PhaseId('p1'), name: 'Phase 1', order: 1, durationWeeks: 4, offsetWeeks: 0 },
  { id: PhaseId('p2'), name: 'Phase 2', order: 2, durationWeeks: 6, offsetWeeks: 4 },
];

const baseResource: Resource = {
  id: ResourceId('r1'),
  scenarioId: ScenarioId('s1'),
  role: 'Software Engineer',
  skillLevel: 'Professional',
  geography: 'US-Onshore',
  defaultAllocationPct: 100,
  allocations: [],
  billRate: money(200, 'USD'),
  internalCostRate: money(120, 'USD'),
  hoursPerWeek: 40,
  utilizationPct: 100,
  billRateOverridden: false,
};

describe('allocationForPhase', () => {
  it('returns default when no override', () => {
    expect(allocationForPhase(baseResource, PhaseId('p1'))).toBe(100);
  });

  it('returns the override when present', () => {
    const r = { ...baseResource, allocations: [{ phaseId: PhaseId('p1'), allocationPct: 50 }] };
    expect(allocationForPhase(r, PhaseId('p1'))).toBe(50);
    expect(allocationForPhase(r, PhaseId('p2'))).toBe(100);
  });
});

describe('hoursInPhase', () => {
  it('computes weeks * hours/week * alloc * util', () => {
    // 4 weeks * 40 h/wk * 100% * 100% = 160
    expect(hoursInPhase(baseResource, phases[0])).toBe(160);
  });

  it('respects utilization', () => {
    const r = { ...baseResource, utilizationPct: 80 };
    // 4 * 40 * 1.0 * 0.8 = 128
    expect(hoursInPhase(r, phases[0])).toBe(128);
  });

  it('respects allocation override', () => {
    const r = { ...baseResource, allocations: [{ phaseId: PhaseId('p1'), allocationPct: 50 }] };
    // 4 * 40 * 0.5 * 1.0 = 80
    expect(hoursInPhase(r, phases[0])).toBe(80);
  });
});

describe('calculateResource', () => {
  it('computes totals across phases', () => {
    const t = calculateResource(baseResource, phases, fx);
    // p1: 160 hours, p2: 240 hours, total 400
    expect(t.totalHours).toBe(400);
    expect(t.internalCost.amount).toBe(400 * 120); // 48000
    expect(t.billedAmount.amount).toBe(400 * 200); // 80000
    expect(t.marginAmount.amount).toBe(32000);
    expect(t.marginPct).toBeCloseTo(40, 5); // (32000 / 80000) * 100
  });

  it('converts non-base currency rates to base', () => {
    // EUR resource at 200 EUR (~215 USD) bill, 120 EUR (~129 USD) cost.
    const r: Resource = { ...baseResource, billRate: money(200, 'EUR'), internalCostRate: money(120, 'EUR') };
    const t = calculateResource(r, phases, fx);
    expect(t.totalHours).toBe(400);
    expect(t.internalCost.amount).toBeCloseTo(400 * (120 / 0.93), 4);
    expect(t.billedAmount.amount).toBeCloseTo(400 * (200 / 0.93), 4);
    expect(t.internalCost.currency).toBe('USD');
  });

  it('reports zero margin when bill = cost', () => {
    const r = { ...baseResource, internalCostRate: money(200, 'USD') };
    const t = calculateResource(r, phases, fx);
    expect(t.marginAmount.amount).toBe(0);
    expect(t.marginPct).toBe(0);
  });
});
